import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { isAxiosError } from "axios";
import { useAuth } from "../context/useAuth";
import { 
  fetchAdminDashboard, 
  fetchDeveloperDashboard, 
  type AdminDashboardData, 
  type DeveloperDashboardData 
} from "../api/dashboard";
import { Badge } from "../components/ui/Badge";

export default function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === "Admin";

  const [adminData, setAdminData] = useState<AdminDashboardData | null>(null);
  const [devData, setDevData] = useState<DeveloperDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (isAdmin) {
        const data = await fetchAdminDashboard();
        setAdminData(data);
      } else {
        const data = await fetchDeveloperDashboard();
        setDevData(data);
      }
    } catch (err) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.error ?? "Failed to load dashboard metrics.");
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDashboard();
  }, [loadDashboard]);

  if (loading) return <p className="page-state">Loading dashboard analytics…</p>;
  if (error) return <div className="form-error" role="alert">{error}</div>;

  return (
    <div className="dashboard-container">
      {/* Welcome Header */}
      <div className="page-header">
        <div>
          <h2>Welcome back, {user?.fullName}!</h2>
          <p className="page-subtitle">
            {isAdmin 
              ? "System-wide developer operations and project health overview." 
              : "Here is what needs your attention today."}
          </p>
        </div>
        <div className="header-actions">
          <Link to="/tasks" className="btn btn-primary">View All Tasks</Link>
          <Link to="/projects" className="btn">Projects</Link>
        </div>
      </div>

      {isAdmin && adminData && (
        <AdminDashboardView data={adminData} />
      )}

      {!isAdmin && devData && (
        <DeveloperDashboardView data={devData} />
      )}
    </div>
  );
}

