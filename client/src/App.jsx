import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  Navigate,
  useNavigate,
} from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Exceptions from "./pages/Exceptions";
import LoanDetails from "./pages/LoanDetails";
import AuditTrail from "./pages/AuditTrail";
import Upload from "./pages/Upload";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";

const AppLayout = () => {
  const navigate = useNavigate();

  const user = JSON.parse(
    localStorage.getItem("user") || "null"
  );

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <>
      <nav className="navbar">
        <div className="nav-container">
          <Link to="/" className="brand">
            Loan Verification Copilot
          </Link>

          <div className="nav-links">

            {user?.role === "DATA_OPERATOR" && (
              <Link to="/upload">Upload</Link>
            )}

            <Link to="/">Dashboard</Link>

            {(user?.role === "DATA_OPERATOR" ||
              user?.role === "REVIEWER") && (
              <Link to="/exceptions">
                Exceptions
              </Link>
            )}

            <Link to="/audit">
              Audit Trail & Export
            </Link>

            <span className="user-role">
              {user?.name} ·{" "}
              {user?.role?.replaceAll("_", " ")}
            </span>

            <button
              onClick={handleLogout}
              className="logout-button"
            >
              Logout
            </button>

          </div>
        </div>
      </nav>

      <Routes>

        <Route
          path="/"
          element={<Dashboard />}
        />

        <Route
          path="/upload"
          element={<Upload />}
        />

        <Route
          path="/exceptions"
          element={<Exceptions />}
        />

        <Route
          path="/loans/:id"
          element={<LoanDetails />}
        />

        <Route
          path="/audit"
          element={<AuditTrail />}
        />

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>
    </>
  );
};

function App() {
  return (
    <BrowserRouter>

      <Routes>

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;