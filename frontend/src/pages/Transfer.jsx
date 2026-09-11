import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  LayoutDashboard,
  LogOut,
  ReceiptText,
  RefreshCw,
  Send,
  Settings,
  WalletCards,
} from "lucide-react";
import {
  createTransaction,
  getAccountBalance,
  getMyAccounts,
  logoutUser,
} from "../services/api.js";
import "../styles/transfer.css";

const errorMessage = (error, fallback) =>
  error.response?.data?.message || error.message || fallback;

function formatAmount(amount, currency) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency || "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));
}

function generateIdempotentKey() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `xfer-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function Transfer() {
  const navigate = useNavigate();
  const [user] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || {};
    } catch {
      return {};
    }
  });

  const [accounts, setAccounts] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [accountsError, setAccountsError] = useState("");

  const [fromAccount, setFromAccount] = useState("");
  const [balance, setBalance] = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceError, setBalanceError] = useState("");

  const [toAccount, setToAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [successResult, setSuccessResult] = useState(null);

  const [loggingOut, setLoggingOut] = useState(false);

  const selectedAccount = useMemo(
    () => accounts.find((account) => account._id === fromAccount) || null,
    [accounts, fromAccount]
  );

  async function loadAccounts() {
    if (!localStorage.getItem("token")) {
      navigate("/login", { replace: true });
      return;
    }
    try {
      setAccountsLoading(true);
      setAccountsError("");
      const accountData = await getMyAccounts();
      const list = accountData.accounts || [];
      setAccounts(list);
      if (list.length > 0) {
        setFromAccount(list[0]._id);
      }
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login", { replace: true });
        return;
      }
      setAccountsError(
        errorMessage(requestError, "Unable to load your accounts.")
      );
    } finally {
      setAccountsLoading(false);
    }
  }

  async function loadBalance(accountId) {
    if (!accountId) {
      setBalance(null);
      return;
    }
    try {
      setBalanceLoading(true);
      setBalanceError("");
      const balanceData = await getAccountBalance(accountId);
      setBalance(balanceData);
    } catch (requestError) {
      setBalanceError(
        errorMessage(requestError, "Unable to load account balance.")
      );
      setBalance(null);
    } finally {
      setBalanceLoading(false);
    }
  }

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    if (fromAccount) {
      loadBalance(fromAccount);
    }
  }, [fromAccount]);

  async function handleLogout() {
    try {
      setLoggingOut(true);
      await logoutUser();
    } catch {
      /* local session must still be cleared */
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/login", { replace: true });
    }
  }

  function validate() {
    const errors = {};
    const trimmedTo = toAccount.trim();
    const numericAmount = Number(amount);

    if (!fromAccount) {
      errors.fromAccount = "Select an account to send from.";
    }

    if (!trimmedTo) {
      errors.toAccount = "Enter a recipient account ID.";
    }

    if (!amount) {
      errors.amount = "Enter an amount to send.";
    } else if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      errors.amount = "Amount must be greater than 0.";
    }

    if (fromAccount && trimmedTo && fromAccount === trimmedTo) {
      errors.toAccount = "Recipient account must be different from the sender account.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitError("");
    setSuccessResult(null);

    if (!validate()) {
      return;
    }

    try {
      setSubmitting(true);
      const data = await createTransaction({
        fromAccount,
        toAccount: toAccount.trim(),
        amount: Number(amount),
        idempotentKey: generateIdempotentKey(),
        description: description.trim() || undefined,
      });

      setSuccessResult(data);
      setToAccount("");
      setAmount("");
      setDescription("");
      setFieldErrors({});
      await loadBalance(fromAccount);
    } catch (requestError) {
      setSubmitError(
        errorMessage(requestError, "Unable to complete the transfer.")
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="transfer-page">
      <aside className="transfer-sidebar">
        <Link className="transfer-brand" to="/">
          BANK<span>·</span>APPLICATION
        </Link>
        <nav>
          <Link className="transfer-nav-item" to="/dashboard">
            <LayoutDashboard size={19} />
            Dashboard
          </Link>
          <Link className="transfer-nav-item transfer-nav-item--active" to="/transfer">
            <Send size={19} />
            Transfer
          </Link>
          <a className="transfer-nav-item transfer-nav-item--muted" href="/transactions">
            <ReceiptText size={19} />
            Transactions
          </a>
          <a className="transfer-nav-item transfer-nav-item--muted" href="/account">
            <Settings size={19} />
            Account
          </a>
        </nav>
        <div className="transfer-sidebar-footer">
          <div className="transfer-user-chip">
            <span>{user.name?.slice(0, 1).toUpperCase() || "U"}</span>
            <p>
              <b>{user.name || "Bank customer"}</b>
              <small>{user.email || "Authenticated account"}</small>
            </p>
          </div>
          <button onClick={handleLogout} disabled={loggingOut}>
            <LogOut size={18} />
            {loggingOut ? "Signing out..." : "Logout"}
          </button>
        </div>
      </aside>

      <main className="transfer-main">
        <header className="transfer-header">
          <div>
            <p className="transfer-kicker">SEND MONEY</p>
            <h1>Transfer funds</h1>
            <span>Move money between accounts securely.</span>
          </div>
          <button
            className="transfer-mobile-logout"
            onClick={handleLogout}
            aria-label="Log out"
          >
            <LogOut size={19} />
          </button>
        </header>

        {accountsLoading ? (
          <div className="transfer-loading">
            <i />
            <p>Loading your accounts…</p>
          </div>
        ) : accountsError ? (
          <div className="transfer-error-state">
            <p>{accountsError}</p>
            <button onClick={loadAccounts}>
              <RefreshCw size={17} />
              Try again
            </button>
          </div>
        ) : accounts.length === 0 ? (
          <section className="transfer-empty-account">
            <WalletCards size={32} />
            <p className="transfer-kicker">ACCOUNT REQUIRED</p>
            <h1>No bank account yet</h1>
            <p>You need an active account before you can transfer funds.</p>
            <Link to="/account">
              Account details <ArrowRight size={17} />
            </Link>
          </section>
        ) : (
          <section className="transfer-card">
            <form onSubmit={handleSubmit} noValidate>
              <div className="transfer-form-group">
                <label htmlFor="fromAccount">From account</label>
                <select
                  id="fromAccount"
                  value={fromAccount}
                  onChange={(event) => {
                    setFromAccount(event.target.value);
                    setSuccessResult(null);
                  }}
                >
                  {accounts.map((account) => (
                    <option key={account._id} value={account._id}>
                      {account.accountNumber || account._id} · {account.status}
                    </option>
                  ))}
                </select>
                {fieldErrors.fromAccount && (
                  <span className="transfer-field-error">{fieldErrors.fromAccount}</span>
                )}
              </div>

              <div className="transfer-balance-row">
                <CreditCard size={18} />
                <span>Available balance</span>
                <strong>
                  {balanceLoading
                    ? "Loading…"
                    : balanceError
                    ? "Unavailable"
                    : formatAmount(
                        balance?.balance,
                        balance?.currency || selectedAccount?.currency
                      )}
                </strong>
              </div>
              {balanceError && (
                <span className="transfer-field-error">{balanceError}</span>
              )}

              <div className="transfer-form-group">
                <label htmlFor="toAccount">Recipient account ID</label>
                <input
                  id="toAccount"
                  type="text"
                  placeholder="Enter recipient account ID"
                  value={toAccount}
                  onChange={(event) => setToAccount(event.target.value)}
                />
                {fieldErrors.toAccount && (
                  <span className="transfer-field-error">{fieldErrors.toAccount}</span>
                )}
              </div>

              <div className="transfer-form-group">
                <label htmlFor="amount">Amount</label>
                <input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                />
                {fieldErrors.amount && (
                  <span className="transfer-field-error">{fieldErrors.amount}</span>
                )}
              </div>

              <div className="transfer-form-group">
                <label htmlFor="description">Description (optional)</label>
                <input
                  id="description"
                  type="text"
                  placeholder="What's this transfer for?"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </div>

              {submitError && <div className="transfer-submit-error">{submitError}</div>}

              {successResult && (
                <div className="transfer-success">
                  <CheckCircle2 size={19} />
                  <div>
                    <b>Transfer completed</b>
                    <span>
                      {successResult.transaction?.reference ||
                        successResult.reference ||
                        "Your money is on its way."}
                    </span>
                  </div>
                </div>
              )}

              <button type="submit" className="transfer-submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <span className="transfer-spinner" />
                    Sending...
                  </>
                ) : (
                  <>
                    Submit Transfer
                    <Send size={18} />
                  </>
                )}
              </button>
            </form>
          </section>
        )}
      </main>
    </div>
  );
}

export default Transfer;