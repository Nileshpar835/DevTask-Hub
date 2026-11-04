import { api } from "./client";

export interface RoleDto {
    id: number;
    name: string;
    description: string | null;
}

export interface UserSummary {
    id: number;
    email: string;
    fullname: string;
    role: string;
    roleId?: number | null;
    isActive: boolean;
    avatarUrl?: string | null;
    gitHubUsername?: string | null;
}

export async function fetchUsers(): Promise<UserSummary[]> {
    const { data } = await api.get<UserSummary[]>("/users");
    return data;
}

export async function fetchRoles(): Promise<RoleDto[]> {
    const { data } = await api.get<RoleDto[]>("/users/roles");
    return data;
}

export async function toggleUserStatus(id: number): Promise<UserSummary> {
    const { data } = await api.patch<UserSummary>(`/users/${id}/toggle-status`);
    return data;
}

export async function changeUserRole(userId: number, roleId: number): Promise<UserSummary> {
    const { data } = await api.patch<UserSummary>(`/users/${userId}/role`, { roleId });
    return data;
}

export async function deleteUser(id: number): Promise<void> {
    await api.delete(`/users/${id}`);
}
