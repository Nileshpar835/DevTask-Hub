import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { isAxiosError } from "axios";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export default function Register() {
    const { user, register } = useAuth();
    const navigate = useNavigate();

    const fullNameRef = useRef<HTMLInputElement>(null);
    const emailRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState<{ fullName?: string; email?: string; password?: string }>({});
    const [serverError, setServerError] = useState<string | null>(null);
    const [pending, setPending] = useState(false);

    if (user) return <Navigate to="/" replace />;

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        const next: { fullName?: string; email?: string; password?: string } = {};
        if (!fullName) next.fullName = "Full name is required.";
        else if (fullName.length > 100) next.fullName = "Full name must be 100 characters or fewer.";
        if (!email) next.email = "Email is required.";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "Enter a valid email address.";
        if (!password) next.password = "Password is required.";
        else if (password.length < 8) next.password = "Password must be at least 8 characters.";
        setErrors(next);
        setServerError(null);
        if (next.fullName) { fullNameRef.current?.focus(); return; }
        if (next.email) { emailRef.current?.focus(); return; }
        if (next.password) { passwordRef.current?.focus(); return; }

        setPending(true);
        try {
            await register(fullName, email, password);
            navigate("/", { replace: true });
        } catch (err) {
            if (isAxiosError(err)) {
                const data = err.response?.data as { error?: string; errors?: Record<string, string[]> } | undefined;
                if (data?.errors) {
                    const pick = (name: string) => {
                        const key = Object.keys(data.errors!).find((k) => k.toLowerCase() === name.toLowerCase());
                        return key ? data.errors![key]?.[0] : undefined;
                    };
                    const next = { fullName: pick("FullName"), email: pick("Email"), password: pick("Password") };
                    setErrors(next);
                    if (next.fullName) fullNameRef.current?.focus();
                    else if (next.email) emailRef.current?.focus();
                    else if (next.password) passwordRef.current?.focus();
                } else {
                    setServerError(data?.error ?? "Registration failed. Is the API running on port 5109?");
                }
            } else {
                setServerError("Unexpected error. Please try again.");
            }
        } finally {
            setPending(false);
        }
    }

    return (
        <div className="form-card">
            <h2>Create account</h2>
            {serverError && <p className="form-error" role="alert">{serverError}</p>}
            <form onSubmit={handleSubmit} noValidate>
                <div className="field">
                    <label htmlFor="fullName">Full name</label>
                    <input
                        id="fullName" ref={fullNameRef} type="text" autoComplete="name" maxLength={100}
                        value={fullName} onChange={(e) => setFullName(e.target.value)}
                        aria-invalid={errors.fullName ? true : undefined}
                        aria-describedby={errors.fullName ? "fullname-error" : undefined}
                    />
                    {errors.fullName && <p className="field-error" id="fullname-error">{errors.fullName}</p>}
                </div>
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
                        id="password" ref={passwordRef} type="password" autoComplete="new-password"
                        value={password} onChange={(e) => setPassword(e.target.value)}
                        aria-invalid={errors.password ? true : undefined}
                        aria-describedby={errors.password ? "password-error" : undefined}
                    />
                    {errors.password && <p className="field-error" id="password-error">{errors.password}</p>}
                </div>
                <button className="btn btn-primary" type="submit" disabled={pending}>
                    {pending ? "Creating account…" : "Create account"}
                </button>
            </form>
            <p className="form-alt">Already have an account? <Link to="/login">Sign in</Link></p>
        </div>
    );
}