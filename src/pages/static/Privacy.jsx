import { Link } from 'react-router-dom';
import { Target } from 'lucide-react';

export default function Privacy() {
    return (
        <div className="static-page">
            <header className="static-header">
                <Link to="/" className="logo">
                    <Target size={24} />
                    <span>IQHUNT</span>
                </Link>
            </header>

            <div className="static-content">
                <h1>Privacy Policy</h1>
                <p className="last-updated">Last Updated: February 13, 2026</p>

                <section>
                    <h2>1. Information We Collect</h2>
                    <h3>Account Information</h3>
                    <ul>
                        <li>Email address (via Google OAuth)</li>
                        <li>Username</li>
                        <li>Date of birth (Hunters only)</li>
                        <li>Nationality</li>
                        <li>Expertise tags (Hunters)</li>
                        <li>Company name (Payers, if applicable)</li>
                    </ul>

                    <h3>Financial Information</h3>
                    <ul>
                        <li>UPI IDs for deposits/ withdrawals</li>
                        <li>Transaction references (UTR numbers)</li>
                        <li>Wallet balance and transaction history</li>
                    </ul>

                    <h3>Activity Data</h3>
                    <ul>
                        <li>Bounties created/staked on</li>
                        <li>Submissions</li>
                        <li>Win/loss records</li>
                    </ul>
                </section>

                <section>
                    <h2>2. How We Use Your Information</h2>
                    <p>We use your information to:</p>
                    <ul>
                        <li>Operate and maintain the Platform</li>
                        <li>Process payments and withdrawals</li>
                        <li>Verify your identity</li>
                        <li>Prevent fraud and abuse</li>
                        <li>Send important account notifications</li>
                        <li>Improve our services</li>
                    </ul>
                </section>

                <section>
                    <h2>3. Data We Do NOT Store</h2>
                    <p><strong>War Room Chats</strong>: All messages in War Rooms are permanently deleted when a bounty completes.
                        We do not archive, backup, or retain any chat history.</p>

                    <p><strong>Mission PDFs</strong>: Files are encrypted and deleted 30 days after bounty completion.</p>
                </section>

                <section>
                    <h2>4. Data Sharing</h2>
                    <p>We do NOT sell your personal information. We may share data with:</p>
                    <ul>
                        <li><strong>Other Users</strong>: Your username, expertise, and performance stats are visible to others</li>
                        <li><strong>Payment Processors</strong>: UPI IDs are shared only for processing transactions</li>
                        <li><strong>Legal Authorities</strong>: When required by law</li>
                    </ul>
                </section>

                <section>
                    <h2>5. Data Security</h2>
                    <p>We implement industry-standard security measures:</p>
                    <ul>
                        <li>TLS encryption for all data in transit</li>
                        <li>Encrypted storage for sensitive data</li>
                        <li>Regular security audits</li>
                        <li>Row-level security policies in our database</li>
                    </ul>
                </section>

                <section>
                    <h2>6. Your Rights</h2>
                    <p>You have the right to:</p>
                    <ul>
                        <li><strong>Access</strong>: Request a copy of your personal data</li>
                        <li><strong>Correction</strong>: Update inaccurate information</li>
                        <li><strong>Deletion</strong>: Request account deletion (subject to outstanding obligations)</li>
                        <li><strong>Export</strong>: Download your data in a portable format</li>
                    </ul>
                    <p>Contact us at <a href="mailto:iqhuntarena@gmail.com">iqhuntarena@gmail.com</a> to exercise these rights.</p>
                </section>

                <section>
                    <h2>7. Cookies & Tracking</h2>
                    <p>We use essential cookies for:</p>
                    <ul>
                        <li>Authentication (session management)</li>
                        <li>Preference storage</li>
                    </ul>
                    <p>We do NOT use third-party advertising trackers or analytics beyond basic usage metrics.</p>
                </section>

                <section>
                    <h2>8. Children's Privacy</h2>
                    <p>
                        IQHUNT is not intended for users under 18. We do not knowingly collect information from minors.
                        If  we discover a minor's account, it will be immediately terminated.
                    </p>
                </section>

                <section>
                    <h2>9. Data Retention</h2>
                    <p>We retain your data:</p>
                    <ul>
                        <li><strong>Active Accounts</strong>: Indefinitely while account is active</li>
                        <li><strong>Deleted Accounts</strong>: 90 days after deletion (for dispute resolution), then permanently purged</li>
                        <li><strong>Financial Records</strong>: 7 years (legal requirement in India)</li>
                    </ul>
                </section>

                <section>
                    <h2>10. International Users</h2>
                    <p>
                        IQHUNT is operated from India. If you access from outside India, your data will be transferred to
                        and processed in India in accordance with Indian data protection laws.
                    </p>
                </section>

                <section>
                    <h2>11. Changes to This Policy</h2>
                    <p>
                        We may update this policy from time to time. Significant changes will be communicated via email.
                        Continued use after changes constitutes acceptance.
                    </p>
                </section>

                <div className="contact-section">
                    <h3>Privacy Questions?</h3>
                    <p>Email us at <a href="mailto:iqhuntarena@gmail.com">iqhuntarena@gmail.com</a></p>
                </div>
            </div>
        </div>
    );
}
