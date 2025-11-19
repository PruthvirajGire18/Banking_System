import { useEffect, useRef, useState } from "react";
import API from "../api";

// TransactionPopup — Elegant & Professional UI
// - Smooth animation
// - Accessible modal (aria, ESC to close)
// - Loading / error / success states
// - Gradient button, clean inputs, and soft background blur

export default function TransactionPopup({
  mode = "deposit",
  userId,
  onClose = () => {},
  reload = () => {},
  balance = null,
}) {
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
    if (mode === "withdraw" && balance != null && n > balance)
      return "Amount exceeds available balance";
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
      const endpoint =
        mode === "deposit" ? "/transactions/deposit" : "/transactions/withdraw";
      await API.post(endpoint, { userId, amount: numeric() });
      await reload();
      setSuccess(
        mode === "deposit"
          ? "Deposited successfully!"
          : "Withdrawn successfully!"
      );
      setTimeout(() => onClose(), 800);
    } catch (err) {
      setError(
        err?.response?.data?.message || err?.message || "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  const setPreset = (v) => setAmount(String(v));
  const addQuick = (v) => setAmount((prev) => String((Number(prev) || 0) + v));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 backdrop-blur-sm">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 transition-opacity animate-fadeIn"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={mode === "deposit" ? "Deposit money" : "Withdraw money"}
        className="relative w-full max-w-md transform transition-all scale-100 animate-slideUp bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-100 p-6"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-semibold text-slate-800">
              {mode === "deposit" ? "💰 Deposit Funds" : "💸 Withdraw Funds"}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Enter the amount you want to {mode}.
            </p>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            className="ml-3 rounded-md p-2 hover:bg-slate-100 transition"
          >
            <svg
              className="h-5 w-5 text-slate-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Input */}
          <div>
            <label
              htmlFor="amount"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Amount
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-slate-400 text-lg">$</span>
              <input
                id="amount"
                ref={inputRef}
                inputMode="decimal"
                type="text"
                value={amount}
                onChange={(e) =>
                  setAmount(e.target.value.replace(/[^0-9.]/g, ""))
                }
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition"
              />
            </div>
          </div>

          {/* Quick buttons */}
          <div className="flex flex-wrap gap-2 justify-between">
            {[10, 20, 50, 100, 500].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setPreset(v)}
                className="flex-1 min-w-[70px] px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white hover:bg-indigo-50 hover:border-indigo-200 text-slate-700 font-medium transition"
              >
                +{v}
              </button>
            ))}
          </div>

          {/* Add quick increments */}
          <div className="flex gap-3 justify-center mt-2">
            {[10, 50].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => addQuick(v)}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-slate-100 hover:bg-slate-200 transition"
              >
                Add +{v}
              </button>
            ))}
          </div>

          {/* Balance info */}
          {balance != null && (
            <div className="flex items-center justify-between text-sm text-slate-600 mt-2">
              <span>Available Balance</span>
              <strong className="text-slate-800">
                ${Number(balance).toLocaleString()}
              </strong>
            </div>
          )}

          {/* Error / Success messages */}
          {error && (
            <div className="text-sm bg-red-50 text-red-700 px-3 py-2 rounded-lg border border-red-100">
              ⚠️ {error}
            </div>
          )}
          {success && (
            <div className="text-sm bg-green-50 text-green-700 px-3 py-2 rounded-lg border border-green-100">
              ✅ {success}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-medium shadow-md hover:shadow-lg hover:opacity-95 transition disabled:opacity-60"
            >
              {loading ? (
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
              ) : (
                <span>
                  {mode === "deposit" ? "Confirm Deposit" : "Confirm Withdrawal"}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition"
            >
              Cancel
            </button>
          </div>

          {/* Note for withdrawal */}
          {mode === "withdraw" && (
            <p className="mt-3 text-xs text-slate-400 italic text-center">
              Withdrawals may be subject to limits or processing time.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
