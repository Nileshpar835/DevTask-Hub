import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";
import { ProtectedRoute, RequireRole } from "./components/Guards";
import Layout from "./components/Layout";
import {
  ProjectForm, ProjectMembers, TaskCreate, Users, Profile,
  Forbidden, NotFound,
} from "./pages/Placeholders";
import "./App.css";

// Lazy-loaded route chunks (code splitting)
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Projects = lazy(() => import("./pages/Projects"));
const ProjectDetails = lazy(() => import("./pages/ProjectDetails"));
const Tasks = lazy(() => import("./pages/Tasks"));
const TaskDetails = lazy(() => import("./pages/TaskDetails"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<div className="page-state" style={{ padding: "40px", textAlign: "center" }}>Loading view…</div>}>
            <Routes>
              {/* Public Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Routes inside Layout Shell */}
              <Route element={<ProtectedRoute />}>
                <Route element={<Layout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="projects" element={<Projects />} />
                  <Route path="projects/new" element={<ProjectForm />} />
                  <Route path="projects/:id" element={<ProjectDetails />} />
                  <Route path="projects/:id/edit" element={<ProjectForm />} />
                  <Route path="projects/:id/members" element={<ProjectMembers />} />
                  <Route path="tasks" element={<Tasks />} />
                  <Route path="tasks/new" element={<TaskCreate />} />
                  <Route path="tasks/:id" element={<TaskDetails />} />
                  
                  {/* Admin Only Route */}
                  <Route element={<RequireRole role="Admin" />}>
                    <Route path="users" element={<Users />} />
                  </Route>

                  <Route path="profile" element={<Profile />} />
                  <Route path="403" element={<Forbidden />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}