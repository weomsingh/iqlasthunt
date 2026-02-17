import React, { useState } from 'react';
import { Container, Mail, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

export default function HelpPage() {
    const [openIndex, setOpenIndex] = useState(null);

    const toggleFAQ = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    const faqs = [
        {
            question: "How do I post a bounty?",
            answer: "Click the 'Post a Bounty' button on your dashboard. Fill in the details about your requirement, set a reward amount, and fund the bounty via our secure escrow system. Once funded, it goes live for hunters to see."
        },
        {
            question: "How do payments work?",
            answer: "All payments are held in secure escrow. You deposit funds when you post a bounty. Hunters are paid only after you approve their work. Payments are processed to their wallet within 2-4 hours of approval."
        },
        {
            question: "What if I'm not satisfied with the work?",
            answer: "You can request revisions from the hunter. If the work still doesn't meet your requirements, you can reject the submission. If a bounty is cancelled or no suitable work is found, your funds are fully refunded to your wallet."
        },
        {
            question: "Are hunters verified?",
            answer: "Yes, we have a tier-based system. Tier 1 Hunters are vetted professionals. You can see a hunter's tier, rating, and past work reviews before assigning them a bounty or accepting their submission."
        },
        {
            question: "How does the 'War Room' work?",
            answer: "The War Room is your mission control center. Once a hunter accepts your bounty, a dedicated workspace is created. You can chat, share files, and track progress with live timers in real-time."
        }
    ];

    return (
        <div className="min-h-screen bg-[#0A0E14] text-white font-sans selection:bg-green-500/30">
            <Header />

            <main className="pt-24 pb-20">
                <div className="max-w-4xl mx-auto px-6">
                    <div className="text-center mb-16 animate-fade-in-up">
                        <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                            Help & Support
                        </h1>
                        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                            Everything you need to know about navigating the IQHUNT ecosystem.
                        </p>
                    </div>

                    <div className="grid gap-8 mb-20 animate-fade-in-up delay-100">
                        <div className="bg-[#1A1F2E] border border-gray-800 rounded-2xl p-8 shadow-xl">
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                                <span className="text-green-400">?</span> Frequently Asked Questions
                            </h2>

                            <div className="space-y-4">
                                {faqs.map((faq, index) => (
                                    <div
                                        key={index}
                                        className="border border-gray-800 rounded-xl overflow-hidden transition-all duration-300 hover:border-gray-700 bg-[#141922]"
                                    >
                                        <button
                                            onClick={() => toggleFAQ(index)}
                                            className="w-full flex justify-between items-center p-5 text-left focus:outline-none"
                                        >
                                            <span className="font-semibold text-lg text-gray-200">{faq.question}</span>
                                            {openIndex === index ? (
                                                <ChevronUp className="text-green-400" size={20} />
                                            ) : (
                                                <ChevronDown className="text-gray-500" size={20} />
                                            )}
                                        </button>

                                        <div
                                            className={`overflow-hidden transition-all duration-300 ${openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                                                }`}
                                        >
                                            <div className="p-5 pt-0 text-gray-400 leading-relaxed border-t border-gray-800/50">
                                                {faq.answer}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="animate-fade-in-up delay-200">
                        <h2 className="text-2xl font-bold mb-8 text-center text-white">Still Need Help?</h2>
                        <p className="text-center text-gray-400 mb-8">Our support team is on standby.</p>

                        <div className="flex justify-center">
                            <div className="bg-[#1A1F2E] border border-gray-800 rounded-2xl p-8 hover:border-green-500/30 transition-all group group-hover:shadow-glow max-w-md w-full">
                                <div className="w-12 h-12 bg-green-900/20 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform mx-auto">
                                    <Mail className="w-6 h-6 text-green-400" />
                                </div>
                                <h3 className="text-xl font-bold mb-2 text-center">Email Support</h3>
                                <a href="mailto:support@iqhunt.com" className="text-green-400 hover:underline text-lg font-medium block mb-2 text-center">
                                    support@iqhunt.com
                                </a>
                                <p className="text-sm text-gray-400 text-center">Response within 24 hours</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
