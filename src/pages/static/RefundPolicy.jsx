import React from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { ShieldCheck, RefreshCw, AlertTriangle, FileText, Mail } from 'lucide-react';

export default function RefundPolicyPage() {
    return (
        <div className="min-h-screen bg-[#0A0E14] text-white font-sans selection:bg-green-500/30">
            <Header />

            <main className="pt-24 pb-20">
                <div className="max-w-4xl mx-auto px-6">
                    <div className="text-center mb-16 animate-fade-in-up">
                        <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                            Refund Policy
                        </h1>
                        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                            Transparent, fair, and secure. How we handle your funds.
                        </p>
                    </div>

                    <div className="space-y-12 animate-fade-in-up delay-100">

                        {/* Section 1 */}
                        <section className="bg-[#1A1F2E] border border-gray-800 p-8 rounded-2xl shadow-lg hover:border-gray-700 transition-colors">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="p-3 bg-green-500/10 rounded-lg">
                                    <ShieldCheck className="w-8 h-8 text-green-400" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white mb-2">1. Refund Eligibility</h2>
                                    <p className="text-gray-400 leading-relaxed">
                                        You are eligible for a full or partial refund in the following specific scenarios:
                                    </p>
                                </div>
                            </div>
                            <ul className="list-disc list-inside space-y-3 text-gray-300 ml-4 pl-4 border-l-2 border-gray-800">
                                <li>Hunter fails to deliver the work within the agreed deadline.</li>
                                <li>The work delivered deviates significantly from the original bounty requirements.</li>
                                <li>Hunter becomes unresponsive for more than 48 hours after accepting the bounty.</li>
                                <li>No suitable hunter accepts your bounty within 30 days of posting.</li>
                            </ul>
                        </section>

                        {/* Section 2 */}
                        <section className="bg-[#1A1F2E] border border-gray-800 p-8 rounded-2xl shadow-lg hover:border-gray-700 transition-colors">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="p-3 bg-blue-500/10 rounded-lg">
                                    <RefreshCw className="w-8 h-8 text-blue-400" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white mb-2">2. Refund Process</h2>
                                    <p className="text-gray-400 leading-relaxed">
                                        We've automated much of the process to ensure speed and security.
                                    </p>
                                </div>
                            </div>
                            <p className="text-gray-300 mb-4">
                                All funds are held in secure escrow from the moment you post a bounty. This ensures money is safe and ready.
                            </p>
                            <ul className="list-disc list-inside space-y-3 text-gray-300 ml-4 pl-4 border-l-2 border-gray-800">
                                <li>If you reject work or cancel a bounty (before work starts), funds are automatically returned to your IQHUNT Wallet.</li>
                                <li>Wallet refunds typically reflect instantly.</li>
                                <li>Withdrawals from your Wallet to your bank account take 3-5 business days depending on your bank.</li>
                            </ul>
                        </section>

                        {/* Section 3 */}
                        <section className="bg-[#1A1F2E] border border-gray-800 p-8 rounded-2xl shadow-lg hover:border-gray-700 transition-colors">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="p-3 bg-yellow-500/10 rounded-lg">
                                    <AlertTriangle className="w-8 h-8 text-yellow-400" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white mb-2">3. Non-Refundable Cases</h2>
                                    <p className="text-gray-400 leading-relaxed">
                                        Please be aware of when refunds cannot be processed:
                                    </p>
                                </div>
                            </div>
                            <ul className="list-disc list-inside space-y-3 text-gray-300 ml-4 pl-4 border-l-2 border-gray-800">
                                <li>Work has been formally <strong>approved</strong> by you and payment has been released to the hunter.</li>
                                <li>You change the requirements significantly <em>after</em> the hunter has already started or completed the work.</li>
                                <li>Platform fees (typically 15%) are non-refundable once a hunter has commenced work, as this covers platform usage.</li>
                            </ul>
                        </section>

                        {/* Section 4 */}
                        <section className="bg-[#1A1F2E] border border-gray-800 p-8 rounded-2xl shadow-lg hover:border-gray-700 transition-colors">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="p-3 bg-purple-500/10 rounded-lg">
                                    <FileText className="w-8 h-8 text-purple-400" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white mb-2">4. Dispute Resolution</h2>
                                    <p className="text-gray-400 leading-relaxed">
                                        When Payer and Hunter disagree, we step in.
                                    </p>
                                </div>
                            </div>
                            <p className="text-gray-300 mb-4">
                                If there is a conflict regarding the quality of work or adherence to the brief:
                            </p>
                            <ol className="list-decimal list-inside space-y-3 text-gray-300 ml-4 pl-4 border-l-2 border-gray-800">
                                <li>Raise a dispute ticket from the Bounty page.</li>
                                <li>Our Arbitration Team will review the brief, the submission, and all War Room communications.</li>
                                <li>A fair decision will be made within 7 business days, binding on both parties.</li>
                            </ol>
                        </section>

                        {/* Contact */}
                        <section className="mt-16 text-center border-t border-gray-800 pt-10">
                            <h2 className="text-2xl font-bold mb-4">Questions?</h2>
                            <p className="text-gray-400 mb-6">
                                For specific refund queries, please contact our financial support team.
                            </p>
                            <a
                                href="mailto:support@iqhunt.com"
                                className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 text-green-400 px-6 py-3 rounded-lg font-medium transition-colors border border-green-500/30 hover:border-green-500"
                            >
                                <Mail size={20} />
                                support@iqhunt.com
                            </a>
                        </section>

                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
