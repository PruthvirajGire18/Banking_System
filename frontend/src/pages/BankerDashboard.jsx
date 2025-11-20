import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api";

/*
  BankerDashboard — Industry-ready UI polish
  - Cleaner, modern visual language (compact, elevated cards)
  - Dashboard stats area (total customers, active on page)
  - Polished search + filter + export controls
  - Actions moved to a compact 3-dot menu (no copy/id exposed)
  - Customer detail modal for quick view
  - Accessible buttons and keyboard-friendly focus
  - Tailwind-only; drop-in single-file component
*/

function IconDownload() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1111 5a6 6 0 016 6z" />
    </svg>
  );
}

function Avatar({ name, size = 10 }) {
  const initials = (name || "?")
    .split(" ")
    .filter(Boolean)
    .map((s) => s[0]?.toUpperCase())
    .slice(0, 2)
    .join("");

  return (
    <div
      className={`h-${size} w-${size} rounded-full bg-gradient-to-tr from-indigo-50 to-indigo-100 flex items-center justify-center text-indigo-700 font-semibold shadow-sm`}
    >
      {initials || "?"}
    </div>
  );
}

function downloadCSV(filename, rows) {
  if (!rows || rows.length === 0) return;
  const header = Object.keys(rows[0]).join(",");
  const csv = [header].concat(rows.map((r) => Object.values(r).map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
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

  // UI state
  const [activeCustomer, setActiveCustomer] = useState(null); // for modal
  const [menuOpenFor, setMenuOpenFor] = useState(null);

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
    if (!token || !user || user.role !== "banker") {
      logout();
      return;
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      if (sortBy === "name") return (a.name || "").localeCompare(b.name || "");
      if (sortBy === "email") return (a.email || "").localeCompare(b.email || "");
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Top summary */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-800">Banker Dashboard</h2>
                <p className="text-sm text-slate-500 mt-1">A clean, production-ready view to manage customers</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-sm text-slate-600 hidden sm:block">Signed in as <strong className="text-slate-800">{user?.name || "-"}</strong></div>
                <button onClick={logout} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-600 text-white text-sm hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7" /></svg>
                  Logout
                </button>
              </div>
            </div>

            {/* small KPIs */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-gradient-to-tr from-white to-indigo-50 rounded-lg border border-gray-100 shadow-sm">
                <div className="text-xs text-gray-500">Total customers</div>
                <div className="text-lg font-semibold text-slate-800">{customers.length}</div>
              </div>

              <div className="p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
                <div className="text-xs text-gray-500">Showing</div>
                <div className="text-lg font-semibold text-slate-800">{filtered.length}</div>
              </div>

              <div className="p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
                <div className="text-xs text-gray-500">Page size</div>
                <div className="text-lg font-semibold text-slate-800">{pageSize}</div>
              </div>

              <div className="p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
                <div className="text-xs text-gray-500">Current page</div>
                <div className="text-lg font-semibold text-slate-800">{page}</div>
              </div>
            </div>
          </div>

          {/* Controls card */}
          <div className="w-full md:w-80 bg-white p-4 rounded-2xl shadow-sm flex flex-col gap-3">
            <div className="relative">
              <IconSearch />
              <input
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                placeholder="Search customers, email or ID"
                className="pl-10 pr-3 py-2 w-full rounded-lg border border-gray-200 bg-white focus:ring-2 focus:ring-indigo-200 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="flex-1 px-3 py-2 rounded-lg border border-gray-200 bg-white">
                <option value="name">Sort: Name</option>
                <option value="email">Sort: Email</option>
              </select>

              <button
                onClick={() => downloadCSV("customers.csv", filtered.map(c => ({ id: c._id, name: c.name, email: c.email })))}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              >
                <IconDownload /> Export
              </button>
            </div>

            <div className="text-xs text-gray-500">Tip: click the 3‑dot menu beside a customer to see actions</div>
          </div>
        </header>

        {/* Main list */}
        <main className="bg-white rounded-2xl shadow-md overflow-hidden">
          {loading ? (
            <div className="p-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse flex items-center gap-4 py-4 border-b last:border-b-0">
                  <div className="h-10 w-10 rounded-full bg-gray-200" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                  <div className="h-3 bg-gray-200 rounded w-24" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-6 text-red-600">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <div className="text-lg font-medium mb-2">No customers found</div>
              <div className="text-sm">Invite customers to sign up or check API connectivity.</div>
            </div>
          ) : (
            <div>
              {/* Desktop table */}
              <div className="hidden md:block">
                <table className="w-full table-fixed border-collapse">
                  <thead className="bg-gray-50">
                    <tr className="text-sm text-gray-500">
                      <th className="text-left p-4 w-1/3">Customer</th>
                      <th className="text-left p-4 w-1/3">Email</th>
                      <th className="text-right p-4 w-1/6">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.map((c) => (
                      <tr key={c._id} className="border-t hover:bg-indigo-50 transition">
                        <td className="p-4 flex items-center gap-3">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-indigo-50 to-indigo-100 flex items-center justify-center text-indigo-700 font-semibold shadow">{(c.name||"?").split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase()}</div>
                          </div>
                          <div>
                            <div className="font-medium text-slate-800">{c.name}</div>
                            <div className="text-xs text-gray-500">Joined: {new Date(c.createdAt || Date.now()).toLocaleDateString()}</div>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-gray-600">{c.email}</td>

                        <td className="p-4 text-right relative">
                          <div className="inline-flex items-center gap-2 justify-end">
                            <Link to={`/transactions/${c._id}`} className="px-3 py-1.5 rounded-lg bg-indigo-100 text-indigo-700 text-sm hover:bg-indigo-200">View</Link>

                            {/* 3-dot menu */}
                            <div className="relative inline-block text-left">
                              <button
                                onClick={() => setMenuOpenFor(menuOpenFor === c._id ? null : c._id)}
                                className="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                aria-expanded={menuOpenFor === c._id}
                                aria-haspopup
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                                  <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM18 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                              </button>

                              {menuOpenFor === c._id && (
                                <div className="origin-top-right absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                                  <div className="py-1">
                                    <button onClick={() => { setActiveCustomer(c); setMenuOpenFor(null); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Quick view</button>
                                    <Link to={`/transactions/${c._id}`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Open transactions</Link>
                                    {/* Future actions: disable/delete etc. keep hidden by default */}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden p-4 grid gap-3">
                {pageItems.map((c) => (
                  <div key={c._id} className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-indigo-50 to-indigo-100 flex items-center justify-center text-indigo-700 font-semibold">{(c.name||"?").split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase()}</div>
                        <div>
                          <div className="font-medium text-slate-800">{c.name}</div>
                          <div className="text-xs text-gray-500">{c.email}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link to={`/transactions/${c._id}`} className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-sm">View</Link>
                        <button onClick={() => setActiveCustomer(c)} className="p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-200">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                            <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM18 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="p-4 border-t flex flex-col md:flex-row items-center justify-between gap-3">
                <div className="text-sm text-gray-600">Page <strong className="text-slate-800">{page}</strong> of <strong className="text-slate-800">{totalPages}</strong></div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage(1)} disabled={page === 1} className={`px-3 py-1.5 rounded-md text-sm ${page === 1 ? 'text-gray-400 border-gray-200 cursor-not-allowed' : 'text-indigo-600 border border-indigo-200 hover:bg-indigo-50'}`}>First</button>
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className={`px-3 py-1.5 rounded-md text-sm ${page === 1 ? 'text-gray-400 border-gray-200 cursor-not-allowed' : 'text-indigo-600 border border-indigo-200 hover:bg-indigo-50'}`}>Prev</button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className={`px-3 py-1.5 rounded-md text-sm ${page === totalPages ? 'text-gray-400 border-gray-200 cursor-not-allowed' : 'text-indigo-600 border border-indigo-200 hover:bg-indigo-50'}`}>Next</button>
                  <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className={`px-3 py-1.5 rounded-md text-sm ${page === totalPages ? 'text-gray-400 border-gray-200 cursor-not-allowed' : 'text-indigo-600 border border-indigo-200 hover:bg-indigo-50'}`}>Last</button>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Customer quick-view modal */}
        {activeCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/40" onClick={() => setActiveCustomer(null)} />
            <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full p-6 z-20">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-indigo-50 to-indigo-100 flex items-center justify-center text-indigo-700 font-semibold">{(activeCustomer.name||"?").split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase()}</div>
                  <div>
                    <div className="font-semibold text-lg text-slate-800">{activeCustomer.name}</div>
                    <div className="text-sm text-gray-500">{activeCustomer.email}</div>
                  </div>
                </div>

                <button onClick={() => setActiveCustomer(null)} className="p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3">
                <div className="text-sm text-gray-600">Customer ID: <span className="text-xs text-slate-700">{activeCustomer._id}</span></div>
                <div className="text-sm text-gray-600">Joined on: <span className="text-sm text-slate-700">{new Date(activeCustomer.createdAt || Date.now()).toLocaleString()}</span></div>
                {/* Add any other quick fields you keep in the API */}
                {activeCustomer.phone && <div className="text-sm text-gray-600">Phone: <span className="text-sm text-slate-700">{activeCustomer.phone}</span></div>}

                <div className="mt-4 flex gap-2">
                  <Link to={`/transactions/${activeCustomer._id}`} className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm">Open Transactions</Link>
                  <button onClick={() => setActiveCustomer(null)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm">Close</button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
