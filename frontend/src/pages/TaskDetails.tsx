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
  type TaskDetail,
  type TaskStatus,
  type TaskPriority,
  type TaskActivityLog
} from "../api/tasks";
import { fetchProjectMembers, type ProjectMember } from "../api/projects";
import { useAuth } from "../context/useAuth";
import { Badge } from "../components/ui/Badge";
import { Modal } from "../components/ui/Modal";

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

  // PR Commits state
  const [expandedPrCommits, setExpandedPrCommits] = useState<Record<number, boolean>>({});
  const [prCommits, setPrCommits] = useState<Record<number, GitHubCommit[]>>({});
  const [loadingCommits, setLoadingCommits] = useState<Record<number, boolean>>({});
  const [commitErrors, setCommitErrors] = useState<Record<number, string | null>>({});


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
      if (isAxiosError(err)) {
        alert(err.response?.data?.error ?? "Failed to sync PR.");
      }
    } finally {
      setSyncingPrId(null);
    }
  }

  async function handleUnlinkPr(prId: number) {
    if (!window.confirm("Are you sure you want to unlink this pull request?")) return;
    try {
      await unlinkTaskPullRequest(taskId, prId);
      setPullRequests(pullRequests.filter(p => p.id !== prId));
      const updatedActivity = await fetchTaskActivity(taskId);
      setActivity(updatedActivity);
    } catch (err) {
      if (isAxiosError(err)) {
        alert(err.response?.data?.error ?? "Failed to unlink PR.");
      }
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

  function getPrBadge(state: "Open" | "Closed" | "Merged", isDraft: boolean) {
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
      if (isAxiosError(err)) {
        alert(err.response?.data?.error ?? "Cannot change task status.");
      } else {
        alert("An error occurred while changing status.");
      }
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
      if (isAxiosError(err)) {
        alert(err.response?.data?.error ?? "Cannot assign task.");
      } else {
        alert("An error occurred while reassigning.");
      }
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
      const updated = await updateTask(taskId, {
        title: editTitle.trim(),
        description: editDesc.trim() || undefined,
        priority: editPriority,
        dueDateUtc: editDueDate ? new Date(editDueDate).toISOString() : undefined,
      });
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
                    </div>
                    <p className="pr-title">{pr.title || "Untitled Pull Request"}</p>
                    <div className="pr-meta-row">
                      <span className="text-muted">
                        {pr.lastSyncedAtUtc ? `Synced ${new Date(pr.lastSyncedAtUtc).toLocaleTimeString()}` : "Not synced"}
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
                          onClick={() => handleUnlinkPr(pr.id)}
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
                        <span className="timeline-date">{new Date(log.timestampUtc).toLocaleString()}</span>
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
              {task.dueDateUtc ? new Date(task.dueDateUtc).toLocaleDateString() : "None"}
            </p>

            {task.completedAtUtc && (
              <>
                <span className="detail-label">Completed Date</span>
                <p className="detail-value" style={{ margin: "4px 0 0", color: "#15803d" }}>
                  ✓ {new Date(task.completedAtUtc).toLocaleDateString()}
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
    </div>
  );
}