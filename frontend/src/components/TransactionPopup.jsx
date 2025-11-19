import { useEffect, useRef, useState } from "react";
import API from "../api";

// TransactionPopup — Improved UI (Tailwind, no external icon/animation libs)
// - Accessible modal (aria, ESC to close)
// - Loading / error / success states
// - Quick preset buttons, formatted preview
// - Minimal dependencies so it works in a Vite + React app

export default function TransactionPopup({ mode = "deposit", userId, onClose = () => {}, reload = () => {}, balance = null }) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Enter") handleSubmit(e);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const numeric = () => {
    const n = Number(amount);
    return Number.isFinite(n) ? n : 0;
  };

  const validate = () => {
    setError("");
    const n = numeric();
    if (!n || n <= 0) return "Enter an amount greater than 0";
    if (mode === "withdraw" && balance != null && n > balance) return "Amount exceeds available balance";
    return "";
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setError("");
    setSuccess("");
    const v = validate();
    if (v) return setError(v);

    try {
      setLoading(true);
      const endpoint = mode === "deposit" ? "/transactions/deposit" : "/transactions/withdraw";
      await API.post(endpoint, { userId, amount: numeric() });
      await reload();
      setSuccess(mode === "deposit" ? "Deposited successfully" : "Withdrawn successfully");
      setTimeout(() => onClose(), 700);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const setPreset = (v) => setAmount(String(v));
  const addQuick = (v) => setAmount((prev) => String((Number(prev) || 0) + v));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={mode === "deposit" ? "Deposit money" : "Withdraw money"}
        className="relative w-full max-w-md bg-white rounded-2xl shadow-xl ring-1 ring-slate-100 p-6"
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">
              {mode === "deposit" ? "Deposit Money" : "Withdraw Money"}
            </h3>
            <p className="mt-1 text-sm text-slate-500">Enter amount to {mode}.</p>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            className="ml-3 rounded-md p-2 hover:bg-slate-100"
          >
            <svg className="h-5 w-5 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4">
          <label htmlFor="amount" className="block text-sm font-medium text-slate-700 mb-2">
            Amount
          </label>

          <div className="flex gap-3 items-center">
            <input
              id="amount"
              ref={inputRef}
              inputMode="decimal"
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              placeholder="0"
              className="flex-1 px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-lg font-medium"
            />

            <div className="flex flex-col gap-2">
              <button type="button" onClick={() => addQuick(10)} className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm">
                +10
              </button>
              <button type="button" onClick={() => addQuick(50)} className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm">
                +50
              </button>
            </div>
          </div>

          <div className="mt-3 flex gap-2 flex-wrap">
            {[20, 50, 100, 500].map((v) => (
              <button key={v} type="button" onClick={() => setPreset(v)} className="text-sm px-3 py-1 rounded-md bg-slate-100 hover:bg-slate-200">
                {v}
              </button>
            ))}
          </div>

          {balance != null && (
            <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
              <span>Available</span>
              <strong>{Number(balance).toLocaleString()}</strong>
            </div>
          )}

          {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
          {success && <div className="mt-3 text-sm text-green-600">{success}</div>}

          <div className="mt-5 flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center gap-2 py-2 rounded-lg bg-indigo-600 text-white font-medium disabled:opacity-60"
            >
              {loading ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              ) : (
                <>
                  <span>{mode === "deposit" ? "Deposit" : "Withdraw"}</span>
                </>
              )}
            </button>

            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg bg-slate-100 hover:bg-slate-200">
              Close
            </button>
          </div>

          {mode === "withdraw" && (
            <p className="mt-3 text-xs text-slate-400">Note: withdrawals may be subject to limits or processing time.</p>
          )}
        </form>
      </div>
    </div>
  );
}
