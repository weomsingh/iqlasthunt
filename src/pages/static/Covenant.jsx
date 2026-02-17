import { Link } from 'react-router-dom';
import { Target, Shield, Zap, Swords } from 'lucide-react';

export default function Covenant() {
    return (
        <div className="static-page covenant-page">
            <header className="static-header">
                <Link to="/" className="logo">
                    <Target size={24} />
                    <span>IQHUNT</span>
                </Link>
            </header>

            <div className="static-content">
                <div className="covenant-hero">
                    <h1>The Covenant</h1>
                    <p className="covenant-tagline">The Digital Blood Oath of IQHUNT</p>
                </div>

                <section className="covenant-intro">
                    <p>
                        By entering the Arena, you sign the Covenant—a binding agreement that governs all interactions
                        within IQHUNT. This is not mere legalese; it is the foundation of trust in our meritocracy.
                    </p>
                </section>

                <div className="covenant-pillars">
                    <div className="pillar-card">
                        <div className="pillar-icon">
                            <Swords size={40} />
                        </div>
                        <h2>I. The Stakes</h2>
                        <p>
                            Entry fees are <strong>irreversible commitments</strong>. When you stake, you wager your capital
                            against your skill. There are no refunds, no second chances. Victory or learning—choose wisely.
                        </p>
                        <ul>
                            <li>Stakes fund the competitive ecosystem</li>
                            <li>Only the best submission wins</li>
                            <li>Losing is part of the game</li>
                        </ul>
                    </div>

                    <div className="pillar-card">
                        <div className="pillar-icon">
                            <Shield size={40} />
                        </div>
                        <h2>II. The Lock</h2>
                        <p>
                            One hunt at a time. When you commit to a bounty, you are <strong>locked</strong> until completion
                            or deadline. No multi-hunting, no hedging. Focus is sacred.
                        </p>
                        <ul>
                            <li>Full attention to one challenge</li>
                            <li>Quality over quantity</li>
                            <li>Respect the mission</li>
                        </ul>
                    </div>

                    <div className="pillar-card">
                        <div className="pillar-icon">
                            <Zap size={40} />
                        </div>
                        <h2>III. The Purge</h2>
                        <p>
                            War Room chats are <strong>ephemeral</strong>. When the winner is chosen, all messages vanish.
                            Forever. No archives, no screenshots, no evidence. What happens in the War Room dies with the mission.
                        </p>
                        <ul>
                            <li>Zero data retention</li>
                            <li>Complete confidentiality</li>
                            <li>Fresh start every hunt</li>
                        </ul>
                    </div>
                </div>

                <section>
                    <h2>Hunter Obligations</h2>
                    <p>As a Hunter, you swear to:</p>
                    <ol>
                        <li>Submit <strong>original work</strong> only—plagiarism results in permanent ban</li>
                        <li>Honor the <strong>deadline</strong>—late submissions are rejected</li>
                        <li>Accept the <strong>Payer's verdict</strong> as final</li>
                        <li>Respect other hunters in the War Room</li>
                        <li>Maintain only <strong>one active stake</strong> at any time</li>
                    </ol>
                </section>

                <section>
                    <h2>Payer Obligations</h2>
                    <p>As a Payer, you swear to:</p>
                    <ol>
                        <li>Fund the vault at <strong>105%</strong> before deployment</li>
                        <li>Provide <strong>clear, achievable</strong> mission criteria</li>
                        <li>Select a winner if <strong>valid submissions</strong> exist</li>
                        <li>Release funds to the winner within <strong>24 hours</strong> of selection</li>
                        <li>Engage in <strong>good faith</strong> with staked hunters</li>
                    </ol>
                </section>

                <section>
                    <h2>The AI Arbitrator</h2>
                    <p>
                        Every submission receives an AI score (0-100). This is a <strong>recommendation</strong>, not a mandate.
                        Payers retain full discretion. The AI exists to assist, not to decide.
                    </p>
                </section>

                <section>
                    <h2>Breach of Covenant</h2>
                    <p>Violations result in:</p>
                    <ul>
                        <li><strong>Tier 1</strong> (Minor): Warning + temporary suspension</li>
                        <li><strong>Tier 2</strong> (Serious): Permanent ban + forfeiture of wallet</li>
                        <li><strong>Tier 3</strong> (Criminal): Legal action</li>
                    </ul>
                    <p>
                        Examples: Plagiarism, collusion, payment fraud, harassment, multi-accounting.
                    </p>
                </section>

                <section className="covenant-acceptance">
                    <h2>Your Signature</h2>
                    <p>
                        By using IQHUNT, you have signed this Covenant in digital blood. There is no undo.
                        Your participation is your oath.
                    </p>
                    <p className="covenant-seal">
                        ⚔️ <strong>WHERE SKILL HUNTS MONEY</strong> ⚔️
                    </p>
                </section>
            </div>
        </div>
    );
}
