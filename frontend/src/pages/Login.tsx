import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { isAxiosError } from "axios";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/";

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const next: { email?: string; password?: string } = {};

    if (!email) next.email = "Email is required.";

    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "Enter a valid email address.";

    if (!password) next.password = "Password is required.";

    setErrors(next);

    setServerError(null);

    if (next.email) {
      emailRef.current?.focus();
      return;
    }

    if (next.password) {
      passwordRef.current?.focus();
      return;
    }

    setPending(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      if (isAxiosError(err)) {
        setServerError(err.response?.data?.error ?? "Sign-in failed. Is the API running on port 5109?");
      } else {
        setServerError("Unexpected error. Please try again.");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="form-card">
      <h2>Sign in</h2>
      {serverError && <p className="form-error" role="alert">{serverError}</p>}
      <form onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email" ref={emailRef} type="email" autoComplete="email"
            value={email} onChange={(e) => setEmail(e.target.value)}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? "email-error" : undefined}
          />
          {errors.email && <p className="field-error" id="email-error">{errors.email}</p>}
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password" ref={passwordRef} type="password" autoComplete="current-password"
            value={password} onChange={(e) => setPassword(e.target.value)}
            aria-invalid={errors.password ? true : undefined}
            aria-describedby={errors.password ? "password-error" : undefined}
          />
          {errors.password && <p className="field-error" id="password-error">{errors.password}</p>}
        </div>
        <button className="btn btn-primary" type="submit" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="form-alt">No account? <Link to="/register">Create one</Link></p>
    </div>
  );
}