// -------------------------------------------------------------
// Admin Dashboard Component
// -------------------------------------------------------------
function AdminDashboardView({ data }: { data: AdminDashboardData }) {
  return (
    <>
      {/* Stat KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <span className="kpi-label">Total Projects</span>
          <p className="kpi-value">{data.totalProjects}</p>
          <span className="kpi-subtext">{data.totalActiveProjects} currently active</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Total Tasks</span>
          <p className="kpi-value">{data.totalTasks}</p>
          <span className="kpi-subtext">{data.statusBreakdown.done} completed</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Active Users</span>
          <p className="kpi-value">{data.totalUsers}</p>
          <span className="kpi-subtext">{data.totalDevelopers} developers</span>
        </div>
        <div className="kpi-card kpi-alert">
          <span className="kpi-label">Overdue Tasks</span>
          <p className="kpi-value" style={{ color: "var(--danger)" }}>{data.overdueTasksCount}</p>
          <span className="kpi-subtext">Needs manager follow-up</span>
        </div>
      </div>

      {/* Status Breakdown & Organization Feed */}
      <div className="dashboard-split">
        {/* Status Breakdown Widget */}
        <div className="detail-card">
          <h3>Task Status Distribution</h3>
          <div className="breakdown-grid" style={{ marginTop: "16px" }}>
            <div className="breakdown-item">
              <span className="badge badge-neutral">To Do</span>
              <strong>{data.statusBreakdown.toDo}</strong>
            </div>
            <div className="breakdown-item">
              <span className="badge badge-primary">In Progress</span>
              <strong>{data.statusBreakdown.inProgress}</strong>
            </div>
            <div className="breakdown-item">
              <span className="badge badge-warning">In Review</span>
              <strong>{data.statusBreakdown.inReview}</strong>
            </div>
            <div className="breakdown-item">
              <span className="badge badge-success">Done</span>
              <strong>{data.statusBreakdown.done}</strong>
            </div>
          </div>
        </div>

        {/* Global Recent Activity Feed */}
        <div className="detail-card">
          <h3>Recent Organization Activity</h3>
          {data.recentActivities.length === 0 ? (
            <p className="text-muted" style={{ fontSize: "13px" }}>No recent activity.</p>
          ) : (
            <div className="activity-timeline" style={{ marginTop: "12px" }}>
              {data.recentActivities.map((act) => (
                <div key={act.id} className="timeline-item">
                  <div className="timeline-badge">●</div>
                  <div className="timeline-content">
                    <div className="timeline-header">
                      <strong>{act.userFullName}</strong>
                      <span className="timeline-action">{act.action}</span>
                      <span className="timeline-date">{new Date(act.timestampUtc).toLocaleTimeString()}</span>
                    </div>
                    {(act.oldValue || act.newValue) && (
                      <div className="timeline-diff">
                        {act.oldValue && <span className="diff-old">{act.oldValue}</span>}
                        {act.oldValue && act.newValue && <span className="diff-arrow">→</span>}
                        {act.newValue && <span className="diff-new">{act.newValue}</span>}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// -------------------------------------------------------------
// Developer Dashboard Component
// -------------------------------------------------------------
function DeveloperDashboardView({ data }: { data: DeveloperDashboardData }) {
  return (
    <>
      {/* Stat KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <span className="kpi-label">Assigned to Me</span>
          <p className="kpi-value">{data.totalAssignedTasks}</p>
          <span className="kpi-subtext">Active tasks</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">In Progress</span>
          <p className="kpi-value">{data.statusBreakdown.inProgress}</p>
          <span className="kpi-subtext">Currently working on</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">In Review</span>
          <p className="kpi-value">{data.statusBreakdown.inReview}</p>
          <span className="kpi-subtext">Awaiting feedback</span>
        </div>
        <div className="kpi-card kpi-alert">
          <span className="kpi-label">Overdue</span>
          <p className="kpi-value" style={{ color: "var(--danger)" }}>{data.overdueTasks.length}</p>
          <span className="kpi-subtext">Past due date</span>
        </div>
      </div>

      {/* Overdue Alerts Section */}
      {data.overdueTasks.length > 0 && (
        <div className="alert-card-danger" style={{ marginBottom: "24px" }}>
          <h3 style={{ margin: "0 0 12px", color: "var(--danger)" }}>⚠️ Overdue Tasks Requiring Action</h3>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Project</th>
                  <th>Priority</th>
                  <th>Due Date</th>
                </tr>
              </thead>
              <tbody>
                {data.overdueTasks.map((t) => (
                  <tr key={t.id}>
                    <td><Link to={`/tasks/${t.id}`}><strong>{t.title}</strong></Link></td>
                    <td><span className="project-key">{t.projectKey}</span></td>
                    <td><Badge variant="danger">{t.priority}</Badge></td>
                    <td style={{ color: "var(--danger)", fontWeight: 600 }}>
                      {t.dueDateUtc ? new Date(t.dueDateUtc).toLocaleDateString() : "Overdue"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Due Soon Tasks & Projects */}
      <div className="dashboard-split">
        {/* Due in next 7 days */}
        <div className="detail-card">
          <h3>Due in Next 7 Days ({data.dueSoonTasks.length})</h3>
          {data.dueSoonTasks.length === 0 ? (
            <p className="text-muted" style={{ fontSize: "13px" }}>No tasks due in the next 7 days. Great job!</p>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.dueSoonTasks.map((t) => (
                    <tr key={t.id}>
                      <td><Link to={`/tasks/${t.id}`}><strong>{t.title}</strong></Link></td>
                      <td>{t.dueDateUtc ? new Date(t.dueDateUtc).toLocaleDateString() : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* My Projects */}
        <div className="detail-card">
          <h3>My Projects ({data.myProjects.length})</h3>
          {data.myProjects.length === 0 ? (
            <p className="text-muted" style={{ fontSize: "13px" }}>You are not assigned to any projects yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px" }}>
              {data.myProjects.map((p) => (
                <div key={p.id} className="project-shortcut">
                  <span className="project-key">{p.key}</span>
                  <Link to={`/projects/${p.id}`} style={{ flex: 1, textDecoration: "none", color: "var(--text)" }}>
                    <strong>{p.name}</strong>
                  </Link>
                  <span className="text-muted" style={{ fontSize: "12px" }}>{p.taskCount} tasks</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}