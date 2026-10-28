import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { fetchUsers, toggleUserStatus, type UserSummary } from "../api/users";
import { useAuth } from "../context/useAuth";
import { Badge } from "../components/ui/Badge";

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [togglingId, setTogglingId] = useState<number | null>(null);

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

  return (
    <div className="projects-container">
      <div className="page-header">
        <div>
          <h2>User Management</h2>
          <p className="page-subtitle">View and manage system users, roles, and account access.</p>
        </div>
      </div>

      {error && <div className="form-error">{error}</div>}

      {/* Query Bar */}
      <div className="query-bar" style={{ marginBottom: "16px" }}>
        <input
          type="search"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
          style={{ maxWidth: "320px" }}
        />

        <div className="query-filters">
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
        </div>
      </div>

      {loading ? (
        <p className="page-state">Loading users…</p>
      ) : filteredUsers.length === 0 ? (
        <div className="empty-state">
          <p>No users matched the search criteria.</p>
        </div>
      ) : (
        <div className="projects-table-wrap">
          <table className="projects-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => {
                const isSelf = u.id === currentUser?.id;
                return (
                  <tr key={u.id}>
                    <td>
                      <strong>{u.fullname}</strong>
                      {isSelf && (
                        <span className="badge badge-neutral" style={{ marginLeft: "8px", fontSize: "11px" }}>
                          You
                        </span>
                      )}
                    </td>
                    <td className="text-muted">{u.email}</td>
                    <td>
                      <Badge variant={u.role === "Admin" ? "primary" : "neutral"}>
                        {u.role}
                      </Badge>
                    </td>
                    <td>
                      <Badge variant={u.isActive ? "success" : "danger"}>
                        {u.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        type="button"
                        className={u.isActive ? "btn-action-delete" : "btn"}
                        style={!u.isActive ? { fontSize: "12px", padding: "4px 8px" } : {}}
                        disabled={isSelf || togglingId === u.id}
                        onClick={() => handleToggleStatus(u)}
                      >
                        {togglingId === u.id
                          ? "Updating…"
                          : u.isActive
                          ? "Deactivate"
                          : "Reactivate"}
                      </button>
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
