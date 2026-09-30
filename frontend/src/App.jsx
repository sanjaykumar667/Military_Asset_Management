import { useState } from "react";
import "./App.css";

import Dashboard from "./pages/Dashboard";
import Assets from "./pages/Assets";
import Purchases from "./pages/Purchases";
import Transfers from "./pages/Transfers";
import Assignments from "./pages/Assignments";
import Expenditures from "./pages/Expenditures";
import AuditLogs from "./pages/AuditLogs";

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const [loggedIn, setLoggedIn] = useState(
    !!localStorage.getItem("access_token")
  );

  const [activePage, setActivePage] = useState("dashboard");

  const user = JSON.parse(localStorage.getItem("user"));

  const handleLogin = async (e) => {
    e.preventDefault();

    setMessage("");

    try {
      const response = await fetch(
        "http://127.0.0.1:5000/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email,
            password: password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Login failed");
        return;
      }

      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setLoggedIn(true);
      setActivePage("dashboard");

    } catch (error) {
      setMessage("Unable to connect to the server");
      console.error(error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");

    setLoggedIn(false);
    setEmail("");
    setPassword("");
    setMessage("");
  };

  if (!loggedIn) {
    return (
      <div className="login-container">

        <div className="login-card">

          <h1>Military Asset Management</h1>

          <p className="subtitle">
            Secure Asset Management System
          </p>

          <form onSubmit={handleLogin}>

            <label>Email</label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label>Password</label>

            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button type="submit">
              Login
            </button>

          </form>

          {message && (
            <p className="message">
              {message}
            </p>
          )}

        </div>

      </div>
    );
  }

  return (
    <div className="app-layout">

      {/* Navigation */}

      <nav className="sidebar">

        <div className="sidebar-title">
          Military Asset Management
        </div>

        <div className="user-info">
          <strong>{user?.name}</strong>
          <span>{user?.role}</span>
        </div>

        <button
          className={
            activePage === "dashboard"
              ? "nav-button active"
              : "nav-button"
          }
          onClick={() => setActivePage("dashboard")}
        >
          Dashboard
        </button>

        <button
          className={
            activePage === "assets"
              ? "nav-button active"
              : "nav-button"
          }
          onClick={() => setActivePage("assets")}
        >
          Assets
        </button>
        <button
        className={
        activePage === "purchases"
        ? "nav-button active"
        : "nav-button"
        }
        onClick={() => setActivePage("purchases")}
        >
        Purchases
        </button>
        <button
        className={
        activePage === "transfers"
        ? "nav-button active"
        : "nav-button"
        }
        onClick={() => setActivePage("transfers")}
        >
        Transfers
        </button>
        <button
        className={
        activePage === "assignments"
        ? "nav-button active"
        : "nav-button"
        }
        onClick={() => setActivePage("assignments")}
        >
        Assignments
        </button>

        <button
        className={
        activePage === "expenditures"
        ? "nav-button active"
        : "nav-button"
        }
        onClick={() => setActivePage("expenditures")}
        >
        Expenditures
        </button>

        {user?.role === "Admin" && (
        <button
        className={activePage === "auditLogs" ? "nav-button active" : "nav-button"}
        onClick={() => setActivePage("auditLogs")}
        >
        Audit Logs
        </button>
        )}

        <div className="sidebar-spacer"></div>

        <button
          className="logout-button"
          onClick={handleLogout}
        >
          Logout
        </button>

      </nav>

      {/* Main Content */}

      <main className="main-content">

        {activePage === "dashboard" && (
          <Dashboard />
        )}

        {activePage === "assets" && (
          <Assets />
        )}
        {activePage === "purchases" && (
        <Purchases />
        )}
        {activePage === "transfers" && (
        <Transfers />
        )}
        {activePage === "assignments" && (
        <Assignments />
        )}
        {activePage === "expenditures" && (
        <Expenditures />
        )}
        {activePage === "auditLogs" && user?.role === "Admin" && <AuditLogs />}

      </main>

    </div>
  );
}

export default App;