import { Link } from 'react-router-dom';
import { Target, Mail, Instagram, Linkedin } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-iq-background border-t border-white/5 py-16">
            <div className="container mx-auto px-4 md:px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    {/* Brand Column */}
                    <div className="flex flex-col items-start gap-4">
                        <div className="flex items-center gap-2 text-iq-primary font-display font-bold text-xl">
                            <Target size={24} />
                            <span>IQHUNT</span>
                        </div>
                        <p className="text-iq-text-secondary text-sm leading-relaxed max-w-xs">
                            Where skill hunts money. A sovereign, skill-based competitive platform.
                        </p>
                    </div>

                    {/* Platform Links */}
                    <div>
                        <h4 className="font-bold text-white mb-6">Platform</h4>
                        <ul className="space-y-3 text-iq-text-secondary">
                            <li><Link to="/covenant" className="hover:text-iq-primary transition-colors">The Covenant</Link></li>
                            <li><Link to="/terms" className="hover:text-iq-primary transition-colors">Terms of Service</Link></li>
                            <li><Link to="/privacy" className="hover:text-iq-primary transition-colors">Privacy Policy</Link></li>
                            <li><Link to="/refund" className="hover:text-iq-primary transition-colors">Refund Policy</Link></li>
                        </ul>
                    </div>

                    {/* Support Links */}
                    <div>
                        <h4 className="font-bold text-white mb-6">Support</h4>
                        <ul className="space-y-3 text-iq-text-secondary">
                            <li><Link to="/contact" className="hover:text-iq-primary transition-colors">Contact Us</Link></li>
                            <li><a href="mailto:support@iqhunt.com" className="hover:text-iq-primary transition-colors">Email Support</a></li>
                        </ul>
                    </div>

                    {/* Connect Links */}
                    <div>
                        <h4 className="font-bold text-white mb-6">Connect</h4>
                        <div className="flex gap-4">
                            <a href="mailto:contact@iqhunt.com" className="p-2 bg-iq-surface rounded-full text-iq-text-secondary hover:text-white hover:bg-iq-primary hover:scale-110 transition-all border border-white/5">
                                <Mail size={20} />
                            </a>
                            <a
                                href="https://www.instagram.com/iqhunt.arena?igsh=MW16d3RseXp6N3VreA=="
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 bg-iq-surface rounded-full text-iq-text-secondary hover:text-white hover:bg-iq-primary hover:scale-110 transition-all border border-white/5"
                            >
                                <Instagram size={20} />
                            </a>
                            <a href="https://linkedin.com/company/iqhunt" target="_blank" className="p-2 bg-iq-surface rounded-full text-iq-text-secondary hover:text-white hover:bg-iq-primary hover:scale-110 transition-all border border-white/5">
                                <Linkedin size={20} />
                            </a>
                        </div>
                    </div>
                </div>

                <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
                    <p className="text-iq-text-secondary text-sm">
                        &copy; 2026 IQHUNT. All rights reserved.
                    </p>
                    <p className="text-iq-text-secondary text-xs opacity-60">
                        This is a skill-based competitive platform. Participate responsibly.
                    </p>
                </div>
            </div>
        </footer>
    );
}

