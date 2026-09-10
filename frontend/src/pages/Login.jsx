import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  LockKeyhole,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  Zap,
  Network,
  ArrowLeft,
} from "lucide-react";
import { loginUser } from "../services/api.js";
import "../styles/auth.css";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e) {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");

    if (!formData.email || !formData.password) {
      setError("Please enter your email and password.");
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);

      const data = await loginUser({
        email: formData.email.trim(),
        password: formData.password,
      });

      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      if (data.user) {
        localStorage.setItem(
          "user",
          JSON.stringify(data.user)
        );
      }

      navigate("/");
    } catch (error) {
      setError(error.response?.data?.message || error.message || "Unable to login. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      {/* LEFT SIDE */}
      <section className="login-brand-panel">
        <div className="brand-glow brand-glow-one" />
        <div className="brand-glow brand-glow-two" />

        <Link to="/" className="login-back">
          <ArrowLeft size={18} />
          Back to home
        </Link>

        <div className="login-brand-content">
          <div className="brand-logo-row">
            <div className="brand-shield">
              <ShieldCheck size={28} />
            </div>

            <div>
              <div className="brand-name">
                Bank <span>Application</span>
              </div>

              <div className="brand-subtitle">
                SECURE BANKING 24/7
              </div>
            </div>
          </div>

          <div className="brand-copy">
            <div className="brand-eyebrow">
              YOUR FINANCES. OUR PRIORITY.
            </div>

            <h1>
              Welcome
              <br />
              <span>back.</span>
            </h1>

            <p>
              Access your accounts, manage transactions
              and stay connected to your financial
              network.
            </p>
          </div>

          <div className="security-features">
            <div className="security-feature">
              <div className="security-feature-icon">
                <LockKeyhole size={21} />
              </div>

              <div>
                <strong>Bank-level security</strong>
                <span>Your data is protected</span>
              </div>
            </div>

            <div className="security-feature">
              <div className="security-feature-icon">
                <Zap size={21} />
              </div>

              <div>
                <strong>Real-time transactions</strong>
                <span>Fast, secure and reliable</span>
              </div>
            </div>

            <div className="security-feature">
              <div className="security-feature-icon">
                <Network size={21} />
              </div>

              <div>
                <strong>Always connected</strong>
                <span>Manage your finances anywhere</span>
              </div>
            </div>
          </div>

          {/* BANK VISUAL */}
          <div className="bank-visual">
            <div className="bank-glow" />

            <div className="bank-building">
              <div className="bank-roof">
                <span>BANK</span>
              </div>

              <div className="bank-top-line" />

              <div className="bank-columns">
                <div className="bank-column" />
                <div className="bank-column" />
                <div className="bank-column" />
                <div className="bank-column" />
              </div>

              <div className="bank-base" />
            </div>

            <div className="bank-floor-glow" />
          </div>
        </div>

        <div className="brand-footer">
          <span />
          TRUST
          <b>•</b>
          SECURITY
          <b>•</b>
          YOUR CONTROL
        </div>
      </section>

      {/* RIGHT SIDE */}
      <section className="login-form-panel">
        <div className="login-card">
          <div className="form-eyebrow">
            WELCOME BACK
          </div>

          <h2>Sign in to your account</h2>

          <p className="form-description">
            Enter your credentials to continue to your
            banking dashboard.
          </p>

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">
                Email address
              </label>

              <div className="input-wrapper">
                <Mail size={20} />

                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
              <div className="password-label-row">
                <label htmlFor="password">
                  Password
                </label>

                <button
                  type="button"
                  className="forgot-password"
                  onClick={() =>
                    setError(
                      "Password recovery will be available soon."
                    )
                  }
                >
                  Forgot password?
                </button>
              </div>

              <div className="input-wrapper">
                <LockKeyhole size={20} />

                <input
                  id="password"
                  name="password"
                  type={
                    showPassword ? "text" : "password"
                  }
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword((value) => !value)
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="login-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading-spinner" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="login-divider">
            <span />
            <p>OR</p>
            <span />
          </div>

          <button
            type="button"
            className="biometric-button"
            onClick={() =>
              setError(
                "Biometric authentication will be available soon."
              )
            }
          >
            <ShieldCheck size={21} />
            Sign in with biometric
          </button>

          <div className="create-account">
            <span>New to Bank Application?</span>

            <Link to="/register">
              Create an account
              <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Login;
