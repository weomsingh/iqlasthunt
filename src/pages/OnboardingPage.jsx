import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Target, HelpCircle, AlertCircle } from 'lucide-react';

const EXPERTISE_TAGS = [
    'UI/UX Design', 'React Development', 'Python', 'Machine Learning',
    'Backend Engineering', '3D Animation', 'Mobile Development', 'DevOps',
    'Data Science', 'Blockchain', 'Game Development', 'Writing/Content'
];

export default function OnboardingPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Get role from localStorage (set on homepage)
    const intendedRole = localStorage.getItem('intended_role') || 'hunter';

    const [formData, setFormData] = useState({
        role: intendedRole,
        username: '',
        // Hunters auto-set to India/INR
        nationality: intendedRole === 'hunter' ? 'india' : '',
        currency: intendedRole === 'hunter' ? 'INR' : '',
        expertise: [],
        bio: '',
        dob: '',
        is_organization: false,
        company_name: '',
        accepted_covenant: false,
    });

    // Auto-advance hunters past region selection
    useEffect(() => {
        if (intendedRole === 'hunter' && step === 1) {
            setStep(2); // Skip to profile details
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
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                throw new Error('Not authenticated');
            }

            // Check if this is the admin email
            const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
            const isAdmin = user.email === adminEmail;

            const profileData = {
                id: user.id,
                email: user.email,
                role: isAdmin ? 'admin' : formData.role, // Auto-assign admin if email matches
                username: formData.username,
                nationality: formData.nationality,
                currency: formData.currency,
                accepted_covenant: formData.accepted_covenant,
                wallet_balance: 0,
                total_earnings: 0,
                total_spent: 0,
            };

            if (formData.role === 'hunter') {
                profileData.expertise = formData.expertise;
                profileData.bio = formData.bio || null;
                profileData.date_of_birth = formData.dob;
            } else {
                profileData.expertise = []; // Empty array for payers
                profileData.is_organization = formData.is_organization;
                profileData.company_name = formData.company_name || null;
            }

            const { error: insertError } = await supabase
                .from('profiles')
                .upsert(profileData, { onConflict: 'id' });

            if (insertError) {
                console.error('Insert error details:', insertError);
                throw insertError;
            }

            // Clear intended role
            localStorage.removeItem('intended_role');

            // Navigate to appropriate dashboard
            if (isAdmin) {
                navigate('/admin/dashboard', { replace: true });
            } else if (formData.role === 'hunter') {
                navigate('/hunter/dashboard', { replace: true });
            } else {
                navigate('/payer/dashboard', { replace: true });
            }

        } catch (err) {
            console.error('Onboarding error:', err);
            setError(`Failed to save profile: ${err.message || 'Please try again.'}`);
        } finally {
            setLoading(false);
        }
    }

    // Calculate actual step number for progress (hunters skip step 1)
    const actualStep = intendedRole === 'hunter' ? step - 1 : step;
    const totalSteps = intendedRole === 'hunter' ? 2 : 3;

    return (
        <div className="onboarding-page">
            <header className="onboarding-header">
                <div className="logo">
                    <Target size={24} />
                    <span>IQHUNT</span>
                </div>
                <button
                    className="help-btn"
                    onClick={() => window.open('mailto:iqhuntarena@gmail.com')}
                >
                    <HelpCircle size={20} />
                    Need Help?
                </button>
            </header>

            <div className="onboarding-container">
                {/* Progress Bar */}
                <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${(actualStep / totalSteps) * 100}%` }} />
                </div>

                <h1>Complete Your Profile</h1>
                <p className="onboarding-subtitle">
                    You're joining as a <strong>{intendedRole === 'hunter' ? 'Hunter' : 'Payer'}</strong>
                </p>

                {error && (
                    <div className="error-banner">
                        <AlertCircle size={20} />
                        {error}
                    </div>
                )}

                {/* STEP 1: Nationality - ONLY FOR PAYERS */}
                {step === 1 && intendedRole === 'payer' && (
                    <div className="form-step">
                        <h2>Select Your Region</h2>
                        <div className="region-buttons">
                            <button
                                className={`region-btn ${formData.nationality === 'india' ? 'selected' : ''}`}
                                onClick={() => setFormData({
                                    ...formData,
                                    nationality: 'india',
                                    currency: 'INR'
                                })}
                            >
                                <span className="flag" style={{ fontFamily: 'monospace', fontWeight: '800', fontSize: '1rem', letterSpacing: '0.05em' }}>IN</span>
                                <span>India (INR)</span>
                            </button>
                            <button
                                className={`region-btn ${formData.nationality === 'global' ? 'selected' : ''}`}
                                onClick={() => setFormData({
                                    ...formData,
                                    nationality: 'global',
                                    currency: 'USD'
                                })}
                            >
                                <span className="flag" style={{ fontFamily: 'monospace', fontWeight: '800', fontSize: '1rem', letterSpacing: '0.05em' }}>GL</span>
                                <span>Global (USD)</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 2: Profile Details */}
                {step === 2 && (
                    <div className="form-step">
                        <h2>Your Details</h2>

                        {/* Hunter India Notice */}
                        {formData.role === 'hunter' && (
                            <div className="info-box" style={{
                                background: 'rgba(6, 182, 212, 0.08)',
                                border: '1px solid rgba(6, 182, 212, 0.25)',
                                padding: '1rem',
                                borderRadius: '10px',
                                marginBottom: '1.5rem'
                            }}>
                                <p style={{ margin: 0, color: '#06B6D4', fontWeight: '600' }}>
                                    Indian Hunter — All earnings credited in INR (Rs.)
                                </p>
                            </div>
                        )}

                        <div className="form-group">
                            <label>Username *</label>
                            <input
                                type="text"
                                placeholder="Choose a unique username"
                                value={formData.username}
                                onChange={e => setFormData({ ...formData, username: e.target.value })}
                            />
                        </div>

                        {formData.role === 'hunter' && (
                            <>
                                <div className="form-group">
                                    <label>Date of Birth *</label>
                                    <input
                                        type="date"
                                        value={formData.dob}
                                        onChange={e => setFormData({ ...formData, dob: e.target.value })}
                                        max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                                    />
                                    <small style={{ color: '#888', marginTop: '0.5rem', display: 'block' }}>
                                        You must be 18+ to participate
                                    </small>
                                </div>

                                <div className="form-group">
                                    <label>Primary Expertise * (Select at least one)</label>
                                    <div className="tags">
                                        {EXPERTISE_TAGS.map(tag => (
                                            <button
                                                key={tag}
                                                type="button"
                                                className={`tag ${formData.expertise.includes(tag) ? 'selected' : ''}`}
                                                onClick={() => {
                                                    const newExpertise = formData.expertise.includes(tag)
                                                        ? formData.expertise.filter(t => t !== tag)
                                                        : [...formData.expertise, tag];
                                                    setFormData({ ...formData, expertise: newExpertise });
                                                }}
                                            >
                                                {tag}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Bio (optional)</label>
                                    <textarea
                                        placeholder="Tell payers about your skills and experience..."
                                        value={formData.bio}
                                        onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                        rows={4}
                                    />
                                </div>
                            </>
                        )}

                        {formData.role === 'payer' && (
                            <>
                                <div className="form-group">
                                    <label>Account Type</label>
                                    <div className="toggle-buttons">
                                        <button
                                            type="button"
                                            className={!formData.is_organization ? 'active' : ''}
                                            onClick={() => setFormData({ ...formData, is_organization: false })}
                                        >
                                            Individual
                                        </button>
                                        <button
                                            type="button"
                                            className={formData.is_organization ? 'active' : ''}
                                            onClick={() => setFormData({ ...formData, is_organization: true })}
                                        >
                                            Organization
                                        </button>
                                    </div>
                                </div>

                                {formData.is_organization && (
                                    <div className="form-group">
                                        <label>Company Name *</label>
                                        <input
                                            type="text"
                                            placeholder="Your company or organization name"
                                            value={formData.company_name}
                                            onChange={e => setFormData({ ...formData, company_name: e.target.value })}
                                        />
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* STEP 3: Covenant */}
                {step === 3 && (
                    <div className="form-step">
                        <h2>The Covenant</h2>
                        <div className="covenant-text">
                            <h3 style={{ color: '#06B6D4', marginBottom: '1rem' }}>
                                Digital Blood Oath
                            </h3>
                            <p>
                                By entering the Arena, you sign the Blood Oath. You acknowledge that <strong>Stakes
                                    are non-refundable entry fees</strong> for a Game of Skill.
                            </p>
                            <p>
                                You agree to the results determined by AI scoring and payer selection.
                                Payers are bound to <strong>fund the Vault at 105%</strong> before deployment
                                and must select a winner if valid submissions exist.
                            </p>
                            <p>
                                All Mission PDFs are encrypted. <strong>War Room chat logs are ephemeral</strong> and
                                purged immediately upon mission completion—zero history is stored.
                            </p>
                            <p style={{ color: '#ff5252', marginTop: '1rem' }}>
                                Note: This is a skill-based competitive platform. Participate responsibly.
                            </p>
                        </div>
                        <div className="covenant-checkbox">
                            <input
                                type="checkbox"
                                id="covenant"
                                checked={formData.accepted_covenant}
                                onChange={e => setFormData({ ...formData, accepted_covenant: e.target.checked })}
                            />
                            <label htmlFor="covenant" style={{ fontSize: '1.1rem', fontWeight: 500 }}>
                                I accept the Covenant and all terms
                            </label>
                        </div>
                    </div>
                )}

                {/* ACTIONS */}
                <div className="onboarding-actions">
                    {step > (intendedRole === 'hunter' ? 2 : 1) && (
                        <button
                            className="btn-back"
                            onClick={() => setStep(step - 1)}
                            disabled={loading}
                        >
                            Back
                        </button>
                    )}
                    <button
                        className="btn-continue"
                        onClick={step === 3 ? handleComplete : () => setStep(step + 1)}
                        disabled={!isStepValid() || loading}
                    >
                        {loading ? 'Saving...' : step === 3 ? 'Enter the Arena' : 'Continue'}
                    </button>
                </div>
            </div>
        </div>
    );
}
