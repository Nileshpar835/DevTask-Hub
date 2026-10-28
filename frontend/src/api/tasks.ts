import { api } from "./client";

import type { PagedResult } from "./projects";

export type { PagedResult };

export type TaskStatus = "ToDo" | "InProgress" | "InReview" | "Done";

export type TaskPriority = "Low" | "Medium" | "High" | "Critical";

export interface TaskSummary {
    id: number;
    projectId: number;
    projectKey: string;
    projectName: string;
    title: string;
    status: TaskStatus;
    priority: TaskPriority;
    assigneeUserId: number | null;
    assigneeName: string | null;
    createdByUserId: number;
    createdByName: string;
    dueDateUtc: string | null;
    completedAtUtc: string | null;
    createdAtUtc: string;
    updatedAtUtc: string;
}
export interface TaskDetail {
    id: number;
    projectId: number;
    projectKey: string;
    projectName: string;
    title: string;
    description: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    assigneeUserId: number | null;
    assigneeName: string | null;
    createdByUserId: number;
    createdByName: string;
    dueDateUtc: string | null;
    completedAtUtc: string | null;
    createdAtUtc: string;
    updatedAtUtc: string;
}
export interface TaskActivityLog {
    id: number;
    taskId: number;
    action: string;
    oldValue: string | null;
    newValue: string | null;
    userId: number;
    userFullName: string;
    timestampUtc: string;
}
export interface CreateTaskPayload {
    projectId: number;
    title: string;
    description?: string;
    priority: TaskPriority;
    assigneeUserId?: number;
    dueDateUtc?: string;
}
export interface UpdateTaskPayload {
    title: string;
    description?: string;
    priority: TaskPriority;
    dueDateUtc?: string;
}
export interface TaskQueryParams {
    page?: number;
    pageSize?: number;
    projectId?: number;
    assigneeId?: number;
    status?: TaskStatus;
    priority?: TaskPriority;
    search?: string;
    mine?: boolean;
}
export async function fetchTasks(params: TaskQueryParams = {}): Promise<PagedResult<TaskSummary>> {
    const { data } = await api.get<PagedResult<TaskSummary>>("/tasks", { params });
    return data;
}

export async function fetchTaskById(id: number): Promise<TaskDetail> {
    const { data } = await api.get<TaskDetail>(`/tasks/${id}`);
    return data;
}

export async function createTask(payload: CreateTaskPayload): Promise<TaskDetail> {
    const { data } = await api.post<TaskDetail>("/tasks", payload);
    return data;
}

export async function updateTask(id: number, payload: UpdateTaskPayload): Promise<TaskDetail> {
    const { data } = await api.put<TaskDetail>(`/tasks/${id}`, payload);
    return data;
}

export async function changeTaskStatus(id: number, status: TaskStatus): Promise<TaskDetail> {
    const { data } = await api.patch<TaskDetail>(`/tasks/${id}/status`, { status });
    return data;
}

export async function assignTask(id: number, assigneeUserId: number | null): Promise<TaskDetail> {
    const { data } = await api.patch<TaskDetail>(`/tasks/${id}/assignee`, { assigneeUserId });
    return data;
}

export async function deleteTask(id: number): Promise<void> {
    await api.delete(`/tasks/${id}`);
}

export async function fetchTaskActivity(id: number): Promise<TaskActivityLog[]> {
    const { data } = await api.get<TaskActivityLog[]>(`/tasks/${id}/activity`);
    return data;
}

