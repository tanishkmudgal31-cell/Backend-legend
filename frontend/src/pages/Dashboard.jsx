import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowDownLeft, ArrowRight, ArrowUpRight, CreditCard, LayoutDashboard, LogOut, ReceiptText, RefreshCw, Send, Settings, WalletCards } from "lucide-react";
import { getAccountBalance, getMyAccounts, getRecentTransactions, logoutUser } from "../services/api.js";
import "../styles/dashboard.css";

const errorMessage = (error, fallback) => error.response?.data?.message || error.message || fallback;

function formatAmount(amount, currency) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: currency || "INR", maximumFractionDigits: 2 }).format(Number(amount || 0));
}

function Dashboard() {
  const navigate = useNavigate();
  const [user] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user")) || {}; } catch { return {}; }
  });
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  }, []);

  async function loadDashboard() {
    if (!localStorage.getItem("token")) { navigate("/login", { replace: true }); return; }
    try {
      setLoading(true); setError("");
      const accountData = await getMyAccounts();
      const selectedAccount = accountData.accounts?.[0] || null;
      setAccount(selectedAccount);
      if (!selectedAccount) { setBalance(null); setTransactions([]); return; }
      const [balanceData, transactionData] = await Promise.all([getAccountBalance(selectedAccount._id), getRecentTransactions()]);
      setBalance(balanceData); setTransactions(transactionData.transactions || []);
    } catch (requestError) {
      if (requestError.response?.status === 401) { localStorage.removeItem("token"); localStorage.removeItem("user"); navigate("/login", { replace: true }); return; }
      setError(errorMessage(requestError, "Unable to load your financial overview."));
    } finally { setLoading(false); }
  }

  useEffect(() => { loadDashboard(); }, []);

  async function handleLogout() {
    try { setLoggingOut(true); await logoutUser(); } catch { /* local session must still be cleared */ } finally { localStorage.removeItem("token"); localStorage.removeItem("user"); navigate("/login", { replace: true }); }
  }

  return <div className="dashboard-page">
    <aside className="dashboard-sidebar"><Link className="dashboard-brand" to="/">BANK<span>·</span>APPLICATION</Link><nav><Link className="dashboard-nav-item dashboard-nav-item--active" to="/dashboard"><LayoutDashboard size={19} />Dashboard</Link><a className="dashboard-nav-item dashboard-nav-item--muted" href="/transfer"><Send size={19} />Transfer</a><a className="dashboard-nav-item dashboard-nav-item--muted" href="/transactions"><ReceiptText size={19} />Transactions</a><a className="dashboard-nav-item dashboard-nav-item--muted" href="/account"><Settings size={19} />Account</a></nav><div className="dashboard-sidebar-footer"><div className="dashboard-user-chip"><span>{user.name?.slice(0, 1).toUpperCase() || "U"}</span><p><b>{user.name || "Bank customer"}</b><small>{user.email || "Authenticated account"}</small></p></div><button onClick={handleLogout} disabled={loggingOut}><LogOut size={18} />{loggingOut ? "Signing out..." : "Logout"}</button></div></aside>
    <main className="dashboard-main"><header className="dashboard-header"><div><p>{greeting}, <strong>{user.name || "there"}</strong></p><span>Here&apos;s your financial overview.</span></div><button className="dashboard-mobile-logout" onClick={handleLogout} aria-label="Log out"><LogOut size={19} /></button></header>
      {loading ? <div className="dashboard-loading"><i /><p>Loading your financial overview…</p></div> : error ? <div className="dashboard-error"><p>{error}</p><button onClick={loadDashboard}><RefreshCw size={17} />Try again</button></div> : !account ? <section className="dashboard-empty-account"><WalletCards size={32} /><p className="dashboard-kicker">ACCOUNT OVERVIEW</p><h1>No bank account yet</h1><p>Create your account to start managing your finances.</p><Link to="/account">Account details <ArrowRight size={17} /></Link></section> : <>
        <section className="dashboard-overview"><article className="dashboard-balance-card"><div className="dashboard-balance-card__top"><span>Available Balance</span><CreditCard size={21} /></div><strong>{formatAmount(balance?.balance, balance?.currency || account.currency)}</strong><div className="dashboard-balance-card__meta"><span>{balance?.currency || account.currency}</span><span className={`dashboard-status dashboard-status--${account.status?.toLowerCase()}`}>{account.status}</span><small>Account ID · {account._id}</small></div></article><div className="dashboard-overview-note"><p className="dashboard-kicker">ACCOUNT STATUS</p><h2>{account.status === "Active" ? "Your account is active." : `Account is ${account.status?.toLowerCase()}.`}</h2><p>Your current balance and account information are securely retrieved from your banking account.</p></div></section>
        <section><div className="dashboard-section-heading"><div><p className="dashboard-kicker">QUICK ACTIONS</p><h2>Manage your money</h2></div></div><div className="dashboard-actions"><a href="/transfer"><Send size={21} /><div><b>Transfer Money</b><span>Move funds securely</span></div><ArrowRight size={18} /></a><a href="/transactions"><ReceiptText size={21} /><div><b>Transactions</b><span>Review activity</span></div><ArrowRight size={18} /></a><a href="/account"><Settings size={21} /><div><b>Account Details</b><span>View account settings</span></div><ArrowRight size={18} /></a></div></section>
        <section className="dashboard-transactions"><div className="dashboard-section-heading"><div><p className="dashboard-kicker">RECENT ACTIVITY</p><h2>Latest transactions</h2></div><a href="/transactions">View all <ArrowRight size={16} /></a></div>{transactions.length === 0 ? <div className="dashboard-empty-transactions"><ReceiptText size={28} /><p>No transactions yet</p><span>Your completed transactions will appear here.</span></div> : <div className="dashboard-transaction-list">{transactions.map((transaction) => { const sent = String(transaction.fromAccount?._id) === String(account._id); const date = transaction.createdAt ? new Date(transaction.createdAt).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" }) : "Date unavailable"; return <article key={transaction._id} className="dashboard-transaction"><span className={sent ? "dashboard-transaction-icon dashboard-transaction-icon--sent" : "dashboard-transaction-icon"}>{sent ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}</span><div className="dashboard-transaction-copy"><b>{sent ? "Money sent" : "Money received"}</b><small>{transaction.description || transaction.type} · {transaction.reference || "Reference unavailable"}</small></div><time>{date}</time><div className="dashboard-transaction-amount"><b className={sent ? "is-sent" : ""}>{sent ? "−" : "+"}{formatAmount(transaction.amount, account.currency)}</b><span>{transaction.status}</span></div></article>; })}</div>}</section>
      </>}
    </main>
  </div>;
}

export default Dashboard;
