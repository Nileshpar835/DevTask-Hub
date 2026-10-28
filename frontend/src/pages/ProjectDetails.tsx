import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import {
    useCallback, useEffect, useState, type FormEvent
} from "react";
import {
    fetchProjectById,
    updateProject,
    deleteProject,
    addProjectMember,
    removeProjectMember,
    type ProjectDetail,
    type ProjectStatus
} from "../api/projects";

import { fetchUsers, type UserSummary } from "../api/users";
import { isAxiosError } from "axios";
import { Modal } from "../components/ui/Modal";
import { Badge } from "../components/ui/Badge";

export default function ProjectDetails() {
    const { id } = useParams<{ id: string }>();
    const projectId = Number(id);
    const navigate = useNavigate();
    const { user } = useAuth();
    const [project, setProject] = useState<ProjectDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [pageError, setPageError] = useState<string | null>(null);
    // Available users for Add Member dropdown (if Admin)
    const [availableUsers, setAvailableUsers] = useState<UserSummary[]>([]);
    // Edit Modal State
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editName, setEditName] = useState("");
    const [editDesc, setEditDesc] = useState("");
    const [editStatus, setEditStatus] = useState<ProjectStatus>("Active");
    const [editError, setEditError] = useState<string | null>(null);
    const [savingEdit, setSavingEdit] = useState(false);
    // Add Member Modal State
    const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<number | "">("");
    const [manualUserId, setManualUserId] = useState("");
    const [memberError, setMemberError] = useState<string | null>(null);
    const [addingMember, setAddingMember] = useState(false);
    // Delete Confirm Modal State
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    const loadProjects = useCallback(async () => {
        if (isNaN(projectId)) {
            setPageError("Invalid Project Id.");
            setLoading(false);
            return;
        }
        setLoading(true);
        setPageError(null);
        try {
            const data = await fetchProjectById(projectId);
            setProject(data);
            setEditName(data.name);
            setEditDesc(data.description || "");
            setEditStatus(data.status);
        } catch (err) {
            if (isAxiosError(err)) {
                setPageError(err.response?.data?.error ?? "Failed to load Project details.");
            } else {
                setPageError("An unexpected error occurred.");
            }
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(()=>{
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadProjects();
    },[loadProjects]);

    useEffect(() => {
        if (user?.role === "Admin") {
            fetchUsers()
                .then((users) => setAvailableUsers(users.filter(u => u.isActive)))
                .catch(() => setAvailableUsers([]));
        }
    }, [user]);


    const isOwnerOrAdmin = user?.role === "Admin" || (project && user?.id === project.ownerUserId);

    async function handleSaveEdit(e: FormEvent) {
        e.preventDefault();
        if (!editName.trim()) {
            setEditError("Project name is Required.");
            return;
        }
        setSavingEdit(true);
        setEditError(null);
        try {
            await updateProject(projectId, {
                name: editName.trim(),
                description: editDesc.trim() || undefined,
                status: editStatus,
            });
            setIsEditOpen(false);
            loadProjects();

        } catch (err) {
            if (isAxiosError(err)) {
                setEditError(err.response?.data?.error ?? "failed to update project.");
            } else {
                setEditError("an unexpected error occured.");
            }
        } finally {
            setSavingEdit(false);
        }
    }
    async function handleAddMember(e: FormEvent) {
        e.preventDefault();
        const targetUserId = selectedUserId !== "" ? Number(selectedUserId) : Number(manualUserId);
        if (!targetUserId || isNaN(targetUserId)) {
            setMemberError("Please select or enter a valid User ID.");
            return;
        }
        setAddingMember(true);
        setMemberError(null);
        try {
            await addProjectMember(projectId, targetUserId);
            setIsAddMemberOpen(false);
            setSelectedUserId("");
            setManualUserId("");
            loadProjects();
        } catch (err) {
            if (isAxiosError(err)) {
                setMemberError(err.response?.data?.error ?? "Failed to add member.");
            } else {
                setMemberError("An unexpected error occurred.");
            }
        } finally {
            setAddingMember(false);
        }
    }
    async function handleRemoveMember(memberUserId: number) {
        if (!window.confirm("Are you sure you want to remove this member from the project?")) return;
        try {
            await removeProjectMember(projectId, memberUserId);
            loadProjects();
        } catch (err) {
            if (isAxiosError(err)) {
                alert(err.response?.data?.error ?? "Failed to remove member.");
            } else {
                alert("An unexpected error occurred.");
            }
        }
    }
    async function handleDeleteProject() {
        setDeleting(true);
        setDeleteError(null);
        try {
            await deleteProject(projectId);
            navigate("/projects", { replace: true });
        } catch (err) {
            if (isAxiosError(err)) {
                setDeleteError(err.response?.data?.error ?? "Cannot delete project.");
            } else {
                setDeleteError("An unexpected error occurred.");
            }
        } finally {
            setDeleting(false);
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
    if (loading) return <p className="page-state">Loading project details…</p>;
    if (pageError || !project) {
        return (
            <div className="projects-container">
                <div className="form-error" role="alert">{pageError ?? "Project not found."}</div>
                <Link to="/projects" className="btn">← Back to Projects</Link>
            </div>
        );
    }
    // Filter out users who are already members
    const nonMemberUsers = availableUsers.filter(
        (u) => !project.members.some((m) => m.userId === u.id)
    );

    return (
        <div className="project-container">
            <div className="page-header">
                <div>
                    <Link to="/projects" className="back-link"> ⬅️ All Projects</Link>
                    <div className="project-header-title">
                        <span className="project-key">{project.key}</span>
                        <h2>{project.name}</h2>
                        {getStatusBadge(project.status)}
                    </div>
                </div>

                {isOwnerOrAdmin && (
                    <div className="header-action">
                        <button className="btn" onClick={() => setIsEditOpen(true)}>
                            Edit Project
                        </button>
                        <button className="btn btn-danger" onClick={() => setIsDeleteOpen(true)}>
                            Delete
                        </button>
                    </div>
                )}
            </div>
            {/* Overview Card */}
            <div className="detail-card">
                <h3>Overview</h3>
                <p className="detail-desc">{project.description || "No description provided."}</p>
                <div className="detail-grid">
                    <div>
                        <span className="detail-label">Project Owner</span>
                        <p className="detail-value">👤 {project.ownerName}</p>
                    </div>
                    <div>
                        <span className="detail-label">Created Date</span>
                        <p className="detail-value">{new Date(project.createdAtUtc).toLocaleDateString()}</p>
                    </div>
                    <div>
                        <span className="detail-label">Last Updated</span>
                        <p className="detail-value">{new Date(project.updatedAtUtc).toLocaleDateString()}</p>
                    </div>
                </div>
            </div>

            {/* Team Members Section */}
            <div className="detail-card" style={{ marginTop: "24px" }}>
                <div className="card-header-flex">
                    <div>
                        <h3>Team Members ({project.members.length})</h3>
                        <p className="page-subtitle">Users assigned to collaborate on tasks in this project.</p>
                    </div>
                    {isOwnerOrAdmin && (
                        <button className="btn btn-primary" onClick={() => setIsAddMemberOpen(true)}>
                            + Add Member
                        </button>
                    )}
                </div>
                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Member</th>
                                <th>Email</th>
                                <th>System Role</th>
                                <th>Joined Date</th>
                                {isOwnerOrAdmin && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {project.members.map((member) => {
                                const isOwner = member.userId === project.ownerUserId;
                                return (
                                    <tr key={member.id}>
                                        <td>
                                            <strong>{member.fullName}</strong>
                                            {isOwner && <span className="owner-badge">Owner</span>}
                                        </td>
                                        <td>{member.email}</td>
                                        <td>
                                            <Badge variant="neutral">{member.role}</Badge>
                                        </td>
                                        <td>{new Date(member.addedAtUtc).toLocaleDateString()}</td>
                                        {isOwnerOrAdmin && (
                                            <td>
                                                {!isOwner ? (
                                                    <button
                                                        type="button"
                                                        className="btn-action-delete"
                                                        onClick={() => handleRemoveMember(member.userId)}
                                                    >
                                                        Remove
                                                    </button>
                                                ) : (
                                                    <span className="text-muted" style={{ fontSize: "12px" }}>Owner</span>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
            {/* Edit Project Modal */}
            <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Project Details">
                {editError && <div className="form-error">{editError}</div>}
                <form onSubmit={handleSaveEdit} noValidate>
                    <div className="field">
                        <label htmlFor="edit-name">Project Name</label>
                        <input
                            id="edit-name"
                            type="text"
                            maxLength={150}
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                        />
                    </div>
                    <div className="field">
                        <label htmlFor="edit-desc">Description</label>
                        <textarea
                            id="edit-desc"
                            rows={3}
                            className="field-textarea"
                            maxLength={2000}
                            value={editDesc}
                            onChange={(e) => setEditDesc(e.target.value)}
                        />
                    </div>
                    <div className="field">
                        <label htmlFor="edit-status">Status</label>
                        <select
                            id="edit-status"
                            className="filter-select"
                            style={{ width: "100%" }}
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value as ProjectStatus)}
                        >
                            <option value="Active">Active</option>
                            <option value="OnHold">On Hold</option>
                            <option value="Archived">Archived</option>
                        </select>
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


            {/* Add Member Modal */}
            <Modal isOpen={isAddMemberOpen} onClose={() => setIsAddMemberOpen(false)} title="Add Team Member">
                {memberError && <div className="form-error">{memberError}</div>}
                <form onSubmit={handleAddMember} noValidate>
                    {availableUsers.length > 0 ? (
                        <div className="field">
                            <label htmlFor="select-user">Select Developer</label>
                            <select
                                id="select-user"
                                className="filter-select"
                                style={{ width: "100%", padding: "8px" }}
                                value={selectedUserId}
                                onChange={(e) => setSelectedUserId(e.target.value ? Number(e.target.value) : "")}
                            >
                                <option value="">-- Choose an active user --</option>
                                {nonMemberUsers.map((u) => (
                                    <option key={u.id} value={u.id}>
                                        {u.fullname} ({u.email}) — {u.role}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <div className="field">
                            <label htmlFor="manual-user-id">User ID to Add</label>
                            <input
                                id="manual-user-id"
                                type="number"
                                placeholder="Enter user numeric ID (e.g. 2)"
                                value={manualUserId}
                                onChange={(e) => setManualUserId(e.target.value)}
                            />
                        </div>
                    )}
                    <div className="modal-actions">
                        <button type="button" className="btn" onClick={() => setIsAddMemberOpen(false)}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={addingMember}>
                            {addingMember ? "Adding…" : "Add to Team"}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete Project">
                {deleteError && <div className="form-error">{deleteError}</div>}
                <p>
                    Are you sure you want to permanently delete <strong>{project.name}</strong>?
                </p>
                <p style={{ color: "var(--muted)", fontSize: "13px" }}>
                    This action cannot be undone. Projects with active tasks cannot be deleted.
                </p>
                <div className="modal-actions">
                    <button type="button" className="btn" onClick={() => setIsDeleteOpen(false)}>
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="btn btn-danger"
                        disabled={deleting}
                        onClick={handleDeleteProject}
                    >
                        {deleting ? "Deleting…" : "Confirm Delete"}
                    </button>
                </div>
            </Modal>
        </div>
    );
}