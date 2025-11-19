import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

// SignupPage — Improved UI
// - Clean card layout with subtle branding
// - Validation, inline errors, loading state
// - Show/hide password, confirm password, accessible labels
// - Friendly success message and redirect to login

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();
  const nameRef = useRef(null);

  useEffect(() => { nameRef.current?.focus(); }, []);

  const validate = () => {
    if (!name.trim()) return "Enter your name";
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid email";
    if (!password || password.length < 4) return "Password must be at least 4 characters";
    if (password !== confirm) return "Passwords do not match";
    return "";
  };

  const handleSignup = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setError("");
    setSuccess("");
    const v = validate();
    if (v) { setError(v); return; }

    try {
      setLoading(true);
      const res = await API.post("/auth/register", { name: name.trim(), email: email.trim(), password });
      setSuccess("Registered successfully. Redirecting to login...");
      // small delay so user sees success message
      setTimeout(() => navigate("/"), 1200);
    } catch (err) {
      console.error("signup error:", err);
      setError(err?.response?.data?.message || err?.message || "Error during signup");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-white p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-lg bg-green-600 flex items-center justify-center text-white font-bold text-lg">B</div>
          <div>
            <h2 className="text-xl font-semibold text-slate-800">Create your account</h2>
            <p className="text-sm text-slate-500">Signing up is quick and easy</p>
          </div>
        </div>

        <form onSubmit={handleSignup} className="space-y-4" aria-label="Signup form">
          <div>
            <label htmlFor="name" className="text-sm font-medium text-slate-700">Name</label>
            <input
              id="name"
              ref={nameRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full mt-1 px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-300"
              placeholder="Your full name"
            />
          </div>

          <div>
            <label htmlFor="email" className="text-sm font-medium text-slate-700">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1 px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-300"
              placeholder="you@example.com"
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
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-300"
                placeholder="Choose a password"
                aria-describedby="pw-help"
              />
              <button
                type="button"
                onClick={() => setShowPassword(s => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-slate-500 px-2 py-1 rounded-md hover:bg-slate-100"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <div id="pw-help" className="text-xs text-slate-400 mt-1">At least 4 characters</div>
          </div>

          <div>
            <label htmlFor="confirm" className="text-sm font-medium text-slate-700">Confirm Password</label>
            <input
              id="confirm"
              type={showPassword ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full mt-1 px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-300"
              placeholder="Re-enter your password"
            />
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}
          {success && <div className="text-sm text-green-600">{success}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-lg bg-green-600 text-white font-medium disabled:opacity-60"
          >
            {loading ? (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
            ) : null}
            <span>{loading ? 'Signing up...' : 'Signup'}</span>
          </button>

          <div className="text-center text-sm text-slate-500">
            Already have an account? <button type="button" onClick={() => navigate('/')} className="text-green-600 underline">Login</button>
          </div>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400">By creating an account you agree to our terms of service.</div>
      </div>
    </div>
  );
}
