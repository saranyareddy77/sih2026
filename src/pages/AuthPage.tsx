// AICTE SmartVerify — Authentication & Institution Registration
// SIH Problem Statement 26261

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  Building2,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Hash,
  MapPin,
  Phone
} from 'lucide-react';
import { authService } from '../services/authService';
import { isConfigured } from '../services/supabaseClient';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Mode derived from route: /register or /auth
  const initialMode = location.pathname === '/register' ? 'register' : 'signin';
  const [mode, setMode] = useState<'signin' | 'register'>(initialMode);

  // Sync mode if route changes
  useEffect(() => {
    if (location.pathname === '/register') {
      setMode('register');
    } else if (location.pathname === '/auth') {
      setMode('signin');
    }
  }, [location.pathname]);

  // Form states — strictly empty initially (NO prefill)
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [fullName, setFullName] = useState<string>('');
  const [designation, setDesignation] = useState<string>('');
  const [institutionName, setInstitutionName] = useState<string>('');
  const [institutionCode, setInstitutionCode] = useState<string>('');
  const [aisheCode, setAisheCode] = useState<string>('');
  const [institutionType, setInstitutionType] = useState<string>('Engineering & Technology');
  const [phone, setPhone] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [state, setState] = useState<string>('');
  const [pincode, setPincode] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // If already logged in, redirect to permitted portal
  useEffect(() => {
    if (authService.isLoggedIn()) {
      const user = authService.getCurrentUser();
      if (user?.roles.includes('super_admin') || user?.roles.includes('scrutiny_officer') || user?.roles.includes('admin')) {
        navigate('/admin', { replace: true });
      } else {
        navigate('/institution', { replace: true });
      }
    }
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!isConfigured) {
      setErrorMessage('Database service is not configured. Please ensure VITE_SUPABASE_URL and publishable key are set in .env');
      return;
    }

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.signIn(email, password);
      if (res.success) {
        const user = authService.getCurrentUser();
        if (user?.roles.includes('super_admin') || user?.roles.includes('scrutiny_officer') || user?.roles.includes('admin')) {
          navigate('/admin');
        } else {
          navigate('/institution');
        }
      } else {
        setErrorMessage(res.error || 'Invalid email or password. Please verify your credentials.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred during sign in.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!isConfigured) {
      setErrorMessage('Database service is not configured. Please verify your environment variables.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please ensure both passwords match.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters in length.');
      return;
    }

    if (!institutionName.trim() || !institutionCode.trim()) {
      setErrorMessage('Institution Name and AICTE Permanent Institute ID are required.');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.registerInstitution({
        email,
        password,
        fullName,
        institutionName,
        institutionCode,
        aisheCode,
        institutionType,
        designation,
        phone,
        address,
        city,
        state,
        pincode
      });

      if (res.success) {
        setSuccessMessage(res.message || 'Institution account registered successfully! Please sign in below.');
        // Switch to sign in view with email preserved
        setMode('signin');
        setPassword('');
        setConfirmPassword('');
      } else {
        setErrorMessage(res.error || 'Institution registration failed. Please check your inputs.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected registration error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        {/* Brand Header */}
        <div className="auth-card-header">
          <div className="auth-brand-badge">
            <ShieldCheck size={28} className="text-emerald-600" />
          </div>
          <h1 className="auth-title">
            {mode === 'signin' ? 'Sign In to SmartVerify' : 'Register Institution'}
          </h1>
          <p className="auth-subtitle">
            {mode === 'signin'
              ? 'Enter your credentials to access the regulatory verification portal'
              : 'Register an institutional account for AICTE regulatory approval submissions'}
          </p>
        </div>

        {/* Configuration Notice if Supabase not connected */}
        {!isConfigured && (
          <div className="auth-alert alert-warning">
            <ShieldAlert size={18} className="alert-icon" />
            <div>
              <strong>Configuration Required:</strong> Supabase connection parameters are not detected. Please configure <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> in your environment file.
            </div>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="auth-alert alert-success">
            <CheckCircle2 size={18} className="alert-icon" />
            <div>{successMessage}</div>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="auth-alert alert-error">
            <AlertCircle size={18} className="alert-icon" />
            <div>{errorMessage}</div>
          </div>
        )}

        {/* Sign In Form */}
        {mode === 'signin' ? (
          <form onSubmit={handleSignIn} className="auth-form">
            <div className="form-group">
              <label className="form-label" htmlFor="signin-email">
                Email Address
              </label>
              <div className="input-with-icon">
                <Mail size={16} className="input-icon" />
                <input
                  id="signin-email"
                  type="email"
                  required
                  placeholder="name@institution.edu.in or officer@aicte-india.org"
                  className="form-input"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
              <div className="label-with-aside">
                <label className="form-label" htmlFor="signin-password">
                  Password
                </label>
              </div>
              <div className="input-with-icon">
                <Lock size={16} className="input-icon" />
                <input
                  id="signin-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  className="form-input"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="input-action-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-emerald-primary btn-block"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
              <ArrowRight size={16} />
            </button>

            <div className="auth-switch-link">
              <span>Need to register your institution? </span>
              <button
                type="button"
                className="link-btn"
                onClick={() => {
                  setMode('register');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
              >
                Register Institution
              </button>
            </div>
          </form>
        ) : (
          /* Institution Registration Form */
          <form onSubmit={handleRegister} className="auth-form">
            <div className="form-notice">
              <Building2 size={16} className="text-emerald-600" />
              <span>Public registration creates an authorized <strong>Institution User</strong> account with access restricted strictly to your institution.</span>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="reg-fullname">
                  Full Name of Authorized Officer *
                </label>
                <div className="input-with-icon">
                  <User size={16} className="input-icon" />
                  <input
                    id="reg-fullname"
                    type="text"
                    required
                    placeholder="e.g. Dr. Ramesh Kumar"
                    className="form-input"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-designation">
                  Designation *
                </label>
                <input
                  id="reg-designation"
                  type="text"
                  required
                  placeholder="e.g. Registrar / Principal"
                  className="form-input"
                  value={designation}
                  onChange={e => setDesignation(e.target.value)}
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="reg-email">
                  Official Email Address *
                </label>
                <div className="input-with-icon">
                  <Mail size={16} className="input-icon" />
                  <input
                    id="reg-email"
                    type="email"
                    required
                    placeholder="registrar@institution.edu.in"
                    className="form-input"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-phone">
                  Contact Phone Number
                </label>
                <div className="input-with-icon">
                  <Phone size={16} className="input-icon" />
                  <input
                    id="reg-phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    className="form-input"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-instname">
                Full Legal Name of Institution *
              </label>
              <div className="input-with-icon">
                <Building2 size={16} className="input-icon" />
                <input
                  id="reg-instname"
                  type="text"
                  required
                  placeholder="e.g. National Institute of Advanced Technology & Research"
                  className="form-input"
                  value={institutionName}
                  onChange={e => setInstitutionName(e.target.value)}
                />
              </div>
            </div>

            <div className="form-grid-3">
              <div className="form-group">
                <label className="form-label" htmlFor="reg-instcode">
                  AICTE Permanent ID *
                </label>
                <div className="input-with-icon">
                  <Hash size={16} className="input-icon" />
                  <input
                    id="reg-instcode"
                    type="text"
                    required
                    placeholder="1-XXXXXXXXXX"
                    className="form-input"
                    value={institutionCode}
                    onChange={e => setInstitutionCode(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-aishe">
                  AISHE Code (if assigned)
                </label>
                <input
                  id="reg-aishe"
                  type="text"
                  placeholder="C-XXXXX"
                  className="form-input"
                  value={aisheCode}
                  onChange={e => setAisheCode(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-insttype">
                  Institution Type
                </label>
                <select
                  id="reg-insttype"
                  className="form-input"
                  value={institutionType}
                  onChange={e => setInstitutionType(e.target.value)}
                >
                  <option value="Engineering & Technology">Engineering &amp; Technology</option>
                  <option value="Polytechnic & Diploma">Polytechnic &amp; Diploma</option>
                  <option value="Management & Technical">Management &amp; Technical</option>
                  <option value="Pharmacy & Health Sciences">Pharmacy &amp; Health Sciences</option>
                  <option value="Architecture & Planning">Architecture &amp; Planning</option>
                  <option value="Applied Arts & Crafts">Applied Arts &amp; Crafts</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-address">
                Campus Physical Address *
              </label>
              <div className="input-with-icon">
                <MapPin size={16} className="input-icon" />
                <input
                  id="reg-address"
                  type="text"
                  required
                  placeholder="e.g. Sector 62, Institutional Area, Knowledge Park"
                  className="form-input"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                />
              </div>
            </div>

            <div className="form-grid-3">
              <div className="form-group">
                <label className="form-label" htmlFor="reg-city">
                  City *
                </label>
                <input
                  id="reg-city"
                  type="text"
                  required
                  placeholder="e.g. Pune"
                  className="form-input"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-state">
                  State *
                </label>
                <input
                  id="reg-state"
                  type="text"
                  required
                  placeholder="e.g. Maharashtra"
                  className="form-input"
                  value={state}
                  onChange={e => setState(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-pincode">
                  PIN Code *
                </label>
                <input
                  id="reg-pincode"
                  type="text"
                  required
                  placeholder="e.g. 411038"
                  className="form-input"
                  value={pincode}
                  onChange={e => setPincode(e.target.value)}
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="reg-password">
                  Password (min 6 characters) *
                </label>
                <div className="input-with-icon">
                  <Lock size={16} className="input-icon" />
                  <input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    className="form-input"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="input-action-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-confirm-password">
                  Confirm Password *
                </label>
                <div className="input-with-icon">
                  <Lock size={16} className="input-icon" />
                  <input
                    id="reg-confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    className="form-input"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-emerald-primary btn-block"
            >
              {loading ? 'Creating Account...' : 'Register Institution Account'}
              <ArrowRight size={16} />
            </button>

            <div className="auth-switch-link">
              <span>Already registered? </span>
              <button
                type="button"
                className="link-btn"
                onClick={() => {
                  setMode('signin');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
              >
                Sign In
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
