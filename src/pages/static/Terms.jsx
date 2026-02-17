import { Link } from 'react-router-dom';
import { Target } from 'lucide-react';

export default function Terms() {
    return (
        <div className="static-page">
            <header className="static-header">
                <Link to="/" className="logo">
                    <Target size={24} />
                    <span>IQHUNT</span>
                </Link>
            </header>

            <div className="static-content">
                <h1>Terms of Service</h1>
                <p className="last-updated">Last Updated: February 13, 2026</p>

                <section>
                    <h2>1. Acceptance of Terms</h2>
                    <p>
                        By accessing and using IQHUNT ("the Platform"), you accept and agree to be bound by the terms
                        and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
                    </p>
                </section>

                <section>
                    <h2>2. Nature of Service</h2>
                    <p>
                        IQHUNT is a skill-based competitive platform where:
                    </p>
                    <ul>
                        <li><strong>Payers</strong> post bounties (challenges) with rewards</li>
                        <li><strong>Hunters</strong> stake entry fees to compete for rewards</li>
                        <li>Winners are selected by Payers based on submission quality and AI scoring</li>
                    </ul>
                    <p>
                        This is NOT gambling. Success depends entirely on skill, creativity, and effort.
                    </p>
                </section>

                <section>
                    <h2>3. Entry Fees & Stakes</h2>
                    <p>
                        Entry fees (stakes) are <strong>non-refundable</strong> once committed. By staking on a bounty:
                    </p>
                    <ul>
                        <li>You confirm you have read and understood the mission requirements</li>
                        <li>You acknowledge only one hunter will win the reward</li>
                        <li>You accept the entry fee is the cost of participation, not a guarantee of return</li>
                    </ul>
                </section>

                <section>
                    <h2>4. One Active Hunt Per Hunter</h2>
                    <p>
                        Hunters can only stake on <strong>ONE bounty at a time</strong>. This ensures focused participation
                        and prevents gaming the system.
                    </p>
                </section>

                <section>
                    <h2>5. Payer Obligations</h2>
                    <p>
                        Payers must:
                    </p>
                    <ul>
                        <li>Fund the vault at 105% of stated reward before bounty goes live</li>
                        <li>Select a winner if valid submissions are received by the deadline</li>
                        <li>Provide clear, achievable mission criteria</li>
                    </ul>
                    <p>
                        Failure to fulfill these obligations may result in account suspension and forfeiture of vault funds
                        to winning hunters.
                    </p>
                </section>

                <section>
                    <h2>6. Winner Selection</h2>
                    <p>
                        Winners are chosen by the Payer. The Platform provides AI scoring as a <strong>recommendation only</strong>.
                        Final decision rests with the Payer. Decisions are final and binding.
                    </p>
                </section>

                <section>
                    <h2>7. War Room & Data Retention</h2>
                    <p>
                        War Room chats are <strong>ephemeral</strong> and permanently deleted upon bounty completion.
                        No chat history is stored. Mission PDFs are encrypted and accessible only to staked hunters.
                    </p>
                </section>

                <section>
                    <h2>8. Payments & Withdrawals</h2>
                    <p>
                        All transactions are processed manually via UPI in India. Deposits are credited within 24 hours
                        of UTR verification. Withdrawals are processed within 48 hours to the provided UPI ID.
                    </p>
                </section>

                <section>
                    <h2>9. Age Requirement</h2>
                    <p>
                        You must be 18 years or older to use this Platform.
                    </p>
                </section>

                <section>
                    <h2>10. Prohibited Conduct</h2>
                    <p>
                        Users must not:
                    </p>
                    <ul>
                        <li>Create multiple accounts</li>
                        <li>Collude with other users</li>
                        <li>Submit plagiarized work</li>
                        <li>Abuse or harass other users</li>
                    </ul>
                    <p>
                        Violations result in immediate account termination and forfeiture of all funds.
                    </p>
                </section>

                <section>
                    <h2>11. Limitation of Liability</h2>
                    <p>
                        IQHUNT is provided "as is" without warranties. We are not liable for any losses incurred through
                        use of the Platform. Maximum liability is limited to the amount paid by you in the past 30 days.
                    </p>
                </section>

                <section>
                    <h2>12. Governing Law</h2>
                    <p>
                        These terms are governed by the laws of India. Disputes will be resolved in courts of Mumbai, Maharashtra.
                    </p>
                </section>

                <section>
                    <h2>13. Changes to Terms</h2>
                    <p>
                        We reserve the right to modify these terms at any time. Continued use after changes constitutes acceptance.
                    </p>
                </section>

                <div className="contact-section">
                    <h3>Questions?</h3>
                    <p>Contact us at <a href="mailto:iqhuntarena@gmail.com">iqhuntarena@gmail.com</a></p>
                </div>
            </div>
        </div>
    );
}
