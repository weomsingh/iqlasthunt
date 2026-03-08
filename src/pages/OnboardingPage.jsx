import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { updateProfile as fbUpdateProfile } from 'firebase/auth';
import { updateProfile } from '../lib/firebaseService';
import { useAuth } from '../context/AuthContext';
import { Target, HelpCircle, AlertCircle, Shield, CheckCircle, ChevronRight, ChevronLeft } from 'lucide-react';

const EXPERTISE_TAGS = [
    'UI/UX Design', 'React Development', 'Python', 'Machine Learning',
    'Backend Engineering', '3D Animation', 'Mobile Development', 'DevOps',
    'Data Science', 'Blockchain', 'Game Development', 'Writing/Content'
];

export default function OnboardingPage() {
    const navigate = useNavigate();
    const { currentUser, refreshUser } = useAuth();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const intendedRole = localStorage.getItem('intended_role') || 'hunter';

    const [formData, setFormData] = useState({
        role: intendedRole,
        username: currentUser?.username || '',
        nationality: intendedRole === 'hunter' ? 'india' : '',
        currency: intendedRole === 'hunter' ? 'INR' : '',
        expertise: [],
        bio: '',
        dob: '',
        is_organization: false,
        company_name: '',
        accepted_covenant: false,
    });

    useEffect(() => {
        if (intendedRole === 'hunter' && step === 1) {
            setStep(2);
        }
    }, [intendedRole, step]);

    const isStepValid = () => {
        if (step === 1) return formData.nationality && formData.currency;
        if (step === 2) {
            if (formData.role === 'hunter') {
                return formData.username && formData.dob && formData.expertise.length > 0;
            } else {
                return formData.username && (!formData.is_organization || formData.company_name);
            }
        }
        if (step === 3) return formData.accepted_covenant;
        return false;
    };

    async function handleComplete() {
        setLoading(true);
        setError(null);

        try {
            const firebaseUser = auth.currentUser;
            if (!firebaseUser) throw new Error('Not authenticated');

            const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
            const isAdmin = firebaseUser.email === adminEmail;

            const profileData = {
                email: firebaseUser.email,
                role: isAdmin ? 'admin' : formData.role,
                username: formData.username,
                nationality: formData.nationality || 'india',
                currency: formData.currency || 'INR',
                accepted_covenant: formData.accepted_covenant,
                is_onboarded: true,
                wallet_balance: 0,
                total_earnings: 0,
                stake_balance: 0,
                hunts_completed: 0,
                success_rate: 0,
            };

            if (formData.role === 'hunter') {
                profileData.expertise = formData.expertise;
                profileData.bio = formData.bio || '';
                profileData.date_of_birth = formData.dob;
            } else {
                profileData.is_organization = formData.is_organization;
                profileData.company_name = formData.company_name || '';
            }

            // Update Firestore profile
            await updateProfile(firebaseUser.uid, profileData);

            // Update Firebase auth display name
            await fbUpdateProfile(firebaseUser, { displayName: formData.username });

            // Refresh context
            await refreshUser();

            localStorage.removeItem('intended_role');

            if (isAdmin) navigate('/admin/dashboard', { replace: true });
            else if (formData.role === 'hunter') navigate('/hunter/dashboard', { replace: true });
            else navigate('/payer/dashboard', { replace: true });

        } catch (err) {
            console.error('Onboarding error:', err);
            setError(`Failed to save profile: ${err.message || 'Please try again.'}`);
        } finally {
            setLoading(false);
        }
    }

    const actualStep = intendedRole === 'hunter' ? step - 1 : step;
    const totalSteps = intendedRole === 'hunter' ? 2 : 3;
    const progressPct = (actualStep / totalSteps) * 100;

    return (
        <div style={{ minHeight: '100vh', background: '#050814', color: '#F0F4FF', fontFamily: 'DM Sans, sans-serif', position: 'relative', overflow: 'hidden' }}>
            {/* Background */}
            <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }}>
                <div style={{ position: 'absolute', top: '-200px', right: '-200px', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,107,53,0.08) 0%, transparent 60%)', filter: 'blur(60px)' }} />
                <div style={{ position: 'absolute', bottom: '-200px', left: '-200px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(67,97,238,0.08) 0%, transparent 60%)', filter: 'blur(60px)' }} />
            </div>

            {/* Header */}
            <header style={{
                position: 'sticky', top: 0, zIndex: 50,
                background: 'rgba(5,8,20,0.85)', backdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                padding: '16px 24px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img src="/finallandstrans.png" alt="IQHUNT" style={{ height: '36px', objectFit: 'contain', filter: 'brightness(1.1)' }} />
                </div>
                <button onClick={() => window.open('mailto:iqhuntarena@gmail.com')} style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    color: '#8892AA', background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '10px', padding: '8px 16px',
                    cursor: 'pointer', fontSize: '13px', fontWeight: '600',
                    minHeight: '40px',
                }}>
                    <HelpCircle size={16} /> Need Help?
                </button>
            </header>

            {/* Main */}
            <div style={{ maxWidth: '560px', margin: '0 auto', padding: '48px 24px', position: 'relative', zIndex: 1 }}>
                {/* Progress */}
                <div style={{ marginBottom: '40px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span style={{ fontSize: '12px', color: '#8892AA', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                            Step {actualStep} of {totalSteps}
                        </span>
                        <span style={{ fontSize: '12px', color: '#FF6B35', fontWeight: '700', fontFamily: 'JetBrains Mono' }}>
                            {Math.round(progressPct)}%
                        </span>
                    </div>
                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{
                            height: '100%', borderRadius: '2px',
                            background: 'linear-gradient(90deg, #FF6B35, #F6C90E)',
                            width: `${progressPct}%`,
                            transition: 'width 0.4s ease',
                            boxShadow: '0 0 12px rgba(255,107,53,0.5)',
                        }} />
                    </div>
                </div>

                {/* Title */}
                <div style={{ marginBottom: '36px' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: '900', fontFamily: 'Space Grotesk', letterSpacing: '-0.02em', marginBottom: '8px' }}>
                        Complete Your Profile
                    </h1>
                    <p style={{ color: '#8892AA', fontSize: '15px' }}>
                        Joining as a{' '}
                        <span style={{ color: intendedRole === 'hunter' ? '#FF6B35' : '#4361EE', fontWeight: '700' }}>
                            {intendedRole === 'hunter' ? 'Hunter' : 'Payer'}
                        </span>
                    </p>
                </div>

                {error && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '16px', borderRadius: '12px', marginBottom: '24px',
                        background: 'rgba(247,37,133,0.08)',
                        border: '1px solid rgba(247,37,133,0.25)',
                        color: '#F72585',
                    }}>
                        <AlertCircle size={18} style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: '14px', fontWeight: '500' }}>{error}</span>
                    </div>
                )}

                {/* STEP 1: Region (Payers only) */}
                {step === 1 && intendedRole === 'payer' && (
                    <div style={{ animation: 'fadeInUp 0.3s ease' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '800', fontFamily: 'Space Grotesk', marginBottom: '24px', color: '#F0F4FF' }}>
                            Select Your Region
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            {[
                                { value: 'india', currency: 'INR', label: 'India', flag: '🇮🇳', desc: 'Payments in INR (₹)' },
                                { value: 'global', currency: 'USD', label: 'Global', flag: '🌍', desc: 'Payments in USD ($)' },
                            ].map(region => (
                                <button key={region.value} onClick={() => setFormData({ ...formData, nationality: region.value, currency: region.currency })} style={{
                                    padding: '28px 20px', borderRadius: '16px',
                                    background: formData.nationality === region.value ? 'rgba(67,97,238,0.12)' : 'rgba(255,255,255,0.03)',
                                    border: formData.nationality === region.value ? '2px solid rgba(67,97,238,0.4)' : '1px solid rgba(255,255,255,0.08)',
                                    cursor: 'pointer', textAlign: 'center',
                                    transition: 'all 0.2s ease',
                                    boxShadow: formData.nationality === region.value ? '0 0 25px rgba(67,97,238,0.2)' : 'none',
                                }}>
                                    <div style={{ fontSize: '36px', marginBottom: '12px' }}>{region.flag}</div>
                                    <div style={{ fontSize: '16px', fontWeight: '800', color: '#F0F4FF', marginBottom: '4px', fontFamily: 'Space Grotesk' }}>{region.label}</div>
                                    <div style={{ fontSize: '13px', color: '#8892AA', fontWeight: '500' }}>{region.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* STEP 2: Profile Details */}
                {step === 2 && (
                    <div style={{ animation: 'fadeInUp 0.3s ease', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '800', fontFamily: 'Space Grotesk', color: '#F0F4FF' }}>Your Details</h2>

                        {formData.role === 'hunter' && (
                            <div style={{ padding: '14px 16px', borderRadius: '12px', background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.15)' }}>
                                <p style={{ color: '#00E5FF', fontWeight: '600', fontSize: '14px', margin: 0 }}>
                                    🇮🇳 Indian Hunter — All earnings credited in INR (₹)
                                </p>
                            </div>
                        )}

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#8892AA', marginBottom: '8px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                                Username *
                            </label>
                            <input type="text" placeholder="Choose a unique username"
                                value={formData.username}
                                onChange={e => setFormData({ ...formData, username: e.target.value })}
                                style={{
                                    width: '100%', padding: '14px 16px', borderRadius: '12px',
                                    background: 'rgba(8,12,28,0.8)', border: '1px solid rgba(255,255,255,0.08)',
                                    color: '#F0F4FF', fontSize: '15px', outline: 'none', fontFamily: 'DM Sans',
                                    transition: 'border-color 0.2s ease',
                                }}
                                onFocus={e => e.target.style.borderColor = 'rgba(255,107,53,0.4)'}
                                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                            />
                        </div>

                        {formData.role === 'hunter' && (
                            <>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#8892AA', marginBottom: '8px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                                        Date of Birth * (18+ required)
                                    </label>
                                    <input type="date"
                                        value={formData.dob}
                                        onChange={e => setFormData({ ...formData, dob: e.target.value })}
                                        max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                                        style={{
                                            width: '100%', padding: '14px 16px', borderRadius: '12px',
                                            background: 'rgba(8,12,28,0.8)', border: '1px solid rgba(255,255,255,0.08)',
                                            color: '#F0F4FF', fontSize: '15px', outline: 'none',
                                        }}
                                        onFocus={e => e.target.style.borderColor = 'rgba(255,107,53,0.4)'}
                                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#8892AA', marginBottom: '12px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                                        Primary Expertise * (select at least 1)
                                    </label>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {EXPERTISE_TAGS.map(tag => {
                                            const selected = formData.expertise.includes(tag);
                                            return (
                                                <button key={tag} type="button" onClick={() => {
                                                    const newExp = selected ? formData.expertise.filter(t => t !== tag) : [...formData.expertise, tag];
                                                    setFormData({ ...formData, expertise: newExp });
                                                }} style={{
                                                    padding: '8px 14px', borderRadius: '100px',
                                                    background: selected ? 'rgba(255,107,53,0.15)' : 'rgba(255,255,255,0.04)',
                                                    border: selected ? '1px solid rgba(255,107,53,0.4)' : '1px solid rgba(255,255,255,0.08)',
                                                    color: selected ? '#FF6B35' : '#8892AA',
                                                    fontSize: '13px', fontWeight: selected ? '700' : '500',
                                                    cursor: 'pointer', transition: 'all 0.15s ease',
                                                    minHeight: '36px',
                                                }}>
                                                    {tag}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#8892AA', marginBottom: '8px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                                        Bio (optional)
                                    </label>
                                    <textarea placeholder="Tell payers about your skills..." rows={3}
                                        value={formData.bio}
                                        onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                        style={{
                                            width: '100%', padding: '14px 16px', borderRadius: '12px',
                                            background: 'rgba(8,12,28,0.8)', border: '1px solid rgba(255,255,255,0.08)',
                                            color: '#F0F4FF', fontSize: '15px', outline: 'none', resize: 'vertical',
                                            fontFamily: 'DM Sans',
                                        }}
                                        onFocus={e => e.target.style.borderColor = 'rgba(255,107,53,0.4)'}
                                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                                    />
                                </div>
                            </>
                        )}

                        {formData.role === 'payer' && (
                            <>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#8892AA', marginBottom: '12px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                                        Account Type
                                    </label>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        {['Individual', 'Organization'].map((type, i) => (
                                            <button key={type} type="button" onClick={() => setFormData({ ...formData, is_organization: i === 1 })} style={{
                                                flex: 1, padding: '14px',
                                                borderRadius: '12px',
                                                background: (i === 1) === formData.is_organization ? 'rgba(67,97,238,0.12)' : 'rgba(255,255,255,0.04)',
                                                border: (i === 1) === formData.is_organization ? '2px solid rgba(67,97,238,0.4)' : '1px solid rgba(255,255,255,0.08)',
                                                color: (i === 1) === formData.is_organization ? '#4361EE' : '#8892AA',
                                                fontSize: '14px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s ease',
                                            }}>
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {formData.is_organization && (
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#8892AA', marginBottom: '8px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                                            Company Name *
                                        </label>
                                        <input type="text" placeholder="Your company or organization name"
                                            value={formData.company_name}
                                            onChange={e => setFormData({ ...formData, company_name: e.target.value })}
                                            style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', background: 'rgba(8,12,28,0.8)', border: '1px solid rgba(255,255,255,0.08)', color: '#F0F4FF', fontSize: '15px', outline: 'none' }}
                                            onFocus={e => e.target.style.borderColor = 'rgba(255,107,53,0.4)'}
                                            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                                        />
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* STEP 3: Covenant */}
                {step === 3 && (
                    <div style={{ animation: 'fadeInUp 0.3s ease' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '800', fontFamily: 'Space Grotesk', marginBottom: '24px', color: '#F0F4FF' }}>
                            The Covenant
                        </h2>

                        <div style={{
                            padding: '28px', borderRadius: '16px',
                            background: 'rgba(10,15,35,0.7)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            marginBottom: '24px',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                                <Shield size={20} style={{ color: '#FF6B35' }} />
                                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#FF6B35', margin: 0, fontFamily: 'Space Grotesk' }}>Digital Blood Oath</h3>
                            </div>
                            {[
                                "By entering the Arena, you sign the Blood Oath. You acknowledge that Stakes are non-refundable entry fees for a Game of Skill.",
                                "You agree to the results determined by AI scoring and payer selection. Payers are bound to fund the Vault at 105% before deployment and must select a winner if valid submissions exist.",
                                "All Mission PDFs are encrypted. War Room chat logs are ephemeral and purged immediately upon mission completion—zero history is stored.",
                            ].map((text, i) => (
                                <p key={i} style={{ color: '#8892AA', lineHeight: 1.7, fontSize: '14px', marginBottom: i < 2 ? '12px' : 0 }}>{text}</p>
                            ))}
                            <p style={{ color: '#F72585', marginTop: '16px', fontSize: '13px', fontWeight: '600' }}>
                                ⚠️ This is a skill-based competitive platform. Participate responsibly.
                            </p>
                        </div>

                        <label style={{
                            display: 'flex', alignItems: 'flex-start', gap: '14px',
                            padding: '20px', borderRadius: '14px', cursor: 'pointer',
                            background: formData.accepted_covenant ? 'rgba(6,255,165,0.06)' : 'rgba(255,255,255,0.03)',
                            border: formData.accepted_covenant ? '1px solid rgba(6,255,165,0.25)' : '1px solid rgba(255,255,255,0.08)',
                            transition: 'all 0.2s ease',
                        }}>
                            <div style={{
                                width: '22px', height: '22px', borderRadius: '6px',
                                background: formData.accepted_covenant ? '#06FFA5' : 'rgba(255,255,255,0.06)',
                                border: formData.accepted_covenant ? 'none' : '1px solid rgba(255,255,255,0.15)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0, transition: 'all 0.2s ease', cursor: 'pointer',
                            }}>
                                {formData.accepted_covenant && <CheckCircle size={14} style={{ color: '#050814' }} />}
                            </div>
                            <input type="checkbox" checked={formData.accepted_covenant}
                                onChange={e => setFormData({ ...formData, accepted_covenant: e.target.checked })}
                                style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />
                            <span style={{ fontSize: '15px', fontWeight: '600', color: '#C4CFED', lineHeight: 1.5 }}>
                                I accept the Covenant and all terms of the IQHUNT platform
                            </span>
                        </label>
                    </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '12px', marginTop: '36px' }}>
                    {step > (intendedRole === 'hunter' ? 2 : 1) && (
                        <button onClick={() => setStep(step - 1)} disabled={loading} style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '16px 24px', borderRadius: '12px',
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            color: '#8892AA', fontWeight: '700', fontSize: '15px',
                            cursor: 'pointer', minHeight: '52px',
                            transition: 'all 0.2s ease',
                        }}>
                            <ChevronLeft size={18} /> Back
                        </button>
                    )}
                    <button
                        onClick={step === 3 ? handleComplete : () => setStep(step + 1)}
                        disabled={!isStepValid() || loading}
                        className="btn-primary"
                        style={{ flex: 1, fontSize: '15px', borderRadius: '12px', gap: '10px', opacity: (!isStepValid() || loading) ? 0.5 : 1 }}>
                        {loading ? (
                            <><div className="spinner-sm" /> Saving...</>
                        ) : step === 3 ? (
                            <><Shield size={18} /> Enter the Arena</>
                        ) : (
                            <>Continue <ChevronRight size={18} /></>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
