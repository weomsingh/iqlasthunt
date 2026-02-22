import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient';
import {
    Wallet, TrendingUp, TrendingDown, Clock, ArrowUpRight,
    ArrowDownLeft, History, Filter, Download, MoreHorizontal, AlertCircle
} from 'lucide-react';

export default function PayerVault() {
    const { currentUser, refreshUser } = useAuth();
    const currency = currentUser?.currency === 'INR' ? '₹' : '$';

    // Ensure wallet_balance is safe to use
    const walletBalance = currentUser?.wallet_balance || 0;

    const [transactions, setTransactions] = useState([]);
    const [stats, setStats] = useState({
        totalSpent: 0,
        inEscrow: 0,
        thisMonth: 0
    });
    const [loading, setLoading] = useState(true);
    const [showDepositModal, setShowDepositModal] = useState(false);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [amount, setAmount] = useState('');
    const [utrNumber, setUtrNumber] = useState('');
    const [upiId, setUpiId] = useState('');
    const [processing, setProcessing] = useState(false);
    const [filter, setFilter] = useState('all');

    const filteredTransactions = (transactions || []).filter(t => {
        if (!t) return false;
        if (filter === 'all') return true;
        if (filter === 'deposit') return t.type === 'deposit';
        if (filter === 'withdraw') return t.type === 'withdrawal';
        if (filter === 'escrow') return ['lock_vault', 'unlock_vault', 'bounty_refund'].includes(t.type);
        return true;
    });

    useEffect(() => {
        if (currentUser?.id) {
            loadVaultData();
        }
    }, [currentUser?.id]);

    async function loadVaultData() {
        if (!currentUser?.id) return;

        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('user_id', currentUser.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setTransactions(data || []);

            // Calculate stats
            const inEscrow = data
                ?.filter(t => t.type === 'lock_vault' && t.status === 'completed')
                .reduce((acc, t) => acc + t.amount, 0) || 0;

            // Subtract released escrow (approvals/refunds)
            const releasedEscrow = data
                ?.filter(t => t.type === 'unlock_vault' && t.status === 'completed')
                .reduce((acc, t) => acc + t.amount, 0) || 0;

            const refundedEscrow = data
                ?.filter(t => t.type === 'bounty_refund' && t.status === 'completed')
                .reduce((acc, t) => acc + t.amount, 0) || 0;

            const totalSpent = data
                ?.filter(t => (t.type === 'lock_vault') && t.status === 'completed')
                .reduce((acc, t) => acc + t.amount, 0) || 0;

            const thisMonth = data
                ?.filter(t => {
                    const d = new Date(t.created_at);
                    const now = new Date();
                    return d.getMonth() === now.getMonth() &&
                        d.getFullYear() === now.getFullYear() &&
                        t.type === 'lock_vault' &&
                        t.status === 'completed';
                })
                .reduce((acc, t) => acc + t.amount, 0) || 0;

            setStats({
                inEscrow: Math.max(0, inEscrow - releasedEscrow - refundedEscrow),
                totalSpent,
                thisMonth
            });

        } catch (error) {
            console.error('Error loading vault:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleDeposit() {
        const value = parseFloat(amount);
        if (!value || value <= 0) { alert('Please enter a valid amount'); return; }
        if (!utrNumber.trim()) { alert('Please enter the UTR / Transaction Reference number'); return; }

        setProcessing(true);
        try {
            const { error } = await supabase
                .from('transactions')
                .insert({
                    user_id: currentUser.id,
                    amount: value,
                    type: 'deposit',
                    currency: currentUser?.currency || 'INR',
                    status: 'pending',          // Admin must verify before crediting
                    metadata: {
                        utr_number: utrNumber,
                        note: 'Payer manual deposit'
                    }
                });

            if (error) throw error;

            await loadVaultData();
            setShowDepositModal(false);
            setAmount('');
            setUtrNumber('');
            alert(`✅ Deposit request submitted!\n\nYour ${currency}${value.toLocaleString()} will be added after admin verification (usually within 24 hours).`);
        } catch (error) {
            console.error('Deposit failed:', error);
            alert('Deposit failed: ' + error.message);
        } finally {
            setProcessing(false);
        }
    }

    async function handleWithdraw() {
        const value = parseFloat(amount);
        if (!value || value <= 0 || value > walletBalance) {
            alert('Invalid withdrawal amount or insufficient balance');
            return;
        }
        if (!upiId.trim()) { alert('Please enter your UPI ID'); return; }

        const confirmed = window.confirm(
            `Withdraw ${currency}${value.toLocaleString()} to UPI: ${upiId}?\n\n` +
            `\u26a0︎ Amount will be deducted immediately.\n` +
            `\u26a0︎ Processing takes 24–48 hours.`
        );
        if (!confirmed) return;

        setProcessing(true);
        try {
            // Deduct from wallet immediately
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ wallet_balance: walletBalance - value })
                .eq('id', currentUser.id);

            if (profileError) throw profileError;

            // Log withdrawal transaction
            const { error: txError } = await supabase
                .from('transactions')
                .insert({
                    user_id: currentUser.id,
                    amount: value,
                    type: 'withdrawal',
                    currency: currentUser?.currency || 'INR',
                    status: 'pending',
                    metadata: { upi_id: upiId, note: 'Payer withdrawal request' }
                });

            if (txError) throw txError;

            await refreshUser();
            await loadVaultData();
            setShowWithdrawModal(false);
            setAmount('');
            setUpiId('');
            alert(`✅ Withdrawal request submitted!\n\n${currency}${value.toLocaleString()} will be sent to ${upiId} within 24–48 hours.`);
        } catch (error) {
            console.error('Withdrawal failed:', error);
            alert('Withdrawal failed: ' + error.message);
        } finally {
            setProcessing(false);
        }
    }

    if (loading) return (
        <div className="flex h-screen items-center justify-center">
            <div className="w-10 h-10 border-4 border-iq-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="space-y-8 pb-20 animate-fade-in text-white relative">
            {/* Header */}
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">My Vault</h1>
                <p className="text-iq-text-secondary">Manage your funds, deposits, and transaction history.</p>
            </div>

            {/* Main Wallet Card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Balance Card */}
                <div className="lg:col-span-2 bg-gradient-to-br from-iq-card to-iq-surface border border-white/5 rounded-2xl p-6 md:p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-iq-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <p className="text-iq-text-secondary mb-1 flex items-center gap-2">
                                    <Wallet size={16} /> Available Balance
                                </p>
                                <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                                    {currency}{walletBalance.toLocaleString()}
                                </h2>
                            </div>
                            <button className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                                <MoreHorizontal className="text-iq-text-secondary" />
                            </button>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowDepositModal(true)}
                                className="btn-primary flex-1 py-3 text-base flex items-center justify-center gap-2"
                            >
                                <ArrowDownLeft size={20} /> Add Funds
                            </button>
                            <button
                                onClick={() => setShowWithdrawModal(true)}
                                className="btn-secondary flex-1 py-3 text-base flex items-center justify-center gap-2"
                            >
                                <ArrowUpRight size={20} /> Withdraw
                            </button>
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="space-y-4">
                    <div className="bg-iq-card border border-white/5 rounded-xl p-5 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                            <Clock size={24} />
                        </div>
                        <div>
                            <p className="text-xs text-iq-text-secondary uppercase tracking-wider font-bold">Locked in Escrow</p>
                            <p className="text-xl font-bold text-white">{currency}{stats.inEscrow.toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="bg-iq-card border border-white/5 rounded-xl p-5 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <p className="text-xs text-iq-text-secondary uppercase tracking-wider font-bold">Total Spent</p>
                            <p className="text-xl font-bold text-white">{currency}{stats.totalSpent.toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="bg-iq-card border border-white/5 rounded-xl p-5 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
                            <TrendingDown size={24} />
                        </div>
                        <div>
                            <p className="text-xs text-iq-text-secondary uppercase tracking-wider font-bold">Spent This Month</p>
                            <p className="text-xl font-bold text-white">{currency}{stats.thisMonth.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* In Escrow Detail (if any) */}
            {stats.inEscrow > 0 && (
                <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="text-yellow-500 shrink-0 mt-0.5" size={20} />
                    <div>
                        <h4 className="font-bold text-yellow-500 text-sm">Funds in Escrow</h4>
                        <p className="text-sm text-iq-text-secondary mt-1">
                            {currency}{stats.inEscrow.toLocaleString()} is currently held securely for your active bounties.
                            These funds will be released to hunters upon approved submission or refunded if cancelled.
                        </p>
                    </div>
                </div>
            )}

            {/* Transaction History */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <History size={20} /> Transaction History
                    </h3>

                    <div className="flex items-center gap-2">
                        <div className="bg-iq-card border border-white/10 rounded-lg p-1 flex">
                            {['all', 'deposit', 'withdraw', 'escrow'].map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-3 py-1.5 rounded text-xs font-medium capitalize transition-colors ${filter === f
                                        ? 'bg-white/10 text-white'
                                        : 'text-iq-text-secondary hover:text-white'
                                        }`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                        <button className="p-2 bg-iq-card border border-white/10 rounded-lg text-iq-text-secondary hover:text-white">
                            <Download size={16} />
                        </button>
                    </div>
                </div>

                <div className="bg-iq-card border border-white/5 rounded-xl overflow-hidden">
                    {filteredTransactions.length === 0 ? (
                        <div className="p-8 text-center">
                            <p className="text-iq-text-secondary">No transactions found</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-white/5">
                            {filteredTransactions.map(tx => (
                                <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${['deposit', 'unlock_vault', 'bounty_refund', 'stake_partial_refund', 'win_prize', 'refund_stake'].includes(tx.type)
                                            ? 'bg-iq-success/10 text-iq-success'
                                            : 'bg-white/5 text-white'
                                            }`}>
                                            {tx.type === 'deposit' && <ArrowDownLeft size={20} />}
                                            {tx.type === 'withdrawal' && <ArrowUpRight size={20} />}
                                            {tx.type === 'lock_vault' && <Clock size={20} />}
                                            {tx.type === 'unlock_vault' && <TrendingDown size={20} />}
                                            {tx.type === 'bounty_refund' && <TrendingDown size={20} />}
                                            {tx.type === 'stake_partial_refund' && <ArrowDownLeft size={20} />}
                                        </div>
                                        <div>
                                            <p className="text-white font-medium capitalize">
                                                {({
                                                    deposit: '💰 Deposit',
                                                    withdrawal: '↑ Withdrawal',
                                                    lock_vault: '🔒 Bounty Escrow',
                                                    unlock_vault: '🔓 Vault Unlocked',
                                                    bounty_refund: '↩ Bounty Refund',
                                                    stake_partial_refund: '↩ Partial Stake Refund',
                                                    win_prize: '🏆 Prize Won',
                                                    refund_stake: '↩ Stake Refund',
                                                    stake: '🎯 Stake',
                                                }[tx.type]) || (tx.type ? tx.type.replace(/_/g, ' ') : 'Transaction')}
                                            </p>
                                            <p className="text-xs text-iq-text-secondary">
                                                {new Date(tx.created_at).toLocaleDateString()} at {new Date(tx.created_at).toLocaleTimeString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-bold ${['deposit', 'unlock_vault', 'bounty_refund', 'stake_partial_refund', 'win_prize', 'refund_stake'].includes(tx.type)
                                            ? 'text-iq-success'
                                            : 'text-white'
                                            }`}>
                                            {['deposit', 'unlock_vault', 'bounty_refund', 'stake_partial_refund', 'win_prize', 'refund_stake'].includes(tx.type) ? '+' : '-'}
                                            {currency}
                                            {typeof tx.amount === 'number' ? tx.amount.toLocaleString() : tx.amount}
                                        </p>
                                        <p className={`text-xs capitalize ${tx.status === 'completed' ? 'text-iq-success' : 'text-yellow-500'
                                            }`}>
                                            {tx.status}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Deposit Modal */}
            {showDepositModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#0F1624] border border-white/10 rounded-2xl p-6 w-full max-w-md animate-fade-in-up">
                        <h2 className="text-2xl font-bold mb-1">Add Funds</h2>
                        <p className="text-sm mb-6" style={{ color: '#94A3B8' }}>Transfer to our UPI and submit the UTR number below for verification.</p>

                        {/* UPI QR / ID box */}
                        <div style={{
                            borderRadius: '14px', padding: '16px 20px', marginBottom: '20px',
                            background: 'rgba(255, 107, 53, 0.06)', border: '1px solid rgba(255, 107, 53, 0.25)',
                        }}>
                            <p style={{ fontSize: '12px', color: '#64748B', fontWeight: '700', letterSpacing: '0.08em', marginBottom: '6px' }}>SEND PAYMENT TO</p>
                            <p style={{ fontSize: '20px', fontWeight: '900', color: '#FF6B35', fontFamily: 'JetBrains Mono' }}>iqhunt@upi</p>
                            <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>IQHUNT Platform · IMPS/UPI/NEFT accepted</p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
                            <div>
                                <label style={{ fontSize: '13px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>Amount ({currency})</label>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    style={{
                                        width: '100%', background: '#080D1A', border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px', padding: '14px 16px', fontSize: '22px',
                                        color: '#F8FAFC', fontFamily: 'JetBrains Mono', outline: 'none',
                                    }}
                                    placeholder="0"
                                    onFocus={e => e.target.style.borderColor = 'rgba(255,107,53,0.5)'}
                                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '13px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>UTR / Transaction Reference No.</label>
                                <input
                                    type="text"
                                    value={utrNumber}
                                    onChange={(e) => setUtrNumber(e.target.value)}
                                    style={{
                                        width: '100%', background: '#080D1A', border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px', padding: '12px 16px', fontSize: '14px',
                                        color: '#F8FAFC', fontFamily: 'JetBrains Mono', outline: 'none',
                                    }}
                                    placeholder="e.g. 427891234567"
                                    onFocus={e => e.target.style.borderColor = 'rgba(255,107,53,0.5)'}
                                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                                />
                                <p style={{ fontSize: '11px', color: '#64748B', marginTop: '5px' }}>Found in your bank app under the payment receipt</p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => { setShowDepositModal(false); setAmount(''); setUtrNumber(''); }}
                                style={{ flex: 1, padding: '13px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', color: '#94A3B8', background: 'none', cursor: 'pointer', fontWeight: '600' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeposit}
                                disabled={processing}
                                className="btn-primary"
                                style={{ flex: 1, padding: '13px', borderRadius: '12px', opacity: processing ? 0.6 : 1, cursor: processing ? 'not-allowed' : 'pointer', justifyContent: 'center' }}
                            >
                                {processing ? 'Submitting...' : 'Submit Request'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Withdraw Modal */}
            {showWithdrawModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#0F1624] border border-white/10 rounded-2xl p-6 w-full max-w-md animate-fade-in-up">
                        <h2 className="text-2xl font-bold mb-1">Withdraw Funds</h2>
                        <p className="text-sm mb-6" style={{ color: '#94A3B8' }}>Funds will be sent to your UPI ID within 24–48 hours.</p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
                            <div>
                                <label style={{ fontSize: '13px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>Amount ({currency})</label>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    max={walletBalance}
                                    style={{
                                        width: '100%', background: '#080D1A', border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px', padding: '14px 16px', fontSize: '22px',
                                        color: '#F8FAFC', fontFamily: 'JetBrains Mono', outline: 'none',
                                    }}
                                    placeholder="0"
                                />
                                <p style={{ fontSize: '12px', color: '#64748B', marginTop: '5px' }}>Available: {currency}{walletBalance.toLocaleString()}</p>
                            </div>
                            <div>
                                <label style={{ fontSize: '13px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>Your UPI ID</label>
                                <input
                                    type="text"
                                    value={upiId}
                                    onChange={(e) => setUpiId(e.target.value)}
                                    style={{
                                        width: '100%', background: '#080D1A', border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px', padding: '12px 16px', fontSize: '14px',
                                        color: '#F8FAFC', fontFamily: 'JetBrains Mono', outline: 'none',
                                    }}
                                    placeholder="yourname@upi"
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => { setShowWithdrawModal(false); setAmount(''); setUpiId(''); }}
                                style={{ flex: 1, padding: '13px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', color: '#94A3B8', background: 'none', cursor: 'pointer', fontWeight: '600' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleWithdraw}
                                disabled={processing}
                                className="btn-primary"
                                style={{ flex: 1, padding: '13px', borderRadius: '12px', opacity: processing ? 0.6 : 1, cursor: processing ? 'not-allowed' : 'pointer', justifyContent: 'center' }}
                            >
                                {processing ? 'Processing...' : 'Request Withdrawal'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
