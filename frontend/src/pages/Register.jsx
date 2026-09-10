import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole, Mail, Network, ShieldCheck, UserRound, Zap } from "lucide-react";
import { registerUser } from "../services/api.js";
import "../styles/register.css";

const emailPattern = /^\S+@\S+\.\S+$/;

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
    if (error) setError("");
  }

  function validate() {
    const name = formData.name.trim();
    if (!name) return "Please enter your full name.";
    if (!formData.email.trim()) return "Please enter your email address.";
    if (!emailPattern.test(formData.email.trim())) return "Please enter a valid email address.";
    if (!formData.password) return "Please create a password.";
    if (formData.password.length < 8) return "Password must be at least 8 characters.";
    if (!formData.confirmPassword) return "Please confirm your password.";
    if (formData.password !== formData.confirmPassword) return "Passwords do not match.";
    return "";
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    try {
      setLoading(true);
      setError("");
      const data = await registerUser({ name: formData.name.trim(), email: formData.email.trim(), password: formData.password });
      if (data.token) localStorage.setItem("token", data.token);
      if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/");
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || "Unable to create your account. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return <div className="register-page">
    <section className="register-brand-panel">
      <div className="register-brand-glow register-brand-glow--one" /><div className="register-brand-glow register-brand-glow--two" />
      <Link to="/" className="register-back"><ArrowLeft size={18} />Back to home</Link>
      <div className="register-brand-content">
        <div className="register-logo-row"><div className="register-shield"><ShieldCheck size={28} /></div><div><div className="register-brand-name">Bank <span>Application</span></div><div className="register-brand-subtitle">SECURE BANKING 24/7</div></div></div>
        <div className="register-copy"><p>YOUR SECURITY, FROM DAY ONE.</p><h1>Open your<br /><span>account.</span></h1><p>Create your protected banking profile and take control of every account, transaction and connection in one place.</p></div>
        <div className="register-security-features"><div><i><LockKeyhole size={20} /></i><p><b>Protected account access</b><span>Authentication built into every sign-in</span></p></div><div><i><Zap size={20} /></i><p><b>Set up in moments</b><span>A straightforward, secure onboarding flow</span></p></div><div><i><Network size={20} /></i><p><b>Built to stay connected</b><span>One place for your financial network</span></p></div></div>
        <div className="register-bank-visual" aria-hidden="true"><div className="register-bank-glow" /><div className="register-bank"><div className="register-bank-roof">BANK</div><div className="register-bank-columns"><span /><span /><span /><span /></div><div className="register-bank-base" /></div></div>
      </div>
      <div className="register-footer">TRUST <b>•</b> SECURITY <b>•</b> YOUR CONTROL</div>
    </section>
    <section className="register-form-panel"><div className="register-card"><p className="register-eyebrow">OPEN YOUR ACCOUNT</p><h2>Create your secure<br />banking account</h2><p className="register-description">Your account is protected with secure authentication from the moment you get started.</p>
      {error && <div className="register-error" role="alert">{error}</div>}
      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor="name">Full name</label><div className="register-input"><UserRound size={19} /><input id="name" name="name" type="text" placeholder="Your full name" value={formData.name} onChange={handleChange} autoComplete="name" /></div>
        <label htmlFor="email">Email address</label><div className="register-input"><Mail size={19} /><input id="email" name="email" type="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} autoComplete="email" /></div>
        <label htmlFor="password">Create password</label><div className="register-input"><LockKeyhole size={19} /><input id="password" name="password" type={showPassword ? "text" : "password"} placeholder="At least 8 characters" value={formData.password} onChange={handleChange} autoComplete="new-password" /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button></div>
        <label htmlFor="confirmPassword">Confirm password</label><div className="register-input"><LockKeyhole size={19} /><input id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="Repeat your password" value={formData.confirmPassword} onChange={handleChange} autoComplete="new-password" /><button type="button" onClick={() => setShowConfirmPassword((value) => !value)} aria-label={showConfirmPassword ? "Hide password" : "Show password"}>{showConfirmPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button></div>
        <button className="register-submit" type="submit" disabled={loading}>{loading ? <><i />Creating account...</> : <>Create account <ArrowRight size={20} /></>}</button>
      </form>
      <p className="register-signin">Already have an account? <Link to="/login">Sign In <ArrowRight size={16} /></Link></p>
    </div></section>
  </div>;
}

export default Register;
