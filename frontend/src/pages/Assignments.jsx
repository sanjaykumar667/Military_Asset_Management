import { useEffect, useState } from "react";
import { API_BASE_URL } from "../config";

function Assignments() {
  const [assignments, setAssignments] = useState([]);
  const [assets, setAssets] = useState([]);
  const [bases, setBases] = useState([]);

  const [assetId, setAssetId] = useState("");
  const [personnelName, setPersonnelName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [baseId, setBaseId] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("access_token");
  const user = JSON.parse(localStorage.getItem("user"));

  const fetchAssignments = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/assignments`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to load assignments");
        return;
      }

      setAssignments(data.assignments);

    } catch (err) {
      setError("Unable to connect to the server");
    }
  };

  const fetchAssets = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/assets`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setAssets(data.assets);
      }

    } catch (err) {
      console.error("Failed to load assets", err);
    }
  };

  const fetchBases = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/bases`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setBases(data.bases);
      }

    } catch (err) {
      console.error("Failed to load bases", err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchAssignments(),
        fetchAssets(),
        fetchBases(),
      ]);

      setLoading(false);
    };

    loadData();
  }, []);

  const handleCreateAssignment = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/assignments`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            asset_id: Number(assetId),
            personnel_name: personnelName,
            quantity: Number(quantity),
            base_id: Number(baseId),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to create assignment");
        return;
      }

      setMessage("Assignment created successfully!");

      setAssetId("");
      setPersonnelName("");
      setQuantity("");
      setBaseId("");

      await fetchAssignments();
      await fetchAssets();

    } catch (err) {
      setError("Unable to connect to the server");
    }
  };

  const canCreateAssignment =
    user?.role === "Admin" ||
    user?.role === "Logistics Officer";

  if (loading) {
    return (
      <div className="dashboard-page">
        Loading assignments...
      </div>
    );
  }

  return (
    <div className="dashboard-page">

      <div className="dashboard-header">

        <div>
          <h1>Military Asset Management</h1>
          <p>Assignment Management</p>
        </div>

        <div>
          <strong>{user?.role}</strong>
        </div>

      </div>

      <h2>Assignments</h2>

      {/* Create Assignment */}

      {canCreateAssignment && (
        <div className="form-card">

          <h3>Record New Assignment</h3>

          <form onSubmit={handleCreateAssignment}>

            <div className="form-grid">

              <div className="form-group">

                <label>Asset</label>

                <select
                  value={assetId}
                  onChange={(e) => setAssetId(e.target.value)}
                  required
                >
                  <option value="">
                    Select Asset
                  </option>

                  {assets.map((asset) => (
                    <option
                      key={asset.id}
                      value={asset.id}
                    >
                      {asset.name} - {asset.base_name}
                    </option>
                  ))}

                </select>

              </div>

              <div className="form-group">

                <label>Personnel Name</label>

                <input
                  type="text"
                  placeholder="Enter personnel name"
                  value={personnelName}
                  onChange={(e) =>
                    setPersonnelName(e.target.value)
                  }
                  required
                />

              </div>

              <div className="form-group">

                <label>Quantity</label>

                <input
                  type="number"
                  min="1"
                  placeholder="Enter quantity"
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(e.target.value)
                  }
                  required
                />

              </div>

              <div className="form-group">

                <label>Base</label>

                <select
                  value={baseId}
                  onChange={(e) => setBaseId(e.target.value)}
                  required
                >
                  <option value="">
                    Select Base
                  </option>

                  {bases.map((base) => (
                    <option
                      key={base.id}
                      value={base.id}
                    >
                      {base.name}
                    </option>
                  ))}

                </select>

              </div>

            </div>

            <button
              type="submit"
              className="primary-button"
            >
              Record Assignment
            </button>

          </form>

        </div>
      )}

      {/* Messages */}

      {message && (
        <p className="success-message">
          {message}
        </p>
      )}

      {error && (
        <p className="filter-error">
          {error}
        </p>
      )}

      {/* Assignment History */}

      <div className="table-card">

        <h3>Assignment History</h3>

        {assignments.length === 0 ? (
          <p>No assignments found.</p>
        ) : (
          <div className="table-container">

            <table>

              <thead>
                <tr>
                  <th>ID</th>
                  <th>Asset ID</th>
                  <th>Personnel</th>
                  <th>Quantity</th>
                  <th>Base ID</th>
                  <th>Assigned Date</th>
                  <th>Created By</th>
                </tr>
              </thead>

              <tbody>

                {assignments.map((assignment) => (
                  <tr key={assignment.id}>

                    <td>{assignment.id}</td>

                    <td>{assignment.asset_id}</td>

                    <td>{assignment.personnel_name}</td>

                    <td>{assignment.quantity}</td>

                    <td>{assignment.base_id}</td>

                    <td>
                      {new Date(
                        assignment.assigned_date
                      ).toLocaleString()}
                    </td>

                    <td>{assignment.created_by}</td>

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

export default Assignments;