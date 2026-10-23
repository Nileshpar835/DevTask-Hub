import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";

const Nav_Items = [
    { to: "/", label: "Dashboard", end: true },
    { to: "/projects", label: "Projects" },
    { to: "/tasks", label: "Tasks" },
    { to: "/users", label: "Users" },
    { to: "profile", label: "Profile" },
];

const Titles: Record<string, string> = {
    "/": "Dashboard",
    "/login": "Sign in",
    "/register": "Create Account",
    "/users": "Users",
    "/profile": "Profile",
    "/403": "Forbidden",
};

function titleFor(path: string): string {
    if (Titles[path]) return Titles[path];
    const first = path.split("/").filter(Boolean)[0];
    if (first) return first.charAt(0).toUpperCase() + first.slice(1);
    return "DevTask Hub";
}

export default function Layout() {
    const [open, setOpen] = useState(false);
    const [pathname] = useLocation();

    return(
        <div className={`app${open ? "nav-open" : " "}`}>
            <aside className="sidebar">
                <div className="brand">DevTaskHub</div>
            </aside>


        </div>
    )
}