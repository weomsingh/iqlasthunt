import { Link } from 'react-router-dom';
import { Target, Mail, Instagram, Linkedin, Heart, ExternalLink } from 'lucide-react';

export default function Footer() {
    return (
        <footer style={{
            background: 'rgba(8,11,20,0.95)',
            borderTop: '1px solid rgba(255,255,255,0.07)',
            backdropFilter: 'blur(20px)',
        }}>
            {/* Top gradient accent */}
            <div style={{ height: '3px', background: 'linear-gradient(90deg, #06B6D4, #06B6D4, #8B5CF6, #F97316, #06B6D4)', opacity: 0.6 }} />

            <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '60px 24px 40px' }}>
                {/* Main Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '40px', marginBottom: '48px' }}>

                    {/* Brand Column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', gridColumn: '1 / span 2' }}>
                        <img
                            src="/finallandstrans.png"
                            alt="IQHUNT"
                            style={{ height: '48px', width: 'auto', objectFit: 'contain', objectPosition: 'left' }}
                        />
                        <p style={{ color: '#8892AA', fontSize: '14px', lineHeight: '1.7', maxWidth: '220px' }}>
                            Where skill hunts money. A private competitive arena for skilled professionals.
                        </p>

                        {/* Social links */}
                        <div style={{ display: 'flex', gap: '10px' }}>
                            {[
                                { href: 'mailto:contact@iqhunt.com', icon: Mail, color: '#06B6D4', bg: 'rgba(139, 92, 246,0.1)', border: 'rgba(139, 92, 246,0.2)' },
                                { href: 'https://www.instagram.com/iqhunt.arena?igsh=MW16d3RseXp6N3VreA==', icon: Instagram, color: '#8B5CF6', bg: 'rgba(168,85,247,0.1)', border: 'rgba(168,85,247,0.2)', external: true },
                                { href: 'https://linkedin.com/company/iqhunt', icon: Linkedin, color: '#3B82F6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)', external: true },
                            ].map((social, i) => (
                                <a
                                    key={i}
                                    href={social.href}
                                    target={social.external ? '_blank' : undefined}
                                    rel={social.external ? 'noopener noreferrer' : undefined}
                                    style={{
                                        width: '40px', height: '40px', borderRadius: '10px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: social.bg, border: `1px solid ${social.border}`,
                                        color: social.color, textDecoration: 'none',
                                        transition: 'all 0.2s ease',
                                    }}
                                    onMouseOver={e => {
                                        e.currentTarget.style.transform = 'translateY(-2px) scale(1.1)';
                                        e.currentTarget.style.boxShadow = `0 8px 20px ${social.color}25`;
                                    }}
                                    onMouseOut={e => {
                                        e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    <social.icon size={18} />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Platform Links */}
                    <FooterSection title="Platform" color="#06B6D4" links={[
                        { label: 'The Covenant', to: '/covenant' },
                        { label: 'Terms of Service', to: '/terms' },
                        { label: 'Privacy Policy', to: '/privacy' },
                        { label: 'Refund Policy', to: '/refund' },
                    ]} />

                    {/* Support Links */}
                    <FooterSection title="Support" color="#06B6D4" links={[
                        { label: 'Help Center', to: '/help' },
                        { label: 'Contact Us', to: '/contact' },
                        { label: 'Email Support', href: 'mailto:support@iqhunt.com' },
                        { label: 'Pricing Guide', to: '/pricing' },
                    ]} />
                </div>

                {/* Bottom bar */}
                <div style={{
                    paddingTop: '28px',
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                    textAlign: 'center',
                }}>
                    <p style={{ fontSize: '14px', color: '#8892AA', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        © 2026 IQHUNT. Made with{' '}
                        <Heart size={14} fill="#F43F5E" style={{ color: '#F43F5E' }} />
                        {' '}in India. All rights reserved.
                    </p>
                    <p style={{ fontSize: '12px', color: '#4A5568' }}>
                        This is a skill-based competitive platform. Participate responsibly.
                    </p>
                </div>
            </div>
        </footer>
    );
}

function FooterSection({ title, color, links }) {
    return (
        <div>
            <h4 style={{
                color: '#F0F4FF', fontWeight: '800', fontSize: '14px',
                marginBottom: '16px', fontFamily: 'Space Grotesk',
            }}>
                <span style={{ color }}>{title}</span>
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {links.map((link, i) => (
                    <li key={i}>
                        {link.to ? (
                            <Link
                                to={link.to}
                                style={{
                                    color: '#8892AA',
                                    textDecoration: 'none',
                                    fontSize: '14px',
                                    transition: 'color 0.15s ease',
                                    display: 'flex', alignItems: 'center', gap: '4px',
                                }}
                                onMouseOver={e => e.currentTarget.style.color = '#F0F4FF'}
                                onMouseOut={e => e.currentTarget.style.color = '#8892AA'}
                            >
                                {link.label}
                            </Link>
                        ) : (
                            <a
                                href={link.href}
                                style={{
                                    color: '#8892AA',
                                    textDecoration: 'none',
                                    fontSize: '14px',
                                    transition: 'color 0.15s ease',
                                }}
                                onMouseOver={e => e.currentTarget.style.color = '#F0F4FF'}
                                onMouseOut={e => e.currentTarget.style.color = '#8892AA'}
                            >
                                {link.label}
                            </a>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}
