import { DollarSign, Users, Info, TrendingUp, Shield, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PricingGuide() {
    const navigate = useNavigate();

    const pricingTiers = [
        {
            range: 'Under ₹1,500',
            stake: '₹15',
            maxHunters: 4,
            color: '#06B6D4',
            example: '₹1,000 bounty',
            description: 'Perfect for quick tasks and small projects'
        },
        {
            range: '₹1,500 - ₹3,000',
            stake: '₹25',
            maxHunters: 6,
            color: '#00ccff',
            example: '₹2,000 bounty',
            description: 'Ideal for medium complexity challenges'
        },
        {
            range: '₹3,000 - ₹4,500',
            stake: '₹40',
            maxHunters: 8,
            color: '#ff9d00',
            example: '₹4,000 bounty',
            description: 'Great for detailed work and projects'
        },
        {
            range: 'Above ₹4,500',
            stake: '2.5% of bounty',
            maxHunters: 10,
            color: '#ff5252',
            example: '₹10,000 bounty = ₹250 stake',
            description: 'For high-value professional projects'
        }
    ];

    return (
        <div className="pricing-guide-page">
            {/* Hero Section */}
            <div className="pricing-hero">
                <div className="pricing-hero-content">
                    <DollarSign size={64} className="pricing-hero-icon" />
                    <h1>Stake Pricing Guide</h1>
                    <p className="pricing-subtitle">
                        Transparent, fair, and automatically calculated
                    </p>
                </div>
            </div>

            {/* How It Works */}
            <section className="pricing-section">
                <h2>
                    <Info size={24} />
                    How Staking Works
                </h2>
                <div className="info-grid">
                    <div className="info-card">
                        <div className="info-icon" style={{ background: 'rgba(6, 182, 212, 0.1)' }}>
                            <Shield size={32} style={{ color: '#06B6D4' }} />
                        </div>
                        <h3>Pay to Play</h3>
                        <p>Hunters pay a small entry fee (stake) to participate in bounties. This ensures serious commitment.</p>
                    </div>

                    <div className="info-card">
                        <div className="info-icon" style={{ background: 'rgba(0, 204, 255, 0.1)' }}>
                            <TrendingUp size={32} style={{ color: '#00ccff' }} />
                        </div>
                        <h3>Winner Takes All</h3>
                        <p>If you win, you get the full bounty reward! If you don't win, you lose your stake.</p>
                    </div>

                    <div className="info-card">
                        <div className="info-icon" style={{ background: 'rgba(255, 157, 0, 0.1)' }}>
                            <Zap size={32} style={{ color: '#ff9d00' }} />
                        </div>
                        <h3>Auto-Calculated</h3>
                        <p>Stakes are automatically set based on bounty value. Fair for everyone!</p>
                    </div>
                </div>
            </section>

            {/* Pricing Tiers */}
            <section className="pricing-section">
                <h2>
                    <DollarSign size={24} />
                    Pricing Tiers
                </h2>
                <p className="section-description">
                    Entry fees are calculated automatically based on the bounty reward amount
                </p>

                <div className="pricing-tiers">
                    {pricingTiers.map((tier, index) => (
                        <div
                            key={index}
                            className="pricing-tier-card"
                            style={{ borderColor: tier.color }}
                        >
                            <div className="tier-header" style={{ background: `${tier.color}15` }}>
                                <span className="tier-range" style={{ color: tier.color }}>
                                    {tier.range}
                                </span>
                            </div>

                            <div className="tier-body">
                                <div className="tier-stake">
                                    <span className="stake-label">Entry Stake</span>
                                    <span className="stake-value" style={{ color: tier.color }}>
                                        {tier.stake}
                                    </span>
                                </div>

                                <div className="tier-hunters">
                                    <Users size={18} />
                                    <span>Max {tier.maxHunters} hunters</span>
                                </div>

                                <div className="tier-example">
                                    <strong>Example:</strong> {tier.example}
                                </div>

                                <p className="tier-description">{tier.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Example Calculation */}
            <section className="pricing-section calculation-section">
                <h2>
                    <TrendingUp size={24} />
                    Example Calculation
                </h2>

                <div className="calculation-example">
                    <div className="calc-card">
                        <div className="calc-header">
                            <h3>₹5,000 Bounty</h3>
                            <span className="calc-badge">High Value</span>
                        </div>

                        <div className="calc-breakdown">
                            <div className="calc-row">
                                <span>Bounty Reward</span>
                                <strong>₹5,000</strong>
                            </div>
                            <div className="calc-row highlight">
                                <span>Hunter Stakes (2.5%)</span>
                                <strong style={{ color: '#06B6D4' }}>₹125</strong>
                            </div>
                            <div className="calc-row">
                                <span>Max Hunters</span>
                                <strong>10 hunters</strong>
                            </div>
                        </div>

                        <div className="calc-footer">
                            <p>
                                🎯 <strong>For Hunters:</strong> Pay ₹125 to compete. Win ₹5,000 if selected!
                            </p>
                            <p>
                                💰 <strong>ROI if you win:</strong> 4,000% (₹125 → ₹5,000)
                            </p>
                        </div>
                    </div>

                    <div className="calc-card">
                        <div className="calc-header">
                            <h3>₹1,200 Bounty</h3>
                            <span className="calc-badge" style={{ background: 'rgba(0, 204, 255, 0.1)', color: '#00ccff' }}>
                                Quick Task
                            </span>
                        </div>

                        <div className="calc-breakdown">
                            <div className="calc-row">
                                <span>Bounty Reward</span>
                                <strong>₹1,200</strong>
                            </div>
                            <div className="calc-row highlight">
                                <span>Hunter Stakes (Fixed)</span>
                                <strong style={{ color: '#06B6D4' }}>₹15</strong>
                            </div>
                            <div className="calc-row">
                                <span>Max Hunters</span>
                                <strong>4 hunters</strong>
                            </div>
                        </div>

                        <div className="calc-footer">
                            <p>
                                🎯 <strong>For Hunters:</strong> Pay ₹15 to compete. Win ₹1,200 if selected!
                            </p>
                            <p>
                                💰 <strong>ROI if you win:</strong> 8,000% (₹15 → ₹1,200)
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="pricing-section faq-section">
                <h2>Frequently Asked Questions</h2>

                <div className="faq-list">
                    <div className="faq-item">
                        <h4>❓ Why do hunters pay a stake?</h4>
                        <p>Stakes ensure commitment and quality. Only serious hunters participate, giving payers better submissions.</p>
                    </div>

                    <div className="faq-item">
                        <h4>❓ What happens if I don't win?</h4>
                        <p>You lose your stake amount. This is the risk for participating. But if you win, you get the full reward!</p>
                    </div>

                    <div className="faq-item">
                        <h4>❓ Can payers set their own stake prices?</h4>
                        <p>No. Stakes are automatically calculated by the platform to ensure fairness across all bounties.</p>
                    </div>

                    <div className="faq-item">
                        <h4>❓ Are there any hidden fees?</h4>
                        <p>No! The stake amount you see is exactly what you pay. No surprises.</p>
                    </div>

                    <div className="faq-item">
                        <h4>❓ What if the bounty gets cancelled?</h4>
                        <p>If a payer cancels before selecting a winner, all stakes are refunded to hunters automatically.</p>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="pricing-cta">
                <h2>Ready to Start?</h2>
                <p>Fair pricing. Automatic calculation. Transparent rules.</p>
                <div className="cta-buttons">
                    <button className="btn-primary" onClick={() => navigate('/hunter/arena')}>
                        <Users size={20} />
                        Browse Bounties
                    </button>
                    <button className="btn-secondary" onClick={() => navigate(-1)}>
                        Go Back
                    </button>
                </div>
            </section>
        </div>
    );
}
