import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Exceptions from "./pages/Exceptions";
import LoanDetails from "./pages/LoanDetails";
import AuditTrail from "./pages/AuditTrail";
import Upload from "./pages/Upload";

function App() {
  return (
    <BrowserRouter>
      <nav className="navbar">
        <div className="nav-container">
          <Link to="/" className="brand">
            Loan Verification Copilot
          </Link>

          <div className="nav-links">
            
            <Link to="/">Dashboard</Link>
            <Link to="/exceptions">Exceptions</Link>
            <Link to="/audit">Audit Trail & Export</Link>
            <Link to="/upload">Upload</Link>
          </div>
        </div>
      </nav>

      <Routes>
  <Route path="/" element={<Dashboard />} />
  <Route path="/exceptions" element={<Exceptions />} />
  <Route path="/loans/:id" element={<LoanDetails />} />
  <Route path="/audit" element={<AuditTrail />} />
  <Route path="/upload" element={<Upload />} />
</Routes>
    </BrowserRouter>
  );
}

export default App;