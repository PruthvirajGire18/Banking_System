import { useEffect, useRef, useState } from "react";
import API from "../api";

export default function TransactionPopup({
  action = "deposit",
  accountId,
  onClose = () => {},
  refresh = () => {},
  available = null,
}) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const refInput = useRef(null);

  useEffect(() => {
    refInput.current?.focus();
    const handler = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Enter") submit(e);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const toNumber = () => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  };

  const check = () => {
    setErr("");
    const n = toNumber();
    if (!n || n <= 0) return "Enter an amount greater than 0";
    if (action === "withdraw" && available != null && n > available)
      return "Amount exceeds available balance";
    return "";
  };

  async function submit(e) {
    if (e?.preventDefault) e.preventDefault();
    setErr("");
    setOk("");
    const v = check();
    if (v) return setErr(v);

    try {
      setBusy(true);
      const path =
        action === "deposit" ? "/transactions/deposit" : "/transactions/withdraw";
      await API.post(path, { userId: accountId, amount: toNumber() });
      await refresh();
      setOk(action === "deposit" ? "Deposit successful" : "Withdrawal successful");
      setTimeout(() => onClose(), 700);
    } catch (error) {
      setErr(
        error?.response?.data?.message || error?.message || "Something went wrong"
      );
    } finally {
      setBusy(false);
    }
  }

  const pick = (n) => setValue(String(n));
  const inc = (n) => setValue((p) => String((Number(p) || 0) + n));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 backdrop-blur-sm">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={action === "deposit" ? "Add funds" : "Remove funds"}
        className="relative w-full max-w-md transform transition-all animate-slideUp bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-100 p-6"
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-semibold text-slate-800">
              {action === "deposit" ? "Add Funds" : "Withdraw Funds"}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Type the amount to {action}.
            </p>
          </div>

          <button onClick={onClose} aria-label="Close" className="ml-3 rounded-md p-2 hover:bg-slate-100">
            <svg className="h-5 w-5 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={submit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-slate-700 mb-1">
              Amount
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-slate-400 text-lg">₹</span>
              <input
                id="amount"
                ref={refInput}
                inputMode="decimal"
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 justify-between">
            {[10, 20, 50, 100, 500].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => pick(n)}
                className="flex-1 min-w-[70px] px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white hover:bg-indigo-50 hover:border-indigo-200 text-slate-700 font-medium transition"
              >
                +{n}
              </button>
            ))}
          </div>

          <div className="flex gap-3 justify-center mt-2">
            {[10, 50].map((n) => (
              <button key={n} type="button" onClick={() => inc(n)} className="px-4 py-2 text-sm font-medium rounded-lg bg-slate-100 hover:bg-slate-200 transition">
                Add +{n}
              </button>
            ))}
          </div>

          {available != null && (
            <div className="flex items-center justify-between text-sm text-slate-600 mt-2">
              <span>Available</span>
              <strong className="text-slate-800">₹{Number(available).toLocaleString()}</strong>
            </div>
          )}

          {err && <div className="text-sm bg-red-50 text-red-700 px-3 py-2 rounded-lg border border-red-100">⚠️ {err}</div>}
          {ok && <div className="text-sm bg-green-50 text-green-700 px-3 py-2 rounded-lg border border-green-100">✅ {ok}</div>}

          <div className="flex gap-3 pt-3">
            <button
              type="submit"
              disabled={busy}
              className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-medium shadow-md hover:shadow-lg transition disabled:opacity-60"
            >
              {busy ? (
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" className="opacity-25" />
                  <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              ) : (
                <span>{action === "deposit" ? "Confirm Add" : "Confirm Withdraw"}</span>
              )}
            </button>

            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition">
              Cancel
            </button>
          </div>

          {action === "withdraw" && (
            <p className="mt-3 text-xs text-slate-400 italic text-center">Withdrawals may take some processing time.</p>
          )}
        </form>
      </div>
    </div>
  );
}
