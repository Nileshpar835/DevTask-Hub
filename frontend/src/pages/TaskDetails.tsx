import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { isAxiosError } from "axios";
import {
  fetchTaskById,
  updateTask,
  changeTaskStatus,
  assignTask,
  deleteTask,
  fetchTaskActivity,
  fetchTaskCategories,
  type TaskDetail,
  type TaskStatus,
  type TaskPriority,
  type TaskActivityLog
} from "../api/tasks";
import { fetchProjectMembers, type ProjectMember } from "../api/projects";
import { useAuth } from "../context/useAuth";
import { Badge } from "../components/ui/Badge";
import { Modal } from "../components/ui/Modal";
import { formatDate, formatDateTime, formatTime, formatRelativeTime } from "../utils/date";

import {
  fetchTaskPullRequests,
  linkTaskPullRequest,
  syncTaskPullRequest,
  unlinkTaskPullRequest,
  fetchPullRequestCommits,
  type PullRequest,
  type GitHubCommit
} from "../api/github";

export default function TaskDetails() {


  // PR State
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [isPrModalOpen, setIsPrModalOpen] = useState(false);
  const [prUrl, setPrUrl] = useState("");
  const [prError, setPrError] = useState<string | null>(null);
  const [linkingPr, setLinkingPr] = useState(false);
  const [syncingPrId, setSyncingPrId] = useState<number | null>(null);

  // Unlink PR Modal State
  const [prToUnlink, setPrToUnlink] = useState<PullRequest | null>(null);
  const [unlinkingPr, setUnlinkingPr] = useState(false);

  // PR Commits state
  const [expandedPrCommits, setExpandedPrCommits] = useState<Record<number, boolean>>({});
  const [prCommits, setPrCommits] = useState<Record<number, GitHubCommit[]>>({});
  const [loadingCommits, setLoadingCommits] = useState<Record<number, boolean>>({});
  const [commitErrors, setCommitErrors] = useState<Record<number, string | null>>({});

  // Generic Notice/Error Modal State
  const [noticeModal, setNoticeModal] = useState<{ title: string; message: string } | null>(null);

  const { id } = useParams<{ id: string }>();
  const taskId = Number(id);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [task, setTask] = useState<TaskDetail | null>(null);
  const [activity, setActivity] = useState<TaskActivityLog[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editPriority, setEditPriority] = useState<TaskPriority>("Medium");
  const [editDueDate, setEditDueDate] = useState("");
  const [editCategory, setEditCategory] = useState("Feature");
  const [categories, setCategories] = useState<string[]>(["Feature", "Bug", "Update", "Refactor", "Documentation"]);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete Modal State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // In-flight action state
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingAssignee, setUpdatingAssignee] = useState(false);

  const loadTask = useCallback(async () => {
    if (isNaN(taskId)) {
      setPageError("Invalid Task ID.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setPageError(null);
    try {
      const data = await fetchTaskById(taskId);
      setTask(data);
      setEditTitle(data.title);
      setEditDesc(data.description || "");
      setEditPriority(data.priority);
      setEditDueDate(data.dueDateUtc ? data.dueDateUtc.slice(0, 10) : "");
      setEditCategory(data.category || "Feature");
      fetchTaskCategories().then(cats => {
        if (cats && cats.length > 0) setCategories(cats);
      }).catch(() => {});

      // Concurrently load project members and activity
      const [membersData, activityData] = await Promise.all([
        fetchProjectMembers(data.projectId).catch(() => []),
        fetchTaskActivity(taskId).catch(() => []),
        fetchTaskPullRequests(taskId).then(setPullRequests).catch(() => setPullRequests([])),
      ]);
      setMembers(membersData);
      setActivity(activityData);
    } catch (err) {
      if (isAxiosError(err)) {
        setPageError(err.response?.data?.error ?? "Failed to load task details.");
      } else {
        setPageError("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadTask();
  }, [loadTask]);

  const isAdmin = user?.role === "Admin";
  const isAssignee = task && user?.id === task.assigneeUserId;
  const isCreatorOrAdmin = isAdmin || (task && user?.id === task.createdByUserId);

  async function handleLinkPr(e: FormEvent) {
    e.preventDefault();
    if (!prUrl.trim()) {
      setPrError("Please enter a valid GitHub Pull Request URL.");
      return;
    }

    setLinkingPr(true);
    setPrError(null);
    try {
      await linkTaskPullRequest(taskId, prUrl.trim());
      setIsPrModalOpen(false);
      setPrUrl("");
      const updatedPrs = await fetchTaskPullRequests(taskId);
      setPullRequests(updatedPrs);
      const updatedActivity = await fetchTaskActivity(taskId);
      setActivity(updatedActivity);
    } catch (err) {
      if (isAxiosError(err)) {
        setPrError(err.response?.data?.error ?? "Failed to link Pull Request.");
      } else {
        setPrError("An unexpected error occurred.");
      }
    } finally {
      setLinkingPr(false);
    }
  }

  async function handleSyncPr(prId: number) {
    setSyncingPrId(prId);
    try {
      await syncTaskPullRequest(taskId, prId);
      const updatedPrs = await fetchTaskPullRequests(taskId);
      setPullRequests(updatedPrs);
    } catch (err) {
      const msg = isAxiosError(err) ? (err.response?.data?.error ?? "Failed to sync PR.") : "Failed to sync PR.";
      setNoticeModal({ title: "PR Sync Failed", message: msg });
    } finally {
      setSyncingPrId(null);
    }
  }

  async function handleConfirmUnlinkPr() {
    if (!prToUnlink) return;
    setUnlinkingPr(true);
    try {
      await unlinkTaskPullRequest(taskId, prToUnlink.id);
      setPullRequests((prev) => prev.filter(p => p.id !== prToUnlink.id));
      const updatedActivity = await fetchTaskActivity(taskId);
      setActivity(updatedActivity);
      setPrToUnlink(null);
    } catch (err) {
      const msg = isAxiosError(err) ? (err.response?.data?.error ?? "Failed to unlink PR.") : "An unexpected error occurred.";
      setNoticeModal({ title: "Unlink Failed", message: msg });
    } finally {
      setUnlinkingPr(false);
    }
  }

  async function togglePrCommits(pr: PullRequest) {
    const isCurrentlyOpen = !!expandedPrCommits[pr.id];
    setExpandedPrCommits((prev) => ({ ...prev, [pr.id]: !isCurrentlyOpen }));

    if (!isCurrentlyOpen && !prCommits[pr.id]) {
      setLoadingCommits((prev) => ({ ...prev, [pr.id]: true }));
      setCommitErrors((prev) => ({ ...prev, [pr.id]: null }));
      try {
        const list = await fetchPullRequestCommits(
          pr.repositoryOwner,
          pr.repositoryName,
          pr.pullRequestNumber
        );
        setPrCommits((prev) => ({ ...prev, [pr.id]: list }));
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to load commits from GitHub.";
        setCommitErrors((prev) => ({ ...prev, [pr.id]: msg }));
      } finally {
        setLoadingCommits((prev) => ({ ...prev, [pr.id]: false }));
      }
    }
  }

  function getPrBadge(state: "Open" | "Closed" | "Merged" | string, isDraft: boolean) {
    if (isDraft) return <span className="badge badge-neutral">Draft</span>;
    switch (state) {
      case "Open": return <span className="badge badge-success">Open</span>;
      case "Merged": return <span className="badge badge-purple">Merged</span>;
      case "Closed": return <span className="badge badge-danger">Closed</span>;
    }
  }

  // Allowed transitions calculation
  function getAllowedNextStatuses(current: TaskStatus): TaskStatus[] {
    switch (current) {
      case "ToDo":
        return ["InProgress"];
      case "InProgress":
        return ["InReview", "ToDo"];
      case "InReview":
        return ["Done", "InProgress"];
      case "Done":
        return (isAdmin || isAssignee) ? ["InProgress"] : [];
    }
  }

  async function handleStatusChange(newStatus: TaskStatus) {
    if (!task || newStatus === task.status) return;
    setUpdatingStatus(true);
    try {
      const updated = await changeTaskStatus(task.id, newStatus);
      setTask(updated);
      const newActivity = await fetchTaskActivity(task.id);
      setActivity(newActivity);
    } catch (err) {
      const msg = isAxiosError(err) ? (err.response?.data?.error ?? "Cannot change task status.") : "An error occurred while changing status.";
      setNoticeModal({ title: "Status Update Failed", message: msg });
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleAssigneeChange(newAssigneeId: number | null) {
    if (!task || newAssigneeId === task.assigneeUserId) return;
    setUpdatingAssignee(true);
    try {
      const updated = await assignTask(task.id, newAssigneeId);
      setTask(updated);
      const newActivity = await fetchTaskActivity(task.id);
      setActivity(newActivity);
    } catch (err) {
      const msg = isAxiosError(err) ? (err.response?.data?.error ?? "Cannot assign task.") : "An error occurred while reassigning.";
      setNoticeModal({ title: "Assignment Failed", message: msg });
    } finally {
      setUpdatingAssignee(false);
    }
  }

  async function handleSaveEdit(e: FormEvent) {
    e.preventDefault();
    if (!editTitle.trim()) {
      setEditError("Task title is required.");
      return;
    }

    setSavingEdit(true);
    setEditError(null);
    try {
      const finalCategory = isCustomCategory ? customCategoryName.trim() : editCategory;
      const updated = await updateTask(taskId, {
        title: editTitle.trim(),
        description: editDesc.trim() || undefined,
        priority: editPriority,
        category: finalCategory || undefined,
        dueDateUtc: editDueDate ? new Date(editDueDate).toISOString() : undefined,
      });
      if (finalCategory && !categories.includes(finalCategory)) {
        setCategories(prev => [...prev, finalCategory]);
      }
      setTask(updated);
      setIsEditOpen(false);
      const newActivity = await fetchTaskActivity(taskId);
      setActivity(newActivity);
    } catch (err) {
      if (isAxiosError(err)) {
        setEditError(err.response?.data?.error ?? "Failed to update task.");
      } else {
        setEditError("An unexpected error occurred.");
      }
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDeleteTask() {
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteTask(taskId);
      navigate("/tasks", { replace: true });
    } catch (err) {
      if (isAxiosError(err)) {
        setDeleteError(err.response?.data?.error ?? "Cannot delete task.");
      } else {
        setDeleteError("An unexpected error occurred.");
      }
    } finally {
      setDeleting(false);
    }
  }

  function getStatusBadge(status: TaskStatus) {
    switch (status) {
      case "ToDo": return <Badge variant="neutral">To Do</Badge>;
      case "InProgress": return <Badge variant="primary">In Progress</Badge>;
      case "InReview": return <Badge variant="warning">In Review</Badge>;
      case "Done": return <Badge variant="success">Done</Badge>;
    }
  }

  function getPriorityBadge(priority: TaskPriority) {
    switch (priority) {
      case "Low": return <span className="priority-tag priority-low">Low</span>;
      case "Medium": return <span className="priority-tag priority-medium">Medium</span>;
      case "High": return <span className="priority-tag priority-high">High</span>;
      case "Critical": return <span className="priority-tag priority-critical">Critical</span>;
    }
  }

  if (loading) return <p className="page-state">Loading task details…</p>;
  if (pageError || !task) {
    return (
      <div className="tasks-container">
        <div className="form-error" role="alert">{pageError ?? "Task not found."}</div>
        <Link to="/tasks" className="btn">← Back to Tasks</Link>
      </div>
    );
  }

  const allowedNext = getAllowedNextStatuses(task.status);

  return (
    <div className="tasks-container">
      {/* Top Bar */}
      <div className="page-header">
        <div>
          <Link to="/tasks" className="back-link">← All Tasks</Link>
          <div className="project-header-title">
            <span className="project-key">{task.projectKey}</span>
            {task.category && (
              <span className={`category-chip cat-${task.category.toLowerCase()}`} style={{ marginLeft: "8px" }}>
                🏷️ {task.category}
              </span>
            )}
            <h2>{task.title}</h2>
          </div>
        </div>

        <div className="header-actions">
          <button className="btn" onClick={() => setIsEditOpen(true)}>
            Edit Details
          </button>
          {isCreatorOrAdmin && (
            <button className="btn btn-danger" onClick={() => setIsDeleteOpen(true)}>
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="task-details-layout">
        {/* Left Column: Description & Activity Feed */}
        <div className="task-main">
          <div className="detail-card">
            <h3>Description</h3>
            <p className="detail-desc" style={{ whiteSpace: "pre-wrap" }}>
              {task.description || "No description provided."}
            </p>
          </div>
          {/* Linked Pull Requests Card */}
          <div className="detail-card" style={{ marginTop: "24px" }}>
            <div className="card-header-flex">
              <div>
                <h3>Linked Pull Requests ({pullRequests.length})</h3>
                <p className="page-subtitle">Track GitHub PR reviews, merges, and sync state.</p>
              </div>
              <button className="btn" onClick={() => setIsPrModalOpen(true)}>
                + Link PR
              </button>
            </div>

            {pullRequests.length === 0 ? (
              <p className="text-muted" style={{ fontSize: "13px" }}>No GitHub pull requests linked to this task.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px" }}>
                {pullRequests.map((pr) => (
                  <div key={pr.id} className="pr-item-card">
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {getPrBadge(pr.state, pr.isDraft)}
                      <a href={pr.htmlUrl} target="_blank" rel="noreferrer" className="pr-link">
                        <strong>{pr.repositoryOwner}/{pr.repositoryName}#{pr.pullRequestNumber}</strong>
                      </a>
                      {pr.authorGitHubUsername && (
                        <span style={{ fontSize: "12px", color: "var(--muted)", marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          {pr.authorAvatarUrl && (
                            <img src={pr.authorAvatarUrl} alt="" style={{ width: "18px", height: "18px", borderRadius: "50%" }} />
                          )}
                          @{pr.authorGitHubUsername}
                        </span>
                      )}
                    </div>
                    <p className="pr-title">{pr.title || "Untitled Pull Request"}</p>
                    <div className="pr-meta-row">
                      {pr.linkedByUserName && (
                        <span className="text-muted" style={{ fontSize: "11px" }}>
                          Linked by {pr.linkedByUserName} •
                        </span>
                      )}
                      <span className="text-muted">
                        {pr.lastSyncedAtUtc && formatTime(pr.lastSyncedAtUtc)
                          ? `Synced ${formatTime(pr.lastSyncedAtUtc)}${formatRelativeTime(pr.lastSyncedAtUtc) ? ` (${formatRelativeTime(pr.lastSyncedAtUtc)})` : ""}`
                          : "Not synced"}
                      </span>
                      {pr.syncError && <span className="pr-error-text">⚠️ {pr.syncError}</span>}

                      <button
                        type="button"
                        className="pr-commits-toggle"
                        onClick={() => togglePrCommits(pr)}
                      >
                        {expandedPrCommits[pr.id] ? "▴ Hide Commits" : "▾ Commits"}
                      </button>

                      <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
                        <button
                          type="button"
                          className="btn-action-sync"
                          disabled={syncingPrId === pr.id}
                          onClick={() => handleSyncPr(pr.id)}
                        >
                          {syncingPrId === pr.id ? "Syncing…" : "↻ Sync"}
                        </button>
                        <button
                          type="button"
                          className="btn-action-delete"
                          onClick={() => setPrToUnlink(pr)}
                        >
                          Unlink
                        </button>
                      </div>
                    </div>

                    {expandedPrCommits[pr.id] && (
                      <div className="pr-commits-container">
                        <div className="pr-commits-header">
                          <span>Commits on this PR</span>
                          {prCommits[pr.id] && <span>{prCommits[pr.id].length} commit(s)</span>}
                        </div>

                        {loadingCommits[pr.id] && (
                          <p className="text-muted" style={{ margin: "6px 0", fontSize: "12px" }}>
                            Fetching commits from GitHub…
                          </p>
                        )}

                        {commitErrors[pr.id] && (
                          <p className="pr-error-text" style={{ margin: "4px 0" }}>
                            ⚠️ {commitErrors[pr.id]}
                          </p>
                        )}

                        {prCommits[pr.id] && prCommits[pr.id].length === 0 && (
                          <p className="text-muted" style={{ margin: "6px 0", fontSize: "12px" }}>
                            No commits found on this pull request.
                          </p>
                        )}

                        {prCommits[pr.id] && prCommits[pr.id].length > 0 && (
                          <div className="pr-commits-list">
                            {prCommits[pr.id].map((c) => (
                              <div key={c.sha} className="pr-commit-item">
                                <a
                                  href={c.htmlUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="commit-hash"
                                  title="View commit on GitHub"
                                  >
                                  <code>{c.sha.substring(0, 7)}</code>
                                </a>
                                <span className="commit-msg" title={c.message}>
                                  {c.message}
                                </span>
                                <div className="commit-meta">
                                  {c.authorAvatarUrl && (
                                    <img
                                      src={c.authorAvatarUrl}
                                      alt={c.authorName}
                                      style={{ width: "16px", height: "16px", borderRadius: "50%" }}
                                    />
                                  )}
                                  <span>{c.authorName}</span>
                                  {c.authorDate && (
                                    <span>• {new Date(c.authorDate).toLocaleDateString()}</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>



          <div className="detail-card" style={{ marginTop: "24px" }}>
            <h3> Activity History ({activity.length})</h3>
            {activity.length === 0 ? (
              <p className="text-muted" style={{ fontSize: "13px" }}>No activity recorded yet.</p>
            ) : (
              <div className="activity-timeline">
                {activity.map((log) => (
                  <div key={log.id} className="timeline-item">
                    <div className="timeline-badge">●</div>
                    <div className="timeline-content">
                      <div className="timeline-header">
                        <strong>{log.userFullName}</strong>
                        <span className="timeline-action">{log.action}</span>
                        <span className="timeline-date">
                          {formatDateTime(log.timestampUtc)}
                          {formatRelativeTime(log.timestampUtc) ? ` (${formatRelativeTime(log.timestampUtc)})` : ""}
                        </span>
                      </div>
                      {(log.oldValue || log.newValue) && (
                        <div className="timeline-diff">
                          {log.oldValue && <span className="diff-old">{log.oldValue}</span>}
                          {log.oldValue && log.newValue && <span className="diff-arrow">→</span>}
                          {log.newValue && <span className="diff-new">{log.newValue}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Status & Assignment Sidebar */}
        <div className="task-sidebar">
          {/* Status Controls */}
          <div className="detail-card">
            <span className="detail-label">Status</span>
            <div style={{ margin: "8px 0 12px" }}>
              {getStatusBadge(task.status)}
            </div>

            {allowedNext.length > 0 && (
              <div className="field" style={{ marginBottom: 0 }}>
                <label htmlFor="change-status" style={{ fontSize: "11px" }}>Move to next status:</label>
                <select
                  id="change-status"
                  className="filter-select"
                  style={{ width: "100%", padding: "6px" }}
                  disabled={updatingStatus}
                  value=""
                  onChange={(e) => {
                    if (e.target.value) handleStatusChange(e.target.value as TaskStatus);
                  }}
                >
                  <option value="">-- Choose Status --</option>
                  {allowedNext.map((st) => (
                    <option key={st} value={st}>Move to: {st}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Assignee Controls */}
          <div className="detail-card" style={{ marginTop: "16px" }}>
            <span className="detail-label">Assignee</span>
            <div className="field" style={{ margin: "8px 0 0" }}>
              <select
                id="task-assignee-select"
                className="filter-select"
                style={{ width: "100%", padding: "6px" }}
                disabled={updatingAssignee}
                value={task.assigneeUserId ?? ""}
                onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : null;
                  handleAssigneeChange(val);
                }}
              >
                <option value="">-- Unassigned --</option>
                {members.map((m) => (
                  <option key={m.userId} value={m.userId}>{m.fullName}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Metadata Card */}
          <div className="detail-card" style={{ marginTop: "16px" }}>
            <span className="detail-label">Priority</span>
            <div style={{ margin: "6px 0 14px" }}>
              {getPriorityBadge(task.priority)}
            </div>

            <span className="detail-label">Project</span>
            <p className="detail-value" style={{ margin: "4px 0 14px" }}>
              <Link to={`/projects/${task.projectId}`}>[{task.projectKey}] {task.projectName}</Link>
            </p>

            <span className="detail-label">Created By</span>
            <p className="detail-value" style={{ margin: "4px 0 14px" }}>👤 {task.createdByName}</p>

            <span className="detail-label">Due Date</span>
            <p className="detail-value" style={{ margin: "4px 0 14px" }}>
              {task.dueDateUtc ? formatDate(task.dueDateUtc) : "None"}
            </p>

            {task.completedAtUtc && (
              <>
                <span className="detail-label">Completed Date</span>
                <p className="detail-value" style={{ margin: "4px 0 0", color: "#15803d" }}>
                  ✓ {formatDate(task.completedAtUtc)}
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Edit Task Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Task">
        {editError && <div className="form-error">{editError}</div>}
        <form onSubmit={handleSaveEdit} noValidate>
          <div className="field">
            <label htmlFor="edit-task-title">Title</label>
            <input
              id="edit-task-title"
              type="text"
              maxLength={200}
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="edit-task-desc">Description</label>
            <textarea
              id="edit-task-desc"
              rows={4}
              className="field-textarea"
              maxLength={4000}
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="field">
              <label htmlFor="edit-task-prio">Priority</label>
              <select
                id="edit-task-prio"
                className="filter-select"
                style={{ width: "100%", padding: "8px" }}
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value as TaskPriority)}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="edit-task-due">Due Date</label>
              <input
                id="edit-task-due"
                type="date"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="edit-task-category">Category</label>
            <select
              id="edit-task-category"
              className="filter-select"
              style={{ width: "100%", padding: "8px" }}
              value={isCustomCategory ? "__CUSTOM__" : editCategory}
              onChange={(e) => {
                if (e.target.value === "__CUSTOM__") {
                  setIsCustomCategory(true);
                } else {
                  setIsCustomCategory(false);
                  setEditCategory(e.target.value);
                }
              }}
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
              <option value="__CUSTOM__">+ Create new category…</option>
            </select>
          </div>

          {isCustomCategory && (
            <div className="field">
              <label htmlFor="edit-custom-cat">New Category Name</label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  id="edit-custom-cat"
                  type="text"
                  placeholder="e.g. Design, DevOps, QA"
                  maxLength={50}
                  value={customCategoryName}
                  onChange={(e) => setCustomCategoryName(e.target.value)}
                  style={{ flex: 1 }}
                  required
                />
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    setIsCustomCategory(false);
                    setCustomCategoryName("");
                  }}
                  style={{ fontSize: "12px" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn" onClick={() => setIsEditOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={savingEdit}>
              {savingEdit ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete Task">
        {deleteError && <div className="form-error">{deleteError}</div>}
        <p>Are you sure you want to delete <strong>{task.title}</strong>?</p>
        <p style={{ color: "var(--muted)", fontSize: "13px" }}>This action cannot be undone.</p>
        <div className="modal-actions">
          <button type="button" className="btn" onClick={() => setIsDeleteOpen(false)}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger"
            disabled={deleting}
            onClick={handleDeleteTask}
          >
            {deleting ? "Deleting…" : "Confirm Delete"}
          </button>
        </div>
      </Modal>

      {/* Link GitHub Pull Request Modal */}
      <Modal isOpen={isPrModalOpen} onClose={() => setIsPrModalOpen(false)} title="Link GitHub Pull Request">
        <form onSubmit={handleLinkPr}>
          {prError && <div className="form-error">{prError}</div>}
          <div className="field">
            <label htmlFor="pr-url">GitHub Pull Request URL</label>
            <input
              id="pr-url"
              type="url"
              placeholder="https://github.com/owner/repo/pull/123"
              value={prUrl}
              onChange={(e) => setPrUrl(e.target.value)}
              required
            />
            <p className="field-hint" style={{ fontSize: "12px", color: "var(--muted)", marginTop: "4px" }}>
              Provide a valid link to an open, merged, or closed GitHub pull request.
            </p>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn" onClick={() => setIsPrModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={linkingPr}>
              {linkingPr ? "Linking…" : "Link Pull Request"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Unlink Pull Request Modal */}
      <Modal
        isOpen={!!prToUnlink}
        onClose={() => {
          if (!unlinkingPr) setPrToUnlink(null);
        }}
        title="Unlink Pull Request"
      >
        <p>
          Are you sure you want to unlink Pull Request{" "}
          <strong>{prToUnlink?.repositoryOwner}/{prToUnlink?.repositoryName}#{prToUnlink?.pullRequestNumber}</strong>?
        </p>
        <div className="modal-actions" style={{ marginTop: "20px" }}>
          <button
            type="button"
            className="btn"
            disabled={unlinkingPr}
            onClick={() => setPrToUnlink(null)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger"
            disabled={unlinkingPr}
            onClick={handleConfirmUnlinkPr}
          >
            {unlinkingPr ? "Unlinking…" : "Confirm Unlink"}
          </button>
        </div>
      </Modal>

      {/* Notice / Alert Modal */}
      <Modal
        isOpen={!!noticeModal}
        onClose={() => setNoticeModal(null)}
        title={noticeModal?.title ?? "Notice"}
      >
        <div className="form-error" style={{ marginBottom: "16px" }}>
          {noticeModal?.message}
        </div>
        <div className="modal-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setNoticeModal(null)}
          >
            OK
          </button>
        </div>
      </Modal>
    </div>
  );
}
