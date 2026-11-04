import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { api, setAccessToken } from "../api/client";
import type { AuthResponse, AuthUser } from "../api/client";
import { AuthContext } from "./useAuth";

const USER_STORAGE_KEY = "devtaskhub_user";

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(() => {
        if (typeof window === "undefined") return null;
        const saved = localStorage.getItem(USER_STORAGE_KEY);
        if (!saved) return null;
        try {
            return JSON.parse(saved);
        } catch {
            return null;
        }
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                // If we have an existing token/session, verify it with /auth/me
                const me = await api.get<AuthUser>("/auth/me");
                if (cancelled) return;
                setUser(me.data);
                if (typeof window !== "undefined") {
                    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(me.data));
                }
            } catch {
                // If token expired, try /auth/refresh
                try {
                    const { data } = await api.post<AuthResponse>("/auth/refresh");
                    if (cancelled) return;
                    setAccessToken(data.accessToken);
                    const me = await api.get<AuthUser>("/auth/me");
                    if (!cancelled) {
                        setUser(me.data);
                        if (typeof window !== "undefined") {
                            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(me.data));
                        }
                    }
                } catch {
                    if (!cancelled) {
                        setAccessToken(null);
                        setUser(null);
                        if (typeof window !== "undefined") {
                            localStorage.removeItem(USER_STORAGE_KEY);
                        }
                    }
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        const { data } = await api.post<AuthResponse>("/auth/login", { email, password });
        setAccessToken(data.accessToken);
        setUser(data.user);
        if (typeof window !== "undefined") {
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
        }
    }, []);

    const register = useCallback(async (fullName: string, email: string, password: string) => {
        const { data } = await api.post<AuthResponse>("/auth/register", { fullName, email, password });
        setAccessToken(data.accessToken);
        setUser(data.user);
        if (typeof window !== "undefined") {
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            await api.post("/auth/logout");
        } finally {
            setAccessToken(null);
            setUser(null);
            if (typeof window !== "undefined") {
                localStorage.removeItem(USER_STORAGE_KEY);
            }
        }
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
