import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import API from "../api";

// Utility: Export CSV
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

export default function UserTransactions() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const rawUser = localStorage.getItem("user");
  const user = rawUser ? JSON.parse(rawUser) : null;

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await API.get(`/bankers/transactions/${id}`);
      const list = (res.data || [])
        .slice()
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setTxns(list);
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load transactions"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !user || user.role !== "banker") {
      localStorage.clear();
      navigate("/");
      return;
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return txns.filter((t) => {
      if (filter !== "all" && t.type !== filter) return false;
      if (!q) return true;
      return (
        (t.type || "").toLowerCase().includes(q) ||
        String(t.amount).toLowerCase().includes(q) ||
        new Date(t.created_at)
          .toLocaleString()
          .toLowerCase()
          .includes(q)
      );
    });
  }, [txns, query, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages]);

  const formatCurrency = (n) => `₹${Number(n || 0).toFixed(2)}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-xl shadow-sm">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              Customer Transactions
            </h2>
            <p className="text-sm text-slate-500">
              Viewing records for account{" "}
              <span className="font-medium text-indigo-600">{id}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setQuery("");
                setFilter("all");
                setPage(1);
                loadData();
              }}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition text-sm"
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
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm shadow-md hover:shadow-lg transition"
            >
              Export CSV
            </button>
            <Link
              to="/banker"
              className="px-4 py-2 rounded-lg border border-slate-200 text-sm hover:bg-slate-50 transition"
            >
              Back
            </Link>
          </div>
        </div>

        {/* Filter and search */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-3">
              <select
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-indigo-400"
              >
                <option value="all">All</option>
                <option value="deposit">Deposits</option>
                <option value="withdraw">Withdrawals</option>
              </select>

              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by type, amount or date"
                className="px-4 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            <div className="text-sm text-slate-500">
              Showing <strong>{filtered.length}</strong> transaction(s)
            </div>
          </div>
        </div>

        {/* Transactions */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: pageSize }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse p-4 bg-slate-50 rounded-lg h-16"
                />
              ))}
            </div>
          ) : error ? (
            <div className="p-4 text-red-600">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <div className="mb-2 text-lg font-medium">
                No transactions found
              </div>
              <div className="text-sm">
                This customer has no recorded activity yet.
              </div>
            </div>
          ) : (
            <ul className="space-y-2">
              {pageItems.map((t) => (
                <li
                  key={t._id}
                  className="flex items-center justify-between p-4 rounded-lg border border-slate-100 hover:shadow-md transition"
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
                      <div className="font-medium capitalize text-slate-800">
                        {t.type}
                      </div>
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

          {/* Pagination */}
          {!loading && filtered.length > 0 && (
            <div className="mt-5 flex items-center justify-between text-sm text-slate-600">
              <div>
                Page {page} of {totalPages}
              </div>
              <div className="flex gap-2">
                {["First", "Prev", "Next", "Last"].map((label, i) => {
                  const actions = [
                    () => setPage(1),
                    () => setPage((p) => Math.max(1, p - 1)),
                    () => setPage((p) => Math.min(totalPages, p + 1)),
                    () => setPage(totalPages),
                  ];
                  const disabled =
                    (label === "First" || label === "Prev") && page === 1
                      ? true
                      : (label === "Next" || label === "Last") &&
                        page === totalPages
                      ? true
                      : false;
                  return (
                    <button
                      key={label}
                      onClick={actions[i]}
                      disabled={disabled}
                      className={`px-3 py-1.5 rounded-full border text-sm transition ${
                        disabled
                          ? "text-gray-400 border-gray-200 cursor-not-allowed"
                          : "text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
