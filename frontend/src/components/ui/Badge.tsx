import type { ReactNode } from "react";

interface BadgeProps {
    variant?: "success" | "warning" | "neutral" | "danger" | "primary";
    children: ReactNode;
}

export function Badge({
     variant = "neutral", children 
    }: BadgeProps) {
    return <span className={`badge badge-
        ${variant}`}>{children}</span>
}
