import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const nav = useNavigate();
  const refEmail = useRef(null);

  useEffect(() => { refEmail.current?.focus(); }, []);

  const validate = () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid email";
    if (!pass || pass.length < 4) return "Password must be at least 4 characters";
    return "";
  };

  const doLogin = async (e) => {
    e?.preventDefault();
    setErr("");
    const v = validate();
    if (v) return setErr(v);

    try {
      setBusy(true);
      const res = await API.post("/auth/login", { email, password: pass });
      if (!res?.data?.token || !res?.data?.user) throw new Error("Unexpected server response");

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      if (res.data.user.role === "customer") nav("/customer");
      else nav("/banker");
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-indigo-100 p-6">
      <div className="w-full max-w-md bg-white/90 backdrop-blur-md border border-slate-100 shadow-2xl rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold text-xl">B</div>
          <div>
            <h2 className="text-2xl font-semibold text-slate-800 tracking-tight">Banking Portal</h2>
            <p className="text-sm text-slate-500">Secure access to your account</p>
          </div>
        </div>

        <form onSubmit={doLogin} className="space-y-5" aria-label="Sign in form">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Email address</label>
            <input id="email" ref={refEmail} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50" aria-invalid={!!err && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)} />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <div className="relative">
              <input id="password" type={show ? "text" : "password"} value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Enter your password" className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50" />
              <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">{show ? "Hide" : "Show"}</button>
            </div>
            <p className="text-xs text-slate-400 mt-1">Minimum 4 characters required</p>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="w-4 h-4 text-indigo-600 rounded" />
              Remember me
            </label>
          </div>

          {err && <div className="text-sm bg-red-50 text-red-700 px-3 py-2 rounded-lg border border-red-100">⚠️ {err}</div>}

          <button type="submit" disabled={busy} className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-medium shadow-md">
            {busy && <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>}
            <span>{busy ? "Signing in..." : "Login"}</span>
          </button>

          <p className="text-center text-sm text-slate-500">New user? <button type="button" onClick={() => nav("/signup")} className="text-indigo-600 font-medium">Create an account</button></p>
           <p className="text-center text-sm text-slate-500">Admin Login <button type="button" onClick={() => nav("/admin-login")} className="text-indigo-600 font-medium">Admin Login</button></p>
        </form>
      </div>
    </div>
  );
}
