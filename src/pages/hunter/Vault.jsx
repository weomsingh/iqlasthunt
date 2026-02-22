import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient';
import { Wallet, TrendingUp, Lock, ArrowUpCircle, ArrowDownCircle, DollarSign, Clock, CheckCircle, XCircle, AlertCircle, X, CreditCard, Banknote } from 'lucide-react';

export default function HunterVault() {
    const { currentUser, refreshUser } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [stakes, setStakes] = useState([]);
    const [showDepositModal, setShowDepositModal] = useState(false);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [upiId, setUpiId] = useState('');
    const [accountHolder, setAccountHolder] = useState('');
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    const currency = currentUser?.currency === 'INR' ? '₹' : '$';

    useEffect(() => {
        if (currentUser) {
            loadVaultData();
        }
    }, [currentUser]);

    async function loadVaultData() {
        try {
            // Load transactions
            const { data: txData, error: txError } = await supabase
                .from('transactions')
                .select('*')
                .eq('user_id', currentUser.id)
                .order('created_at', { ascending: false })
                .limit(20);

            if (txError) throw txError;
            setTransactions(txData || []);

            // Load active stakes
            const { data: stakesData, error: stakesError } = await supabase
                .from('hunter_stakes')
                .select(`
                    *,
                    bounty:bounties(title, reward)
                `)
                .eq('hunter_id', currentUser.id)
                .eq('status', 'active');

            if (stakesError) throw stakesError;
            setStakes(stakesData || []);

        } catch (error) {
            console.error('Error loading vault data:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleDeposit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const amount = parseFloat(formData.get('amount'));
        const utrNumber = formData.get('utr_number');
        const paymentMethod = formData.get('payment_method');

        if (!amount || amount <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        if (!utrNumber) {
            alert('Please enter UTR/Transaction number');
            return;
        }

        setProcessing(true);

        try {
            const { error } = await supabase
                .from('transactions')
                .insert({
                    user_id: currentUser.id,
                    type: 'deposit',
                    amount: amount,
                    currency: currentUser.currency,
                    status: 'pending',
                    metadata: {
                        utr_number: utrNumber,
                        payment_method: paymentMethod
                    }
                });

            if (error) throw error;

            alert('✅ Deposit request submitted!\n\nYour funds will be added after admin verification (usually within 24 hours).');
            setShowDepositModal(false);
            await loadVaultData();
        } catch (error) {
            console.error('Deposit error:', error);
            alert('Failed to submit deposit request');
        } finally {
            setProcessing(false);
        }
    }

    async function handleWithdraw(e) {
        e.preventDefault();
        const amount = parseFloat(withdrawAmount);

        if (amount <= 0 || amount > currentUser.wallet_balance) {
            alert('Invalid withdrawal amount');
            return;
        }

        if (!upiId.trim() || !accountHolder.trim()) {
            alert('Please fill all fields');
            return;
        }

        const confirmed = window.confirm(
            `Withdraw ${currency}${amount.toLocaleString()}?\n\n` +
            `UPI: ${upiId}\n` +
            `Account Holder: ${accountHolder}\n\n` +
            `⚠️ Amount will be deducted immediately\n` +
            `⚠️ Processing takes 24-48 hours`
        );

        if (!confirmed) return;

        setProcessing(true);

        try {
            // Deduct from wallet
            const newBalance = currentUser.wallet_balance - amount;
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ wallet_balance: newBalance })
                .eq('id', currentUser.id);

            if (updateError) throw updateError;

            // Create withdrawal transaction
            const { error: txError } = await supabase
                .from('transactions')
                .insert({
                    user_id: currentUser.id,
                    type: 'withdrawal',
                    amount: amount,
                    currency: currentUser.currency,
                    status: 'pending',
                    metadata: {
                        upi_id: upiId,
                        account_holder: accountHolder
                    }
                });

            if (txError) throw txError;

            alert(`✅ Withdrawal request submitted!\n\n${currency}${amount.toLocaleString()} will be processed within 24-48 hours`);

            await refreshUser();
            await loadVaultData();
            setShowWithdrawModal(false);
            setWithdrawAmount('');
            setUpiId('');
            setAccountHolder('');

        } catch (error) {
            console.error('Withdrawal error:', error);
            // Rollback wallet balance if tx fails (simplified for now, ideally transaction block)
            alert('Failed to process withdrawal. Please contact support.');
        } finally {
            setProcessing(false);
        }
    }

    const totalStaked = stakes.reduce((sum, stake) => sum + stake.stake_amount, 0);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="w-10 h-10 border-4 border-iq-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in pb-20 md:pb-0">
            {/* Header */}
            <div className="mb-8 relative overflow-hidden bg-iq-card border border-white/5 rounded-3xl p-8">
                <div className="absolute top-0 right-0 w-64 h-64 bg-iq-accent/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <h1 className="text-3xl font-bold text-white mb-2 relative z-10">Hunter Vault</h1>
                <p className="text-iq-text-secondary relative z-10">Manage your earnings, stakes, and secure withdrawals.</p>
            </div>

            {/* Balance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="p-6 rounded-2xl bg-gradient-to-br from-iq-primary/20 to-iq-card border border-iq-primary/30 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform text-iq-primary">
                        <Wallet size={64} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-sm text-iq-primary font-bold uppercase tracking-wider mb-2">Available Balance</p>
                        <p className="text-3xl font-bold text-white">{currency}{currentUser.wallet_balance.toLocaleString()}</p>
                    </div>
                    <div className="mt-8 flex gap-3">
                        <button
                            onClick={() => setShowDepositModal(true)}
                            className="flex-1 py-2 bg-iq-primary text-black font-bold rounded-lg text-sm hover:bg-iq-primary/90 transition-colors flex items-center justify-center gap-2"
                        >
                            <ArrowDownCircle size={16} /> Deposit
                        </button>
                        <button
                            onClick={() => setShowWithdrawModal(true)}
                            disabled={currentUser.wallet_balance <= 0}
                            className="flex-1 py-2 bg-black/20 text-white border border-white/10 font-bold rounded-lg text-sm hover:bg-white/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ArrowUpCircle size={16} /> Withdraw
                        </button>
                    </div>
                </div>

                <div className="p-6 rounded-2xl bg-iq-card border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform text-white">
                        <Lock size={64} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-sm text-iq-text-secondary font-bold uppercase tracking-wider mb-2">Staked in Bounties</p>
                        <p className="text-3xl font-bold text-white">{currency}{totalStaked.toLocaleString()}</p>
                        <div className="mt-2 text-xs text-iq-text-secondary flex items-center gap-1">
                            <Lock size={12} /> Funds locked until mission completion
                        </div>
                    </div>
                    <div className="mt-8 h-9 flex items-center text-sm text-iq-text-secondary">
                        {stakes.length} Active Stake{stakes.length !== 1 ? 's' : ''}
                    </div>
                </div>

                <div className="p-6 rounded-2xl bg-iq-card border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform text-iq-accent">
                        <TrendingUp size={64} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-sm text-iq-text-secondary font-bold uppercase tracking-wider mb-2">Total Value</p>
                        <p className="text-3xl font-bold text-iq-accent">{currency}{(currentUser.wallet_balance + totalStaked).toLocaleString()}</p>
                        <div className="mt-2 text-xs text-iq-text-secondary flex items-center gap-1">
                            <TrendingUp size={12} className="text-iq-accent" /> Includes wallet + stakes
                        </div>
                    </div>
                    <div className="mt-8 h-9 flex items-center text-sm text-iq-text-secondary">
                        Net Worth
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Active Stakes List */}
                <div className="lg:col-span-1 space-y-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Lock size={20} className="text-iq-primary" /> Active Stakes
                    </h2>
                    {stakes.length > 0 ? (
                        <div className="space-y-3">
                            {stakes.map(stake => (
                                <div key={stake.id} className="bg-iq-card border border-white/5 rounded-xl p-4 hover:border-iq-primary/20 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-white text-sm line-clamp-1">{stake.bounty.title}</h3>
                                        <span className="text-xs font-mono text-iq-warning bg-iq-warning/10 px-2 py-0.5 rounded border border-iq-warning/20">LOCKED</span>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <div className="text-xs text-iq-text-secondary">
                                            Staked: {new Date(stake.created_at).toLocaleDateString()}
                                        </div>
                                        <div className="text-right">
                                            <div className="text-iq-error font-bold font-mono">-{currency}{stake.stake_amount.toLocaleString()}</div>
                                            <div className="text-[10px] text-iq-text-secondary">Low Potential: {currency}{stake.bounty.reward.toLocaleString()}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-iq-card border border-dashed border-white/10 rounded-xl p-6 text-center">
                            <Lock size={24} className="mx-auto text-iq-text-secondary mb-2 opacity-50" />
                            <p className="text-sm text-iq-text-secondary">No active stakes found.</p>
                        </div>
                    )}
                </div>

                {/* Transaction History */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Clock size={20} className="text-iq-primary" /> Recent Transactions
                    </h2>
                    <div className="bg-iq-card border border-white/5 rounded-2xl overflow-hidden">
                        {transactions.length === 0 ? (
                            <div className="p-8 text-center">
                                <DollarSign size={32} className="mx-auto text-iq-text-secondary mb-3 opacity-50" />
                                <p className="text-iq-text-secondary">No transactions in your history.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {transactions.map(tx => {
                                    const isPositive = tx.type === 'win_prize' || tx.type === 'refund_stake' || tx.type === 'deposit' || tx.type === 'stake_partial_refund';
                                    const Icon = tx.type === 'withdrawal' ? ArrowUpCircle :
                                        tx.type === 'deposit' ? ArrowDownCircle :
                                            tx.type === 'stake' ? Lock :
                                                tx.type === 'win_prize' ? TrendingUp :
                                                    tx.type === 'refund_stake' ? TrendingUp : DollarSign;

                                    return (
                                        <div key={tx.id} className="p-4 flex items-center gap-4 hover:bg-white/5 transition-colors">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${tx.type === 'win_prize' ? 'bg-iq-accent/10 text-iq-accent' :
                                                tx.type === 'stake' ? 'bg-iq-warning/10 text-iq-warning' :
                                                    isPositive ? 'bg-iq-success/10 text-iq-success' : 'bg-iq-error/10 text-iq-error'
                                                }`}>
                                                <Icon size={18} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-white capitalize">
                                                    {({
                                                        win_prize: '🏆 Prize Won',
                                                        refund_stake: '↩ Stake Refund',
                                                        stake_partial_refund: '↩ Partial Stake Refund',
                                                        deposit: '💰 Deposit',
                                                        withdrawal: '↑ Withdrawal',
                                                        stake: '🎯 Stake Locked',
                                                        unlock_vault: '🔓 Vault Unlocked',
                                                        bounty_refund: '↩ Bounty Refund',
                                                    }[tx.type]) || (tx.type ? tx.type.replace(/_/g, ' ') : 'Transaction')}
                                                </p>
                                                <p className="text-xs text-iq-text-secondary">
                                                    {new Date(tx.created_at).toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className={`font-mono font-bold ${isPositive ? 'text-iq-success' : 'text-white'}`}>
                                                    {isPositive ? '+' : '-'}{currency}{tx.amount.toLocaleString()}
                                                </p>
                                                <div className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded capitalize ${tx.status === 'completed' ? 'bg-iq-success/10 text-iq-success' :
                                                    tx.status === 'failed' ? 'bg-iq-error/10 text-iq-error' :
                                                        'bg-iq-warning/10 text-iq-warning'
                                                    }`}>
                                                    {tx.status}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Withdraw Modal */}
            {showWithdrawModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-iq-card border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative">
                        <div className="p-6 border-b border-white/5 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white">Withdraw Funds</h2>
                            <button onClick={() => setShowWithdrawModal(false)} className="text-iq-text-secondary hover:text-white">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleWithdraw} className="p-6 space-y-4">
                            <div className="bg-iq-surface rounded-xl p-4 border border-white/10 flex items-center gap-3 mb-4">
                                <Wallet className="text-iq-primary" size={24} />
                                <div>
                                    <p className="text-xs text-iq-text-secondary">Available Balance</p>
                                    <p className="text-lg font-bold text-white">{currency}{currentUser.wallet_balance.toLocaleString()}</p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-iq-text-secondary mb-1">Amount ({currency})</label>
                                <input
                                    type="number"
                                    value={withdrawAmount}
                                    onChange={(e) => setWithdrawAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full bg-iq-surface border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-iq-primary"
                                    min="1"
                                    max={currentUser.wallet_balance}
                                    step="0.01"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-iq-text-secondary mb-1">UPI ID / Bank Account</label>
                                <input
                                    type="text"
                                    value={upiId}
                                    onChange={(e) => setUpiId(e.target.value)}
                                    placeholder="yourname@upi"
                                    className="w-full bg-iq-surface border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-iq-primary"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-iq-text-secondary mb-1">Account Holder Name</label>
                                <input
                                    type="text"
                                    value={accountHolder}
                                    onChange={(e) => setAccountHolder(e.target.value)}
                                    placeholder="Full Name"
                                    className="w-full bg-iq-surface border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-iq-primary"
                                    required
                                />
                            </div>

                            <div className="text-xs text-iq-text-secondary bg-white/5 p-3 rounded-lg flex items-start gap-2">
                                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                                <p>Withdrawals are processed manually for security. Expect funds within 24-48 hours.</p>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowWithdrawModal(false)} className="flex-1 py-3 bg-iq-surface text-white rounded-xl font-bold hover:bg-white/10">Cancel</button>
                                <button type="submit" disabled={processing} className="flex-1 py-3 bg-iq-primary text-black rounded-xl font-bold hover:bg-iq-primary/90 disabled:opacity-50">
                                    {processing ? 'Processing...' : 'Confirm Withdraw'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Deposit Modal */}
            {showDepositModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-iq-card border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative">
                        <div className="p-6 border-b border-white/5 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white">Deposit Funds</h2>
                            <button onClick={() => setShowDepositModal(false)} className="text-iq-text-secondary hover:text-white">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleDeposit} className="p-6 space-y-4">
                            <div className="bg-iq-surface p-4 rounded-xl border border-white/10">
                                <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                                    <Banknote size={16} className="text-iq-success" /> Transfer Details
                                </h3>
                                <div className="text-xs text-iq-text-secondary space-y-1 font-mono bg-black/20 p-3 rounded-lg border border-white/5">
                                    <p><span className="text-white/50">UPI ID:</span> singhomedu69-1@oksbi</p>
                                    <p><span className="text-white/50">Bank:</span> Contact Support</p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-iq-text-secondary mb-1">Amount ({currency})</label>
                                <input
                                    type="number"
                                    name="amount"
                                    placeholder="0.00"
                                    className="w-full bg-iq-surface border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-iq-primary"
                                    min="1"
                                    step="0.01"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-iq-text-secondary mb-1">UTR / Ref Number</label>
                                <input
                                    type="text"
                                    name="utr_number"
                                    placeholder="Enter transaction reference ID"
                                    className="w-full bg-iq-surface border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-iq-primary"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-iq-text-secondary mb-1">Payment Method</label>
                                <select name="payment_method" className="w-full bg-iq-surface border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-iq-primary">
                                    <option value="upi">UPI</option>
                                    <option value="bank_transfer">Bank Transfer</option>
                                    <option value="crypto">Crypto (USDT/USDC)</option>
                                </select>
                            </div>

                            <div className="text-xs text-iq-text-secondary flex items-start gap-2">
                                <CheckCircle size={14} className="mt-0.5 shrink-0 text-iq-success" />
                                <p>Deposits are verified manually. Your wallet will be credited once the transaction is confirmed.</p>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowDepositModal(false)} className="flex-1 py-3 bg-iq-surface text-white rounded-xl font-bold hover:bg-white/10">Cancel</button>
                                <button type="submit" disabled={processing} className="flex-1 py-3 bg-iq-success text-black rounded-xl font-bold hover:bg-iq-success/90 disabled:opacity-50">
                                    {processing ? 'Verifying...' : 'Submit Deposit'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
