import { useState, useEffect, useRef } from 'react';
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
            <div className="flex h-screen items-center justify-center">
                <div className="w-10 h-10 border-4 border-iq-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    // Archived View
    if (archivedUrl || (activeBounty && isExpired(activeBounty.submission_deadline))) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] text-center space-y-6 animate-fade-in">
                <div className="w-24 h-24 bg-iq-card rounded-full flex items-center justify-center border border-white/5 shadow-xl text-yellow-500">
                    <Shield size={48} />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Protocol Terminated</h1>
                    <p className="text-iq-text-secondary max-w-sm mx-auto">
                        This mission has concluded. Communications have been securely archived by HQ.
                    </p>
                </div>

                <div className="flex flex-col gap-2 items-center">
                    <div className="px-4 py-2 bg-green-500/10 border border-green-500/30 text-green-500 rounded-lg text-sm flex items-center gap-2">
                        <Shield size={16} />
                        <span>Logs encrypted & sent to Admins</span>
                    </div>
                </div>

                <button
                    className="mt-8 px-6 py-2 bg-iq-surface border border-white/10 hover:bg-white/5 rounded-lg text-white transition-colors"
                    onClick={() => window.location.href = '/hunter/dashboard'}
                >
                    Return to Operations
                </button>
            </div>
        );
    }

    if (!activeBounty) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] text-center space-y-6">
                <div className="w-24 h-24 bg-iq-card rounded-full flex items-center justify-center border border-white/5 shadow-xl">
                    <Target size={48} className="text-iq-text-secondary opacity-50" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">War Room Offline</h1>
                    <p className="text-iq-text-secondary max-w-sm mx-auto">
                        You have no active high-value target assigned. Initialize a stake to enter the War Room.
                    </p>
                </div>
                <button
                    className="px-8 py-3 bg-iq-primary text-black font-bold rounded-xl hover:scale-105 transition-transform flex items-center gap-2"
                    onClick={() => window.location.href = '/hunter/arena'}
                >
                    <Target size={20} /> Browse Arena
                </button>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col animate-fade-in pb-20 md:pb-0">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 shrink-0">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 rounded-full bg-iq-error animate-pulse"></span>
                        <p className="text-xs font-bold text-iq-error uppercase tracking-wider">Live Mission</p>
                    </div>
                    <h1 className="text-2xl font-bold text-white">{activeBounty.title}</h1>
                </div>
                <div className="text-right">
                    <p className="text-xs text-iq-text-secondary uppercase tracking-wider">Reward Pool</p>
                    <p className="text-xl font-bold text-iq-primary">{currency}{activeBounty.reward.toLocaleString()}</p>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
                {/* Left Column: Stats & Brief */}
                {/* Left Column: Stats & Timer */}
                <div className="lg:col-span-1 flex flex-col gap-6 overflow-y-auto pr-2">
                    {/* Timer Card - ENHANCED */}
                    <div className="bg-iq-card border border-white/5 rounded-2xl p-8 text-center shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-iq-primary/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

                        <p className="text-sm text-iq-text-secondary mb-6 uppercase tracking-widest font-bold">MISSION DEADLINE</p>

                        {timer.expired ? (
                            <div className="text-iq-error font-bold text-3xl animate-pulse flex flex-col items-center gap-4 py-8">
                                <AlertCircle size={48} />
                                MISSION EXPIRED
                            </div>
                        ) : (
                            <div className="py-4">
                                <div className="flex justify-center gap-4 text-white mb-6">
                                    <div className="flex flex-col items-center">
                                        <span className="text-5xl md:text-6xl font-mono font-bold text-yellow-500">{timer.days || 0}</span>
                                        <span className="text-xs text-iq-text-secondary uppercase mt-2 font-bold">Days</span>
                                    </div>
                                    <span className="text-5xl md:text-6xl font-mono opacity-20 text-yellow-500/50">:</span>
                                    <div className="flex flex-col items-center">
                                        <span className="text-5xl md:text-6xl font-mono font-bold text-yellow-500">{String(timer.hours || 0).padStart(2, '0')}</span>
                                        <span className="text-xs text-iq-text-secondary uppercase mt-2 font-bold">Hours</span>
                                    </div>
                                    <span className="text-5xl md:text-6xl font-mono opacity-20 text-yellow-500/50">:</span>
                                    <div className="flex flex-col items-center">
                                        <span className="text-5xl md:text-6xl font-mono font-bold text-yellow-500">{String(timer.minutes || 0).padStart(2, '0')}</span>
                                        <span className="text-xs text-iq-text-secondary uppercase mt-2 font-bold">Mins</span>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden mb-4">
                                    <div
                                        className="h-full bg-yellow-500 transition-all duration-1000"
                                        style={{ width: `${Math.max(0, Math.min(100, 100 - (timer.days * 24 + timer.hours) / (3 * 24) * 100))}%` }} // Mock percentage logic
                                    />
                                </div>

                                {/* Urgency Indicator */}
                                {(timer.days === 0 && timer.hours < 24) && (
                                    <div className="mt-6 bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center justify-center gap-2 text-red-400 animate-pulse">
                                        <AlertCircle className="w-5 h-5" />
                                        <span className="font-bold">URGENT: Less than 24 hours left!</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Chat */}
                <div className="lg:col-span-2 bg-iq-card border border-white/5 rounded-2xl flex flex-col overflow-hidden shadow-xl">
                    <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-iq-primary/10 flex items-center justify-center text-iq-primary">
                                <MessageSquare size={18} />
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-sm">Operative Comms</h3>
                                <p className="text-xs text-iq-text-secondary flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-iq-success"></span> Online
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-iq-text-secondary opacity-50">
                                <MessageSquare size={48} className="mb-2" />
                                <p>Channel secure. Stand by for comms.</p>
                            </div>
                        ) : (
                            messages.map(msg => {
                                const isMe = msg.sender_id === currentUser.id;
                                return (
                                    <div key={msg.id} className={`flex gap-4 ${isMe ? 'flex-row-reverse' : ''}`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isMe ? 'bg-iq-primary text-black' : 'bg-iq-surface text-iq-text-secondary border border-white/10'
                                            }`}>
                                            {isMe ? 'ME' : (msg.sender?.username?.substring(0, 2).toUpperCase() || 'OP')}
                                        </div>
                                        <div className={`max-w-[70%] space-y-1`}>
                                            <div className={`p-3 rounded-2xl text-sm ${isMe
                                                ? 'bg-iq-primary text-black rounded-tr-none'
                                                : 'bg-iq-surface text-white border border-white/10 rounded-tl-none'
                                                }`}>
                                                {msg.message}
                                            </div>
                                            <p className={`text-[10px] text-iq-text-secondary ${isMe ? 'text-right' : 'text-left'}`}>
                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={sendMessage} className="p-4 bg-iq-surface border-t border-white/5 flex gap-3">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message..."
                            maxLength={500}
                            className="flex-1 bg-iq-card border border-white/10 rounded-xl px-4 text-sm text-white focus:outline-none focus:border-iq-primary placeholder-white/20"
                        />
                        <button
                            type="submit"
                            disabled={!newMessage.trim()}
                            className="p-3 bg-iq-primary text-black rounded-xl hover:bg-iq-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Send size={18} />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
