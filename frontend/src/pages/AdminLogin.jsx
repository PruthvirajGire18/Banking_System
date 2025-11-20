import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const navigate = useNavigate();
  const emailRef = useRef(null);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const validate = () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Valid email required";
    if (!password || password.length < 4) return "Password must be at least 4 characters";
    return "";
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError("");
    const v = validate();
    if (v) return setError(v);

    try {
      setBusy(true);
      const res = await API.post("/auth/login", { email, password });
      const token = res?.data?.token;
      const user = res?.data?.user;

      if (!token || !user) {
        throw new Error("Unexpected server response");
      }

      // Only allow banker/admin roles here
      if (!["banker", "admin"].includes(user.role)) {
        // optional: log out session on server if required
        setError("You are not authorized to access the admin area.");
        return;
      }

      // persist
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      // remember option: keep token longer (depends on backend/session handling)
      if (remember) {
        // example: extend expiry handling can be implemented server-side
      }

      // redirect to admin dashboard
      navigate("/banker");
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-indigo-100 p-6">
      <div className="w-full max-w-md bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-100 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-700 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
            A
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-800">Admin Login</h1>
            <p className="text-sm text-slate-500">Sign in to manage customers and transactions</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" aria-label="Admin login form">
          <div>
            <label htmlFor="admin-email" className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              id="admin-email"
              ref={emailRef}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-indigo-300"
              aria-invalid={!!error && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)}
            />
          </div>

          <div>
            <label htmlFor="admin-password" className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <div className="relative">
              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-indigo-300"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 hover:text-indigo-600"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="w-4 h-4 text-indigo-600 rounded" />
              Remember this device
            </label>

            <button
              type="button"
              onClick={() => alert("If you forgot the admin password, follow the reset procedure configured on your backend.")}
              className="text-sm text-indigo-600 hover:underline"
            >
              Forgot?
            </button>
          </div>

          {error && <div className="text-sm bg-red-50 text-red-700 px-3 py-2 rounded-lg border border-red-100">⚠️ {error}</div>}

          <button
            type="submit"
            disabled={busy}
            className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-medium shadow-md disabled:opacity-60"
          >
            {busy && (
              <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            )}
            <span>{busy ? "Signing in..." : "Sign in as Admin"}</span>
          </button>

          <p className="text-center text-sm text-slate-500">
            Not an admin? <button type="button" onClick={() => navigate("/")} className="text-indigo-600 font-medium hover:underline">Go to user login</button>
          </p>
        </form>
      </div>
    </div>
  );
}
