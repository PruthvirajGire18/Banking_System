import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const navigate = useNavigate();
  const emailRef = useRef(null);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const validate = () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return "Enter a valid email address";
    if (!password || password.length < 4)
      return "Password must be at least 4 characters";
    return "";
  };

  const login = async (e) => {
    e?.preventDefault();
    setError("");
    const v = validate();
    if (v) return setError(v);

    try {
      setLoading(true);
      const res = await API.post("/auth/login", { email, password });
      if (!res?.data?.token || !res?.data?.user)
        throw new Error("Unexpected server response");

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      if (res.data.user.role === "customer") navigate("/customer");
      else navigate("/banker");
    } catch (err) {
      setError(
        err?.response?.data?.message || err?.message || "Login failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-indigo-100 p-6">
      <div className="w-full max-w-md bg-white/90 backdrop-blur-md border border-slate-100 shadow-2xl rounded-2xl p-8 transition-all">
        {/* Branding */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
            B
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-slate-800 tracking-tight">
              Banking Portal
            </h2>
            <p className="text-sm text-slate-500">
              Secure access to your account
            </p>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={login} className="space-y-5" aria-label="Login form">
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Email address
            </label>
            <input
              id="email"
              ref={emailRef}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-400 focus:outline-none transition"
              aria-invalid={!!error && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)}
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-400 focus:outline-none transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 hover:text-indigo-600 transition"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Minimum 4 characters required
            </p>
          </div>

          {/* Options */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
              />
              Remember me
            </label>
            <button
              type="button"
              onClick={() => navigate("/forgot-password")}
              className="text-sm text-indigo-600 hover:underline"
            >
              Forgot password?
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-sm bg-red-50 text-red-700 px-3 py-2 rounded-lg border border-red-100">
              ⚠️ {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-medium shadow-md hover:shadow-lg hover:opacity-95 transition disabled:opacity-60"
          >
            {loading && (
              <svg
                className="animate-spin h-4 w-4 text-white"
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
            )}
            <span>{loading ? "Signing in..." : "Login"}</span>
          </button>

          {/* Signup Link */}
          <p className="text-center text-sm text-slate-500">
            New user?{" "}
            <button
              type="button"
              onClick={() => navigate("/signup")}
              className="text-indigo-600 font-medium hover:underline"
            >
              Create an account
            </button>
          </p>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-slate-400">
          By logging in, you agree to our{" "}
          <a
            href="#"
            className="underline text-indigo-500 hover:text-indigo-600"
          >
            Terms
          </a>{" "}
          and{" "}
          <a
            href="#"
            className="underline text-indigo-500 hover:text-indigo-600"
          >
            Privacy Policy
          </a>
          .
        </div>
      </div>
    </div>
  );
}
