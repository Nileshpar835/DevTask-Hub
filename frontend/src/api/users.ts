import { api } from "./client";

export interface UserSummary {
    id: number;
    email: string;
    fullname: string;
    role: string;
    isActive: boolean;
}

export async function fetchUsers(): Promise<UserSummary[]> {
    const { data } = await api.get<UserSummary[]>("/users");
    return data;
}

export async function toggleUserStatus(id: number): Promise<UserSummary> {
    const { data } = await api.patch<UserSummary>(`/users/${id}/toggle-status`);
    return data;
}
