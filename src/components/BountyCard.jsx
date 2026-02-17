import { Target, Users, Calendar, TrendingUp, Clock, AlertCircle, CheckCircle, Lock, Heart, ChevronRight, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function BountyCard({ bounty, userRole = 'hunter' }) {
    const {
        id, title, description, reward, currency,
        max_hunters = 10, submission_deadline, status,
        entry_fee = 0, difficulty = 'Medium', is_featured, is_urgent,
        vault_locked = 0
    } = bounty;

    const symbol = currency === 'INR' ? '₹' : '$';
    const deadline = new Date(submission_deadline);
    const now = new Date();
    const daysLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
    const isExpiringSoon = daysLeft <= 3 && daysLeft > 0;
    const isExpired = daysLeft <= 0;

    // Count staked hunters (mock for now - will come from database count in parent or join)
    // Assuming bounty object might have hunter_stakes_count if joined
    const stakedHunters = bounty.hunter_count || bounty.staked_count || 0;
    const slotsLeft = max_hunters - stakedHunters;

    // Determine if payment is secured (vault has enough funds)
    const isSecured = vault_locked >= reward;

    return (
        <div className="card group relative p-6 cursor-pointer overflow-hidden flex flex-col h-full">

            {/* Hover Gradient Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-iq-primary/0 via-white/5 to-iq-accent/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

            {/* Header */}
            <div className="relative flex justify-between items-start mb-4 z-10">
                <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap gap-2">
                        {/* Category/Type Badge */}
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider badge-mission">
                            <Target size={10} />
                            {bounty.category || 'Mission'}
                        </span>

                        {is_featured && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider badge-featured">
                                ⭐ Featured
                            </span>
                        )}

                        {(is_urgent || isExpiringSoon) && !isExpired && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider badge-urgent">
                                🔥 Urgent
                            </span>
                        )}

                        {isSecured && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-iq-success/10 text-iq-success border border-iq-success/20">
                                <ShieldCheck size={10} />
                                Secured
                            </span>
                        )}
                        {!isSecured && vault_locked > 0 && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-500 border border-blue-500/20">
                                <Lock size={10} />
                                Vaulted
                            </span>
                        )}
                    </div>
                </div>

                {/* Like/Heart (Mock) */}
                <button className="text-white/20 hover:text-iq-error transition-colors p-1" title="Save to favorites">
                    <Heart size={20} />
                </button>
            </div>

            {/* Content */}
            <div className="relative z-10 flex-1">
                <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 group-hover:text-iq-primary transition-colors">
                    {title}
                </h3>
                <p className="text-iq-text-secondary text-sm line-clamp-2 mb-6 h-10">
                    {description}
                </p>

                {/* Grid Stats */}
                <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs text-iq-text-secondary mb-6 p-4 bg-iq-surface/50 rounded-xl border border-white/5">
                    <div className="flex items-center gap-2">
                        <Clock size={14} className={isExpiringSoon ? 'text-iq-warning' : ''} />
                        <span className={isExpiringSoon ? 'text-iq-warning font-mono font-bold' : 'font-mono'}>
                            {isExpired ? 'Expired' : `${daysLeft}d left`}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Users size={14} />
                        <span className="font-mono">{stakedHunters}/{max_hunters} Joined</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <TrendingUp size={14} />
                        <span className={`font-bold uppercase tracking-wider ${difficulty === 'Easy' ? 'difficulty-easy' :
                            difficulty === 'Medium' ? 'difficulty-medium' : 'difficulty-hard'
                            }`}>
                            {difficulty}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Lock size={14} />
                        <span className="font-mono">
                            Entry: {entry_fee > 0 ? `${symbol}${entry_fee}` : 'Free'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between mt-auto">
                <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-wider text-iq-text-secondary mb-0.5">Reward Pool</span>
                    <span className="text-2xl font-bold text-iq-primary tracking-tight">
                        {symbol}{reward.toLocaleString()}
                    </span>
                </div>

                {userRole === 'hunter' && status === 'live' && !isExpired && (
                    <Link
                        to={`/hunter/bounty/${id}`}
                        className="group/btn flex items-center gap-2 px-5 py-2.5 bg-white text-black font-bold rounded-xl hover:bg-iq-primary hover:scale-105 transition-all active:scale-95 shadow-lg shadow-white/5"
                    >
                        View
                        <ChevronRight size={16} className="group-hover/btn:translate-x-0.5 transition-transform" />
                    </Link>
                )}

                {userRole === 'payer' && (
                    <Link
                        to={`/payer/bounty/${id}`}
                        className="group/btn flex items-center gap-2 px-5 py-2.5 bg-iq-surface text-white border border-white/10 font-bold rounded-xl hover:bg-white/10 transition-all active:scale-95"
                    >
                        Manage
                        <ChevronRight size={16} className="group-hover/btn:translate-x-0.5 transition-transform" />
                    </Link>
                )}
            </div>
        </div>
    );
}
