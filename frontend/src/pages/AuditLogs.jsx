import { useEffect, useState } from "react";

function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("access_token");
  const user = JSON.parse(localStorage.getItem("user"));

  const fetchAuditLogs = async () => {
    try {
      const response = await fetch(
        "http://127.0.0.1:5000/api/audit-logs",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to load audit logs");
        return;
      }

      setLogs(data.audit_logs);
    } catch (err) {
      setError("Unable to connect to the server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-page">
        Loading audit logs...
      </div>
    );
  }

  return (
    <div className="dashboard-page">

      <div className="dashboard-header">
        <div>
          <h1>Military Asset Management</h1>
          <p>System Audit Logs</p>
        </div>

        <div>
          <strong>{user?.role}</strong>
        </div>
      </div>

      <h2>Audit Logs</h2>

      {error && (
        <p className="filter-error">
          {error}
        </p>
      )}

      <div className="table-card">

        <h3>Transaction History</h3>

        {logs.length === 0 ? (
          <p>No audit logs found.</p>
        ) : (
          <div className="table-container">

            <table>

              <thead>
                <tr>
                  <th>ID</th>
                  <th>User ID</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Entity ID</th>
                  <th>Details</th>
                  <th>Timestamp</th>
                </tr>
              </thead>

              <tbody>

                {logs.map((log) => (
                  <tr key={log.id}>

                    <td>{log.id}</td>

                    <td>{log.user_id}</td>

                    <td>{log.action}</td>

                    <td>{log.entity}</td>

                    <td>{log.entity_id}</td>

                    <td>{log.details}</td>

                    <td>
                      {new Date(log.timestamp).toLocaleString()}
                    </td>

                  </tr>
                ))}

              </tbody>

            </table>

          </div>
        )}

      </div>

    </div>
  );
}

export default AuditLogs;