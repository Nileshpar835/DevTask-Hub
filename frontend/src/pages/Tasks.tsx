import { useCallback, useEffect, useState, type FormEvent, type DragEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { isAxiosError } from "axios";
import { 
  fetchTasks, 
  createTask, 
  changeTaskStatus,
  fetchTaskCategories,
  type TaskSummary, 
  type TaskStatus, 
  type TaskPriority, 
  type PagedResult 
} from "../api/tasks";
import { fetchProjects, fetchProjectMembers, type ProjectSummary, type ProjectMember } from "../api/projects";
import { Badge } from "../components/ui/Badge";
import { Modal } from "../components/ui/Modal";
import { Pagination } from "../components/ui/Pagination";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

const AVATAR_COLORS = ["#2563eb", "#059669", "#7c3aed", "#db2777", "#d97706", "#0891b2", "#4f46e5"];
function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function formatCardDate(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function isOverdue(isoDate: string, status: TaskStatus): boolean {
  if (status === "Done") return false;
  return new Date(isoDate) < new Date();
}

const DEFAULT_CATEGORIES = ["Feature", "Bug", "Update", "Refactor", "Documentation"];

export default function Tasks() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialProjectId = searchParams.get("projectId") ? Number(searchParams.get("projectId")) : "";

  // View Mode: Kanban (default, matches screenshot) or List
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");

  const [data, setData] = useState<PagedResult<TaskSummary> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transitionError, setTransitionError] = useState<string | null>(null);

  // Projects & Categories list
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);

  // Query & Filter States
  const [search, setSearch] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<number | "">(initialProjectId);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "">("");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "">("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [mineOnly, setMineOnly] = useState(false);
  const [page, setPage] = useState(1);

  // Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalProjectId, setModalProjectId] = useState<number | "">("");
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [modalTitle, setModalTitle] = useState("");
  const [modalDesc, setModalDesc] = useState("");
  const [modalPriority, setModalPriority] = useState<TaskPriority>("Medium");
  const [modalCategory, setModalCategory] = useState("Feature");
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState("");
  const [modalAssigneeId, setModalAssigneeId] = useState<number | "">("");
  const [modalDueDate, setModalDueDate] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Load available projects and categories
  useEffect(() => {
    fetchProjects({ pageSize: 100 })
      .then(res => setProjects(res.items))
      .catch(() => setProjects([]));

    fetchTaskCategories()
      .then(cats => {
        if (cats && cats.length > 0) {
          setCategories(cats);
        }
      })
      .catch(() => {});
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
      // For Kanban board, load a larger page size so all columns are populated
      const pageSize = viewMode === "kanban" ? 100 : 15;
      const res = await fetchTasks({
        page: viewMode === "kanban" ? 1 : page,
        pageSize,
        search: search.trim() || undefined,
        projectId: selectedProjectId !== "" ? Number(selectedProjectId) : undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        category: categoryFilter || undefined,
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
  }, [viewMode, page, search, selectedProjectId, statusFilter, priorityFilter, categoryFilter, mineOnly]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadTasks();
  }, [loadTasks]);

  function handleResetFilters() {
    setSearch("");
    setSelectedProjectId("");
    setStatusFilter("");
    setPriorityFilter("");
    setCategoryFilter("");
    setMineOnly(false);
    setPage(1);
    setSearchParams({});
  }

  function openCreateModal() {
    setModalProjectId(selectedProjectId !== "" ? selectedProjectId : (projects[0]?.id ?? ""));
    setIsCustomCategory(false);
    setCustomCategoryName("");
    setModalCategory("Feature");
    setIsModalOpen(true);
  }

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

    const finalCategory = isCustomCategory ? customCategoryName.trim() : modalCategory;
    if (isCustomCategory && !finalCategory) {
      setFormError("Please enter a category name or choose an existing one.");
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
        category: finalCategory || "Feature",
        assigneeUserId: modalAssigneeId !== "" ? Number(modalAssigneeId) : undefined,
        dueDateUtc: modalDueDate ? new Date(modalDueDate).toISOString() : undefined,
      });

      if (finalCategory && !categories.includes(finalCategory)) {
        setCategories(prev => [...prev, finalCategory]);
      }

      setIsModalOpen(false);
      setModalTitle("");
      setModalDesc("");
      setModalPriority("Medium");
      setModalCategory("Feature");
      setIsCustomCategory(false);
      setCustomCategoryName("");
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

  // Drag and Drop Status Change
  async function handleDropTask(e: DragEvent<HTMLDivElement>, targetStatus: TaskStatus) {
    e.preventDefault();
    const taskIdStr = e.dataTransfer.getData("text/plain");
    if (!taskIdStr) return;
    const taskId = Number(taskIdStr);
    if (!taskId) return;

    const task = data?.items.find(t => t.id === taskId);
    if (!task || task.status === targetStatus) return;

    setTransitionError(null);
    try {
      await changeTaskStatus(taskId, targetStatus);
      // Optimistically update local state for snappy UX
      setData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map(t => t.id === taskId ? { ...t, status: targetStatus } : t)
        };
      });
    } catch (err) {
      if (isAxiosError(err)) {
        setTransitionError(err.response?.data?.error ?? "Invalid status transition.");
      } else {
        setTransitionError("Failed to update status.");
      }
    }
  }

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const currentProjectName = selectedProject ? selectedProject.name : "All Projects";

  // Partition tasks into Kanban columns
  const allTasks = data?.items ?? [];
  const todoTasks = allTasks.filter(t => t.status === "ToDo");
  const inProgressTasks = allTasks.filter(t => t.status === "InProgress");
  const inReviewTasks = allTasks.filter(t => t.status === "InReview");
  const doneTasks = allTasks.filter(t => t.status === "Done");

  function renderCard(task: TaskSummary) {
    return (
      <div 
        key={task.id} 
        className="kanban-task-card" 
        draggable 
        onDragStart={(e) => e.dataTransfer.setData("text/plain", String(task.id))}
      >
        <div className="card-top-row">
          <Link to={`/tasks/${task.id}`} className="card-title-link">
            {task.title}
          </Link>
          <Link to={`/tasks/${task.id}`} className="card-id-badge" title="View Details">
            #{task.id} <span style={{ fontSize: "12px" }}>↗</span>
          </Link>
        </div>

        <div className="card-project-subtext">
          <span>{task.projectName}</span>
          <span style={{ color: "#cbd5e1" }}>·</span>
          <span>📁 {task.projectKey}</span>
        </div>

        <div className="card-meta-row">
          <span className={`priority-pill priority-${task.priority.toLowerCase()}`}>
            <span>🚩</span> {task.priority}
          </span>
          {task.dueDateUtc && (
            <span className={`card-due-tag ${isOverdue(task.dueDateUtc, task.status) ? "overdue" : ""}`}>
              {formatCardDate(task.dueDateUtc)}
            </span>
          )}
        </div>

        {task.category && (
          <div className="card-category-row">
            <span className={`category-chip cat-${task.category.toLowerCase()}`}>
              🏷️ {task.category}
            </span>
          </div>
        )}

        <div className="card-bottom-row">
          <div className="card-assignee-group">
            {task.assigneeName ? (
              <div 
                className="assignee-bubble" 
                title={task.assigneeName}
                style={{ backgroundColor: getAvatarColor(task.assigneeName) }}
              >
                {getInitials(task.assigneeName)}
              </div>
            ) : (
              <div className="assignee-bubble-unassigned" title="Unassigned">
                👤
              </div>
            )}
            <span className="card-assignee-name">
              {task.assigneeName || "Unassigned"}
            </span>
          </div>

          <div className="card-actions-quick">
            <span className="card-key-pill">{task.projectKey}-{task.id}</span>
          </div>
        </div>
      </div>
    );
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
    <div className="tasks-page-wrapper">
      {/* Top Breadcrumb */}
      <div className="tasks-breadcrumb">
        <span>DevTask Hub</span>
        <span className="crumb-sep">·</span>
        <span>Projects</span>
        <span className="crumb-sep">·</span>
        <span className="crumb-current">{currentProjectName}</span>
      </div>

      {/* Header Row */}
      <div className="tasks-header-row">
        <h2>Tasks</h2>

        <div className="tasks-header-actions">
          <span className="tasks-count-badge">
            {allTasks.length} of {data?.totalCount ?? allTasks.length} tasks
          </span>

          <button 
            type="button" 
            className="btn-reset-board" 
            onClick={handleResetFilters}
            title="Reset filters and board state"
          >
            Reset board
          </button>

          <button 
            type="button"
            className="btn btn-primary" 
            onClick={openCreateModal}
          >
            + New task
          </button>

          {/* Segmented View Switcher */}
          <div className="view-segmented-control">
            <button
              type="button"
              className={`view-segment-btn ${viewMode === "kanban" ? "active" : ""}`}
              onClick={() => setViewMode("kanban")}
            >
              <span>☷</span> Kanban
            </button>
            <button
              type="button"
              className={`view-segment-btn ${viewMode === "list" ? "active" : ""}`}
              onClick={() => setViewMode("list")}
            >
              <span>☰</span> List
            </button>
          </div>
        </div>
      </div>

      {/* Query & Filter Bar */}
      <div className="kanban-query-bar">
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input
            type="search"
            placeholder="Search by title or #ID…"
            className="search-input-styled"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        <div className="kanban-filters-group">
          <button
            type="button"
            className={`kanban-filter-pill ${mineOnly ? "active" : ""}`}
            onClick={() => { setMineOnly(!mineOnly); setPage(1); }}
          >
            <span>👤</span> Mine
          </button>

          <select
            className="kanban-filter-select"
            value={priorityFilter}
            onChange={(e) => { setPriorityFilter(e.target.value as TaskPriority | ""); setPage(1); }}
          >
            <option value="">🚩 Priority</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>

          <select
            className="kanban-filter-select"
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          >
            <option value="">🏷️ Category</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            className="kanban-filter-select"
            value={selectedProjectId}
            onChange={(e) => {
              const val = e.target.value ? Number(e.target.value) : "";
              setSelectedProjectId(val);
              setPage(1);
              setSearchParams(val !== "" ? { projectId: String(val) } : {});
            }}
          >
            <option value="">📁 Projects</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>[{p.key}] {p.name}</option>
            ))}
          </select>

          {viewMode === "list" && (
            <select
              className="kanban-filter-select"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as TaskStatus | ""); setPage(1); }}
            >
              <option value="">All Statuses</option>
              <option value="ToDo">To Do</option>
              <option value="InProgress">In Progress</option>
              <option value="InReview">In Review</option>
              <option value="Done">Done</option>
            </select>
          )}

          {(search || selectedProjectId !== "" || statusFilter || priorityFilter || categoryFilter || mineOnly) && (
            <button
              type="button"
              className="btn-clear-filters"
              onClick={handleResetFilters}
            >
              ✕ Clear
            </button>
          )}
        </div>
      </div>

      {transitionError && (
        <div className="form-error" style={{ marginBottom: "16px" }} role="alert">
          ⚠️ {transitionError}
        </div>
      )}

      {error && (
        <div className="form-error" role="alert" style={{ marginBottom: "16px" }}>
          {error}
        </div>
      )}

      {/* Main Board / List View */}
      {loading ? (
        <p className="page-state">Loading tasks…</p>
      ) : viewMode === "kanban" ? (
        /* KANBAN BOARD VIEW */
        <div className="kanban-board-grid">
          {/* Column 1: To Do */}
          <div 
            className="kanban-column"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDropTask(e, "ToDo")}
          >
            <div className="kanban-column-header">
              <div className="kanban-header-capsule header-capsule-todo">
                <span className="kanban-count-circle">{todoTasks.length}</span>
                <span className="kanban-column-title">To Do</span>
                <button 
                  type="button"
                  className="kanban-add-task-btn" 
                  title="Create To Do task"
                  onClick={openCreateModal}
                >
                  +
                </button>
              </div>
              <p className="kanban-column-subtext">{currentProjectName}</p>
            </div>
            <div className="kanban-cards-scroll">
              {todoTasks.length === 0 ? (
                <div className="empty-column-msg">No tasks to do</div>
              ) : (
                todoTasks.map(renderCard)
              )}
            </div>
          </div>

          {/* Column 2: In Progress */}
          <div 
            className="kanban-column"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDropTask(e, "InProgress")}
          >
            <div className="kanban-column-header">
              <div className="kanban-header-capsule header-capsule-inprogress">
                <span className="kanban-count-circle">{inProgressTasks.length}</span>
                <span className="kanban-column-title">In Progress</span>
                <button 
                  type="button"
                  className="kanban-add-task-btn" 
                  title="Create In Progress task"
                  onClick={openCreateModal}
                >
                  +
                </button>
              </div>
              <p className="kanban-column-subtext">{currentProjectName}</p>
            </div>
            <div className="kanban-cards-scroll">
              {inProgressTasks.length === 0 ? (
                <div className="empty-column-msg">No tasks in progress</div>
              ) : (
                inProgressTasks.map(renderCard)
              )}
            </div>
          </div>

          {/* Column 3: Review */}
          <div 
            className="kanban-column"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDropTask(e, "InReview")}
          >
            <div className="kanban-column-header">
              <div className="kanban-header-capsule header-capsule-inreview">
                <span className="kanban-count-circle">{inReviewTasks.length}</span>
                <span className="kanban-column-title">Review</span>
                <button 
                  type="button"
                  className="kanban-add-task-btn" 
                  title="Create Review task"
                  onClick={openCreateModal}
                >
                  +
                </button>
              </div>
              <p className="kanban-column-subtext">{currentProjectName}</p>
            </div>
            <div className="kanban-cards-scroll">
              {inReviewTasks.length === 0 ? (
                <div className="empty-column-msg">No tasks in review</div>
              ) : (
                inReviewTasks.map(renderCard)
              )}
            </div>
          </div>

          {/* Column 4: Done */}
          <div 
            className="kanban-column"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDropTask(e, "Done")}
          >
            <div className="kanban-column-header">
              <div className="kanban-header-capsule header-capsule-done">
                <span className="kanban-count-circle">{doneTasks.length}</span>
                <span className="kanban-column-title">Done</span>
                <button 
                  type="button"
                  className="kanban-add-task-btn" 
                  title="Create Done task"
                  onClick={openCreateModal}
                >
                  +
                </button>
              </div>
              <p className="kanban-column-subtext">{currentProjectName}</p>
            </div>
            <div className="kanban-cards-scroll">
              {doneTasks.length === 0 ? (
                <div className="empty-column-msg">No completed tasks</div>
              ) : (
                doneTasks.map(renderCard)
              )}
            </div>
          </div>
        </div>
      ) : (
        /* TABLE LIST VIEW */
        !data || data.items.length === 0 ? (
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
                    <th>Category</th>
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
                        {task.category ? (
                          <span className={`category-chip cat-${task.category.toLowerCase()}`}>
                            🏷️ {task.category}
                          </span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
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
        )
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
              <label htmlFor="task-category">Category</label>
              <select
                id="task-category"
                className="filter-select"
                style={{ width: "100%", padding: "8px" }}
                value={isCustomCategory ? "__CUSTOM__" : modalCategory}
                onChange={(e) => {
                  if (e.target.value === "__CUSTOM__") {
                    setIsCustomCategory(true);
                  } else {
                    setIsCustomCategory(false);
                    setModalCategory(e.target.value);
                  }
                }}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
                <option value="__CUSTOM__">+ Create new category…</option>
              </select>
            </div>
          </div>

          {isCustomCategory && (
            <div className="field">
              <label htmlFor="new-category-input">New Category Name</label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  id="new-category-input"
                  type="text"
                  placeholder="e.g. Design, DevOps, QA, Research"
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

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
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

            <div className="field">
              <label htmlFor="task-due">Due Date (optional)</label>
              <input
                id="task-due"
                type="date"
                value={modalDueDate}
                onChange={(e) => setModalDueDate(e.target.value)}
              />
            </div>
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
