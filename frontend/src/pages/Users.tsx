import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { fetchUsers, toggleUserStatus, deleteUser, type UserSummary } from "../api/users";
import { useAuth } from "../context/useAuth";
import { Badge } from "../components/ui/Badge";

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
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

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

  async function handleToggleStatus(targetUser: UserSummary) {
    if (targetUser.role === "Admin" && targetUser.isActive) {
      alert("Administrator accounts cannot be deactivated.");
      return;
    }

    if (targetUser.id === currentUser?.id) {
      alert("You cannot deactivate your own account.");
      return;
    }

    const action = targetUser.isActive ? "deactivate" : "reactivate";
    if (!window.confirm(`Are you sure you want to ${action} user "${targetUser.fullname}"?`)) {
      return;
    }

    setTogglingId(targetUser.id);
    try {
      const updated = await toggleUserStatus(targetUser.id);
      setUsers((prev) =>
        prev.map((u) => (u.id === updated.id ? { ...u, isActive: updated.isActive } : u))
      );
    } catch (err) {
      if (isAxiosError(err)) {
        alert(err.response?.data?.error ?? `Failed to ${action} user.`);
      } else {
        alert("An unexpected error occurred.");
      }
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDeleteUser(targetUser: UserSummary) {
    if (targetUser.role === "Admin") {
      alert("Administrator accounts cannot be deleted.");
      return;
    }

    if (targetUser.id === currentUser?.id) {
      alert("You cannot delete your own account.");
      return;
    }

    if (!window.confirm(`Permanently delete user "${targetUser.fullname}" (${targetUser.email})?\n\nThis will unassign any tasks assigned to them and remove their memberships. This action cannot be undone.`)) {
      return;
    }

    setDeletingId(targetUser.id);
    try {
      await deleteUser(targetUser.id);
      setUsers((prev) => prev.filter((u) => u.id !== targetUser.id));
    } catch (err) {
      if (isAxiosError(err)) {
        alert(err.response?.data?.error ?? "Failed to delete user.");
      } else {
        alert("An unexpected error occurred.");
      }
    } finally {
      setDeletingId(null);
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
                          disabled={isAdminUser || isSelf || togglingId === u.id || deletingId === u.id}
                          title={isAdminUser ? "Administrators cannot be deactivated" : undefined}
                          onClick={() => handleToggleStatus(u)}
                        >
                          {togglingId === u.id
                            ? "Updating…"
                            : u.isActive
                            ? "Deactivate"
                            : "Reactivate"}
                        </button>

                        {!isAdminUser && (
                          <button
                            type="button"
                            className="btn btn-danger"
                            style={{ fontSize: "12px", padding: "4px 8px" }}
                            disabled={isSelf || deletingId === u.id || togglingId === u.id}
                            onClick={() => handleDeleteUser(u)}
                          >
                            {deletingId === u.id ? "Deleting…" : "Delete"}
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
    </div>
  );
}
