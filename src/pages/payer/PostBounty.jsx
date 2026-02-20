import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient';
import {
    Target, FileText, Calendar, DollarSign, Upload, ArrowRight, ArrowLeft,
    Check, Sparkles, MessageSquare, Briefcase, Zap, Info, X
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

    // Chat State
    const [messages, setMessages] = useState([
        { type: 'ai', text: "Hi! I'm your AI assistant. Let's create the perfect bounty together. What do you need help with?" }
    ]);
    const chatEndRef = useRef(null);

    const currency = currentUser?.currency === 'INR' ? '₹' : '$';

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

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

    // AI Simulation
    const addAiMessage = (text, delay = 500) => {
        setTimeout(() => {
            setMessages(prev => [...prev, { type: 'ai', text }]);
        }, delay);
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        // AI Reactions
        if (field === 'title' && value.length > 10 && messages.length < 2) {
            addAiMessage(`"${value}" sounds interesting! I can help you refine the description in the next step.`);
        }
        if (field === 'category' && value) {
            addAiMessage(`Great choice! For ${value} projects, clarity is key. I'll guide you through the requirements.`);
        }
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

    // Calculate Platform Fees
    const platformFee = formData.budget * 0.15;
    const gatewayFee = (formData.budget + platformFee) * 0.02; // Approx 2%
    const totalAmount = formData.budget + platformFee + gatewayFee;

    // Stake Calculation (Backend Logic Compatibility)
    const calculateStake = (amount) => {
        if (amount < 1500) return { stake: 15, max: 4 };
        if (amount < 3000) return { stake: 25, max: 6 };
        if (amount < 4500) return { stake: 40, max: 8 };
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

            // 3. Deduct Balance
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

                        <div className="bg-iq-surface/50 p-4 rounded-xl border border-dashed border-iq-primary/30 flex items-start gap-3">
                            <Sparkles className="text-iq-primary shrink-0 mt-1" size={18} />
                            <div className="text-sm text-iq-text-secondary">
                                <p className="text-white font-medium mb-1">AI Suggestion:</p>
                                <p>Try to include your brand colors, target audience, and examples of styles you like. The more details, the better the results.</p>
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
                            <button className="flex items-center gap-2 text-sm text-iq-primary hover:text-iq-accent transition-colors">
                                <Sparkles size={14} /> Improve with AI
                            </button>
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

                        <div className="bg-iq-card border border-white/10 rounded-xl overflow-hidden">
                            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                                <h3 className="font-bold text-white">Payment Breakdown</h3>
                                <DollarSign className="text-iq-text-secondary" size={18} />
                            </div>
                            <div className="p-4 space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-iq-text-secondary">Bounty Reward</span>
                                    <span className="text-white">{currency}{formData.budget.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-iq-text-secondary">Platform Fee (15%)</span>
                                    <span className="text-white">{currency}{platformFee.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-iq-text-secondary">Gateway Fee (~2%)</span>
                                    <span className="text-white">{currency}{gatewayFee.toLocaleString()}</span>
                                </div>
                                <div className="h-px bg-white/10 my-2"></div>
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-white">Total to Pay</span>
                                    <span className="text-xl font-bold text-iq-primary">{currency}{totalAmount.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-iq-surface p-4 rounded-xl space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded-full bg-iq-success/20 flex items-center justify-center">
                                    <Check size={12} className="text-iq-success" />
                                </div>
                                <span className="text-sm text-iq-text-secondary">Money held in secure escrow</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded-full bg-iq-success/20 flex items-center justify-center">
                                    <Check size={12} className="text-iq-success" />
                                </div>
                                <span className="text-sm text-iq-text-secondary">100% refund if no hunter selected</span>
                            </div>
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
        <div className="flex flex-col md:flex-row min-h-screen bg-iq-background">
            {/* Left AI Sidebar (Desktop: 40%) */}
            {step < 7 && (
                <div className="w-full md:w-[40%] bg-iq-surface border-r border-white/5 flex flex-col h-[30vh] md:h-screen sticky top-0">
                    <div className="p-6 border-b border-white/5 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-iq-primary/20 flex items-center justify-center">
                            <Sparkles className="text-iq-primary" size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-white">AI Assistant</h3>
                            <p className="text-xs text-iq-text-secondary">Helping you draft...</p>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.type === 'user'
                                        ? 'bg-iq-primary text-black rounded-tr-none'
                                        : 'bg-iq-card text-white border border-white/10 rounded-tl-none'
                                    }`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        <div ref={chatEndRef} />
                    </div>

                    <div className="p-4 border-t border-white/5">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Type to ask for help..."
                                className="w-full bg-iq-background border border-white/10 rounded-full py-3 px-4 text-sm text-white focus:outline-none focus:border-iq-primary/50"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && e.target.value) {
                                        setMessages(prev => [...prev, { type: 'user', text: e.target.value }]);
                                        e.target.value = '';
                                        setTimeout(() => addAiMessage("I'm adding that to your requirements momentarily. Is there anything else?"), 1000);
                                    }
                                }}
                            />
                            <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-iq-primary rounded-full text-black">
                                <ArrowRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Right Form Area (Desktop: 60%) */}
            <div className={`flex-1 flex flex-col ${step === 7 ? 'w-full' : ''}`}>
                {step < 7 && (
                    <div className="h-2 bg-iq-surface w-full">
                        <div
                            className="h-full bg-iq-primary transition-all duration-500"
                            style={{ width: `${(step / 6) * 100}%` }}
                        />
                    </div>
                )}

                <div className="flex-1 p-6 md:p-12 overflow-y-auto">
                    <div className="max-w-2xl mx-auto w-full h-full flex flex-col">
                        {/* Step Header */}
                        {step < 7 && (
                            <div className="flex items-center justify-between mb-8">
                                <button
                                    onClick={() => step > 1 && setStep(s => s - 1)}
                                    disabled={step === 1}
                                    className={`p-2 rounded-lg hover:bg-white/5 transition-colors ${step === 1 ? 'opacity-0 pointer-events-none' : 'text-iq-text-secondary'}`}
                                >
                                    <ArrowLeft size={24} />
                                </button>
                                <span className="text-sm font-medium text-iq-text-secondary">Step {step} of 6</span>
                                <div className="w-10"></div> {/* Spacer */}
                            </div>
                        )}

                        {/* Step Content */}
                        <div className="flex-1">
                            {renderStep()}
                        </div>

                        {/* Step Footer/Actions */}
                        {step < 6 && (
                            <div className="mt-8 flex justify-end">
                                <button
                                    onClick={() => setStep(s => s + 1)}
                                    disabled={
                                        (step === 1 && !formData.title) ||
                                        (step === 2 && !formData.description)
                                    }
                                    className="btn-primary px-8 py-3 text-base flex items-center gap-2"
                                >
                                    Continue <ArrowRight size={20} />
                                </button>
                            </div>
                        )}

                        {step === 5 && (
                            <div className="mt-8 flex justify-end gap-4">
                                <button className="btn-secondary">Save Draft</button>
                                <button onClick={() => { setStep(6); setTimeout(handleSubmit, 2000); }} className="btn-primary px-8 py-3 text-base flex items-center gap-2">
                                    Pay & Post <ArrowRight size={20} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

