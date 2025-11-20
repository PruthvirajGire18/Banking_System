import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import TransactionPopup from "../components/TransactionPopup";

function moneyFmt(n) {
  return `₹${Number(n || 0).toFixed(2)}`;
}

function downloadCSV(name, rows) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const csv = [keys.join(",")].concat(rows.map(r => keys.map(k => `"${String(r[k] ?? "").replace(/"/g, '""')}"`).join(","))).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const [user] = useState(() => JSON.parse(localStorage.getItem("user")));
  const [transactions, setTransactions] = useState([]);
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [visible, setVisible] = useState(8);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setErr("");
    try {
      const res = await API.get(`/transactions/${user.id}`);
      const list = (res.data || []).slice().sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
      setTransactions(list);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load transactions");
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
    load();
  }, [user, load]);

  const latestBalance = transactions[0]?.balance_after ?? 0;

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return transactions.filter(t => {
      if (filter !== "all" && t.type !== filter) return false;
      if (!s) return true;
      return (t.type || "").toLowerCase().includes(s) ||
        String(t.amount).includes(s) ||
        new Date(t.created_at).toLocaleString().toLowerCase().includes(s);
    });
  }, [transactions, filter, q]);

  const visibleTxns = filtered.slice(0, visible);
  const canMore = visible < filtered.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-xl shadow-sm">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Welcome, {user?.name || "User"} 👋</h2>
            <p className="text-sm text-slate-500">Your account overview</p>
          </div>

          <button onClick={logout} className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm">Logout</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white p-6 rounded-2xl shadow-lg flex items-center justify-between">
            <div>
              <div className="text-sm opacity-80">Current Balance</div>
              <div className="mt-1 text-3xl font-bold">{moneyFmt(latestBalance)}</div>
              <div className="mt-2 text-xs opacity-70">Updated: {transactions[0] ? new Date(transactions[0].created_at).toLocaleString() : "—"}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setModal("deposit")} className="px-4 py-2 rounded-lg bg-white text-indigo-700 font-medium">Deposit</button>
              <button onClick={() => setModal("withdraw")} className="px-4 py-2 rounded-lg bg-red-600 text-white font-medium">Withdraw</button>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow flex flex-col gap-3 justify-between">
            <div className="text-sm text-slate-500 flex items-center justify-between">
              <span>Quick Actions</span>
              <span className="text-xs text-slate-400">⋯</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setQ(""); setFilter("all"); setVisible(8); load(); }} className="flex-1 px-3 py-2 rounded-lg bg-slate-100">Refresh</button>
              <button onClick={() => downloadCSV("transactions.csv", filtered.map(t => ({ id: t._id, type: t.type, amount: t.amount, date: t.created_at, balance_after: t.balance_after })))} className="flex-1 px-3 py-2 rounded-lg bg-indigo-600 text-white">Export</button>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <select value={filter} onChange={(e) => { setFilter(e.target.value); setVisible(8); }} className="px-3 py-2 rounded-lg border border-slate-200">
                <option value="all">All</option>
                <option value="deposit">Deposits</option>
                <option value="withdraw">Withdrawals</option>
              </select>

              <input value={q} onChange={(e) => { setQ(e.target.value); setVisible(8); }} placeholder="Search by amount, date or type" className="px-4 py-2 rounded-lg border border-slate-200 bg-slate-50" />
            </div>

            <div className="text-sm text-slate-500">Showing <strong>{filtered.length}</strong> transaction(s)</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-3 text-lg">Transaction History</h3>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="animate-pulse flex items-center justify-between p-3 bg-slate-50 rounded-lg h-16" />
              ))}
            </div>
          ) : err ? (
            <div className="p-4 text-red-600">{err}</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <div className="mb-2 text-lg font-medium">No transactions yet</div>
              <div className="text-sm">Make a deposit to begin.</div>
            </div>
          ) : (
            <ul className="space-y-2">
              {visibleTxns.map(t => (
                <li key={t._id} className="flex justify-between items-center p-3 rounded-lg hover:bg-indigo-50">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.type === "deposit" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {t.type === "deposit" ? <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg> : <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" /></svg>}
                    </div>

                    <div>
                      <div className="font-medium capitalize">{t.type}</div>
                      <div className="text-sm text-slate-500">{new Date(t.created_at).toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-semibold text-slate-800">{moneyFmt(t.amount)}</div>
                    <div className="text-sm text-slate-500">Bal: {moneyFmt(t.balance_after)}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {!loading && filtered.length > 0 && (
            <div className="mt-5 flex items-center justify-center">
              {canMore ? <button onClick={() => setVisible(v => v + 8)} className="px-4 py-2 rounded-lg bg-slate-100">Load More</button> : <div className="text-sm text-slate-400">No more transactions</div>}
            </div>
          )}
        </div>

        {modal && (
          <TransactionPopup
            action={modal}
            accountId={user.id}
            onClose={() => { setModal(null); load(); }}
            refresh={load}
            available={latestBalance}
          />
        )}
      </div>
    </div>
  );
}
