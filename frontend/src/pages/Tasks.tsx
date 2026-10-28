import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { isAxiosError } from "axios";
import { 
  fetchTasks, 
  createTask, 
  type TaskSummary, 
  type TaskStatus, 
  type TaskPriority, 
  type PagedResult 
} from "../api/tasks";
import { fetchProjects, fetchProjectMembers, type ProjectSummary, type ProjectMember } from "../api/projects";
import { Badge } from "../components/ui/Badge";
import { Modal } from "../components/ui/Modal";
import { Pagination } from "../components/ui/Pagination";

export default function Tasks() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialProjectId = searchParams.get("projectId") ? Number(searchParams.get("projectId")) : "";

  const [data, setData] = useState<PagedResult<TaskSummary> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Projects list for filter dropdown and create modal
  const [projects, setProjects] = useState<ProjectSummary[]>([]);

  // Query & Filter States
  const [search, setSearch] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<number | "">(initialProjectId);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "">("");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "">("");
  const [mineOnly, setMineOnly] = useState(false);
  const [page, setPage] = useState(1);

  // Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalProjectId, setModalProjectId] = useState<number | "">("");
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [modalTitle, setModalTitle] = useState("");
  const [modalDesc, setModalDesc] = useState("");
  const [modalPriority, setModalPriority] = useState<TaskPriority>("Medium");
  const [modalAssigneeId, setModalAssigneeId] = useState<number | "">("");
  const [modalDueDate, setModalDueDate] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Load available projects
  useEffect(() => {
    fetchProjects({ pageSize: 100 })
      .then(res => setProjects(res.items))
      .catch(() => setProjects([]));
  }, []);

  // When project selected in create modal, load its members
  useEffect(() => {
    if (modalProjectId !== "") {
      fetchProjectMembers(Number(modalProjectId))
        .then(setProjectMembers)
        .catch(() => setProjectMembers([]));
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProjectMembers([]);
    }
  }, [modalProjectId]);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchTasks({
        page,
        pageSize: 15,
        search: search.trim() || undefined,
        projectId: selectedProjectId !== "" ? Number(selectedProjectId) : undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        mine: mineOnly || undefined,
      });
      setData(res);
    } catch (err) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.error ?? "Failed to load tasks.");
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedProjectId, statusFilter, priorityFilter, mineOnly]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadTasks();
  }, [loadTasks]);

  async function handleCreateTask(e: FormEvent) {
    e.preventDefault();
    if (modalProjectId === "") {
      setFormError("Please select a project.");
      return;
    }
    if (!modalTitle.trim()) {
      setFormError("Task title is required.");
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      await createTask({
        projectId: Number(modalProjectId),
        title: modalTitle.trim(),
        description: modalDesc.trim() || undefined,
        priority: modalPriority,
        assigneeUserId: modalAssigneeId !== "" ? Number(modalAssigneeId) : undefined,
        dueDateUtc: modalDueDate ? new Date(modalDueDate).toISOString() : undefined,
      });
      setIsModalOpen(false);
      setModalTitle("");
      setModalDesc("");
      setModalPriority("Medium");
      setModalAssigneeId("");
      setModalDueDate("");
      loadTasks();
    } catch (err) {
      if (isAxiosError(err)) {
        setFormError(err.response?.data?.error ?? "Failed to create task.");
      } else {
        setFormError("An unexpected error occurred.");
      }
    } finally {
      setSubmitting(false);
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

  return (
    <div className="tasks-container">
      <div className="page-header">
        <div>
          <h2>Tasks</h2>
          <p className="page-subtitle">Track, assign, and manage issues across all your projects.</p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={() => {
            setModalProjectId(selectedProjectId !== "" ? selectedProjectId : (projects[0]?.id ?? ""));
            setIsModalOpen(true);
          }}
        >
          + New Task
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <input
          type="search"
          placeholder="Search tasks by title or description…"
          className="search-input"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        <div className="filter-group">
          <select
            className="filter-select"
            value={selectedProjectId}
            onChange={(e) => {
              const val = e.target.value ? Number(e.target.value) : "";
              setSelectedProjectId(val);
              setPage(1);
              setSearchParams(val !== "" ? { projectId: String(val) } : {});
            }}
          >
            <option value="">All Projects</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>[{p.key}] {p.name}</option>
            ))}
          </select>

          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as TaskStatus | ""); setPage(1); }}
          >
            <option value="">All Statuses</option>
            <option value="ToDo">To Do</option>
            <option value="InProgress">In Progress</option>
            <option value="InReview">In Review</option>
            <option value="Done">Done</option>
          </select>

          <select
            className="filter-select"
            value={priorityFilter}
            onChange={(e) => { setPriorityFilter(e.target.value as TaskPriority | ""); setPage(1); }}
          >
            <option value="">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>

          <button
            type="button"
            className={`filter-pill ${mineOnly ? "active" : ""}`}
            onClick={() => { setMineOnly(!mineOnly); setPage(1); }}
          >
            Assigned to Me
          </button>
        </div>
      </div>

      {/* Content States */}
      {loading ? (
        <p className="page-state">Loading tasks…</p>
      ) : error ? (
        <div className="form-error" role="alert">{error}</div>
      ) : !data || data.items.length === 0 ? (
        <div className="empty-state">
          <h3>No tasks found</h3>
          <p>Try clearing filters or create a new task to get started.</p>
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Project</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Assignee</th>
                  <th>Due Date</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((task) => (
                  <tr key={task.id}>
                    <td>
                      <Link to={`/tasks/${task.id}`} className="task-row-link">
                        <strong>{task.title}</strong>
                      </Link>
                    </td>
                    <td>
                      <span className="project-key">{task.projectKey}</span>
                    </td>
                    <td>{getStatusBadge(task.status)}</td>
                    <td>{getPriorityBadge(task.priority)}</td>
                    <td>
                      {task.assigneeName ? (
                        <span>👤 {task.assigneeName}</span>
                      ) : (
                        <span className="text-muted" style={{ fontStyle: "italic", fontSize: "12px" }}>Unassigned</span>
                      )}
                    </td>
                    <td>
                      {task.dueDateUtc ? (
                        new Date(task.dueDateUtc).toLocaleDateString()
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            page={data.page}
            totalpages={data.totalPages}
            onPageChange={(newPage) => setPage(newPage)}
          />
        </>
      )}

      {/* Create Task Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Task">
        {formError && <div className="form-error">{formError}</div>}
        <form onSubmit={handleCreateTask} noValidate>
          <div className="field">
            <label htmlFor="task-project">Project</label>
            <select
              id="task-project"
              className="filter-select"
              style={{ width: "100%", padding: "8px" }}
              value={modalProjectId}
              onChange={(e) => setModalProjectId(Number(e.target.value))}
            >
              <option value="">-- Select Project --</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>[{p.key}] {p.name}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="task-title">Title</label>
            <input
              id="task-title"
              type="text"
              placeholder="e.g. Implement user profile avatar upload"
              maxLength={200}
              value={modalTitle}
              onChange={(e) => setModalTitle(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="task-desc">Description (optional)</label>
            <textarea
              id="task-desc"
              rows={3}
              className="field-textarea"
              placeholder="Acceptance criteria, notes, or implementation details…"
              maxLength={4000}
              value={modalDesc}
              onChange={(e) => setModalDesc(e.target.value)}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="field">
              <label htmlFor="task-priority">Priority</label>
              <select
                id="task-priority"
                className="filter-select"
                style={{ width: "100%", padding: "8px" }}
                value={modalPriority}
                onChange={(e) => setModalPriority(e.target.value as TaskPriority)}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="task-assignee">Assignee</label>
              <select
                id="task-assignee"
                className="filter-select"
                style={{ width: "100%", padding: "8px" }}
                value={modalAssigneeId}
                onChange={(e) => setModalAssigneeId(e.target.value ? Number(e.target.value) : "")}
              >
                <option value="">-- Unassigned --</option>
                {projectMembers.map(m => (
                  <option key={m.userId} value={m.userId}>{m.fullName}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="field">
            <label htmlFor="task-due">Due Date (optional)</label>
            <input
              id="task-due"
              type="date"
              value={modalDueDate}
              onChange={(e) => setModalDueDate(e.target.value)}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Creating…" : "Create Task"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}