import { Link } from 'react-router-dom';
import { Target, Mail, MessageSquare } from 'lucide-react';

export default function Contact() {
    return (
        <div className="static-page">
            <header className="static-header">
                <Link to="/" className="logo">
                    <Target size={24} />
                    <span>IQHUNT</span>
                </Link>
            </header>

            <div className="static-content">
                <h1>Contact Us</h1>
                <p className="page-subtitle">
                    We're here to help! Reach out for support, partnerships, or general inquiries.
                </p>

                <div className="contact-grid">
                    <div className="contact-card">
                        <div className="contact-icon">
                            <Mail size={32} />
                        </div>
                        <h3>Email Support</h3>
                        <p>For account issues, payments, or general questions</p>
                        <a href="mailto:iqhuntarena@gmail.com" className="contact-link">
                            iqhuntarena@gmail.com
                        </a>
                        <small>Response within 24 hours</small>
                    </div>

                    <div className="contact-card">
                        <div className="contact-icon">
                            <MessageSquare size={32} />
                        </div>
                        <h3>Report a Bug</h3>
                        <p>Found something broken? Let us know!</p>
                        <a href="mailto:iqhuntarena@gmail.com?subject=Bug Report" className="contact-link">
                            Send Bug Report
                        </a>
                        <small>Include screenshots if possible</small>
                    </div>
                </div>

                <section>
                    <h2>Frequently Asked Questions</h2>

                    <div className="faq-item">
                        <h4>How long does deposit verification take?</h4>
                        <p>Deposits are typically verified within 24 hours. Make sure to enter the correct UTR number.</p>
                    </div>

                    <div className="faq-item">
                        <h4>How do I withdraw my winnings?</h4>
                        <p>Go to Vault → Click Withdraw → Enter amount and UPI ID. Funds are sent within 48 hours.</p>
                    </div>

                    <div className="faq-item">
                        <h4>Why can't I stake on multiple bounties?</h4>
                        <p>Each hunter can only have ONE active stake at a time to ensure focused participation.</p>
                    </div>

                    <div className="faq-item">
                        <h4>Are entry fees refundable?</h4>
                        <p>No. Entry fees are non-refundable once you stake on a bounty. Read mission requirements carefully before staking.</p>
                    </div>

                    <div className="faq-item">
                        <h4>How is the winner chosen?</h4>
                        <p>Payers select the winner based on submission quality. Our AI provides scoring as a recommendation.</p>
                    </div>

                    <div className="faq-item">
                        <h4>What happens to War Room chats?</h4>
                        <p>All War Room messages are permanently deleted when the bounty completes. No history is kept.</p>
                    </div>
                </section>

                <section>
                    <h2>Business Inquiries</h2>
                    <p>
                        Interested in posting large-scale bounties or partnerships?
                        Email us at <a href="mailto:iqhuntarena@gmail.com?subject=Business Inquiry">iqhuntarena@gmail.com</a>
                        with "Business Inquiry" in the subject line.
                    </p>
                </section>

                <section>
                    <h2>Office</h2>
                    <p>
                        IQHUNT<br />
                        Mumbai, Maharashtra<br />
                        India
                    </p>
                </section>
            </div>
        </div>
    );
}
