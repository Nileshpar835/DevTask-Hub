import { Link } from "react-router-dom";

export function ProjectForm() {
  return (
    <div className="projects-container">
      <div className="detail-card" style={{ maxWidth: "560px", margin: "40px auto", textAlign: "center", padding: "36px 24px" }}>
        <h3>Project Management</h3>
        <p className="detail-desc" style={{ margin: "12px 0 24px" }}>
          Projects are created and configured via modals directly from the Projects directory.
        </p>
        <Link to="/projects" className="btn btn-primary">
          ← Go to Projects
        </Link>
      </div>
    </div>
  );
}

export function ProjectMembers() {
  return (
    <div className="projects-container">
      <div className="detail-card" style={{ maxWidth: "560px", margin: "40px auto", textAlign: "center", padding: "36px 24px" }}>
        <h3>Team Member Management</h3>
        <p className="detail-desc" style={{ margin: "12px 0 24px" }}>
          Team members and role permissions are managed directly on each project's details page.
        </p>
        <Link to="/projects" className="btn btn-primary">
          ← View Projects
        </Link>
      </div>
    </div>
  );
}

export function TaskCreate() {
  return (
    <div className="tasks-container">
      <div className="detail-card" style={{ maxWidth: "560px", margin: "40px auto", textAlign: "center", padding: "36px 24px" }}>
        <h3>Create New Task</h3>
        <p className="detail-desc" style={{ margin: "12px 0 24px" }}>
          Tasks can be created seamlessly using the "+ New Task" modal directly on the Tasks board.
        </p>
        <Link to="/tasks" className="btn btn-primary">
          ← Go to Tasks Board
        </Link>
      </div>
    </div>
  );
}

export function Forbidden() {
  return (
    <div className="projects-container">
      <div className="detail-card" style={{ maxWidth: "500px", margin: "60px auto", textAlign: "center", padding: "40px 24px" }}>
        <div style={{ fontSize: "44px", marginBottom: "8px" }}>🛡️</div>
        <span className="badge badge-danger" style={{ fontSize: "13px", padding: "4px 10px" }}>
          403 — Forbidden
        </span>
        <h2 style={{ margin: "16px 0 8px" }}>Access Denied</h2>
        <p className="detail-desc" style={{ marginBottom: "24px" }}>
          You do not have the required permissions to view this resource. Contact your administrator if you need access.
        </p>
        <Link to="/" className="btn btn-primary">
          ← Return to Dashboard
        </Link>
      </div>
    </div>
  );
}

export function NotFound() {
  return (
    <div className="projects-container">
      <div className="detail-card" style={{ maxWidth: "500px", margin: "60px auto", textAlign: "center", padding: "40px 24px" }}>
        <div style={{ fontSize: "44px", marginBottom: "8px" }}>🔍</div>
        <span className="badge badge-neutral" style={{ fontSize: "13px", padding: "4px 10px" }}>
          404 — Not Found
        </span>
        <h2 style={{ margin: "16px 0 8px" }}>Page Not Found</h2>
        <p className="detail-desc" style={{ marginBottom: "24px" }}>
          The page or route you are attempting to access does not exist or has been relocated.
        </p>
        <Link to="/" className="btn btn-primary">
          ← Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
