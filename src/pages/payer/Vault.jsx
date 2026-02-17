import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient';
import {
    Wallet, TrendingUp, TrendingDown, Clock, ArrowUpRight,
    ArrowDownLeft, History, Filter, Download, MoreHorizontal, AlertCircle
} from 'lucide-react';

export default function PayerVault() {
    const { currentUser, refreshUser } = useAuth();
    const currency = '$'; // Currency Symbol

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
    const [processing, setProcessing] = useState(false);
    const [filter, setFilter] = useState('all');

    const filteredTransactions = (transactions || []).filter(t => {
        if (!t) return false;
        if (filter === 'all') return true;
        if (filter === 'deposit') return t.type === 'deposit';
        if (filter === 'withdraw') return t.type === 'withdrawal';
        if (filter === 'escrow') return t.type === 'lock_vault' || t.type === 'release_vault' || t.type === 'refund_vault';
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

            // Subtract released escrow (approvals)
            const releasedEscrow = data
                ?.filter(t => t.type === 'release_vault' && t.status === 'completed')
                .reduce((acc, t) => acc + t.amount, 0) || 0;

            const refundedEscrow = data
                ?.filter(t => t.type === 'refund_vault' && t.status === 'completed')
                .reduce((acc, t) => acc + t.amount, 0) || 0;

            const totalSpent = data
                ?.filter(t => (t.type === 'payment' || t.type === 'release_vault') && t.status === 'completed')
                .reduce((acc, t) => acc + t.amount, 0) || 0;

            const thisMonth = data
                ?.filter(t => {
                    const d = new Date(t.created_at);
                    const now = new Date();
                    return d.getMonth() === now.getMonth() &&
                        d.getFullYear() === now.getFullYear() &&
                        (t.type === 'payment' || t.type === 'release_vault') &&
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

    async function handleTransaction(type) {
        if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        const value = parseFloat(amount);
        if (type === 'withdraw' && value > walletBalance) {
            alert('Insufficient funds');
            return;
        }

        setProcessing(true);
        try {
            // 1. Create Transaction Record
            const { error: txError } = await supabase
                .from('transactions')
                .insert({
                    user_id: currentUser.id,
                    amount: value,
                    type: type, // 'deposit' or 'withdrawal'
                    description: type === 'deposit' ? 'Manual Deposit' : 'Manual Withdrawal',
                    status: 'completed' // In real app, might be 'pending'
                });

            if (txError) throw txError;

            // 2. Update Wallet Balance
            const newBalance = type === 'deposit'
                ? walletBalance + value
                : walletBalance - value;

            const { error: profileError } = await supabase
                .from('profiles')
                .update({ wallet_balance: newBalance })
                .eq('id', currentUser.id);

            if (profileError) throw profileError;

            // 3. Refresh
            await refreshUser();
            await loadVaultData();

            setShowDepositModal(false);
            setShowWithdrawModal(false);
            setAmount('');
            alert(`${type === 'deposit' ? 'Deposit' : 'Withdrawal'} successful!`);

        } catch (error) {
            console.error('Transaction failed:', error);
            alert('Transaction failed: ' + error.message);
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
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'deposit' || tx.type === 'release_vault'
                                            ? 'bg-iq-success/10 text-iq-success'
                                            : 'bg-white/5 text-white'
                                            }`}>
                                            {tx.type === 'deposit' && <ArrowDownLeft size={20} />}
                                            {tx.type === 'withdrawal' && <ArrowUpRight size={20} />}
                                            {tx.type === 'lock_vault' && <Clock size={20} />}
                                            {tx.type === 'payment' && <TrendingUp size={20} />}
                                            {tx.type === 'release_vault' && <TrendingDown size={20} />}
                                        </div>
                                        <div>
                                            <p className="text-white font-medium capitalize">
                                                {tx.type ? tx.type.replace('_', ' ') : 'Transaction'}
                                            </p>
                                            <p className="text-xs text-iq-text-secondary">
                                                {new Date(tx.created_at).toLocaleDateString()} at {new Date(tx.created_at).toLocaleTimeString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-bold ${tx.type === 'deposit' || tx.type === 'release_vault'
                                            ? 'text-iq-success'
                                            : 'text-white'
                                            }`}>
                                            {tx.type === 'deposit' || tx.type === 'release_vault' ? '+' : '-'}
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
                    <div className="bg-[#1A1F2E] border border-white/10 rounded-2xl p-6 w-full max-w-md animate-fade-in-up">
                        <h2 className="text-2xl font-bold mb-4">Add Funds</h2>
                        <p className="text-gray-400 mb-6">Enter the amount you wish to deposit into your IQHUNT Wallet.</p>

                        <div className="mb-6">
                            <label className="block text-sm text-gray-400 mb-2">Amount ({currency})</label>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full bg-[#141922] border border-white/10 rounded-xl p-4 text-2xl text-white font-mono focus:border-iq-primary focus:outline-none"
                                placeholder="0.00"
                            />
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowDepositModal(false)}
                                className="flex-1 py-3 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleTransaction('deposit')}
                                disabled={processing}
                                className="flex-1 py-3 rounded-xl bg-iq-primary text-black font-bold hover:bg-iq-primary/90 transition-colors disabled:opacity-50"
                            >
                                {processing ? 'Processing...' : 'Confirm Deposit'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Withdraw Modal */}
            {showWithdrawModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#1A1F2E] border border-white/10 rounded-2xl p-6 w-full max-w-md animate-fade-in-up">
                        <h2 className="text-2xl font-bold mb-4">Withdraw Funds</h2>
                        <p className="text-gray-400 mb-6">Withdraw funds securely to your linked bank account.</p>

                        <div className="mb-6">
                            <label className="block text-sm text-gray-400 mb-2">Amount ({currency})</label>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full bg-[#141922] border border-white/10 rounded-xl p-4 text-2xl text-white font-mono focus:border-iq-primary focus:outline-none"
                                placeholder="0.00"
                                max={walletBalance}
                            />
                            <p className="text-xs text-gray-400 mt-2">Available: {currency}{walletBalance.toLocaleString()}</p>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowWithdrawModal(false)}
                                className="flex-1 py-3 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleTransaction('withdrawal')}
                                disabled={processing}
                                className="flex-1 py-3 rounded-xl bg-iq-primary text-black font-bold hover:bg-iq-primary/90 transition-colors disabled:opacity-50"
                            >
                                {processing ? 'Processing...' : 'Confirm Withdrawal'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
