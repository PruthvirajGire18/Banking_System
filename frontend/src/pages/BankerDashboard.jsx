import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api";

// Utility: CSV download
function downloadCSV(filename, rows) {
  const header = Object.keys(rows[0] || {}).join(",");
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

export default function BankerDashboard() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const rawUser = localStorage.getItem("user");
  const user = rawUser ? JSON.parse(rawUser) : null;

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await API.get("/bankers/customers");
      setCustomers(res.data || []);
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load customers"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !user || user.role !== "banker") {
      logout();
      return;
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // derived list (search + sort)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = customers.slice();
    if (q) {
      list = list.filter(
        (c) =>
          (c.name || "").toLowerCase().includes(q) ||
          (c.email || "").toLowerCase().includes(q) ||
          (c._id || "").toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      if (sortBy === "name")
        return (a.name || "").localeCompare(b.name || "");
      if (sortBy === "email")
        return (a.email || "").localeCompare(b.email || "");
      return 0;
    });
    return list;
  }, [customers, query, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages]);

  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-xl shadow-sm">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Banker Dashboard</h2>
            <p className="text-sm text-slate-500">
              Manage customers and transactions
            </p>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">
              Signed in as <strong>{user?.name || "-"}</strong>
            </span>
            <button
              onClick={logout}
              className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm hover:bg-red-600 transition"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Search and filters */}
        <div className="bg-white p-5 rounded-xl shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search by name, email, or ID"
                  className="w-72 pl-10 pr-4 py-2 rounded-lg border border-gray-200 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-200 bg-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value="name">Sort by Name</option>
                <option value="email">Sort by Email</option>
              </select>

              <button
                onClick={() =>
                  downloadCSV(
                    "customers.csv",
                    filtered.map((c) => ({
                      id: c._id,
                      name: c.name,
                      email: c.email,
                    }))
                  )
                }
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700 transition"
              >
                ⬇️ Export CSV
              </button>
            </div>

            <div className="text-sm text-gray-500">
              Showing <strong>{filtered.length}</strong> customers
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div className="p-6 text-red-600">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <div className="mb-3 text-lg">No customers found</div>
              <div className="text-sm">
                Ask customers to sign up or check your API connectivity.
              </div>
            </div>
          ) : (
            <div>
              {/* Table (desktop) */}
              <div className="hidden md:block">
                <table className="w-full text-left border-separate border-spacing-y-2">
                  <thead>
                    <tr className="text-sm text-gray-500">
                      <th className="pb-2">Name</th>
                      <th className="pb-2">Email</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.map((c) => (
                      <tr
                        key={c._id}
                        className="bg-white hover:bg-indigo-50 transition rounded-lg shadow-sm"
                      >
                        <td className="py-3 px-4 font-medium text-gray-800">
                          {c.name}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {c.email}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            to={`/transactions/${c._id}`}
                            className="text-sm px-3 py-1.5 rounded-md bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Cards (mobile) */}
              <div className="md:hidden grid grid-cols-1 gap-3">
                {pageItems.map((c) => (
                  <div
                    key={c._id}
                    className="p-4 bg-white rounded-lg shadow-sm border border-gray-100"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold text-gray-800">
                          {c.name}
                        </div>
                        <div className="text-sm text-gray-600">{c.email}</div>
                      </div>
                      <div className="text-xs text-gray-400">{c._id}</div>
                    </div>

                    <div className="mt-3 flex gap-2">
                      <Link
                        to={`/transactions/${c._id}`}
                        className="text-sm flex-1 text-center px-3 py-2 rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                      >
                        View Transactions
                      </Link>
                      <button
                        onClick={() => {
                          navigator.clipboard?.writeText(c._id);
                          alert("Account ID copied");
                        }}
                        className="text-sm px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200"
                      >
                        Copy ID
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="mt-6 flex flex-wrap items-center justify-between text-sm text-gray-600">
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
                        className={`px-3 py-1.5 rounded-full border text-sm ${
                          disabled
                            ? "text-gray-400 border-gray-200 cursor-not-allowed"
                            : "text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                        } transition`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
