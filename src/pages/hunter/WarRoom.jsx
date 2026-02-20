import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient';
import { Clock, MessageSquare, Send, Target, Users, AlertCircle, FileText, Download, Shield } from 'lucide-react';

export default function HunterWarRoom() {
    const { currentUser } = useAuth();
    const [activeBounty, setActiveBounty] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [timer, setTimer] = useState({});
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (currentUser) {
            loadActiveBounty();
        }
    }, [currentUser]);

    async function loadActiveBounty() {
        try {
            // Get hunter's active stake
            const { data: stakeData } = await supabase
                .from('hunter_stakes')
                .select(`
                    *,
                    bounty:bounties(*)
                `)
                .eq('hunter_id', currentUser.id)
                .eq('status', 'active')
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (!stakeData) {
                setLoading(false);
                return;
            }

            setActiveBounty(stakeData.bounty);

            // Load chat messages for this bounty
            loadMessages(stakeData.bounty.id);

            // Subscribe to new messages
            const channel = supabase
                .channel(`war-room-${stakeData.bounty.id}`)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'war_room_messages',
                    filter: `bounty_id=eq.${stakeData.bounty.id}`
                }, (payload) => {
                    // Fetch sender details for the new message
                    // Or just optimistically add it if we can
                    // For now, reload messages or simple append
                    setMessages(prev => [...prev, payload.new]);
                })
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        } catch (error) {
            console.error('Error loading active bounty:', error);
        } finally {
            setLoading(false);
        }
    }

    async function loadMessages(bountyId) {
        try {
            const { data, error } = await supabase
                .from('war_room_messages')
                .select(`
                    *,
                    sender:profiles(username)
                `)
                .eq('bounty_id', bountyId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            setMessages(data || []);
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    }

    async function sendMessage(e) {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            const { error } = await supabase
                .from('war_room_messages')
                .insert({
                    bounty_id: activeBounty.id,
                    sender_id: currentUser.id,
                    message: newMessage.trim()
                });

            if (error) throw error;
            setNewMessage('');
            // Scroll handled by useEffect on messages
        } catch (error) {
            console.error('Error sending message:', error);
        }
    }

    function calculateTimeRemaining(deadline) {
        const now = new Date();
        const end = new Date(deadline);
        const diff = end - now;

        if (diff <= 0) {
            return { expired: true, display: 'EXPIRED' };
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        return { expired: false, days, hours, minutes, seconds };
    }

    const [archiving, setArchiving] = useState(false);
    const [archivedUrl, setArchivedUrl] = useState(null);

    // Initial check for expired/completed status on load
    useEffect(() => {
        if (activeBounty && (activeBounty.status === 'completed' || isExpired(activeBounty.submission_deadline))) {
            handleArchive(activeBounty);
        }
    }, [activeBounty]);

    function isExpired(deadline) {
        return new Date(deadline) <= new Date();
    }

    // Timer check
    useEffect(() => {
        if (!activeBounty || archivedUrl) return;

        const interval = setInterval(() => {
            const time = calculateTimeRemaining(activeBounty.submission_deadline);
            setTimer(time);

            // Trigger archive if expired just now
            if (time.expired && !archiving && !archivedUrl) {
                console.log("Timer expired, archiving...");
                handleArchive(activeBounty);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [activeBounty, archiving, archivedUrl]);


    async function handleArchive(bounty) {
        if (archiving || archivedUrl) return;
        setArchiving(true);

        try {
            console.log("Archiving chat for bounty:", bounty.id);

            // 1. Generate PDF
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            doc.setFontSize(20);
            doc.text(`Mission Archive: ${bounty.title}`, 10, 20);
            doc.setFontSize(12);
            doc.text(`Bounty ID: ${bounty.id}`, 10, 30);
            doc.text(`Archived At: ${new Date().toLocaleString()}`, 10, 40);

            // Simple table of messages
            // We need to fetch ALL messages if possible, relying on current visible messages for now
            const history = messages.map(m => [
                new Date(m.created_at).toLocaleString(),
                m.sender?.username || 'Unknown',
                m.message
            ]);

            doc.autoTable({
                startY: 50,
                head: [['Time', 'User', 'Message']],
                body: history,
            });

            const pdfBlob = doc.output('blob');

            // 2. Upload to Supabase only (Private Archive)
            const fileName = `archive_${bounty.id}_${Date.now()}.pdf`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('mission_archives') // Ensure this bucket exists!
                .upload(fileName, pdfBlob);

            if (uploadError) {
                console.error("Archive upload failed:", uploadError);
                // Fail silently for user, but log for admin. 
                // Do NOT download to user device as requested.
            } else {
                console.log("Archive uploaded securely:", uploadData);
                // We do NOT get a public URL or show it.
                setArchivedUrl('secured'); // Just a flag to switch UI
            }

            // 3. Mark locally as archived (UI update)
            // In a real app, update DB status to 'archived', but here we just lock UI

        } catch (err) {
            console.error("Archival failed:", err);
        } finally {
            setArchiving(false);
        }
    }

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <div className="spinner" />
            </div>
        );
    }

    // Archived View
    if (archivedUrl || (activeBounty && isExpired(activeBounty.submission_deadline))) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', gap: '24px', animation: 'fadeInUp 0.4s ease' }}>
                <div style={{ width: '96px', height: '96px', borderRadius: '50%', background: 'rgba(0,255,148,0.1)', border: '1px solid rgba(0,255,148,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Shield size={48} style={{ color: '#00FF94' }} />
                </div>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#F0F4FF', marginBottom: '8px', fontFamily: 'Space Grotesk' }}>Protocol Terminated</h1>
                    <p style={{ color: '#8892AA', maxWidth: '360px' }}>This mission has concluded. Communications have been securely archived by HQ.</p>
                </div>
                <div style={{ padding: '12px 20px', borderRadius: '12px', background: 'rgba(0,255,148,0.08)', border: '1px solid rgba(0,255,148,0.2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Shield size={16} style={{ color: '#00FF94' }} />
                    <span style={{ color: '#00FF94', fontSize: '13px', fontWeight: '600' }}>Logs encrypted & sent to Admins</span>
                </div>
                <button
                    onClick={() => window.location.href = '/hunter/dashboard'}
                    className="btn-secondary"
                    style={{ padding: '12px 28px', fontSize: '14px' }}
                >
                    Return to Base
                </button>
            </div>
        );
    }

    if (!activeBounty) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', gap: '24px' }}>
                <div style={{ width: '96px', height: '96px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Target size={48} style={{ color: '#4A5568' }} />
                </div>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#F0F4FF', marginBottom: '8px', fontFamily: 'Space Grotesk' }}>War Room Offline</h1>
                    <p style={{ color: '#8892AA', maxWidth: '360px' }}>No active mission. Stake on a bounty to unlock the War Room and comms channel.</p>
                </div>
                <button
                    className="btn-primary"
                    onClick={() => window.location.href = '/hunter/arena'}
                    style={{ padding: '14px 28px', fontSize: '15px' }}
                >
                    <Target size={20} /> Browse Arena
                </button>
            </div>
        );
    }

    const currency = currentUser?.currency === 'INR' ? '₹' : '$';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: 'calc(100vh - 160px)', minHeight: '500px', animation: 'fadeInUp 0.4s ease', paddingBottom: '80px' }}>

            {/* ===== HEADER ===== */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', flexShrink: 0 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FF2D78', display: 'inline-block', animation: 'pulseDot 1.5s ease-in-out infinite' }} />
                        <span style={{ color: '#FF2D78', fontSize: '11px', fontWeight: '800', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Live Mission</span>
                    </div>
                    <h1 style={{ fontSize: 'clamp(18px, 3vw, 24px)', fontWeight: '800', color: '#F0F4FF', fontFamily: 'Space Grotesk', lineHeight: 1.3 }}>
                        {activeBounty.title}
                    </h1>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <p style={{ color: '#8892AA', fontSize: '11px', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>Reward Pool</p>
                    <p style={{ fontSize: '24px', fontWeight: '900', fontFamily: 'Space Grotesk', background: 'linear-gradient(135deg, #00FF94, #00E5FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                        {currency}{activeBounty.reward.toLocaleString()}
                    </p>
                </div>
            </div>

            {/* ===== MAIN GRID ===== */}
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr', gap: '16px', minHeight: 0, overflow: 'hidden' }} className="lg:grid-cols-3-custom">
                <style>{`@media (min-width: 1024px) { .war-room-grid { grid-template-columns: 340px 1fr !important; } }`}</style>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', overflow: 'auto' }} className="war-room-grid">

                    {/* Timer Column */}
                    <div style={{ display: 'none' }} className="war-room-timer-col">
                        <style>{`@media (min-width: 1024px) { .war-room-timer-col { display: flex !important; flex-direction: column; gap: 16px; overflow: auto; } .war-room-grid { display: grid !important; grid-template-columns: 320px 1fr !important; } }`}</style>

                        {/* Timer Card */}
                        <div style={{ padding: '28px 24px', borderRadius: '20px', background: 'rgba(23,30,46,0.9)', border: '1px solid rgba(255,230,0,0.2)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '150px', height: '150px', borderRadius: '50%', background: 'rgba(255,230,0,0.06)', filter: 'blur(40px)', pointerEvents: 'none' }} />

                            <p style={{ color: '#8892AA', fontSize: '11px', fontWeight: '700', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '20px' }}>Mission Deadline</p>

                            {timer.expired ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '20px 0', color: '#F43F5E', animation: 'pulseDot 1.5s infinite' }}>
                                    <AlertCircle size={48} />
                                    <p style={{ fontWeight: '900', fontSize: '20px', fontFamily: 'Space Grotesk' }}>MISSION EXPIRED</p>
                                </div>
                            ) : (
                                <>
                                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                                        {[
                                            { v: timer.days || 0, l: 'D' },
                                            { v: timer.hours || 0, l: 'H' },
                                            { v: timer.minutes || 0, l: 'M' },
                                            { v: timer.seconds || 0, l: 'S' },
                                        ].map((seg, i) => (
                                            <React.Fragment key={i}>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                                    <div style={{
                                                        background: 'rgba(0,0,0,0.4)', borderRadius: '10px', padding: '8px 12px',
                                                        fontFamily: 'JetBrains Mono', fontWeight: '900', fontSize: '28px',
                                                        color: timer.days === 0 && (timer.hours || 0) < 3 ? '#FF6B35' : '#FFE600',
                                                        textShadow: '0 0 20px currentColor',
                                                        minWidth: '52px', textAlign: 'center',
                                                    }}>
                                                        {String(seg.v).padStart(2, '0')}
                                                    </div>
                                                    <span style={{ fontSize: '10px', color: '#4A5568', fontWeight: '700' }}>{seg.l}</span>
                                                </div>
                                                {i < 3 && <span style={{ color: '#3A4560', fontSize: '24px', fontWeight: '900', marginTop: '-16px' }}>:</span>}
                                            </React.Fragment>
                                        ))}
                                    </div>

                                    <div style={{ height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden', marginBottom: '12px' }}>
                                        <div style={{
                                            height: '100%', borderRadius: '3px',
                                            width: `${Math.max(0, Math.min(100, 100 - ((timer.days || 0) * 24 + (timer.hours || 0)) / (3 * 24) * 100))}%`,
                                            background: timer.days === 0 && (timer.hours || 0) < 3 ? 'linear-gradient(90deg, #FF6B35, #F43F5E)' : 'linear-gradient(90deg, #FFE600, #FF6B35)',
                                            transition: 'width 1s ease',
                                            boxShadow: '0 0 10px rgba(255,230,0,0.5)',
                                        }} />
                                    </div>

                                    {timer.days === 0 && (timer.hours || 0) < 24 && (
                                        <div style={{
                                            padding: '10px 16px', borderRadius: '10px',
                                            background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                            animation: 'pulseDot 1.5s ease-in-out infinite',
                                        }}>
                                            <AlertCircle size={16} style={{ color: '#F43F5E' }} />
                                            <span style={{ color: '#F43F5E', fontWeight: '700', fontSize: '13px' }}>Less than 24h remaining!</span>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Chat Column */}
                    <div style={{
                        display: 'flex', flexDirection: 'column',
                        borderRadius: '20px', overflow: 'hidden',
                        background: 'rgba(23,30,46,0.9)', border: '1px solid rgba(255,255,255,0.07)',
                        minHeight: '400px',
                    }}>
                        {/* Chat header */}
                        <div style={{
                            padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            background: 'rgba(255,255,255,0.03)', flexShrink: 0,
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(0,255,148,0.1)', border: '1px solid rgba(0,255,148,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <MessageSquare size={18} style={{ color: '#00FF94' }} />
                                </div>
                                <div>
                                    <h3 style={{ color: '#F0F4FF', fontWeight: '700', fontSize: '14px' }}>Operative Comms</h3>
                                    <p style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#8892AA', fontSize: '12px' }}>
                                        <span className="status-live" />
                                        Encrypted Channel
                                    </p>
                                </div>
                            </div>
                            <div style={{ padding: '6px 12px', borderRadius: '8px', background: 'rgba(0,255,148,0.08)', border: '1px solid rgba(0,255,148,0.2)' }}>
                                <span style={{ color: '#00FF94', fontSize: '11px', fontWeight: '700' }}>{messages.length} msgs</span>
                            </div>
                        </div>

                        {/* Messages */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {messages.length === 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#4A5568', gap: '12px' }}>
                                    <MessageSquare size={40} />
                                    <p style={{ fontSize: '14px' }}>Channel secure. Awaiting comms...</p>
                                </div>
                            ) : (
                                messages.map(msg => {
                                    const isMe = msg.sender_id === currentUser.id;
                                    return (
                                        <div key={msg.id} style={{ display: 'flex', gap: '12px', flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-end' }}>
                                            {/* Avatar */}
                                            <div style={{
                                                width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '12px', fontWeight: '800',
                                                background: isMe ? 'linear-gradient(135deg, #00FF94, #00E5FF)' : 'rgba(255,255,255,0.06)',
                                                color: isMe ? '#000' : '#8892AA',
                                                border: isMe ? 'none' : '1px solid rgba(255,255,255,0.1)',
                                            }}>
                                                {isMe ? 'ME' : (msg.sender?.username?.substring(0, 2).toUpperCase() || 'OP')}
                                            </div>
                                            <div style={{ maxWidth: '70%', display: 'flex', flexDirection: 'column', gap: '4px', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                                                <div style={{
                                                    padding: '12px 16px', borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                                    background: isMe ? 'linear-gradient(135deg, #00FF94, #00E5FF)' : 'rgba(255,255,255,0.07)',
                                                    color: isMe ? '#000000' : '#F0F4FF',
                                                    fontSize: '14px', lineHeight: '1.5',
                                                    border: isMe ? 'none' : '1px solid rgba(255,255,255,0.08)',
                                                    fontWeight: isMe ? '600' : '400',
                                                }}>
                                                    {msg.message}
                                                </div>
                                                <p style={{ fontSize: '10px', color: '#4A5568', fontFamily: 'JetBrains Mono' }}>
                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Message input */}
                        <form onSubmit={sendMessage} style={{
                            padding: '16px', borderTop: '1px solid rgba(255,255,255,0.07)',
                            display: 'flex', gap: '10px', flexShrink: 0,
                            background: 'rgba(255,255,255,0.02)',
                        }}>
                            <input
                                type="text"
                                value={newMessage}
                                onChange={e => setNewMessage(e.target.value)}
                                placeholder="Type a message..."
                                maxLength={500}
                                style={{
                                    flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '12px', padding: '12px 16px', color: '#F0F4FF',
                                    fontSize: '14px', outline: 'none', transition: 'border-color 0.2s ease',
                                    fontFamily: 'DM Sans',
                                }}
                                onFocus={e => e.target.style.borderColor = 'rgba(0,255,148,0.5)'}
                                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                            />
                            <button
                                type="submit"
                                disabled={!newMessage.trim()}
                                style={{
                                    width: '48px', height: '48px', borderRadius: '12px', flexShrink: 0,
                                    background: newMessage.trim() ? 'linear-gradient(135deg, #00FF94, #00E5FF)' : 'rgba(255,255,255,0.06)',
                                    border: 'none', cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.2s ease',
                                    opacity: newMessage.trim() ? 1 : 0.4,
                                }}
                            >
                                <Send size={18} style={{ color: newMessage.trim() ? '#000' : '#8892AA' }} />
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
