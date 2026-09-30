import { useEffect, useState } from "react";
import { API_BASE_URL } from "../config";

function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [bases, setBases] = useState([]);

  const [baseId, setBaseId] = useState("");
  const [assetType, setAssetType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showMovementDetails, setShowMovementDetails] = useState(false);

  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("access_token");

  // Load bases
  useEffect(() => {
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

    fetchBases();
  }, [token]);

  // Load dashboard
  const fetchDashboard = async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();

      if (baseId) {
        params.append("base_id", baseId);
      }

      if (assetType) {
        params.append("asset_type", assetType);
      }

      if (startDate) {
        params.append("start_date", startDate);
      }

      if (endDate) {
        params.append("end_date", endDate);
      }

      const queryString = params.toString();

      const url = queryString
        ? `${API_BASE_URL}/api/dashboard?${queryString}`
        : `${API_BASE_URL}/api/dashboard`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to load dashboard");
        return;
      }

      setDashboard(data);

    } catch (err) {
      setError("Unable to connect to the server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleApplyFilters = () => {
    fetchDashboard();
  };

  const handleClearFilters = () => {
    setBaseId("");
    setAssetType("");
    setStartDate("");
    setEndDate("");

    setTimeout(() => {
      fetchDashboard();
    }, 0);
  };

  if (loading && !dashboard) {
    return (
      <div className="dashboard-page">
        Loading dashboard...
      </div>
    );
  }

  if (error && !dashboard) {
    return (
      <div className="dashboard-page">
        {error}
      </div>
    );
  }

  return (
    <div className="dashboard-page">

      {/* Header */}

      <div className="dashboard-header">

        <div>
          <h1>Military Asset Management</h1>
          <p>Welcome, {user?.name}</p>
        </div>

        <div>
          <strong>{user?.role}</strong>
        </div>

      </div>

      <h2>Dashboard</h2>

      {/* Filters */}

      <div className="filter-section">

        <div className="filter-group">

          <label>Base</label>

          <select
            value={baseId}
            onChange={(e) => setBaseId(e.target.value)}
          >
            <option value="">All Bases</option>

            {bases.map((base) => (
              <option key={base.id} value={base.id}>
                {base.name}
              </option>
            ))}

          </select>

        </div>

        <div className="filter-group">

          <label>Equipment Type</label>

          <select
            value={assetType}
            onChange={(e) => setAssetType(e.target.value)}
          >
            <option value="">All Types</option>
            <option value="Weapon">Weapon</option>
            <option value="Vehicle">Vehicle</option>
            <option value="Ammunition">Ammunition</option>
            <option value="Equipment">Equipment</option>
          </select>

        </div>

        <div className="filter-group">

          <label>Start Date</label>

          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />

        </div>

        <div className="filter-group">

          <label>End Date</label>

          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />

        </div>

        <div className="filter-buttons">

          <button onClick={handleApplyFilters}>
            Apply Filters
          </button>

          <button
            className="clear-button"
            onClick={handleClearFilters}
          >
            Clear
          </button>

        </div>

      </div>

      {/* Error */}

      {error && (
        <p className="filter-error">
          {error}
        </p>
      )}

      {/* Dashboard Cards */}

      <div className="dashboard-cards">

        <div className="dashboard-card">
          <h3>Opening Balance</h3>
          <p>{dashboard?.opening_balance}</p>
        </div>

        <div className="dashboard-card">
          <h3>Closing Balance</h3>
          <p>{dashboard?.closing_balance}</p>
        </div>

        {/* Net Movement Card */}

        <div
          className="dashboard-card clickable-card"
          onClick={() => setShowMovementDetails(true)}
        >
          <h3>Net Movement</h3>

          <p>{dashboard?.net_movement}</p>

          <span className="card-hint">
            Click for details
          </span>
        </div>

        <div className="dashboard-card">
          <h3>Assigned Assets</h3>
          <p>{dashboard?.assigned_assets}</p>
        </div>

        <div className="dashboard-card">
          <h3>Expended Assets</h3>
          <p>{dashboard?.expended_assets}</p>
        </div>

      </div>

      {/* Net Movement Details Popup */}

      {showMovementDetails && (
        <div
          className="modal-overlay"
          onClick={() => setShowMovementDetails(false)}
        >

          <div
            className="movement-modal"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="modal-header">

              <h2>Net Movement Details</h2>

              <button
                className="close-button"
                onClick={() => setShowMovementDetails(false)}
              >
                ×
              </button>

            </div>

            <div className="movement-row">
              <span>Purchases</span>

              <strong>
                +{dashboard?.movement_details?.purchases}
              </strong>
            </div>

            <div className="movement-row">
              <span>Transfers In</span>

              <strong>
                +{dashboard?.movement_details?.transfers_in}
              </strong>
            </div>

            <div className="movement-row">
              <span>Transfers Out</span>

              <strong>
                -{dashboard?.movement_details?.transfers_out}
              </strong>
            </div>

            <div className="movement-row">
              <span>Assignments</span>

              <strong>
                -{dashboard?.movement_details?.assignments}
              </strong>
            </div>

            <div className="movement-row">
              <span>Expenditures</span>

              <strong>
                -{dashboard?.movement_details?.expenditures}
              </strong>
            </div>

            <div className="movement-total">

              <span>Net Movement</span>

              <strong>
                {dashboard?.net_movement}
              </strong>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default Dashboard;