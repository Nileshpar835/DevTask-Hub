import { api } from "./client"

export interface PagedResult<T> {
    items: T[];
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
}

export type ProjectStatus = "Active" | "OnHold" | "Archived";

export interface ProjectSummary {
    id: number;
    key: string;
    name: string;
    description: string | null;
    gitHubRepoUrl?: string | null;
    status: ProjectStatus;
    ownerUserId: number;
    ownerName: string;
    memberCount: number;
    taskCount: number;
    createdAtUtc: string;
    updatedAtUtc: string;
}

export interface ProjectMember {
    id: number;
    userId: number;
    email: string;
    fullName: string;
    role: string;
    addedAtUtc: string;
    avatarUrl?: string | null;
    gitHubUsername?: string | null;
}

export interface ProjectDetail {
    id: number;
    key: string;
    name: string;
    description: string | null;
    gitHubRepoUrl?: string | null;
    status: ProjectStatus;
    ownerUserId: number;
    ownerName: string;
    createdAtUtc: string;
    updatedAtUtc: string;
    members: ProjectMember[];
}

export interface ProjectPullRequest {
    id: number;
    taskId: number;
    taskKey: string;
    taskTitle: string;
    repositoryOwner: string;
    repositoryName: string;
    pullRequestNumber: number;
    htmlUrl: string;
    title: string | null;
    state: "Open" | "Closed" | "Merged" | string;
    isDraft: boolean;
    reviewStatus: string | null;
    authorGitHubUsername: string | null;
    authorAvatarUrl: string | null;
    linkedByUserId: number | null;
    linkedByUserName: string | null;
    lastSyncedAtUtc: string | null;
    syncError: string | null;
    createdAtUtc: string;
}

export interface CreateProjectPayload {
    key: string;
    name: string;
    description?: string;
    gitHubRepoUrl?: string;
}

export interface UpdateProjectPayload {
    name: string;
    description?: string;
    status: ProjectStatus;
    gitHubRepoUrl?: string;
}

export interface ProjectQueryParams {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: ProjectStatus;
    mine?: boolean;
}

export async function fetchProjects(
    params: ProjectQueryParams = {},
    signal?: AbortSignal
): Promise<PagedResult<ProjectSummary>> {
    const { data } = await api.get<PagedResult<ProjectSummary>>("/projects", {
        params,
        signal
    });
    return data;
}

export async function fetchProjectById(id: number): Promise<ProjectDetail> {
    const { data } = await api.get<ProjectDetail>(`/projects/${id}`);
    return data;
}

export async function createProject(payload: CreateProjectPayload): Promise<ProjectSummary> {
    const { data } = await api.post<ProjectSummary>("/projects", payload);
    return data;
}

export async function updateProject(id: number, payload: UpdateProjectPayload): Promise<ProjectSummary> {
    const { data } = await api.put<ProjectSummary>(`/projects/${id}`, payload);
    return data;
}

export async function deleteProject(id: number): Promise<void> {
    await api.delete(`/projects/${id}`);
}

export async function fetchProjectMembers(projectId: number): Promise<ProjectMember[]> {
    const { data } = await api.get<ProjectMember[]>(`/projects/${projectId}/members`);
    return data;
}

export async function addProjectMember(projectId: number, userId: number): Promise<ProjectMember> {
    const { data } = await api.post<ProjectMember>(`/projects/${projectId}/members`, { userId });
    return data;
}

export async function removeProjectMember(projectId: number, memberUserId: number): Promise<void> {
    await api.delete(`/projects/${projectId}/members/${memberUserId}`);
}

export async function fetchProjectPullRequests(projectId: number): Promise<ProjectPullRequest[]> {
    const { data } = await api.get<ProjectPullRequest[]>(`/projects/${projectId}/pull-requests`);
    return data;
}

export async function syncProjectPullRequests(projectId: number): Promise<ProjectPullRequest[]> {
    const { data } = await api.post<ProjectPullRequest[]>(`/projects/${projectId}/pull-requests/sync`);
    return data;
}
