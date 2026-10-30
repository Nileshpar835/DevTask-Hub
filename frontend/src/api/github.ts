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
  state: "Open" | "Closed" | "Merged" | string;
  isDraft: boolean;
  reviewStatus: string | null;
  authorGitHubUsername?: string | null;
  authorAvatarUrl?: string | null;
  linkedByUserId?: number | null;
  linkedByUserName?: string | null;
  lastSyncedAtUtc: string | null;
  syncError: string | null;
}

export interface GitHubCommit {
  sha: string;
  htmlUrl: string;
  message: string;
  authorName: string;
  authorDate: string;
  authorAvatarUrl?: string;
}

interface RawGitHubCommit {
  sha: string;
  html_url: string;
  commit?: {
    message?: string;
    author?: {
      name?: string;
      date?: string;
    };
  };
  author?: {
    login?: string;
    avatar_url?: string;
  };
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

export async function fetchPullRequestCommits(
  owner: string,
  repo: string,
  pullNumber: number
): Promise<GitHubCommit[]> {
  const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls/${pullNumber}/commits?per_page=15`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!res.ok) {
    if (res.status === 403) {
      throw new Error("GitHub rate limit reached (60 req/hr). Please try again shortly.");
    }
    if (res.status === 404) {
      throw new Error("Repository or Pull Request not found on GitHub.");
    }
    throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
  }

  const rawList: RawGitHubCommit[] = await res.json();
  return rawList.map((c) => ({
    sha: c.sha,
    htmlUrl: c.html_url,
    message: c.commit?.message?.split("\n")[0] || "No commit message",
    authorName: c.commit?.author?.name || c.author?.login || "Unknown",
    authorDate: c.commit?.author?.date || "",
    authorAvatarUrl: c.author?.avatar_url,
  }));
}
