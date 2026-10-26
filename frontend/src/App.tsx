import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import {
  Dashboard, ProjectDetails, ProjectForm,
  ProjectMembers, Tasks, TaskDetails, TaskCreate, Users, Profile,
  Forbidden, NotFound,
} from "./pages/Placeholders";
import "./App.css";
import { AuthProvider } from "./context/AuthContext";
import { RequireRole } from "./components/Guards";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Projects from "./pages/Projects";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Auth pages render standalone, no sidebar */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Everything else lives inside the shell */}
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
            <Route element={<RequireRole role="Admin" />}>
              <Route path="users" element={<Users />} />
            </Route>
            {/* <Route path="users" element={<Users />} /> */}
            <Route path="profile" element={<Profile />} />
            <Route path="403" element={<Forbidden />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}