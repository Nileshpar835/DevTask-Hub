import { api } from "./client";

export interface GitHubProfile {
  id: number;
  userId: number;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  profileUrl: string | null;
  fetchedAtUtc: string | null;
}

export interface PullRequest {
  id: number;
  taskId: number;
  repositoryOwner: string;
  repositoryName: string;
  pullRequestNumber: number;
  htmlUrl: string;
  title: string | null;
  state: "Open" | "Closed" | "Merged";
  isDraft: boolean;
  reviewStatus: string | null;
  lastSyncedAtUtc: string | null;
  syncError: string | null;
}

export async function fetchMyGitHubProfile(): Promise<GitHubProfile | null> {
  try {
    const { data } = await api.get<GitHubProfile>("/github/profile");
    return data;
  } catch {
    return null;
  }
}

export async function linkGitHubProfile(username: string): Promise<GitHubProfile> {
  const { data } = await api.post<GitHubProfile>("/github/profile", { username });
  return data;
}

export async function unlinkGitHubProfile(): Promise<void> {
  await api.delete("/github/profile");
}

export async function fetchTaskPullRequests(taskId: number): Promise<PullRequest[]> {
  const { data } = await api.get<PullRequest[]>(`/tasks/${taskId}/pull-requests`);
  return data;
}

export async function linkTaskPullRequest(taskId: number, url: string): Promise<PullRequest> {
  const { data } = await api.post<PullRequest>(`/tasks/${taskId}/pull-requests`, { url });
  return data;
}

export async function syncTaskPullRequest(taskId: number, prId: number): Promise<PullRequest> {
  const { data } = await api.post<PullRequest>(`/tasks/${taskId}/pull-requests/${prId}/sync`);
  return data;
}

export async function unlinkTaskPullRequest(taskId: number, prId: number): Promise<void> {
  await api.delete(`/tasks/${taskId}/pull-requests/${prId}`);
}