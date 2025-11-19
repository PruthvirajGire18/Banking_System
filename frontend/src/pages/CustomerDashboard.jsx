import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import TransactionPopup from "../components/TransactionPopup";

// Helper functions
function formatCurrency(n) {
  return `₹${Number(n || 0).toFixed(2)}`;
}

function downloadCSV(filename, rows) {
  if (!rows.length) return;
  const header = Object.keys(rows[0]).join(",");
  const csv = [header]
    .concat(
      rows.map((r) =>
        Object.values(r)
          .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
          .join(",")
      )
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const [user] = useState(() => JSON.parse(localStorage.getItem("user")));
  const [txns, setTxns] = useState([]);
  const [popup, setPopup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(8);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const res = await API.get(`/transactions/${user.id}`);
      const list = (res.data || [])
        .slice()
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setTxns(list);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !user || user.role !== "customer") {
      logout();
      return;
    }
    loadData();
  }, [user, loadData]);

  const latest = txns[0]?.balance_after ?? 0;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return txns.filter((t) => {
      if (filter !== "all" && t.type !== filter) return false;
      if (!q) return true;
      return (
        (t.type || "").toLowerCase().includes(q) ||
        String(t.amount).includes(q) ||
        new Date(t.created_at)
          .toLocaleString()
          .toLowerCase()
          .includes(q)
      );
    });
  }, [txns, filter, query]);

  const visibleTxns = filtered.slice(0, visibleCount);
  const canLoadMore = visibleCount < filtered.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-xl shadow-sm">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              Welcome back, {user?.name || "Customer"} 👋
            </h2>
            <p className="text-sm text-slate-500">
              Secure banking at your fingertips
            </p>
          </div>

          <button
            onClick={logout}
            className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>

        {/* Balance + Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white p-6 rounded-2xl shadow-lg flex items-center justify-between">
            <div>
              <div className="text-sm opacity-80">Current Balance</div>
              <div className="mt-1 text-3xl font-bold">
                {formatCurrency(latest)}
              </div>
              <div className="mt-2 text-xs opacity-70">
                Updated:{" "}
                {txns[0]
                  ? new Date(txns[0].created_at).toLocaleString()
                  : "—"}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPopup("deposit")}
                className="px-4 py-2 rounded-lg bg-white text-indigo-700 font-medium hover:bg-indigo-50 shadow-sm"
              >
                Deposit
              </button>
              <button
                onClick={() => setPopup("withdraw")}
                className="px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 shadow-sm"
              >
                Withdraw
              </button>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow flex flex-col gap-3 justify-between">
            <div>
              <div className="text-sm text-slate-500 flex items-center justify-between">
                <span>Quick Actions</span>
                <span className="text-xs text-slate-400">⋯</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setQuery("");
                  setFilter("all");
                  setVisibleCount(8);
                  loadData();
                }}
                className="flex-1 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition"
              >
                Refresh
              </button>
              <button
                onClick={() =>
                  downloadCSV(
                    "transactions.csv",
                    filtered.map((t) => ({
                      id: t._id,
                      type: t.type,
                      amount: t.amount,
                      date: t.created_at,
                      balance_after: t.balance_after,
                    }))
                  )
                }
                className="flex-1 px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
              >
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-5 rounded-2xl shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <select
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value);
                  setVisibleCount(8);
                }}
                className="px-3 py-2 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-400"
              >
                <option value="all">All</option>
                <option value="deposit">Deposits</option>
                <option value="withdraw">Withdrawals</option>
              </select>

              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setVisibleCount(8);
                }}
                placeholder="Search by amount, date or type"
                className="px-4 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            <div className="text-sm text-slate-500">
              Showing <strong>{filtered.length}</strong> transaction(s)
            </div>
          </div>
        </div>

        {/* Transactions */}
        <div className="bg-white p-5 rounded-2xl shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-3 text-lg">
            Transaction History
          </h3>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse flex items-center justify-between p-3 bg-slate-50 rounded-lg h-16"
                />
              ))}
            </div>
          ) : error ? (
            <div className="p-4 text-red-600">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <div className="mb-2 text-lg font-medium">No transactions yet</div>
              <div className="text-sm">
                Make a deposit to start tracking your finances.
              </div>
            </div>
          ) : (
            <ul className="space-y-2">
              {visibleTxns.map((t) => (
                <li
                  key={t._id}
                  className="flex justify-between items-center p-3 rounded-lg hover:bg-indigo-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        t.type === "deposit"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {t.type === "deposit" ? (
                        <svg
                          className="w-5 h-5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                        >
                          <path
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                        >
                          <path
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M20 12H4"
                          />
                        </svg>
                      )}
                    </div>

                    <div>
                      <div className="font-medium capitalize">{t.type}</div>
                      <div className="text-sm text-slate-500">
                        {new Date(t.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-semibold text-slate-800">
                      {formatCurrency(t.amount)}
                    </div>
                    <div className="text-sm text-slate-500">
                      Bal: {formatCurrency(t.balance_after)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Load More */}
          {!loading && filtered.length > 0 && (
            <div className="mt-5 flex items-center justify-center">
              {canLoadMore ? (
                <button
                  onClick={() => setVisibleCount((v) => v + 8)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition"
                >
                  Load More
                </button>
              ) : (
                <div className="text-sm text-slate-400">
                  No more transactions
                </div>
              )}
            </div>
          )}
        </div>

        {/* Popup */}
        {popup && (
          <TransactionPopup
            mode={popup}
            userId={user.id}
            onClose={() => {
              setPopup(null);
              loadData();
            }}
            reload={loadData}
            balance={latest}
          />
        )}
      </div>
    </div>
  );
}
