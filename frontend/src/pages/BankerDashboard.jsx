import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api";

// BankerDashboard — cleaned (Account No & Balance removed)
// - Search, sort (name/email), pagination, export CSV, responsive layout

function downloadCSV(filename, rows) {
  const header = Object.keys(rows[0] || {}).join(",");
  const csv = [header]
    .concat(rows.map(r => Object.values(r).map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function BankerDashboard() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("name"); // only name/email now
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
      setError(err?.response?.data?.message || err?.message || "Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !user || user.role !== "banker") { logout(); return; }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // derived list (search + sort)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = customers.slice();
    if (q) {
      list = list.filter(c =>
        (c.name || "").toLowerCase().includes(q) ||
        (c.email || "").toLowerCase().includes(q) ||
        (c._id || "").toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      if (sortBy === "name") return (a.name || "").localeCompare(b.name || "");
      if (sortBy === "email") return (a.email || "").localeCompare(b.email || "");
      return 0;
    });
    return list;
  }, [customers, query, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [totalPages]);
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="container mx-auto p-6">
      {/* top */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-semibold">Banker Dashboard</h2>
          <p className="text-sm text-slate-500">Manage customers and view transactions</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-sm text-slate-600 mr-2">Signed in as <strong>{user?.name || "-"}</strong></div>

          <button onClick={logout} className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm">Logout</button>
        </div>
      </div>

      <div className="bg-white rounded-xl p-5 shadow">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              placeholder="Search by name, email or id"
              className="w-full md:w-72 px-4 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none"
            />

            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-200 bg-white">
              <option value="name">Sort: Name</option>
              <option value="email">Sort: Email</option>
            </select>

            <button
              onClick={() => downloadCSV("customers.csv", filtered.map(c => ({ id: c._id, name: c.name, email: c.email })))}
              className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:opacity-95"
            >
              Export CSV
            </button>
          </div>

          <div className="text-sm text-slate-500">Showing <strong>{filtered.length}</strong> customer(s)</div>
        </div>

        {/* content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: pageSize }).map((_, i) => (
              <div key={i} className="animate-pulse p-4 bg-slate-50 rounded-lg h-24" />
            ))}
          </div>
        ) : error ? (
          <div className="p-6 text-red-600">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <div className="mb-3 text-lg">No customers found</div>
            <div className="text-sm">Ask customers to sign up or check your API connectivity.</div>
          </div>
        ) : (
          <div>
            {/* table for md+ */}
            <div className="hidden md:block">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-sm text-slate-500 border-b">
                    <th className="py-3">Name</th>
                    <th className="py-3">Email</th>
                    <th className="py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map(c => (
                    <tr key={c._id} className="hover:bg-slate-50">
                      <td className="py-3 align-top">
                        <div className="font-medium">{c.name}</div>
                      </td>
                      <td className="py-3 align-top text-sm text-slate-600">{c.email}</td>
                      <td className="py-3 align-top text-right">
                        <Link to={`/transactions/${c._id}`} className="text-sm px-3 py-1 rounded-md bg-slate-100 hover:bg-slate-200">View</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* card list for mobile */}
            <div className="md:hidden grid grid-cols-1 gap-3">
              {pageItems.map(c => (
                <div key={c._id} className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium">{c.name}</div>
                      <div className="text-sm text-slate-600">{c.email}</div>
                    </div>
                    <div className="text-xs text-slate-500">{c._id}</div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <Link to={`/transactions/${c._id}`} className="text-sm flex-1 text-center px-3 py-2 rounded-md bg-white border">View Transactions</Link>
                    <button onClick={() => { navigator.clipboard?.writeText(c._id); alert('Account ID copied'); }} className="text-sm px-3 py-2 rounded-md bg-slate-100">Copy ID</button>
                  </div>
                </div>
              ))}
            </div>

            {/* pagination */}
            <div className="mt-5 flex items-center justify-between">
              <div className="text-sm text-slate-600">Page {page} of {totalPages}</div>
              <div className="flex gap-2">
                <button onClick={() => setPage(1)} disabled={page === 1} className="px-3 py-1 rounded-md bg-slate-100 disabled:opacity-50">First</button>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 rounded-md bg-slate-100 disabled:opacity-50">Prev</button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 rounded-md bg-slate-100 disabled:opacity-50">Next</button>
                <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="px-3 py-1 rounded-md bg-slate-100 disabled:opacity-50">Last</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
