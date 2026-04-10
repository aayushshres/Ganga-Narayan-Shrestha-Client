import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AdminNav from "./AdminNav";

export default function AdminLayout() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  const handleLogout = () => {
    logout();
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
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1rem 2rem",
          background: "var(--crimson)",
          color: "white",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-display)",
            margin: 0,
            fontSize: "1.5rem",
          }}
        >
          प्रशासन
        </h1>
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
          }}
        >
          लग आउट
        </button>
      </header>

      <AdminNav />

      <main style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
        <Outlet />
      </main>
    </div>
  );
}
