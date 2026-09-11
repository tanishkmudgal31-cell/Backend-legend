import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BadgeCheck, Bell, Building2, CalendarDays, Check, Copy, CreditCard, Fingerprint, LayoutDashboard, Lock, LogOut, Mail, ReceiptText, RefreshCw, Send, ShieldCheck, Settings, User, WalletCards } from "lucide-react";
import { getAccountBalance, getMyAccounts, logoutUser } from "../services/api.js";
import "../styles/dashboard.css";
import "../styles/account.css";

const errorMessage = (error, fallback) => error.response?.data?.message || error.message || fallback;

function formatAmount(amount, currency) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: currency || "INR", maximumFractionDigits: 2 }).format(Number(amount || 0));
}

function formatDate(value) {
  if (!value) return "Not available";
  return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

function Account() {
  const navigate = useNavigate();
  const [user] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user")) || {}; } catch { return {}; }
  });
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [copied, setCopied] = useState(false);
  const [prefs, setPrefs] = useState({ alerts: true, statements: false, twoFactor: true, biometric: false });

  async function loadAccount() {
    if (!localStorage.getItem("token")) { setAccount(null); setBalance(null); setLoading(false); return; }
    try {
      setLoading(true); setError("");
      const accountData = await getMyAccounts();
      const selectedAccount = accountData.accounts?.[0] || null;
      setAccount(selectedAccount);
      if (!selectedAccount) { setBalance(null); return; }
      const balanceData = await getAccountBalance(selectedAccount._id);
      setBalance(balanceData);
    } catch (requestError) {
      if (requestError.response?.status === 401) { localStorage.removeItem("token"); localStorage.removeItem("user"); setAccount(null); setBalance(null); return; }
      setError(errorMessage(requestError, "Unable to load your account details."));
    } finally { setLoading(false); }
  }

  useEffect(() => { loadAccount(); }, []);

  async function handleLogout() {
    try { setLoggingOut(true); await logoutUser(); } catch { /* local session must still be cleared */ } finally { localStorage.removeItem("token"); localStorage.removeItem("user"); navigate("/login", { replace: true }); }
  }

  async function handleCopy() {
    if (!account?._id) return;
    try { await navigator.clipboard.writeText(account._id); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* clipboard unavailable */ }
  }

  function togglePref(key) {
    setPrefs((current) => ({ ...current, [key]: !current[key] }));
  }

  return <div className="dashboard-page">
    <aside className="dashboard-sidebar">
      <Link className="dashboard-brand" to="/">BANK<span>·</span>APPLICATION</Link>
      <nav>
        <Link className="dashboard-nav-item dashboard-nav-item--muted" to="/dashboard"><LayoutDashboard size={19} />Dashboard</Link>
        <a className="dashboard-nav-item dashboard-nav-item--muted" href="/transfer"><Send size={19} />Transfer</a>
        <a className="dashboard-nav-item dashboard-nav-item--muted" href="/transactions"><ReceiptText size={19} />Transactions</a>
        <a className="dashboard-nav-item dashboard-nav-item--active" href="/account"><Settings size={19} />Account</a>
      </nav>
      <div className="dashboard-sidebar-footer">
        <div className="dashboard-user-chip"><span>{user.name?.slice(0, 1).toUpperCase() || "U"}</span><p><b>{user.name || "Bank customer"}</b><small>{user.email || "Authenticated account"}</small></p></div>
        <button onClick={handleLogout} disabled={loggingOut}><LogOut size={18} />{loggingOut ? "Signing out..." : "Logout"}</button>
      </div>
    </aside>

    <main className="dashboard-main">
      <header className="dashboard-header">
        <div><p>Account <strong>settings</strong></p><span>Manage your profile and account details.</span></div>
        <button className="dashboard-mobile-logout" onClick={handleLogout} aria-label="Log out"><LogOut size={19} /></button>
      </header>

      {loading ? <div className="dashboard-loading"><i /><p>Loading your account details…</p></div>
        : error ? <div className="dashboard-error"><p>{error}</p><button onClick={loadAccount}><RefreshCw size={17} />Try again</button></div>
        : !account ? <section className="dashboard-empty-account"><WalletCards size={32} /><p className="dashboard-kicker">ACCOUNT DETAILS</p><h1>No bank account yet</h1><p>Once your account is created it will appear here with its full details.</p><Link to="/dashboard">Back to dashboard</Link></section>
        : <>
          <section className="account-profile">
            <article className="account-identity">
              <span className="account-avatar">{user.name?.slice(0, 1).toUpperCase() || "U"}</span>
              <div className="account-identity-copy">
                <h1>{user.name || "Bank customer"}</h1>
                <p>{user.email || "Authenticated account"}</p>
                <span className="account-verified"><BadgeCheck size={13} />Verified customer</span>
              </div>
            </article>
            <div className="account-summary">
              <p className="dashboard-kicker">CURRENT BALANCE</p>
              <h2>{formatAmount(balance?.balance, balance?.currency || account.currency)}</h2>
              <p>Your account is {account.status === "Active" ? "active and in good standing" : `currently ${account.status?.toLowerCase()}`}. Balances are securely retrieved from your banking records.</p>
            </div>
          </section>

          <section>
            <div className="dashboard-section-heading"><div><p className="dashboard-kicker">PROFILE</p><h2>Personal information</h2></div></div>
            <div className="account-detail-list">
              <div className="account-detail-row">
                <span className="account-detail-icon"><User size={18} /></span>
                <div className="account-detail-label"><b>Full name</b><small>Registered account holder</small></div>
                <div className="account-detail-value">{user.name || "Not available"}</div>
              </div>
              <div className="account-detail-row">
                <span className="account-detail-icon"><Mail size={18} /></span>
                <div className="account-detail-label"><b>Email address</b><small>Used for sign-in and alerts</small></div>
                <div className="account-detail-value">{user.email || "Not available"}</div>
              </div>
              <div className="account-detail-row">
                <span className="account-detail-icon"><Building2 size={18} /></span>
                <div className="account-detail-label"><b>Account ID</b><small>Unique banking identifier</small></div>
                <div className="account-detail-value">
                  <button type="button" className="account-copy-btn" onClick={handleCopy}>{copied ? <><Check size={13} />Copied</> : <><Copy size={13} />{account._id}</>}</button>
                </div>
              </div>
            </div>
          </section>

          <section>
            <div className="dashboard-section-heading"><div><p className="dashboard-kicker">ACCOUNT</p><h2>Banking details</h2></div></div>
            <div className="account-detail-list">
              <div className="account-detail-row">
                <span className="account-detail-icon"><CreditCard size={18} /></span>
                <div className="account-detail-label"><b>Currency</b><small>Account base currency</small></div>
                <div className="account-detail-value">{account.currency || "INR"}</div>
              </div>
              <div className="account-detail-row">
                <span className="account-detail-icon"><ShieldCheck size={18} /></span>
                <div className="account-detail-label"><b>Account status</b><small>Operational state</small></div>
                <div className="account-detail-value"><span className={`account-status account-status--${account.status?.toLowerCase()}`}>{account.status}</span></div>
              </div>
              <div className="account-detail-row">
                <span className="account-detail-icon"><CalendarDays size={18} /></span>
                <div className="account-detail-label"><b>Date opened</b><small>Account creation date</small></div>
                <div className="account-detail-value">{formatDate(account.createdAt)}</div>
              </div>
            </div>
          </section>

          <section>
            <div className="dashboard-section-heading"><div><p className="dashboard-kicker">PREFERENCES</p><h2>Security &amp; notifications</h2></div></div>
            <div className="account-prefs">
              <div className="account-pref">
                <Bell size={21} />
                <div className="account-pref-copy"><b>Transaction alerts</b><span>Notify me on every transaction</span></div>
                <button type="button" className="account-toggle" data-on={prefs.alerts} aria-pressed={prefs.alerts} aria-label="Toggle transaction alerts" onClick={() => togglePref("alerts")} />
              </div>
              <div className="account-pref">
                <ReceiptText size={21} />
                <div className="account-pref-copy"><b>Monthly statements</b><span>Email me a statement each month</span></div>
                <button type="button" className="account-toggle" data-on={prefs.statements} aria-pressed={prefs.statements} aria-label="Toggle monthly statements" onClick={() => togglePref("statements")} />
              </div>
              <div className="account-pref">
                <Lock size={21} />
                <div className="account-pref-copy"><b>Two-factor auth</b><span>Extra security at sign-in</span></div>
                <button type="button" className="account-toggle" data-on={prefs.twoFactor} aria-pressed={prefs.twoFactor} aria-label="Toggle two-factor authentication" onClick={() => togglePref("twoFactor")} />
              </div>
              <div className="account-pref">
                <Fingerprint size={21} />
                <div className="account-pref-copy"><b>Biometric login</b><span>Use fingerprint or face ID</span></div>
                <button type="button" className="account-toggle" data-on={prefs.biometric} aria-pressed={prefs.biometric} aria-label="Toggle biometric login" onClick={() => togglePref("biometric")} />
              </div>
            </div>
          </section>
        </>}
    </main>
  </div>;
}

export default Account;
