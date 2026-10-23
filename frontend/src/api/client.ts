import axios, { type AxiosRequestConfig } from "axios";

const API_BASE = "http://localhost:5109/api";

export interface AuthUser {
    id: number;
    email: string;
    fullName: string;
    role: "Admin" | "Developer";
}

export interface AuthResponse {
    accessToken: string;
    accessTokenExpiresAtUtc: string;
    user: AuthUser;
}
let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
    accessToken = token;
}

export const api = axios.create({
    baseURL: API_BASE,
    withCredentials: true,
});

api.interceptors.request.use((config) => {
    if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
    return config;
})

type RetriableConfig = AxiosRequestConfig & { _retry?: boolean };

let refreshing: Promise<string | null> | null = null;

function refreshAccessToken(): Promise<string | null> {
    refreshing ??= (async () => {
        try {
            const { data } = await api.post<AuthResponse>("/auth/refresh");
            setAccessToken(data.accessToken);
            return data.accessToken;
        } catch {
            setAccessToken(null);
            return null;
        } finally {
            refreshing = null
        }
    })();
    return refreshing;
}

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const original = error.config as RetriableConfig | undefined;
        const url: string = original?.url ?? "";
        const isAuthUrl=
        url.includes("/auth/login") ||
        url.includes("/auth/register") ||
        url.includes("/auth/refresh") ||
        url.includes("/auth/logout");

        if(error.response?.status == 401 && original && !original._retry && !isAuthUrl){
            original._retry=true;
            const token = await refreshAccessToken();
            if(token) return api(original);
        }
        return Promise.reject(error);
    }
);