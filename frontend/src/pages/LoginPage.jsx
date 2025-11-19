import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

// Improved LoginPage
// - Modern card layout with subtle branding
// - Input validation + inline error messages
// - Loading state, show/hide password, remember me
// - Accessible labels, keyboard submit

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const navigate = useNavigate();
  const emailRef = useRef(null);

  useEffect(() => { emailRef.current?.focus(); }, []);

  const validate = () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid email";
    if (!password || password.length < 4) return "Password must be at least 4 characters";
    return "";
  };

  const login = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setError("");
    const v = validate();
    if (v) { setError(v); return; }

    try {
      setLoading(true);
      const res = await API.post("/auth/login", { email, password });
      console.log("login response:", res?.data);

      if (!res?.data?.token || !res?.data?.user) {
        setError("Unexpected server response. Check console.");
        return;
      }

      localStorage.setItem("token", res.data.token);
      // Always store user in localStorage so other pages relying on it work consistently
      localStorage.setItem("user", JSON.stringify(res.data.user));

      if (res.data.user.role === "customer") navigate("/customer");
      else navigate("/banker");
    } catch (err) {
      console.error("login error:", err);
      const msg = err?.response?.data?.message || err?.message || "Login failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-white p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">B</div>
          <div>
            <h2 className="text-xl font-semibold text-slate-800">Banking System</h2>
            <p className="text-sm text-slate-500">Securely manage your account</p>
          </div>
        </div>

        <form onSubmit={login} className="space-y-4" aria-label="Login form">
          <div>
            <label htmlFor="email" className="text-sm font-medium text-slate-700">Email</label>
            <input
              id="email"
              ref={emailRef}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1 px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="you@example.com"
              aria-invalid={!!error && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)}
            />
          </div>

          <div>
            <label htmlFor="password" className="text-sm font-medium text-slate-700">Password</label>
            <div className="relative mt-1">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                placeholder="Enter your password"
                aria-describedby="pwd-help"
              />

              <button
                type="button"
                onClick={() => setShowPassword(s => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-slate-500 px-2 py-1 rounded-md hover:bg-slate-100"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <div id="pwd-help" className="text-xs text-slate-400 mt-1">Password must be at least 4 characters</div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="w-4 h-4" />
              Remember me
            </label>

            <button type="button" onClick={() => navigate('/forgot-password')} className="text-sm text-indigo-600">Forgot?</button>
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-lg bg-indigo-600 text-white font-medium disabled:opacity-60"
          >
            {loading ? (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
            ) : null}
            <span>{loading ? 'Signing in...' : 'Login'}</span>
          </button>

          <div className="text-center text-sm text-slate-500">
            New user? <button type="button" onClick={() => navigate('/signup')} className="text-indigo-600 underline">Signup here</button>
          </div>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400">By logging in you agree to the terms and privacy policy.</div>
      </div>
    </div>
  );
}
