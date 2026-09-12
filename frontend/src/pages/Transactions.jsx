import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Hash,
  LayoutDashboard,
  LogOut,
  ReceiptText,
  RefreshCw,
  Send,
  Settings,
} from "lucide-react";

import { getMyAccounts, logoutUser } from "../services/api.js";
import api from "../services/api.js";

import "../styles/dashboard.css";
import "../styles/transactions.css";

const PAGE_SIZE = 5;

const errorMessage = (error, fallback) =>
  error.response?.data?.message || error.message || fallback;

function formatAmount(amount, currency) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency || "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));
}

function formatDateTime(value) {
  if (!value) {
    return { date: "Date unavailable", time: "" };
  }
  const parsed = new Date(value);
  return {
    date: parsed.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    time: parsed.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

// Sample data used only for preview when there is no auth token / backend.
const SAMPLE_ACCOUNT_ID = "sample-account-001";
const SAMPLE_TRANSACTIONS = [
  {
    _id: "s1",
    type: "TRANSFER",
    amount: 12500,
    status: "COMPLETED",
    reference: "TXN-6f3a92c1b8d4e70a1c2f",
    description: "Rent payment",
    createdAt: "2026-09-10T09:24:00.000Z",
    fromAccount: { _id: SAMPLE_ACCOUNT_ID, currency: "INR", user: { name: "You" } },
    toAccount: { _id: "acc-landlord", currency: "INR", user: { name: "Meera Landlord" } },
  },
  {
    _id: "s2",
    type: "TRANSFER",
    amount: 4800,
    status: "COMPLETED",
    reference: "TXN-2ab71f9044c6e83b0d15",
    description: "Freelance invoice",
    createdAt: "2026-09-09T15:02:00.000Z",
    fromAccount: { _id: "acc-client", currency: "INR", user: { name: "Nova Studio" } },
    toAccount: { _id: SAMPLE_ACCOUNT_ID, currency: "INR", user: { name: "You" } },
  },
  {
    _id: "s3",
    type: "TRANSFER",
    amount: 990,
    status: "PENDING",
    reference: "TXN-88de10a4c7f2b6e39a04",
    description: "Utility bill",
    createdAt: "2026-09-09T08:41:00.000Z",
    fromAccount: { _id: SAMPLE_ACCOUNT_ID, currency: "INR", user: { name: "You" } },
    toAccount: { _id: "acc-power", currency: "INR", user: { name: "City Power Co." } },
  },
  {
    _id: "s4",
    type: "TRANSFER",
    amount: 30000,
    status: "FAILED",
    reference: "TXN-51c0b7e2a9d84f16c3ba",
    description: "Investment top-up",
    createdAt: "2026-09-08T19:18:00.000Z",
    fromAccount: { _id: SAMPLE_ACCOUNT_ID, currency: "INR", user: { name: "You" } },
    toAccount: { _id: "acc-broker", currency: "INR", user: { name: "Ledger Brokerage" } },
  },
  {
    _id: "s5",
    type: "TRANSFER",
    amount: 2150,
    status: "REVERSED",
    reference: "TXN-9a4e6db130f8c25a7e11",
    description: "Refund adjustment",
    createdAt: "2026-09-07T11:55:00.000Z",
    fromAccount: { _id: "acc-store", currency: "INR", user: { name: "Aurora Retail" } },
    toAccount: { _id: SAMPLE_ACCOUNT_ID, currency: "INR", user: { name: "You" } },
  },
];

function StatusBadge({ status }) {
  const value = String(status || "").toUpperCase();
  const known = ["COMPLETED", "PENDING", "FAILED", "REVERSED"];
  const modifier = known.includes(value) ? value.toLowerCase() : "completed";
  return (
    <span className={`txn-status txn-status--${modifier}`}>
      {value || "COMPLETED"}
    </span>
  );
}

function Transactions() {
  const navigate = useNavigate();

  const [user] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || {};
    } catch {
      return {};
    }
  });

  const [accountIds, setAccountIds] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    totalTransactions: 0,
    totalPages: 0,
  });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  const accountIdSet = useMemo(
    () => new Set(accountIds.map((id) => String(id))),
    [accountIds]
  );

  function isSent(transaction) {
    return accountIdSet.has(String(transaction.fromAccount?._id));
  }

  const summary = useMemo(() => {
    let sent = 0;
    let received = 0;
    let pending = 0;
    for (const transaction of transactions) {
      if (String(transaction.status).toUpperCase() === "PENDING") {
        pending += 1;
      }
      if (isSent(transaction)) {
        sent += Number(transaction.amount || 0);
      } else {
        received += Number(transaction.amount || 0);
      }
    }
    return { sent, received, pending };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions, accountIdSet]);

  async function loadTransactions(requestedPage) {
    const targetPage = requestedPage || page;

    // Preview mode: no token means no backend session — show sample data.
    if (!localStorage.getItem("token")) {
      setAccountIds([SAMPLE_ACCOUNT_ID]);
      setTransactions(SAMPLE_TRANSACTIONS);
      setPagination({
        page: 1,
        limit: PAGE_SIZE,
        totalTransactions: SAMPLE_TRANSACTIONS.length,
        totalPages: 1,
      });
      setLoading(false);
      setError("");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const accountData = await getMyAccounts();
      const ids = (accountData.accounts || []).map((account) => account._id);
      setAccountIds(ids);

      const response = await api.get("/transactions", {
        params: { page: targetPage, limit: PAGE_SIZE },
      });

      setTransactions(response.data.transactions || []);
      setPagination(
        response.data.pagination || {
          page: targetPage,
          limit: PAGE_SIZE,
          totalTransactions: (response.data.transactions || []).length,
          totalPages: 1,
        }
      );
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login", { replace: true });
        return;
      }
      setError(
        errorMessage(requestError, "Unable to load your transaction history.")
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTransactions(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

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

  const totalPages = Math.max(pagination.totalPages || 1, 1);
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="dashboard-page">
      <aside className="dashboard-sidebar">
        <Link className="dashboard-brand" to="/">
          BANK<span>·</span>APPLICATION
        </Link>
        <nav>
          <a className="dashboard-nav-item dashboard-nav-item--muted" href="/dashboard">
            <LayoutDashboard size={19} />
            Dashboard
          </a>
          <a className="dashboard-nav-item dashboard-nav-item--muted" href="/transfer">
            <Send size={19} />
            Transfer
          </a>
          <Link className="dashboard-nav-item dashboard-nav-item--active" to="/transactions">
            <ReceiptText size={19} />
            Transactions
          </Link>
          <a className="dashboard-nav-item dashboard-nav-item--muted" href="/account">
            <Settings size={19} />
            Account
          </a>
        </nav>
        <div className="dashboard-sidebar-footer">
          <div className="dashboard-user-chip">
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

      <main className="dashboard-main">
        <header className="txn-header">
          <div>
            <p className="dashboard-kicker">TRANSACTION HISTORY</p>
            <h1>Your Transactions</h1>
            <span>View and track your recent banking activity.</span>
          </div>
          <button
            className="dashboard-mobile-logout"
            onClick={handleLogout}
            aria-label="Log out"
          >
            <LogOut size={19} />
          </button>
        </header>

        <section className="txn-summary" aria-label="Transaction summary">
          <article className="txn-summary-card">
            <div className="txn-summary-icon txn-summary-icon--neutral">
              <ReceiptText size={18} />
            </div>
            <p className="txn-summary-label">Total transactions</p>
            <strong className="txn-summary-value">
              {pagination.totalTransactions ?? transactions.length}
            </strong>
          </article>
          <article className="txn-summary-card">
            <div className="txn-summary-icon txn-summary-icon--sent">
              <ArrowUpRight size={18} />
            </div>
            <p className="txn-summary-label">Total sent</p>
            <strong className="txn-summary-value txn-summary-value--sent">
              {formatAmount(summary.sent)}
            </strong>
          </article>
          <article className="txn-summary-card">
            <div className="txn-summary-icon txn-summary-icon--received">
              <ArrowDownLeft size={18} />
            </div>
            <p className="txn-summary-label">Total received</p>
            <strong className="txn-summary-value txn-summary-value--received">
              {formatAmount(summary.received)}
            </strong>
          </article>
          <article className="txn-summary-card">
            <div className="txn-summary-icon txn-summary-icon--pending">
              <RefreshCw size={18} />
            </div>
            <p className="txn-summary-label">Pending transactions</p>
            <strong className="txn-summary-value">{summary.pending}</strong>
          </article>
        </section>

        <section className="txn-section">
          <div className="dashboard-section-heading">
            <div>
              <p className="dashboard-kicker">ACTIVITY</p>
              <h2>Transaction history</h2>
            </div>
          </div>

          {loading ? (
            <div className="txn-table" aria-hidden="true">
              <div className="txn-row txn-row--head">
                <span>Transaction</span>
                <span>Details</span>
                <span className="txn-col-amount">Amount</span>
                <span>Status</span>
                <span>Date</span>
              </div>
              {Array.from({ length: PAGE_SIZE }).map((_, index) => (
                <div className="txn-row txn-row--skeleton" key={index}>
                  <span className="txn-skel txn-skel-icon" />
                  <span className="txn-skel-lines">
                    <span className="txn-skel txn-skel-line" />
                    <span className="txn-skel txn-skel-line txn-skel-line--short" />
                  </span>
                  <span className="txn-skel txn-skel-line txn-col-amount" />
                  <span className="txn-skel txn-skel-pill" />
                  <span className="txn-skel txn-skel-line txn-skel-line--short" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="dashboard-error">
              <p>{error}</p>
              <button onClick={() => loadTransactions(page)}>
                <RefreshCw size={17} />
                Try again
              </button>
            </div>
          ) : transactions.length === 0 ? (
            <div className="txn-empty">
              <ArrowLeftRight size={30} />
              <p>No transactions yet</p>
              <span>
                Your sent and received payments will appear here once you start
                moving money.
              </span>
              <Link to="/transfer" className="txn-empty-action">
                <Send size={16} />
                Make a transfer
              </Link>
            </div>
          ) : (
            <>
              <div className="txn-table">
                <div className="txn-row txn-row--head">
                  <span>Transaction</span>
                  <span>Details</span>
                  <span className="txn-col-amount">Amount</span>
                  <span>Status</span>
                  <span>Date</span>
                </div>

                {transactions.map((transaction) => {
                  const sent = isSent(transaction);
                  const counterparty = sent
                    ? transaction.toAccount
                    : transaction.fromAccount;
                  const counterpartyName =
                    counterparty?.user?.name ||
                    counterparty?._id ||
                    "Unknown account";
                  const { date, time } = formatDateTime(transaction.createdAt);
                  const currency =
                    transaction.fromAccount?.currency ||
                    transaction.toAccount?.currency ||
                    "INR";

                  return (
                    <div className="txn-row" key={transaction._id}>
                      <div className="txn-cell-main">
                        <span
                          className={`txn-icon ${
                            sent ? "txn-icon--sent" : "txn-icon--received"
                          }`}
                        >
                          {sent ? (
                            <ArrowUpRight size={18} />
                          ) : (
                            <ArrowDownLeft size={18} />
                          )}
                        </span>
                        <span className="txn-direction">
                          <b>{sent ? "Sent" : "Received"}</b>
                          <small>{transaction.type || "TRANSFER"}</small>
                        </span>
                      </div>

                      <div className="txn-cell-details">
                        <b>
                          {transaction.description ||
                            (sent ? "Money sent" : "Money received")}
                        </b>
                        <small>
                          {sent ? "To" : "From"} · {counterpartyName}
                        </small>
                        <small className="txn-reference">
                          <Hash size={11} />
                          {transaction.reference || "Reference unavailable"}
                        </small>
                      </div>

                      <div className="txn-cell-amount">
                        <b className={sent ? "is-sent" : "is-received"}>
                          {sent ? "−" : "+"}
                          {formatAmount(transaction.amount, currency)}
                        </b>
                      </div>

                      <div className="txn-cell-status">
                        <StatusBadge status={transaction.status} />
                      </div>

                      <div className="txn-cell-date">
                        <span>{date}</span>
                        {time && <small>{time}</small>}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="txn-pagination">
                <button
                  type="button"
                  onClick={() => canPrev && setPage((current) => current - 1)}
                  disabled={!canPrev}
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>
                <span className="txn-page-indicator">
                  Page <b>{pagination.page || page}</b> of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => canNext && setPage((current) => current + 1)}
                  disabled={!canNext}
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}

export default Transactions;
