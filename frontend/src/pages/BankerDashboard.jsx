import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api";

function SvgExport() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
    </svg>
  );
}

function SvgSearch() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1111 5a6 6 0 016 6z" />
    </svg>
  );
}

function Avatar({ label }) {
  const initials = (label || "?").split(" ").map(s => s[0]).slice(0,2).join("").toUpperCase();
  return (
    <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-indigo-50 to-indigo-100 flex items-center justify-center text-indigo-700 font-semibold shadow-sm">
      {initials || "?"}
    </div>
  );
}

function downloadCSV(name, rows) {
  if (!rows || rows.length === 0) return;
  const keys = Object.keys(rows[0]);
  const csv = [keys.join(",")].concat(rows.map(r => keys.map(k => `"${String(r[k] ?? "").replace(/"/g, '""')}"`).join(","))).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export default function BankerDashboard() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [busy, setBusy] = useState(true);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("name");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const [detail, setDetail] = useState(null);
  const [openFor, setOpenFor] = useState(null);

  const raw = localStorage.getItem("user");
  const me = raw ? JSON.parse(raw) : null;

  const signOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  async function fetchClients() {
    try {
      setBusy(true);
      setErr("");
      const res = await API.get("/bankers/customers");
      setClients(res.data || []);
    } catch (e) {
      console.error(e);
      setErr(e?.response?.data?.message || e?.message || "Failed to load");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !me || me.role !== "banker") {
      signOut();
      return;
    }
    fetchClients();
  }, []);

  const filtered = useMemo(() => {
    const low = q.trim().toLowerCase();
    let list = clients.slice();
    if (low) {
      list = list.filter(c =>
        (c.name || "").toLowerCase().includes(low) ||
        (c.email || "").toLowerCase().includes(low) ||
        (c._id || "").toLowerCase().includes(low)
      );
    }
    list.sort((a,b) => {
      if (sort === "name") return (a.name || "").localeCompare(b.name || "");
      return (a.email || "").localeCompare(b.email || "");
    });
    return list;
  }, [clients, q, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [totalPages]);

  const pageData = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-800">Admin Panel</h2>
                <p className="text-sm text-slate-500 mt-1">Manage client accounts</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-sm text-slate-600 hidden sm:block">Signed in as <strong className="text-slate-800">{me?.name || "-"}</strong></div>
                <button onClick={signOut} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-600 text-white text-sm hover:bg-rose-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7" /></svg>
                  Sign out
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-gradient-to-tr from-white to-indigo-50 rounded-lg border border-gray-100 shadow-sm">
                <div className="text-xs text-gray-500">Total clients</div>
                <div className="text-lg font-semibold text-slate-800">{clients.length}</div>
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
                <div className="text-xs text-gray-500">Page</div>
                <div className="text-lg font-semibold text-slate-800">{page}</div>
              </div>
            </div>
          </div>

          <aside className="w-full md:w-80 bg-white p-4 rounded-2xl shadow-sm flex flex-col gap-3">
            <div className="relative">
              <SvgSearch />
              <input
                value={q}
                onChange={(e) => { setQ(e.target.value); setPage(1); }}
                placeholder="Search clients, email or id"
                className="pl-10 pr-3 py-2 w-full rounded-lg border border-gray-200 bg-white focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            <div className="flex items-center gap-2">
              <select value={sort} onChange={(e) => setSort(e.target.value)} className="flex-1 px-3 py-2 rounded-lg border border-gray-200 bg-white">
                <option value="name">Sort: Name</option>
                <option value="email">Sort: Email</option>
              </select>

              <button onClick={() => downloadCSV("clients.csv", filtered.map(c => ({ id: c._id, name: c.name, email: c.email })))} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm">
                <SvgExport /> Export
              </button>
            </div>

            <div className="text-xs text-gray-500">Tip: open the menu next to a client for quick actions</div>
          </aside>
        </header>

        <main className="bg-white rounded-2xl shadow-md overflow-hidden">
          {busy ? (
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
          ) : err ? (
            <div className="p-6 text-red-600">{err}</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <div className="text-lg font-medium mb-2">No clients found</div>
              <div className="text-sm">Invite clients or check API connectivity.</div>
            </div>
          ) : (
            <>
              <div className="hidden md:block">
                <table className="w-full table-fixed border-collapse">
                  <thead className="bg-gray-50">
                    <tr className="text-sm text-gray-500">
                      <th className="text-left p-4 w-1/3">Client</th>
                      <th className="text-left p-4 w-1/3">Email</th>
                      <th className="text-right p-4 w-1/6">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageData.map(c => (
                      <tr key={c._id} className="border-t hover:bg-indigo-50 transition">
                        <td className="p-4 flex items-center gap-3">
                          <div className="flex-shrink-0"><Avatar label={c.name} /></div>
                          <div>
                            <div className="font-medium text-slate-800">{c.name}</div>
                            <div className="text-xs text-gray-500">Joined: {new Date(c.createdAt || Date.now()).toLocaleDateString()}</div>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-gray-600">{c.email}</td>
                        <td className="p-4 text-right relative">
                          <div className="inline-flex items-center gap-2 justify-end">
                            <Link to={`/transactions/${c._id}`} className="px-3 py-1.5 rounded-lg bg-indigo-100 text-indigo-700 text-sm">View</Link>

                            <div className="relative inline-block text-left">
                              <button onClick={() => setOpenFor(openFor === c._id ? null : c._id)} className="p-2 rounded-full hover:bg-gray-100">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                                  <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM18 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                              </button>

                              {openFor === c._id && (
                                <div className="origin-top-right absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                                  <div className="py-1">
                                    <button onClick={() => { setDetail(c); setOpenFor(null); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Quick view</button>
                                    <Link to={`/transactions/${c._id}`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Open transactions</Link>
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

              <div className="md:hidden p-4 grid gap-3">
                {pageData.map(c => (
                  <div key={c._id} className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar label={c.name} />
                        <div>
                          <div className="font-medium text-slate-800">{c.name}</div>
                          <div className="text-xs text-gray-500">{c.email}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link to={`/transactions/${c._id}`} className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-sm">View</Link>
                        <button onClick={() => setDetail(c)} className="p-2 rounded-md hover:bg-gray-100">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                            <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM18 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t flex flex-col md:flex-row items-center justify-between gap-3">
                <div className="text-sm text-gray-600">Page <strong className="text-slate-800">{page}</strong> of <strong className="text-slate-800">{totalPages}</strong></div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage(1)} disabled={page === 1} className={`px-3 py-1.5 rounded-md text-sm ${page === 1 ? 'text-gray-400 border-gray-200 cursor-not-allowed' : 'text-indigo-600 border border-indigo-200 hover:bg-indigo-50'}`}>First</button>
                  <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page === 1} className={`px-3 py-1.5 rounded-md text-sm ${page === 1 ? 'text-gray-400 border-gray-200 cursor-not-allowed' : 'text-indigo-600 border border-indigo-200 hover:bg-indigo-50'}`}>Prev</button>
                  <button onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page === totalPages} className={`px-3 py-1.5 rounded-md text-sm ${page === totalPages ? 'text-gray-400 border-gray-200 cursor-not-allowed' : 'text-indigo-600 border border-indigo-200 hover:bg-indigo-50'}`}>Next</button>
                  <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className={`px-3 py-1.5 rounded-md text-sm ${page === totalPages ? 'text-gray-400 border-gray-200 cursor-not-allowed' : 'text-indigo-600 border border-indigo-200 hover:bg-indigo-50'}`}>Last</button>
                </div>
              </div>
            </>
          )}
        </main>

        {detail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/40" onClick={() => setDetail(null)} />
            <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full p-6 z-20">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-indigo-50 to-indigo-100 flex items-center justify-center text-indigo-700 font-semibold">{(detail.name||"?").split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase()}</div>
                  <div>
                    <div className="font-semibold text-lg text-slate-800">{detail.name}</div>
                    <div className="text-sm text-gray-500">{detail.email}</div>
                  </div>
                </div>

                <button onClick={() => setDetail(null)} className="p-2 rounded-md hover:bg-gray-100">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3">
                <div className="text-sm text-gray-600">Client ID: <span className="text-xs text-slate-700">{detail._id}</span></div>
                
                <div className="mt-4 flex gap-2">
                  <Link to={`/transactions/${detail._id}`} className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm">Open Transactions</Link>
                  <button onClick={() => setDetail(null)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm">Close</button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
