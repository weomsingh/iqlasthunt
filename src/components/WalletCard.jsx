import { Wallet, TrendingUp, TrendingDown } from 'lucide-react';

export default function WalletCard({ balance = 0, currency = 'INR', username = 'User', onDeposit, onWithdraw }) {
    const symbol = currency === 'INR' ? '₹' : '$';

    return (
        <div className="wallet-card">
            <div className="wallet-header">
                <div className="wallet-icon">
                    <Wallet size={24} />
                </div>
                <div className="wallet-info">
                    <span className="wallet-label">Available Balance</span>
                    <h2 className="wallet-balance">
                        {symbol}{balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h2>
                    <span className="wallet-currency">{currency}</span>
                </div>
            </div>

            <div className="wallet-actions">
                {onDeposit && (
                    <button className="btn-wallet-action deposit" onClick={onDeposit}>
                        <TrendingDown size={18} />
                        Deposit
                    </button>
                )}
                {onWithdraw && (
                    <button className="btn-wallet-action withdraw" onClick={onWithdraw}>
                        <TrendingUp size={18} />
                        Withdraw
                    </button>
                )}
            </div>

            <div className="wallet-cardholder">
                <span className="cardholder-label">Account Holder</span>
                <span className="cardholder-name">{username}</span>
            </div>
        </div>
    );
}
