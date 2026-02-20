import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient';
import {
    CheckCircle, XCircle, Clock, DollarSign,
    Users, Target, TrendingUp, AlertCircle
} from 'lucide-react';

export default function AdminDashboard() {
    const { currentUser } = useAuth();
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalHunters: 0,
        totalPayers: 0,
        activeBounties: 0,
        totalVolume: 0,
        pendingDeposits: 0,
        pendingWithdrawals: 0
    });
    const [pendingDeposits, setPendingDeposits] = useState([]);
    const [pendingWithdrawals, setPendingWithdrawals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(null);

    useEffect(() => {
        if (currentUser) {
            loadDashboardData();
        }
    }, [currentUser]);

    async function loadDashboardData() {
        try {
            // Get user stats
            const { count: totalUsers } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true });

            const { count: totalHunters } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'hunter');

            const { count: totalPayers } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'payer');

            // Get bounty stats
            const { count: activeBounties } = await supabase
                .from('bounties')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'live');

            // Get transaction volume
            const { data: transactions } = await supabase
                .from('transactions')
                .select('amount')
                .eq('status', 'completed');

            const totalVolume = transactions?.reduce((sum, t) => sum + t.amount, 0) || 0;

            // Get pending deposits
            const { data: depositsData, count: pendingDepositsCount } = await supabase
                .from('transactions')
                .select(`
                    *,
                    user:profiles(id, username, email)
                `, { count: 'exact' })
                .eq('type', 'deposit')
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            setPendingDeposits(depositsData || []);

            // Get pending withdrawals
            const { data: withdrawalsData, count: pendingWithdrawalsCount } = await supabase
                .from('transactions')
                .select(`
                    *,
                    user:profiles(id, username, email)
                `, { count: 'exact' })
                .eq('type', 'withdrawal')
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            setPendingWithdrawals(withdrawalsData || []);

            setStats({
                totalUsers: totalUsers || 0,
                totalHunters: totalHunters || 0,
                totalPayers: totalPayers || 0,
                activeBounties: activeBounties || 0,
                totalVolume,
                pendingDeposits: pendingDepositsCount || 0,
                pendingWithdrawals: pendingWithdrawalsCount || 0
            });

        } catch (error) {
            console.error('Error loading admin data:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleVerifyDeposit(transactionId, userId, amount) {
        const confirmed = window.confirm(
            `Verify deposit of ₹${amount.toLocaleString()}?\n\n` +
            `This will add funds to the user's wallet.`
        );

        if (!confirmed) return;

        setProcessing(transactionId);

        try {
            const { data, error } = await supabase.rpc('verify_deposit', {
                p_transaction_id: transactionId
            });

            if (error) {
                console.error('RPC Error:', JSON.stringify(error, null, 2));
                throw error;
            }

            if (data.success) {
                alert('Deposit verified successfully!');
                await loadDashboardData();
            } else {
                // This shows the actual error message from the database
                alert(`Failed to verify deposit: ${data.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Verify deposit error:', error);
            alert('Failed to verify deposit. Please try again.');
        } finally {
            setProcessing(null);
        }
    }

    async function handleRejectDeposit(transactionId) {
        const reason = window.prompt('Reason for rejection:');
        if (!reason) return;

        setProcessing(transactionId);

        try {
            const { error } = await supabase
                .from('transactions')
                .update({
                    status: 'failed',
                    metadata: { rejection_reason: reason }
                })
                .eq('id', transactionId);

            if (error) throw error;

            alert('Deposit rejected');
            await loadDashboardData();
        } catch (error) {
            console.error('Reject deposit error:', error);
            alert('Failed to reject deposit');
        } finally {
            setProcessing(null);
        }
    }

    async function handleProcessWithdrawal(transactionId, userId, amount, metadata) {
        const confirmed = window.confirm(
            `Process withdrawal of ₹${amount.toLocaleString()}?\n\n` +
            `UPI ID: ${metadata?.upi_id}\n` +
            `Name: ${metadata?.account_holder_name}\n\n` +
            `Note: Make sure you've sent the money before confirming!`
        );

        if (!confirmed) return;

        setProcessing(transactionId);

        try {
            const { data, error } = await supabase.rpc('process_withdrawal', {
                p_transaction_id: transactionId
            });

            if (error) throw error;

            if (data.success) {
                alert('Withdrawal processed successfully!');
                await loadDashboardData();
            } else {
                alert(data.error || 'Failed to process withdrawal');
            }
        } catch (error) {
            console.error('Process withdrawal error:', error);
            alert('Failed to process withdrawal. Please try again.');
        } finally {
            setProcessing(null);
        }
    }

    const currency = '₹'; // Admin sees INR by default

    if (loading) {
        return (
            <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading admin dashboard...</p>
            </div>
        );
    }

    return (
        <div className="admin-dashboard-page">
            {/* Header */}
            <div className="dashboard-hero">
                <div>
                    <h1>Admin Dashboard ‍</h1>
                    <p className="hero-subtitle">
                        Platform monitoring and transaction verification
                    </p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid admin-stats">
                <div className="stat-card">
                    <div className="stat-icon">
                        <Users size={24} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-label">Total Users</span>
                        <span className="stat-value highlight">{stats.totalUsers}</span>
                        <small>{stats.totalHunters} hunters, {stats.totalPayers} payers</small>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">
                        <Target size={24} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-label">Active Bounties</span>
                        <span className="stat-value">{stats.activeBounties}</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">
                        <TrendingUp size={24} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-label">Total Volume</span>
                        <span className="stat-value">
                            {currency}{stats.totalVolume.toLocaleString()}
                        </span>
                    </div>
                </div>

                <div className="stat-card warning">
                    <div className="stat-icon">
                        <Clock size={24} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-label">Pending Actions</span>
                        <span className="stat-value">
                            {stats.pendingDeposits + stats.pendingWithdrawals}
                        </span>
                        <small>{stats.pendingDeposits} deposits, {stats.pendingWithdrawals} withdrawals</small>
                    </div>
                </div>
            </div>

            {/* Pending Deposits */}
            <div className="admin-section">
                <h2>
                    <DollarSign size={24} />
                    Pending Deposits ({pendingDeposits.length})
                </h2>

                {pendingDeposits.length === 0 ? (
                    <div className="empty-state-small">
                        <CheckCircle size={32} color="#06B6D4" />
                        <p>No pending deposits</p>
                    </div>
                ) : (
                    <div className="admin-transactions-list">
                        {pendingDeposits.map(tx => (
                            <div key={tx.id} className="admin-transaction-card">
                                <div className="transaction-info">
                                    <div className="transaction-header">
                                        <h3>{tx.user.username}</h3>
                                        <span className="transaction-amount">
                                            {currency}{tx.amount.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="transaction-details">
                                        <p><strong>Email:</strong> {tx.user.email}</p>
                                        <p><strong>UTR:</strong> {tx.metadata?.utr_number || 'N/A'}</p>
                                        <p><strong>Method:</strong> {tx.metadata?.payment_method || 'UPI'}</p>
                                        <p><strong>Date:</strong> {new Date(tx.created_at).toLocaleString()}</p>
                                    </div>
                                </div>

                                <div className="transaction-actions">
                                    <button
                                        className="btn-primary btn-verify"
                                        onClick={() => handleVerifyDeposit(tx.id, tx.user_id, tx.amount)}
                                        disabled={processing === tx.id}
                                    >
                                        {processing === tx.id ? (
                                            'Processing...'
                                        ) : (
                                            <>
                                                <CheckCircle size={18} />
                                                Verify
                                            </>
                                        )}
                                    </button>

                                    <button
                                        className="btn-secondary btn-reject"
                                        onClick={() => handleRejectDeposit(tx.id)}
                                        disabled={processing === tx.id}
                                    >
                                        <XCircle size={18} />
                                        Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Pending Withdrawals */}
            <div className="admin-section">
                <h2>
                    <DollarSign size={24} />
                    Pending Withdrawals ({pendingWithdrawals.length})
                </h2>

                {pendingWithdrawals.length === 0 ? (
                    <div className="empty-state-small">
                        <CheckCircle size={32} color="#06B6D4" />
                        <p>No pending withdrawals</p>
                    </div>
                ) : (
                    <div className="admin-transactions-list">
                        {pendingWithdrawals.map(tx => (
                            <div key={tx.id} className="admin-transaction-card">
                                <div className="transaction-info">
                                    <div className="transaction-header">
                                        <h3>{tx.user.username}</h3>
                                        <span className="transaction-amount">
                                            {currency}{tx.amount.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="transaction-details">
                                        <p><strong>Email:</strong> {tx.user.email}</p>
                                        <p><strong>UPI ID:</strong> {tx.metadata?.upi_id || 'N/A'}</p>
                                        <p><strong>Name:</strong> {tx.metadata?.account_holder_name || 'N/A'}</p>
                                        <p><strong>Date:</strong> {new Date(tx.created_at).toLocaleString()}</p>
                                    </div>
                                </div>

                                <div className="transaction-actions">
                                    <button
                                        className="btn-primary btn-verify"
                                        onClick={() => handleProcessWithdrawal(
                                            tx.id,
                                            tx.user_id,
                                            tx.amount,
                                            tx.metadata
                                        )}
                                        disabled={processing === tx.id}
                                    >
                                        {processing === tx.id ? (
                                            'Processing...'
                                        ) : (
                                            <>
                                                <CheckCircle size={18} />
                                                Process
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Warning Banner */}
            <div className="admin-warning">
                <AlertCircle size={20} />
                <div>
                    <strong>Admin Responsibilities:</strong>
                    <ul>
                        <li>Verify deposits only after confirming payment in bank/UPI account</li>
                        <li>Process withdrawals by sending money to user's UPI ID</li>
                        <li>Double-check amounts and account details before confirming</li>
                        <li>Keep records of all processed transactions</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
