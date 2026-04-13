import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AdminNav from "./AdminNav";
import "../styles/admin.css";

export default function AdminLayout() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
        color: "var(--text-primary)",
      }}
    >
      <header className="admin-header">
        <h1>प्रशासन</h1>
        <button
          onClick={handleLogout}
          style={{
            background: "transparent",
            border: "1px solid white",
            color: "white",
            padding: "0.5rem 1rem",
            borderRadius: "4px",
            cursor: "pointer",
            fontFamily: "var(--font-body)",
            whiteSpace: "nowrap",
          }}
        >
          लग आउट
        </button>
      </header>

      <AdminNav />

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
