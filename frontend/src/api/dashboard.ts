import { api } from "./client";
import type { TaskActivityLog } from "./tasks";
import type { ProjectSummary } from "./projects";

export interface TaskStatusBreakdown {
  toDo: number;
  inProgress: number;
  inReview: number;
  done: number;
}

export interface UrgentTaskSummary {
  id: number;
  projectId: number;
  projectKey: string;
  title: string;
  priority: string;
  status: string;
  dueDateUtc: string | null;
}

export interface AdminDashboardData {
  totalProjects: number;
  totalActiveProjects: number;
  totalUsers: number;
  totalDevelopers: number;
  totalTasks: number;
  overdueTasksCount: number;
  statusBreakdown: TaskStatusBreakdown;
  recentActivities: TaskActivityLog[];
}

export interface DeveloperDashboardData {
  totalAssignedTasks: number;
  statusBreakdown: TaskStatusBreakdown;
  overdueTasks: UrgentTaskSummary[];
  dueSoonTasks: UrgentTaskSummary[];
  myProjects: ProjectSummary[];
}

export async function fetchAdminDashboard(): Promise<AdminDashboardData> {
  const { data } = await api.get<AdminDashboardData>("/dashboard/admin");
  return data;
}

export async function fetchDeveloperDashboard(): Promise<DeveloperDashboardData> {
  const { data } = await api.get<DeveloperDashboardData>("/dashboard/developer");
  return data;
}