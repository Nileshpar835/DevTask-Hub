import { useEffect, useState, type FormEvent } from "react";
import { isAxiosError } from "axios";
import { useAuth } from "../context/useAuth";
import { 
  fetchMyGitHubProfile, 
  linkGitHubProfile, 
  unlinkGitHubProfile, 
  type GitHubProfile 
} from "../api/github";
import { Badge } from "../components/ui/Badge";
import { Modal } from "../components/ui/Modal";

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<GitHubProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [usernameInput, setUsernameInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDisconnectOpen, setIsDisconnectOpen] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    fetchMyGitHubProfile()
      .then(setProfile)
      .finally(() => setLoading(false));
  }, []);

  async function handleLink(e: FormEvent) {
    e.preventDefault();
    if (!usernameInput.trim()) {
      setError("Please enter your GitHub username.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const linked = await linkGitHubProfile(usernameInput.trim());
      setProfile(linked);
      setUsernameInput("");
      setSuccess(`Successfully linked @${linked.username}!`);
    } catch (err) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.error ?? "Failed to link GitHub account.");
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmDisconnect() {
    setDisconnecting(true);
    try {
      await unlinkGitHubProfile();
      setProfile(null);
      setIsDisconnectOpen(false);
      setSuccess("GitHub account disconnected.");
    } catch {
      setError("Failed to disconnect GitHub profile.");
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <div className="projects-container">
      <div className="page-header">
        <div>
          <h2>User Profile</h2>
          <p className="page-subtitle">Manage your account information and developer integrations.</p>
        </div>
      </div>

      {/* Account Info Card */}
      <div className="detail-card">
        <h3>Account Details</h3>
        <div className="detail-grid" style={{ marginTop: "16px" }}>
          <div>
            <span className="detail-label">Full Name</span>
            <p className="detail-value">{user?.fullName}</p>
          </div>
          <div>
            <span className="detail-label">Email Address</span>
            <p className="detail-value">{user?.email}</p>
          </div>
          <div>
            <span className="detail-label">Role</span>
            <div style={{ marginTop: "4px" }}>
              <Badge variant={user?.role === "Admin" ? "primary" : "neutral"}>
                {user?.role}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* GitHub Integration Card */}
      <div className="detail-card" style={{ marginTop: "24px" }}>
        <h3>GitHub Integration</h3>
        <p className="detail-desc">
          Link your GitHub profile to connect pull requests and display your developer identity.
        </p>

        {error && <div className="form-error">{error}</div>}
        {success && <div className="form-success">{success}</div>}

        {loading ? (
          <p className="page-state">Loading GitHub status…</p>
        ) : profile ? (
          <div className="github-profile-card">
            {profile.avatarUrl && (
              <img src={profile.avatarUrl} alt={profile.username} className="github-avatar" />
            )}
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <strong>{profile.displayName || profile.username}</strong>
                <a href={profile.profileUrl || `https://github.com/${profile.username}`} target="_blank" rel="noreferrer" className="back-link">
                  @{profile.username} ↗
                </a>
              </div>
              <p className="text-muted" style={{ fontSize: "12px", margin: "4px 0 0" }}>
                Connected on {profile.fetchedAtUtc ? new Date(profile.fetchedAtUtc).toLocaleDateString() : "recently"}
              </p>
            </div>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => setIsDisconnectOpen(true)}
            >
              Disconnect
            </button>
          </div>
        ) : (
          <form onSubmit={handleLink} style={{ maxWidth: "400px", marginTop: "12px" }}>
            <div className="field">
              <label htmlFor="gh-username">GitHub Username</label>
              <input
                id="gh-username"
                type="text"
                placeholder="e.g. octocat"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Connecting…" : "Connect GitHub Account"}
            </button>
          </form>
        )}
      </div>

      {/* Disconnect GitHub Modal */}
      <Modal
        isOpen={isDisconnectOpen}
        onClose={() => {
          if (!disconnecting) setIsDisconnectOpen(false);
        }}
        title="Disconnect GitHub Profile"
      >
        <p>
          Are you sure you want to disconnect your GitHub account (<strong>@{profile?.username}</strong>)?
        </p>
        <p style={{ color: "var(--muted)", fontSize: "13px", marginTop: "8px" }}>
          You can reconnect this or another GitHub username at any time.
        </p>
        <div className="modal-actions" style={{ marginTop: "20px" }}>
          <button
            type="button"
            className="btn"
            disabled={disconnecting}
            onClick={() => setIsDisconnectOpen(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger"
            disabled={disconnecting}
            onClick={handleConfirmDisconnect}
          >
            {disconnecting ? "Disconnecting…" : "Disconnect"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
