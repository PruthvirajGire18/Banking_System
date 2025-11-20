import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const nav = useNavigate();
  const refName = useRef(null);

  useEffect(() => { refName.current?.focus(); }, []);

  const validate = () => {
    if (!fullName.trim()) return "Please enter your full name";
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid email address";
    if (!pw || pw.length < 4) return "Password must be at least 4 characters";
    if (pw !== confirm) return "Passwords do not match";
    return "";
  };

  const doRegister = async (e) => {
    e?.preventDefault();
    setErr(""); setOk("");
    const v = validate(); if (v) return setErr(v);

    try {
      setBusy(true);
      await API.post("/auth/register", { name: fullName.trim(), email: email.trim(), password: pw });
      setOk("🎉 Registered successfully! Redirecting to login...");
      setTimeout(() => nav("/"), 1200);
    } catch (e) {
      console.error("register error:", e);
      setErr(e?.response?.data?.message || e?.message || "Error during signup");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-100 p-6">
      <div className="w-full max-w-md bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-100 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-600 to-emerald-500 flex items-center justify-center text-white font-bold text-lg">B</div>
          <div>
            <h2 className="text-2xl font-semibold text-slate-800">Create your account</h2>
            <p className="text-sm text-slate-500">Banking made simple and secure</p>
          </div>
        </div>

        <form onSubmit={doRegister} className="space-y-5" aria-label="Register form">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <input id="name" ref={refName} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50" />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Email address</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50" />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <div className="relative">
              <input id="password" type={show ? "text" : "password"} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Create a strong password" className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50" />
              <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">{show ? "Hide" : "Show"}</button>
            </div>
            <p className="text-xs text-slate-400 mt-1">At least 4 characters required</p>
          </div>

          <div>
            <label htmlFor="confirm" className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
            <input id="confirm" type={show ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Re-enter your password" className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50" />
          </div>

          {err && <div className="text-sm bg-red-50 text-red-700 px-3 py-2 rounded-lg border border-red-100">⚠️ {err}</div>}
          {ok && <div className="text-sm bg-green-50 text-green-700 px-3 py-2 rounded-lg border border-green-100">✅ {ok}</div>}

          <button type="submit" disabled={busy} className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-lg bg-gradient-to-r from-green-600 to-emerald-500 text-white font-medium shadow-md">
            {busy && <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>}
            <span>{busy ? "Creating account..." : "Sign Up"}</span>
          </button>

          <p className="text-center text-sm text-slate-500">Already have an account? <button type="button" onClick={() => nav("/")} className="text-green-600 font-medium">Login here</button></p>
        </form>
      </div>
    </div>
  );
}
