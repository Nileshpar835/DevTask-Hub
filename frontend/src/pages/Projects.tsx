import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { isAxiosError } from "axios";
import {
    fetchProjects,
    createProject,
    type ProjectSummary,
    type ProjectStatus,
    type PagedResult
} from "../api/projects";
import { Badge } from "../components/ui/Badge";
import { Modal } from "../components/ui/Modal";
import { Pagination } from "../components/ui/Pagination";


export default function Projects() {
    const [data, setData] = useState<PagedResult<ProjectSummary> | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    // Filter & Query States
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<ProjectStatus | "">("");
    const [mineOnly, setMineOnly] = useState(false);
    const [page, setPage] = useState(1);
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newKey, setNewKey] = useState("");
    const [newName, setNewName] = useState("");
    const [newDescription, setNewDescription] = useState("");
    const [formError, setFormError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);


    const loadProjects = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetchProjects({
                page,
                pageSize: 10,
                search: search.trim() || undefined,
                status: statusFilter || undefined,
                mine: mineOnly || undefined,
            });
            setData(res);
        } catch (err) {
            if (isAxiosError(err)) {
                setError(err.response?.data?.error ?? "Failed to load Projects");
            } else {
                setError("An unexpected error occured while loading projects");
            }

        } finally {
            setLoading(false);
        }
    }, [page, search, statusFilter, mineOnly]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadProjects();
    }, [loadProjects]);

    async function handleCreateProject(e: FormEvent) {
        e.preventDefault();
        if (!newKey.trim()) {
            setFormError("Project Key is required (e.g. 'CORE', 'API').");
            return;
        }
        if (!newName.trim()) {
            setFormError("Project Name is Required.");
            return;
        }
        setSubmitting(true);
        setFormError(null);
        try {
            await createProject({
                key: newKey.trim().toUpperCase(),
                name: newName.trim(),
                description: newDescription.trim() || undefined,
            });
            setIsModalOpen(false);
            setNewKey("");
            setNewName("");
            setNewDescription("");
            loadProjects();

        } catch (err) {
            if (isAxiosError(err)) {
                setFormError(err.response?.data?.error ?? "failed to create project.");
            } else {
                setFormError("An unexpected error occured");
            }
        } finally {
            setSubmitting(false);
        }
    }
    function getStatusBadge(status: ProjectStatus) {
        switch (status) {
            case "Active": return <Badge variant="success">Active</Badge>;

            case "OnHold": return <Badge variant="warning">On Hold</Badge>;

            case "Archived": return <Badge variant="neutral">Archived</Badge>;

            default: return <Badge>{status}</Badge>;
        }
    }

    return (
        <div className="projects-container">
            <div className="page-header">
                <div>
                    <h2>Projects</h2>
                    <p className="page-subtitle">Track and Organize software repositories and task.</p>
                </div>
                <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                    + New Project
                </button>
            </div>
            {/* Filter and Search Bar */}
            <div className="filter-bar">
                <input
                    type="search"
                    placeholder="Search by key or name.."
                    className="search-input"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }} />

                <div className="filter-group">
                    <button
                        type="button"
                        className={`filter-pill ${mineOnly ? "active" : ""}`}
                        onClick={() => { setMineOnly(!mineOnly); setPage(1); }}>
                        My Projects
                    </button>
                    <select
                        className="filter-select"
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value as ProjectStatus | ""); setPage(1); }}
                    >
                        <option value="">All Statuses</option>
                        <option value="Active">Active</option>
                        <option value="OnHold">On Hold</option>
                        <option value="Archived">Archived</option>
                    </select>
                </div>
            </div>
            {/* Content States */}
            {loading ? (
                <p className="page-state">Loading projects…</p>
            ) : error ? (
                <div className="form-error" role="alert">{error}</div>
            ) : !data || data.items.length === 0 ? (
                <div className="empty-state">
                    <h3>No projects found</h3>
                    <p>Try adjusting your search filters or create a new project.</p>
                </div>
            ) : (
                <>
                    <div className="project-grid">
                        {data.items.map((project) => (
                            <div key={project.id} className="project-card">
                                <div className="project-card-header">
                                    <span className="project-key">{project.key}</span>
                                    {getStatusBadge(project.status)}
                                </div>
                                <h3 className="project-title">
                                    <Link to={`/projects/${project.id}`}>{project.name}</Link>
                                </h3>
                                <p className="project-description">
                                    {project.description || "No description provided."}
                                </p>
                                <div className="project-meta">
                                    <span>👤 {project.ownerName}</span>
                                    <span>👥 {project.memberCount} members</span>
                                    <span>📋 {project.taskCount} tasks</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <Pagination
                        page={data.page}
                        totalpages={data.totalPages}
                        onPageChange={(newPage) => setPage(newPage)}
                    />
                </>
            )}
            {/* Create Project Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Project">
                {formError && <div className="form-error">{formError}</div>}
                <form onSubmit={handleCreateProject} noValidate>
                    <div className="field">
                        <label htmlFor="project-key">Project Key (2–10 uppercase characters)</label>
                        <input
                            id="project-key"
                            type="text"
                            placeholder="e.g. TASK"
                            maxLength={10}
                            value={newKey}
                            onChange={(e) => setNewKey(e.target.value.toUpperCase())}
                        />
                    </div>
                    <div className="field">
                        <label htmlFor="project-name">Project Name</label>
                        <input
                            id="project-name"
                            type="text"
                            placeholder="e.g. Developer Task Hub"
                            maxLength={150}
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                        />
                    </div>
                    <div className="field">
                        <label htmlFor="project-desc">Description (optional)</label>
                        <textarea
                            id="project-desc"
                            rows={3}
                            className="field-textarea"
                            placeholder="Brief description of the project goals…"
                            maxLength={2000}
                            value={newDescription}
                            onChange={(e) => setNewDescription(e.target.value)}
                        />
                    </div>
                    <div className="modal-actions">
                        <button type="button" className="btn" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={submitting}>
                            {submitting ? "Creating…" : "Create Project"}
                        </button>
                    </div>
                </form>
            </Modal>

        </div>
    );


}