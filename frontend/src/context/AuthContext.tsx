import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { api, setAccessToken } from "../api/client";
import type { AuthResponse, AuthUser } from "../api/client";
import { AuthContext } from "./useAuth";

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const { data } = await api.post<AuthResponse>("/auth/refresh");
                if (cancelled) return;
                setAccessToken(data.accessToken);
                const me = await api.get<AuthUser>("/auth/me");
                if (!cancelled) setUser(me.data);
            } catch {
                if (!cancelled) {
                    setAccessToken(null);
                    setUser(null);
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
    }, []);

    const register = useCallback(async (fullName: string, email: string, password: string) => {
        const { data } = await api.post<AuthResponse>("/auth/register", { fullName, email, password });
        setAccessToken(data.accessToken);
        setUser(data.user);
    }, []);

    const logout = useCallback(async () => {
        try {
            await api.post("/auth/logout");
        } finally {
            setAccessToken(null);
            setUser(null);
        }
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
