import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";

interface NavItem { to: string; label: string; end?: boolean; adminOnly?: boolean }
// Role-aware filtering (hiding "Users" from non-admins) arrives in 4.3.
const NAV_ITEMS: NavItem[] = [
    { to: "/", label: "Dashboard", end: true },
    { to: "/projects", label: "Projects" },
    { to: "/tasks", label: "Tasks" },
    { to: "/users", label: "Users" },
    { to: "/profile", label: "Profile" },
];

const TITLES: Record<string, string> = {
    "/": "Dashboard",
    "/login": "Sign in",
    "/register": "Create account",
    "/users": "Users",
    "/profile": "Profile",
    "/403": "Forbidden",
};

function titleFor(path: string): string {
    if (TITLES[path]) return TITLES[path];
    const first = path.split("/").filter(Boolean)[0];
    if (first) return first.charAt(0).toUpperCase() + first.slice(1);
    return "DevTask Hub";
}

export default function Layout() {
    const [open, setOpen] = useState(false);
    const { pathname } = useLocation();
    const { user, logout } = useAuth();
    const visibleNav = NAV_ITEMS.filter((item) => !item.adminOnly || user?.role === "Admin");
    return (
        <div className={`app${open ? " nav-open" : ""}`}>
            <aside className="sidebar">
                <div className="brand">DevTask Hub</div>
                <nav className="nav">
                    {visibleNav.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
                            onClick={() => setOpen(false)}
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
                <div className="user-chip">
                    {user ? (
                        <>
                            <div>{user.fullName}</div>
                            <div className="user-role">{user.role}</div>
                            <button type="button" onClick={() => void logout()}>Sign Out</button>
                        </>
                    ) : (
                        "Not signed in"
                    )}
                </div>
            </aside>

            <div className="main">
                <header className="topbar">
                    <button className="hamburger" onClick={() => setOpen((v) => !v)} aria-label="Toggle navigation">
                        ☰
                    </button>
                    <h1 className="page-title">{titleFor(pathname)}</h1>
                    {user?.avatarUrl ? (
                        <img
                            src={user.avatarUrl}
                            alt={user.fullName}
                            className="avatar"
                            style={{ objectFit: "cover", border: "1px solid var(--border)" }}
                            title={user.gitHubUsername ? `${user.fullName} (@${user.gitHubUsername})` : user.fullName}
                        />
                    ) : (
                        <div className="avatar" aria-hidden="true">{user ? user.fullName.charAt(0).toUpperCase() : "?"}</div>
                    )}
                </header>
                <main className="content">
                    <Outlet />
                </main>
            </div>

            {open && <button className="scrim" onClick={() => setOpen(false)} aria-label="Close navigation" />}
        </div>
    );
}