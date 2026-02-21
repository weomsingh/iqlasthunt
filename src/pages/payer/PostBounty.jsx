import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient';
import {
    Target, FileText, Calendar, DollarSign, Upload, ArrowRight, ArrowLeft,
    Check, MessageSquare, Briefcase, Zap, Info, X
} from 'lucide-react';

export default function PostBounty() {
    const { currentUser, refreshUser } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [uploading, setUploading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        category: '',
        title: '',
        description: '',
        requirements: [],
        budget: 5000,
        timeline: '1 week',
        deadlineDate: '',
        deliverables: {
            sourceFiles: false,
            highRes: false,
            vector: false,
            commercial: false
        }
    });

    const currency = currentUser?.currency === 'INR' ? '₹' : '$';

    // Helper to calculate deadline date based on timeline selection
    useEffect(() => {
        const date = new Date();
        if (formData.timeline === '3 days') date.setDate(date.getDate() + 3);
        else if (formData.timeline === '1 week') date.setDate(date.getDate() + 7);
        else if (formData.timeline === '2 weeks') date.setDate(date.getDate() + 14);

        // Format for datetime-local input
        const isoString = date.toISOString().slice(0, 16);
        setFormData(prev => ({ ...prev, deadlineDate: isoString }));
    }, [formData.timeline]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const toggleRequirement = (req) => {
        setFormData(prev => {
            const exists = prev.requirements.includes(req);
            return {
                ...prev,
                requirements: exists
                    ? prev.requirements.filter(r => r !== req)
                    : [...prev.requirements, req]
            };
        });
    };

    // Platform fee: 2% of the bounty reward only
    const platformFee = Math.ceil(formData.budget * 0.02);
    const totalAmount = formData.budget + platformFee;

    // Stake tiers (entry fee hunters pay to participate)
    const calculateStake = (amount) => {
        if (amount <= 1500) return { stake: 10, max: 4 };
        if (amount <= 3000) return { stake: 20, max: 6 };
        if (amount <= 4500) return { stake: 40, max: 8 };
        return { stake: Math.ceil(amount * 0.025), max: 10 };
    };
    const stakeInfo = calculateStake(formData.budget);

    // Submission Handler
    const handleSubmit = async () => {
        setUploading(true);
        try {
            // 1. Generate text file from description (replacing PDF requirement)
            const blob = new Blob([formData.description + '\n\nRequirements:\n' + formData.requirements.join('\n')], { type: 'text/plain' });
            const fileName = `${currentUser.id}/${Date.now()}_brief.txt`;

            const { error: uploadError } = await supabase.storage
                .from('bounty-missions')
                .upload(fileName, blob);

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
                .from('bounty-missions')
                .getPublicUrl(fileName);

            // 2. Insert Bounty
            const { data: bountyData, error: bountyError } = await supabase
                .from('bounties')
                .insert({
                    payer_id: currentUser.id,
                    title: formData.title,
                    description: formData.description,
                    reward: parseFloat(formData.budget),
                    entry_fee: stakeInfo.stake,
                    max_hunters: stakeInfo.max,
                    currency: currentUser.currency || 'INR',
                    submission_deadline: formData.deadlineDate,
                    mission_pdf_url: urlData.publicUrl,
                    status: 'live',
                    vault_locked: totalAmount // Locking total amount
                })
                .select()
                .single();

            if (bountyError) throw bountyError;

            // 3. Log vault_locked transaction
            await supabase.from('transactions').insert({
                user_id: currentUser.id,
                type: 'lock_vault',
                amount: totalAmount,
                currency: currentUser.currency || 'INR',
                status: 'completed',
                metadata: { bounty_id: bountyData.id, bounty_title: formData.title }
            });

            // 4. Deduct Balance
            const newBalance = currentUser.wallet_balance - totalAmount;
            if (newBalance < 0) throw new Error("Insufficient balance");

            await supabase.from('profiles').update({ wallet_balance: newBalance }).eq('id', currentUser.id);
            await refreshUser();

            setStep(7); // Success Step

        } catch (error) {
            console.error(error);
            alert('Error creating bounty: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    // Render Steps
    const renderStep = () => {
        switch (step) {
            case 1: // Basic Info
                return (
                    <div className="space-y-6 animate-fade-in">
                        <h2 className="text-2xl font-bold text-white">Let's start with the basics</h2>

                        <div className="space-y-2">
                            <label className="text-sm text-iq-text-secondary">Category</label>
                            <div className="grid grid-cols-2 gap-3">
                                {['Design', 'Development', 'Content', 'Video', 'Marketing', 'Other'].map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => handleInputChange('category', cat)}
                                        className={`p-3 rounded-xl border text-left transition-all ${formData.category === cat
                                            ? 'bg-iq-primary/10 border-iq-primary text-iq-primary'
                                            : 'bg-iq-card border-white/10 text-white hover:border-white/30'
                                            }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm text-iq-text-secondary">Bounty Title</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => handleInputChange('title', e.target.value)}
                                placeholder="e.g. Redesign my startup's logo"
                                className="w-full bg-iq-surface border border-white/10 rounded-xl p-4 text-white focus:border-iq-primary focus:outline-none"
                            />
                            <div className="flex justify-between text-xs text-iq-text-secondary">
                                <span>Be specific</span>
                                <span>{formData.title.length}/100</span>
                            </div>
                        </div>
                    </div>
                );

            case 2: // Detailed Description
                return (
                    <div className="space-y-6 animate-fade-in">
                        <h2 className="text-2xl font-bold text-white">Describe your mission</h2>

                        <div style={{
                            borderRadius: '14px',
                            padding: '16px 20px',
                            background: 'rgba(59, 130, 246, 0.06)',
                            border: '1px solid rgba(59, 130, 246, 0.2)',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '12px',
                        }}>
                            <Info size={18} style={{ color: '#3B82F6', flexShrink: 0, marginTop: '2px' }} />
                            <div className="text-sm" style={{ color: '#94A3B8' }}>
                                <p style={{ color: '#F8FAFC', fontWeight: '700', marginBottom: '4px' }}>Writing Tip:</p>
                                <p>Include your brand colors, target audience, and examples of styles you like. The more specific, the better the results.</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm text-iq-text-secondary">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                placeholder="I need a..."
                                rows={8}
                                className="w-full bg-iq-surface border border-white/10 rounded-xl p-4 text-white focus:border-iq-primary focus:outline-none resize-none"
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                                <span style={{ fontSize: '12px', color: '#64748B' }}>Be as detailed as possible for best results</span>
                                <span style={{ fontSize: '12px', color: formData.description.length > 50 ? '#10B981' : '#64748B' }}>{formData.description.length} chars</span>
                            </div>
                        </div>
                    </div>
                );

            case 3: // Requirements
                return (
                    <div className="space-y-6 animate-fade-in">
                        <h2 className="text-2xl font-bold text-white">Deliverables & Requirements</h2>

                        <div className="space-y-4">
                            <p className="text-sm text-iq-text-secondary">What files do you need?</p>
                            {[
                                { id: 'sourceFiles', label: 'Source Files (PSD, AI, Figma)' },
                                { id: 'highRes', label: 'High-Resolution PNG/JPG' },
                                { id: 'vector', label: 'Vector Formats (SVG, EPS)' },
                                { id: 'commercial', label: 'Commercial Usage Rights' }
                            ].map(item => (
                                <label key={item.id} className="flex items-center gap-3 p-4 bg-iq-card border border-white/10 rounded-xl cursor-pointer hover:bg-white/5 transition-colors">
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${formData.deliverables[item.id] ? 'bg-iq-primary border-iq-primary' : 'border-white/30'
                                        }`}>
                                        {formData.deliverables[item.id] && <Check size={14} className="text-black" />}
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={formData.deliverables[item.id]}
                                        onChange={() => setFormData(prev => ({
                                            ...prev,
                                            deliverables: { ...prev.deliverables, [item.id]: !prev.deliverables[item.id] }
                                        }))}
                                    />
                                    <span className="text-white">{item.label}</span>
                                </label>
                            ))}
                        </div>

                        <div className="space-y-2">
                            <p className="text-sm text-iq-text-secondary">Custom Requirements</p>
                            <div className="flex gap-2">
                                <input type="text" placeholder="Add a requirement..." className="flex-1 bg-iq-surface border border-white/10 rounded-xl p-3 text-white" />
                                <button className="p-3 bg-white/10 rounded-xl hover:bg-white/20"><Check className="text-white" /></button>
                            </div>
                        </div>
                    </div>
                );

            case 4: // Budget & Timeline
                return (
                    <div className="space-y-8 animate-fade-in">
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-2">Budget & Timeline</h2>
                            <p className="text-iq-text-secondary text-sm">Avg for similar bounties: {currency}5,000 - {currency}8,000</p>
                        </div>

                        {/* Budget Slider */}
                        <div className="space-y-6">
                            <div className="flex justify-between items-end">
                                <label className="text-sm text-iq-text-secondary">Your Budget</label>
                                <span className="text-2xl font-bold text-iq-primary">{currency}{formData.budget.toLocaleString()}</span>
                            </div>
                            <input
                                type="range"
                                min="1000"
                                max="50000"
                                step="500"
                                value={formData.budget}
                                onChange={(e) => handleInputChange('budget', parseInt(e.target.value))}
                                className="w-full h-2 bg-iq-surface rounded-full appearance-none cursor-pointer accent-iq-primary"
                            />
                            <div className="flex justify-between text-xs text-iq-text-secondary">
                                <span>{currency}1,000</span>
                                <span>{currency}50,000+</span>
                            </div>
                        </div>

                        {/* Timeline */}
                        <div className="space-y-3">
                            <label className="text-sm text-iq-text-secondary">Timeline</label>
                            <div className="grid grid-cols-3 gap-3">
                                {['3 days', '1 week', '2 weeks', 'Flexible'].map(opt => (
                                    <button
                                        key={opt}
                                        onClick={() => handleInputChange('timeline', opt)}
                                        className={`p-3 rounded-xl border text-sm transition-all ${formData.timeline === opt
                                            ? 'bg-iq-primary/10 border-iq-primary text-iq-primary font-medium'
                                            : 'bg-iq-card border-white/10 text-white hover:border-white/30'
                                            }`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-4 bg-iq-success/10 border border-iq-success/20 rounded-xl">
                            <Zap className="text-iq-success" size={20} />
                            <p className="text-sm text-iq-success">Offering {currency}{formData.budget} attracts top 10% of hunters.</p>
                        </div>
                    </div>
                );

            case 5: // Preview & Payment
                return (
                    <div className="space-y-6 animate-fade-in">
                        <h2 className="text-2xl font-bold text-white">Review & Pay</h2>

                        {/* Wallet balance check */}
                        <div style={{
                            padding: '16px 20px',
                            borderRadius: '16px',
                            background: currentUser?.wallet_balance >= totalAmount
                                ? 'rgba(16, 185, 129, 0.06)'
                                : 'rgba(255, 107, 53, 0.06)',
                            border: `1px solid ${currentUser?.wallet_balance >= totalAmount
                                ? 'rgba(16, 185, 129, 0.25)'
                                : 'rgba(255, 107, 53, 0.3)'}`,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '14px',
                        }}>
                            <div style={{
                                width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
                                background: currentUser?.wallet_balance >= totalAmount
                                    ? 'rgba(16, 185, 129, 0.15)'
                                    : 'rgba(255, 107, 53, 0.15)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <Zap size={20} style={{ color: currentUser?.wallet_balance >= totalAmount ? '#10B981' : '#FF6B35' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <p style={{ fontWeight: '700', color: '#F8FAFC', fontSize: '14px', marginBottom: '3px' }}>
                                    Your Vault Balance: <span style={{ color: currentUser?.wallet_balance >= totalAmount ? '#10B981' : '#FF6B35', fontFamily: 'JetBrains Mono' }}>{currency}{(currentUser?.wallet_balance || 0).toLocaleString()}</span>
                                </p>
                                {currentUser?.wallet_balance < totalAmount ? (
                                    <p style={{ fontSize: '13px', color: '#94A3B8' }}>
                                        ⚠️ You need <strong style={{ color: '#FF6B35' }}>{currency}{(totalAmount - (currentUser?.wallet_balance || 0)).toLocaleString()}</strong> more. Please add funds to your vault first.
                                    </p>
                                ) : (
                                    <p style={{ fontSize: '13px', color: '#10B981' }}>✅ Sufficient balance — ready to post!</p>
                                )}
                            </div>
                        </div>

                        {/* Payment Breakdown */}
                        <div style={{
                            borderRadius: '20px',
                            background: 'rgba(15, 20, 35, 0.6)',
                            backdropFilter: 'blur(16px)',
                            border: '1px solid rgba(255, 255, 255, 0.07)',
                            overflow: 'hidden',
                        }}>
                            <div style={{
                                padding: '14px 20px',
                                borderBottom: '1px solid rgba(255,255,255,0.06)',
                                background: 'rgba(255,255,255,0.03)',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            }}>
                                <h3 style={{ fontWeight: '800', color: '#F8FAFC', fontFamily: 'Space Grotesk', fontSize: '15px' }}>Payment Breakdown</h3>
                                <DollarSign size={16} style={{ color: '#64748B' }} />
                            </div>
                            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: '#94A3B8', fontSize: '14px' }}>Bounty Reward</span>
                                    <span style={{ color: '#F8FAFC', fontWeight: '700', fontFamily: 'JetBrains Mono' }}>{currency}{formData.budget.toLocaleString()}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <span style={{ color: '#94A3B8', fontSize: '14px' }}>Platform Fee </span>
                                        <span style={{ color: '#64748B', fontSize: '12px' }}>(2%)</span>
                                    </div>
                                    <span style={{ color: '#F59E0B', fontWeight: '700', fontFamily: 'JetBrains Mono' }}>{currency}{platformFee.toLocaleString()}</span>
                                </div>
                                <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)' }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: '800', color: '#F8FAFC', fontSize: '16px', fontFamily: 'Space Grotesk' }}>Total to Deduct</span>
                                    <span style={{ fontSize: '22px', fontWeight: '900', color: '#FF6B35', fontFamily: 'Space Grotesk' }}>{currency}{totalAmount.toLocaleString()}</span>
                                </div>
                                <p style={{ fontSize: '12px', color: '#64748B', lineHeight: 1.5 }}>
                                    💡 For a {currency}{formData.budget.toLocaleString()} bounty, we recommend having at least <strong style={{ color: '#F8FAFC' }}>{currency}{totalAmount.toLocaleString()}</strong> in your vault (reward + 2% platform fee).
                                </p>
                            </div>
                        </div>

                        {/* Escrow guarantees */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {[
                                { text: 'Money held in secure escrow — released only on your approval', color: '#10B981' },
                                { text: 'Instant full refund if you cancel before any hunter joins', color: '#10B981' },
                                { text: '30% of each hunter\'s stake returned as consolation if they lose', color: '#3B82F6' },
                            ].map((item, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: `${item.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <Check size={11} style={{ color: item.color }} />
                                    </div>
                                    <span style={{ fontSize: '13px', color: '#94A3B8' }}>{item.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 6: // Processing (Mock)
                return (
                    <div className="flex flex-col items-center justify-center h-full min-h-[400px] animate-fade-in">
                        <div className="w-16 h-16 border-4 border-iq-primary border-t-transparent rounded-full animate-spin mb-6"></div>
                        <h3 className="text-xl font-bold text-white mb-2">Securing funds in escrow...</h3>
                        <p className="text-iq-text-secondary">Please do not close this window</p>
                    </div>
                );

            case 7: // Success
                return (
                    <div className="flex flex-col items-center justify-center h-full min-h-[400px] animate-fade-in text-center">
                        <div className="w-20 h-20 bg-iq-success/20 rounded-full flex items-center justify-center mb-6 animate-bounce">
                            <Check size={40} className="text-iq-success" />
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-2">Bounty Live! </h2>
                        <p className="text-iq-text-secondary max-w-md mb-8">
                            Your bounty is now visible to thousands of skilled hunters. You'll be notified when applications arrive.
                        </p>
                        <div className="flex gap-4">
                            <button onClick={() => navigate('/payer/dashboard')} className="btn-primary">
                                Go to Dashboard
                            </button>
                        </div>
                    </div>
                );

            default: return null;
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: 'transparent' }}>
            {/* Progress bar */}
            {step < 7 && (
                <div style={{ height: '3px', background: 'rgba(255,255,255,0.07)', width: '100%', position: 'sticky', top: 0, zIndex: 10 }}>
                    <div
                        style={{
                            height: '100%',
                            background: 'linear-gradient(90deg, #FF6B35, #F59E0B)',
                            width: `${(step / 6) * 100}%`,
                            transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                            borderRadius: '0 3px 3px 0',
                        }}
                    />
                </div>
            )}

            <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 16px 80px', width: '100%' }}>
                <div style={{ display: 'flex', flexDirection: 'column', minHeight: '80vh' }}>
                    {/* Step Header */}
                    {step < 7 && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px' }}>
                            <button
                                onClick={() => step > 1 && setStep(s => s - 1)}
                                disabled={step === 1}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    padding: '8px 14px', borderRadius: '10px',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    color: step === 1 ? 'transparent' : '#94A3B8',
                                    cursor: step === 1 ? 'default' : 'pointer',
                                    pointerEvents: step === 1 ? 'none' : 'auto',
                                    fontSize: '13px', fontWeight: '600',
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                <ArrowLeft size={16} /> Back
                            </button>
                            <span style={{ color: '#64748B', fontSize: '13px', fontWeight: '600' }}>Step {step} of 6</span>
                            <div style={{ width: '80px' }} />
                        </div>
                    )}

                    {/* Step Content */}
                    <div style={{ flex: 1 }}>
                        {renderStep()}
                    </div>

                    {/* Footer Actions */}
                    {step < 6 && (
                        <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setStep(s => s + 1)}
                                disabled={
                                    (step === 1 && !formData.title) ||
                                    (step === 2 && !formData.description)
                                }
                                className="btn-primary"
                                style={{ padding: '14px 36px', fontSize: '15px', borderRadius: '14px' }}
                            >
                                Continue <ArrowRight size={20} />
                            </button>
                        </div>
                    )}

                    {step === 5 && (
                        <div style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-end' }}>
                            {(currentUser?.wallet_balance || 0) < totalAmount && (
                                <p style={{ fontSize: '13px', color: '#94A3B8', textAlign: 'right' }}>
                                    Not enough funds? {' '}
                                    <button
                                        onClick={() => navigate('/payer/vault')}
                                        style={{ color: '#FF6B35', fontWeight: '700', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                                    >
                                        Add funds to Vault →
                                    </button>
                                </p>
                            )}
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button className="btn-secondary" style={{ padding: '14px 24px', fontSize: '14px', borderRadius: '14px' }}>Save Draft</button>
                                <button
                                    onClick={() => { setStep(6); setTimeout(handleSubmit, 2000); }}
                                    disabled={(currentUser?.wallet_balance || 0) < totalAmount}
                                    className="btn-primary"
                                    style={{
                                        padding: '14px 36px', fontSize: '15px', borderRadius: '14px',
                                        opacity: (currentUser?.wallet_balance || 0) < totalAmount ? 0.45 : 1,
                                        cursor: (currentUser?.wallet_balance || 0) < totalAmount ? 'not-allowed' : 'pointer',
                                    }}
                                >
                                    Pay & Post <ArrowRight size={20} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

