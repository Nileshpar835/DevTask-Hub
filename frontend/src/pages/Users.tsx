import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { fetchUsers, toggleUserStatus, deleteUser, type UserSummary } from "../api/users";
import { useAuth } from "../context/useAuth";
import { Badge } from "../components/ui/Badge";
import { Modal } from "../components/ui/Modal";

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

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  // Status Change Modal State
  const [statusTarget, setStatusTarget] = useState<UserSummary | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [isToggling, setIsToggling] = useState(false);

  // Delete User Modal State
  const [deleteTarget, setDeleteTarget] = useState<UserSummary | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let ignore = false;

    fetchUsers()
      .then((data) => {
        if (!ignore) {
          setUsers(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (!ignore) {
          if (isAxiosError(err)) {
            setError(err.response?.data?.error ?? "Failed to load system users.");
          } else {
            setError("An unexpected error occurred.");
          }
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  function openStatusModal(u: UserSummary) {
    setStatusTarget(u);
    setStatusError(null);
  }

  async function handleConfirmToggleStatus() {
    if (!statusTarget) return;

    setIsToggling(true);
    setStatusError(null);
    try {
      const updated = await toggleUserStatus(statusTarget.id);
      setUsers((prev) =>
        prev.map((u) => (u.id === updated.id ? { ...u, isActive: updated.isActive } : u))
      );
      setStatusTarget(null);
    } catch (err) {
      if (isAxiosError(err)) {
        setStatusError(err.response?.data?.error ?? "Failed to update user status.");
      } else {
        setStatusError("An unexpected error occurred.");
      }
    } finally {
      setIsToggling(false);
    }
  }

  function openDeleteModal(u: UserSummary) {
    setDeleteTarget(u);
    setDeleteError(null);
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;

    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteUser(deleteTarget.id);
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      if (isAxiosError(err)) {
        setDeleteError(err.response?.data?.error ?? "Failed to delete user.");
      } else {
        setDeleteError("An unexpected error occurred.");
      }
    } finally {
      setIsDeleting(false);
    }
  }

  // Filter users client-side
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.fullname.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "All" || u.role === roleFilter;
    const matchesStatus =
      statusFilter === "All" ||
      (statusFilter === "Active" && u.isActive) ||
      (statusFilter === "Inactive" && !u.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const activeCount = users.filter((u) => u.isActive).length;

  return (
    <div className="tasks-page-wrapper">
      {/* Breadcrumb */}
      <div className="tasks-breadcrumb">
        <span>DevTask Hub</span>
        <span className="crumb-sep">·</span>
        <span>Administration</span>
        <span className="crumb-sep">·</span>
        <span className="crumb-current">User Directory</span>
      </div>

      {/* Header */}
      <div className="tasks-header-row">
        <div>
          <h2>User Management</h2>
          <p className="page-subtitle">View and manage system users, roles, and account access permissions.</p>
        </div>

        <div className="tasks-header-actions">
          <span className="tasks-count-badge">
            {filteredUsers.length} of {users.length} users ({activeCount} active)
          </span>
        </div>
      </div>

      {error && (
        <div className="form-error" role="alert" style={{ marginBottom: "16px" }}>
          {error}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="filter-bar" style={{ marginBottom: "20px" }}>
        <input
          type="search"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
          style={{ maxWidth: "320px" }}
        />

        <div className="filter-group">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="filter-select"
          >
            <option value="All">All Roles</option>
            <option value="Admin">Admin</option>
            <option value="Developer">Developer</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          {(search || roleFilter !== "All" || statusFilter !== "All") && (
            <button
              type="button"
              className="btn-clear-filters"
              onClick={() => {
                setSearch("");
                setRoleFilter("All");
                setStatusFilter("All");
              }}
            >
              ✕ Clear
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <p className="page-state">Loading users…</p>
      ) : filteredUsers.length === 0 ? (
        <div className="empty-state">
          <h3>No users found</h3>
          <p>No system accounts matched the search criteria.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Account Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => {
                const isSelf = u.id === currentUser?.id;
                const isAdminUser = u.role === "Admin";
                return (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div
                          className="assignee-bubble"
                          style={{
                            backgroundColor: getAvatarColor(u.fullname),
                            width: "30px",
                            height: "30px",
                            fontSize: "12px",
                          }}
                        >
                          {getInitials(u.fullname)}
                        </div>
                        <div>
                          <strong>{u.fullname}</strong>
                          {isSelf && (
                            <span className="owner-badge">
                              You
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="text-muted">{u.email}</td>
                    <td>
                      <Badge variant={isAdminUser ? "primary" : "neutral"}>
                        {u.role}
                      </Badge>
                    </td>
                    <td>
                      <Badge variant={u.isActive ? "success" : "danger"}>
                        {u.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "8px", justifyContent: "flex-end", alignItems: "center" }}>
                        <button
                          type="button"
                          className={u.isActive ? "btn-action-delete" : "btn"}
                          style={!u.isActive ? { fontSize: "12px", padding: "4px 10px" } : { fontSize: "13px" }}
                          disabled={isAdminUser || isSelf}
                          title={isAdminUser ? "Administrators cannot be deactivated" : isSelf ? "You cannot deactivate your own account" : undefined}
                          onClick={() => openStatusModal(u)}
                        >
                          {u.isActive ? "Deactivate" : "Reactivate"}
                        </button>

                        {!isAdminUser && (
                          <button
                            type="button"
                            className="btn btn-danger"
                            style={{ fontSize: "12px", padding: "4px 8px" }}
                            disabled={isSelf}
                            title={isSelf ? "You cannot delete your own account" : undefined}
                            onClick={() => openDeleteModal(u)}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Change Status Confirmation Modal */}
      <Modal
        isOpen={!!statusTarget}
        onClose={() => {
          if (!isToggling) setStatusTarget(null);
        }}
        title={statusTarget?.isActive ? "Deactivate Account" : "Reactivate Account"}
      >
        {statusError && <div className="form-error">{statusError}</div>}
        <p>
          Are you sure you want to {statusTarget?.isActive ? "deactivate" : "reactivate"}{" "}
          <strong>{statusTarget?.fullname}</strong> ({statusTarget?.email})?
        </p>
        {statusTarget?.isActive && (
          <p style={{ color: "var(--muted)", fontSize: "13px", marginTop: "8px" }}>
            Deactivated users will be prevented from logging in or being assigned to new tasks.
          </p>
        )}
        <div className="modal-actions" style={{ marginTop: "20px" }}>
          <button
            type="button"
            className="btn"
            disabled={isToggling}
            onClick={() => setStatusTarget(null)}
          >
            Cancel
          </button>
          <button
            type="button"
            className={statusTarget?.isActive ? "btn btn-danger" : "btn btn-primary"}
            disabled={isToggling}
            onClick={handleConfirmToggleStatus}
          >
            {isToggling ? "Updating…" : statusTarget?.isActive ? "Confirm Deactivate" : "Confirm Reactivate"}
          </button>
        </div>
      </Modal>

      {/* Delete User Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => {
          if (!isDeleting) setDeleteTarget(null);
        }}
        title="Delete User Account"
      >
        {deleteError && <div className="form-error">{deleteError}</div>}
        <p>
          Are you sure you want to permanently delete <strong>{deleteTarget?.fullname}</strong> ({deleteTarget?.email})?
        </p>
        <p style={{ color: "var(--muted)", fontSize: "13px", marginTop: "8px" }}>
          This will unassign any active tasks assigned to this user and remove all their project team memberships.
          <strong> This action cannot be undone.</strong>
        </p>
        <div className="modal-actions" style={{ marginTop: "20px" }}>
          <button
            type="button"
            className="btn"
            disabled={isDeleting}
            onClick={() => setDeleteTarget(null)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger"
            disabled={isDeleting}
            onClick={handleConfirmDelete}
          >
            {isDeleting ? "Deleting…" : "Permanently Delete"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
