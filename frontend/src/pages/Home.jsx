import { Link } from "react-router-dom";
import { Activity, ArrowRight, LockKeyhole, Network, ShieldCheck } from "lucide-react";
import FinancialCore3D from "../components/FinancialCore3D.jsx";
import "../styles/home.css";

const features = [
  { number: "01", icon: Activity, title: "Secure Transactions", text: "Move money through a transaction system designed with authentication and controlled account access." },
  { number: "02", icon: LockKeyhole, title: "Bank-Level Security", text: "Authentication and authorization protect your accounts and financial operations." },
  { number: "03", icon: Network, title: "Connected Accounts", text: "Manage your financial accounts and transactions through one connected banking platform." },
];

function Home() {
  return <div className="home-page">
    <header className="home-header home-container">
      <Link className="home-brand" to="/" aria-label="Bank Application home">BANK<span>·</span>APPLICATION</Link>
      <nav className="home-nav" aria-label="Main navigation"><a href="#features">Features</a><a href="#security">Security</a><a href="#network">Network</a></nav>
      <div className="home-actions"><Link className="home-signin" to="/login">Sign In</Link><Link className="home-button home-button--compact" to="/register">Open an Account</Link></div>
    </header>
    <main>
      <section className="home-hero">
        <div className="home-grid" />
        <div className="home-container home-hero__content">
          <div className="home-copy"><p className="home-status"><i />BANKING SYSTEM ONLINE</p><h1>Your Money.<br /><em>Your Network.</em><br />Your Control.</h1><p className="home-description">A secure digital banking infrastructure designed to give you complete control over your accounts, transactions and financial network.</p><div className="home-cta"><Link className="home-button" to="/register">Open an Account <ArrowRight size={18} /></Link><Link className="home-button home-button--secondary" to="/login">Sign In</Link></div><div className="home-stats"><div><b>24/7</b><span>Banking access</span></div><div><b>Secure</b><span>Authentication</span></div><div><b>Real-time</b><span>Transactions</span></div></div></div>
          <div className="home-visual" aria-label="Decorative banking network visualization">
            <div className="home-orbit" /><FinancialCore3D />
            <div className="home-data-card home-data-card--balance"><small>Illustrative account balance</small><strong>₹1,24,850</strong><span>Protected account view</span></div>
            <div className="home-data-card home-data-card--received"><b>↓</b><div><small>Money received</small><strong>₹25,000</strong><span>Account transfer · visual only</span></div></div>
            <div className="home-data-card home-data-card--sent"><b>↑</b><div><small>Money sent</small><strong>₹8,500</strong><span>Bank transfer · visual only</span></div></div>
          </div>
        </div>
      </section>
      <section className="home-section home-container" id="features"><p className="home-label">THE INFRASTRUCTURE</p><div className="home-section-heading"><h2>Financial infrastructure<br />built for control.</h2><p>Everything you need to manage money, accounts and transactions through one secure banking platform.</p></div><div className="home-features">{features.map(({ number, icon: Icon, title, text }) => <article className="home-feature" key={number}><span>{number}</span><div className="home-feature__icon"><Icon size={23} /></div><h3>{title}</h3><p>{text}</p><ArrowRight size={20} /></article>)}</div></section>
      <section className="home-security" id="security"><div className="home-container home-security__inner"><div className="home-security__icon"><ShieldCheck size={30} /></div><p className="home-label">SECURITY FIRST</p><h2>Your financial data<br />stays under your control.</h2><p>Authenticated access, controlled accounts and traceable financial transactions give you a clear, protected view of your financial network.</p><Link className="home-button" to="/register">Get Started <ArrowRight size={18} /></Link></div></section>
    </main>
    <footer className="home-footer home-container" id="network"><div><strong className="home-brand">BANK<span>·</span>APPLICATION</strong><p>Secure digital banking infrastructure.</p></div><div><a href="#features">Features</a><a href="#security">Security</a><a href="#network">Network</a></div></footer>
  </div>;
}

export default Home;
