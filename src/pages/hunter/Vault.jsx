import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
    Wallet, ArrowDownLeft, ArrowUpRight, Clock, CheckCircle,
    XCircle, Shield, TrendingUp, Zap, Plus, Minus,
    Copy, ChevronDown, ChevronUp, AlertCircle
} from 'lucide-react';
import {
    getTransactions, submitDepositRequest, submitWithdrawRequest,
    getHunterStakes
} from '../../lib/firebaseService';

// Transaction icon helper
function TxIcon({ type }) {
    const configs = {
        deposit: { icon: ArrowDownLeft, color: '#06FFA5', bg: 'rgba(6,255,165,0.1)' },
        withdrawal: { icon: ArrowUpRight, color: '#F72585', bg: 'rgba(247,37,133,0.1)' },
        stake: { icon: Shield, color: '#F6C90E', bg: 'rgba(246,201,14,0.1)' },
        earning: { icon: Zap, color: '#FF6B35', bg: 'rgba(255,107,53,0.1)' },
        refund: { icon: CheckCircle, color: '#4CC9F0', bg: 'rgba(76,201,240,0.1)' },
    };
    const c = configs[type?.toLowerCase()] || configs.deposit;
    return (
        <div style={{
            width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
            background: c.bg, border: `1px solid ${c.color}25`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
            <c.icon size={18} style={{ color: c.color }} />
        </div>
    );
}

// Status badge
function StatusBadge({ status }) {
    const configs = {
        completed: { color: '#06FFA5', bg: 'rgba(6,255,165,0.08)', border: 'rgba(6,255,165,0.2)', label: 'Completed' },
        pending: { color: '#F6C90E', bg: 'rgba(246,201,14,0.08)', border: 'rgba(246,201,14,0.2)', label: 'Pending' },
        failed: { color: '#F72585', bg: 'rgba(247,37,133,0.08)', border: 'rgba(247,37,133,0.2)', label: 'Failed' },
    };
    const c = configs[status?.toLowerCase()] || configs.pending;
    return (
        <span style={{
            padding: '3px 10px', borderRadius: '100px', fontSize: '10px', fontWeight: '700',
            background: c.bg, color: c.color, border: `1px solid ${c.border}`,
            letterSpacing: '0.06em', textTransform: 'uppercase',
        }}>
            {c.label}
        </span>
    );
}

// Modal wrapper
function Modal({ isOpen, onClose, title, accent, children }) {
    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = '';
        return () => document.body.style.overflow = '';
    }, [isOpen]);

    if (!isOpen) return null;
    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(5,8,20,0.92)', backdropFilter: 'blur(16px)' }} />
            <div style={{
                position: 'relative', width: '100%', maxWidth: '460px',
                borderRadius: '24px',
                background: 'rgba(8,12,28,0.99)',
                border: `1px solid ${accent}30`,
                boxShadow: `0 0 80px ${accent}12, 0 40px 80px rgba(0,0,0,0.7)`,
                padding: '32px',
                animation: 'scaleIn 0.2s ease',
                maxHeight: '90vh', overflowY: 'auto',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#F0F4FF', fontFamily: 'Space Grotesk' }}>{title}</h3>
                    <button onClick={onClose} style={{ width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#8892AA', cursor: 'pointer', fontSize: '20px', fontWeight: 300 }}>
                        ×
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}

export default function HunterVault() {
    const { currentUser, refreshUser } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [stakes, setStakes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [depositModal, setDepositModal] = useState(false);
    const [withdrawModal, setWithdrawModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [success, setSuccess] = useState(null);
    const [formError, setFormError] = useState(null);

    // Deposit form
    const [depositAmount, setDepositAmount] = useState('');
    const [depositUtr, setDepositUtr] = useState('');
    const [depositMethod, setDepositMethod] = useState('upi');

    // Withdraw form
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawUpi, setWithdrawUpi] = useState('');
    const [withdrawHolder, setWithdrawHolder] = useState('');

    const currency = currentUser?.currency || 'INR';
    const symbol = currency === 'INR' ? '₹' : '$';
    const wallet = currentUser?.wallet_balance || 0;
    const stakeBalance = currentUser?.stake_balance || 0;

    useEffect(() => { if (currentUser?.id) loadData(); }, [currentUser]);

    async function loadData() {
        setLoading(true);
        try {
            const [txs, stks] = await Promise.all([
                getTransactions(currentUser.id, 30),
                getHunterStakes(currentUser.id),
            ]);
            setTransactions(txs || []);
            setStakes(stks || []);
        } catch (err) {
            console.error('Vault load error:', err);
        } finally {
            setLoading(false);
        }
    }

    async function handleDeposit() {
        if (!depositAmount || !depositUtr || parseFloat(depositAmount) <= 0) {
            setFormError('Please enter a valid amount and UTR number');
            return;
        }
        setActionLoading(true);
        setFormError(null);
        try {
            await submitDepositRequest(currentUser.id, parseFloat(depositAmount), depositUtr, depositMethod, currency);
            setDepositModal(false);
            setDepositAmount(''); setDepositUtr('');
            setSuccess('Deposit request submitted! Admin will verify and credit your vault within 24 hours.');
            await loadData();
        } catch (err) {
            setFormError(err.message || 'Deposit failed. Please try again.');
        } finally {
            setActionLoading(false);
        }
    }

    async function handleWithdraw() {
        const amount = parseFloat(withdrawAmount);
        if (!amount || amount <= 0) { setFormError('Enter a valid amount'); return; }
        if (amount > wallet) { setFormError('Insufficient balance'); return; }
        if (!withdrawUpi?.trim()) { setFormError('Enter your UPI ID'); return; }
        setActionLoading(true);
        setFormError(null);
        try {
            await submitWithdrawRequest(currentUser.id, amount, withdrawUpi, withdrawHolder, currency);
            await refreshUser();
            setWithdrawModal(false);
            setWithdrawAmount(''); setWithdrawUpi(''); setWithdrawHolder('');
            setSuccess(`Withdrawal of ${symbol}${amount.toLocaleString()} submitted. Processing in 2–3 business days.`);
            await loadData();
        } catch (err) {
            setFormError(err.message || 'Withdrawal failed. Please try again.');
        } finally {
            setActionLoading(false);
        }
    }

    const upiId = 'iqhuntarena@upi';

    const summaryStats = [
        { label: 'Available Balance', value: `${symbol}${wallet.toLocaleString()}`, color: '#06FFA5', icon: Wallet, glow: 'rgba(6,255,165,0.15)' },
        { label: 'Active Stakes', value: `${symbol}${stakeBalance.toLocaleString()}`, color: '#F6C90E', icon: Shield, glow: 'rgba(246,201,14,0.15)' },
        { label: 'Total Earned', value: `${symbol}${(currentUser?.total_earnings || 0).toLocaleString()}`, color: '#FF6B35', icon: TrendingUp, glow: 'rgba(255,107,53,0.15)' },
        { label: 'Missions Completed', value: String(currentUser?.hunts_completed || 0), color: '#9B5DE5', icon: Zap, glow: 'rgba(155,93,229,0.15)' },
    ];

    return (
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px', color: '#F0F4FF' }}>
            {/* Title */}
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: 'clamp(1.8rem,5vw,3rem)', fontWeight: '900', fontFamily: 'Space Grotesk', letterSpacing: '-0.02em', marginBottom: '8px' }}>
                    Hunter Vault
                </h1>
                <p style={{ color: '#8892AA', fontWeight: '500' }}>
                    Manage your earnings, stakes, and transactions.
                </p>
            </div>

            {/* Success message */}
            {success && (
                <div style={{
                    display: 'flex', alignItems: 'flex-start', gap: '12px',
                    padding: '16px', borderRadius: '14px', marginBottom: '24px',
                    background: 'rgba(6,255,165,0.08)', border: '1px solid rgba(6,255,165,0.2)', color: '#06FFA5',
                    animation: 'fadeInUp 0.3s ease',
                }}>
                    <CheckCircle size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
                    <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '14px', fontWeight: '600', lineHeight: 1.5 }}>{success}</p>
                    </div>
                    <button onClick={() => setSuccess(null)} style={{ color: '#06FFA5', background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', lineHeight: 1 }}>×</button>
                </div>
            )}

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }} className="grid-cols-2 lg:grid-cols-4">
                {summaryStats.map((stat, i) => (
                    <div key={i} style={{
                        padding: '22px 20px', borderRadius: '18px',
                        background: `${stat.color}06`,
                        border: `1px solid ${stat.color}18`,
                        transition: 'all 0.3s ease', cursor: 'default',
                    }}
                        onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 12px 30px ${stat.glow}`; }}
                        onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: `${stat.color}12`, border: `1px solid ${stat.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                            <stat.icon size={18} style={{ color: stat.color }} />
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: '900', color: '#F0F4FF', fontFamily: 'Space Grotesk', letterSpacing: '-0.01em', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stat.value}</div>
                        <div style={{ fontSize: '11px', color: '#8892AA', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }} className="grid-cols-1 sm:grid-cols-2">
                <button onClick={() => { setDepositModal(true); setFormError(null); }} className="btn-primary"
                    style={{ justifyContent: 'center', gap: '10px', fontSize: '15px', padding: '18px', borderRadius: '14px', letterSpacing: '0.04em' }}>
                    <Plus size={20} /> Deposit Funds
                </button>
                <button onClick={() => { setWithdrawModal(true); setFormError(null); }} className="btn-secondary"
                    style={{ justifyContent: 'center', gap: '10px', fontSize: '15px', padding: '18px', borderRadius: '14px', letterSpacing: '0.04em' }}>
                    <Minus size={20} /> Withdraw
                </button>
            </div>

            {/* Active Stakes */}
            {stakes.length > 0 && (
                <div style={{ marginBottom: '28px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: '800', fontFamily: 'Space Grotesk', color: '#F0F4FF', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Shield size={18} style={{ color: '#F6C90E' }} /> Active Stakes ({stakes.length})
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {stakes.map(stake => (
                            <div key={stake.id} style={{
                                padding: '20px 22px', borderRadius: '16px',
                                background: 'rgba(246,201,14,0.05)',
                                border: '1px solid rgba(246,201,14,0.15)',
                                display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap',
                            }}>
                                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(246,201,14,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <Shield size={20} style={{ color: '#F6C90E' }} />
                                </div>
                                <div style={{ flex: 1, minWidth: '150px' }}>
                                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#F0F4FF', marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {stake.bounty_title || 'Active Mission'}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#8892AA' }}>Active stake</div>
                                </div>
                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                    <div style={{ fontSize: '18px', fontWeight: '900', color: '#F6C90E', fontFamily: 'JetBrains Mono' }}>
                                        {symbol}{(stake.stake_amount || 0).toLocaleString()}
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#8892AA' }}>staked amount</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Transactions */}
            <div>
                <h2 style={{ fontSize: '18px', fontWeight: '800', fontFamily: 'Space Grotesk', color: '#F0F4FF', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={18} style={{ color: '#00E5FF' }} /> Transaction History
                </h2>

                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '70px', borderRadius: '14px' }} />)}
                    </div>
                ) : transactions.length === 0 ? (
                    <div style={{ padding: '40px', borderRadius: '18px', textAlign: 'center', background: 'rgba(10,15,35,0.5)', border: '1px dashed rgba(255,255,255,0.08)' }}>
                        <Wallet size={36} style={{ color: '#4B5563', margin: '0 auto 12px' }} />
                        <p style={{ color: '#8892AA', fontWeight: '500' }}>No transactions yet. Make your first deposit to get started!</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {transactions.map(tx => {
                            const isCredit = ['deposit', 'earning', 'refund'].includes(tx.type?.toLowerCase());
                            const ts = tx.created_at?.toDate ? tx.created_at.toDate() : new Date(tx.created_at || Date.now());
                            return (
                                <div key={tx.id} style={{
                                    display: 'flex', alignItems: 'center', gap: '14px', padding: '18px 20px',
                                    borderRadius: '14px', background: 'rgba(10,15,35,0.7)',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    transition: 'all 0.2s ease',
                                }}
                                    onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.background = 'rgba(10,15,35,0.9)'; }}
                                    onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.background = 'rgba(10,15,35,0.7)'; }}>
                                    <TxIcon type={tx.type} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#F0F4FF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '3px' }}>
                                            {tx.description || `${tx.type} transaction`}
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#8892AA' }}>
                                            {ts.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </div>
                                    </div>
                                    <StatusBadge status={tx.status} />
                                    <div style={{
                                        fontFamily: 'JetBrains Mono', fontWeight: '900', fontSize: '16px',
                                        color: isCredit ? '#06FFA5' : '#F72585',
                                        flexShrink: 0, marginLeft: '4px',
                                    }}>
                                        {isCredit ? '+' : '-'}{symbol}{(tx.amount || 0).toLocaleString()}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ─── DEPOSIT MODAL ─── */}
            <Modal isOpen={depositModal} onClose={() => { setDepositModal(false); setFormError(null); }} title="Deposit Funds" accent="#06FFA5">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* UPI info */}
                    <div style={{ padding: '20px', borderRadius: '14px', background: 'rgba(6,255,165,0.06)', border: '1px solid rgba(6,255,165,0.2)', textAlign: 'center' }}>
                        <p style={{ color: '#8892AA', fontSize: '13px', marginBottom: '10px' }}>Send to IQHUNT UPI ID:</p>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                            <span style={{ fontFamily: 'JetBrains Mono', fontWeight: '900', fontSize: '18px', color: '#06FFA5' }}>{upiId}</span>
                            <button onClick={() => { navigator.clipboard.writeText(upiId); }} style={{
                                padding: '6px 10px', borderRadius: '8px', background: 'rgba(6,255,165,0.1)',
                                border: '1px solid rgba(6,255,165,0.2)', color: '#06FFA5', cursor: 'pointer', fontSize: '12px',
                            }}>
                                <Copy size={13} />
                            </button>
                        </div>
                        <p style={{ color: '#4B5563', fontSize: '12px', marginTop: '10px' }}>After sending, enter the UTR number below.</p>
                    </div>

                    {/* Amount */}
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#8892AA', marginBottom: '8px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Amount ({symbol})</label>
                        <input type="number" min="100" placeholder="Min ₹100" value={depositAmount}
                            onChange={e => setDepositAmount(e.target.value)} className="input-field" />
                    </div>

                    {/* Method */}
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#8892AA', marginBottom: '8px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Payment Method</label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            {[{ value: 'upi', label: 'UPI' }, { value: 'neft', label: 'NEFT' }, { value: 'imps', label: 'IMPS' }].map(m => (
                                <button key={m.value} type="button" onClick={() => setDepositMethod(m.value)} style={{
                                    flex: 1, padding: '10px', borderRadius: '10px',
                                    background: depositMethod === m.value ? 'rgba(6,255,165,0.12)' : 'rgba(255,255,255,0.03)',
                                    border: depositMethod === m.value ? '1px solid rgba(6,255,165,0.35)' : '1px solid rgba(255,255,255,0.08)',
                                    color: depositMethod === m.value ? '#06FFA5' : '#8892AA',
                                    fontWeight: '700', fontSize: '13px', cursor: 'pointer',
                                }}>
                                    {m.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* UTR */}
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#8892AA', marginBottom: '8px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>UTR / Reference Number</label>
                        <input type="text" placeholder="Enter UTR/Reference number" value={depositUtr}
                            onChange={e => setDepositUtr(e.target.value)} className="input-field" />
                    </div>

                    {formError && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', borderRadius: '10px', background: 'rgba(247,37,133,0.08)', border: '1px solid rgba(247,37,133,0.2)', color: '#F72585', fontSize: '13px' }}>
                            <AlertCircle size={15} /> {formError}
                        </div>
                    )}

                    <button onClick={handleDeposit} disabled={actionLoading || !depositAmount || !depositUtr} className="btn-primary"
                        style={{ width: '100%', justifyContent: 'center', gap: '8px', borderRadius: '12px', opacity: (actionLoading || !depositAmount || !depositUtr) ? 0.5 : 1 }}>
                        {actionLoading ? <><div className="spinner-sm" /> Submitting...</> : <><CheckCircle size={16} /> Submit Deposit Request</>}
                    </button>
                </div>
            </Modal>

            {/* ─── WITHDRAW MODAL ─── */}
            <Modal isOpen={withdrawModal} onClose={() => { setWithdrawModal(false); setFormError(null); }} title="Withdraw Funds" accent="#F72585">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ padding: '14px 16px', borderRadius: '12px', background: 'rgba(6,255,165,0.06)', border: '1px solid rgba(6,255,165,0.2)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Wallet size={16} style={{ color: '#06FFA5', flexShrink: 0 }} />
                        <div>
                            <div style={{ fontSize: '11px', color: '#8892AA', marginBottom: '2px' }}>Available</div>
                            <div style={{ fontFamily: 'JetBrains Mono', fontWeight: '900', fontSize: '18px', color: '#06FFA5' }}>{symbol}{wallet.toLocaleString()}</div>
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#8892AA', marginBottom: '8px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Amount ({symbol})</label>
                        <input type="number" min="100" max={wallet} placeholder="Enter amount" value={withdrawAmount}
                            onChange={e => setWithdrawAmount(e.target.value)} className="input-field" />
                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                            {[25, 50, 75, 100].map(pct => (
                                <button key={pct} type="button" onClick={() => setWithdrawAmount(Math.floor(wallet * pct / 100))} style={{
                                    flex: 1, padding: '8px', borderRadius: '8px',
                                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                                    color: '#8892AA', fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                                }}>
                                    {pct}%
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#8892AA', marginBottom: '8px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>UPI ID *</label>
                        <input type="text" placeholder="yourname@upi" value={withdrawUpi}
                            onChange={e => setWithdrawUpi(e.target.value)} className="input-field" />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#8892AA', marginBottom: '8px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Account Holder Name</label>
                        <input type="text" placeholder="Full name" value={withdrawHolder}
                            onChange={e => setWithdrawHolder(e.target.value)} className="input-field" />
                    </div>

                    {formError && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', borderRadius: '10px', background: 'rgba(247,37,133,0.08)', border: '1px solid rgba(247,37,133,0.2)', color: '#F72585', fontSize: '13px' }}>
                            <AlertCircle size={15} /> {formError}
                        </div>
                    )}

                    <button onClick={handleWithdraw} disabled={actionLoading || !withdrawAmount || !withdrawUpi} className="btn-primary"
                        style={{ width: '100%', justifyContent: 'center', background: 'linear-gradient(135deg, #F72585, #9B5DE5)', gap: '8px', borderRadius: '12px', boxShadow: '0 4px 25px rgba(247,37,133,0.3)', opacity: (actionLoading || !withdrawAmount || !withdrawUpi) ? 0.5 : 1 }}>
                        {actionLoading ? <><div className="spinner-sm" /> Processing...</> : <><ArrowUpRight size={16} /> Confirm Withdrawal</>}
                    </button>

                    <p style={{ fontSize: '12px', color: '#4B5563', textAlign: 'center' }}>
                        Withdrawals process within 2–3 business days via UPI
                    </p>
                </div>
            </Modal>
        </div>
    );
}
