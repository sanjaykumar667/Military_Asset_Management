import { useEffect, useState } from "react";
import { API_BASE_URL } from "../config";

function Transfers() {
  const [transfers, setTransfers] = useState([]);
  const [assets, setAssets] = useState([]);
  const [bases, setBases] = useState([]);

  const [assetId, setAssetId] = useState("");
  const [fromBaseId, setFromBaseId] = useState("");
  const [toBaseId, setToBaseId] = useState("");
  const [quantity, setQuantity] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("access_token");
  const user = JSON.parse(localStorage.getItem("user"));

  const fetchTransfers = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/transfers`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to load transfers");
        return;
      }

      setTransfers(data.transfers);

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
        fetchTransfers(),
        fetchAssets(),
        fetchBases(),
      ]);

      setLoading(false);
    };

    loadData();
  }, []);

  const handleCreateTransfer = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (fromBaseId === toBaseId) {
      setError("Source and destination bases must be different.");
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/transfers`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            asset_id: Number(assetId),
            from_base_id: Number(fromBaseId),
            to_base_id: Number(toBaseId),
            quantity: Number(quantity),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to create transfer");
        return;
      }

      setMessage("Transfer created successfully!");

      setAssetId("");
      setFromBaseId("");
      setToBaseId("");
      setQuantity("");

      await fetchTransfers();
      await fetchAssets();

    } catch (err) {
      setError("Unable to connect to the server");
    }
  };

  const canCreateTransfer =
    user?.role === "Admin" ||
    user?.role === "Logistics Officer";

  if (loading) {
    return (
      <div className="dashboard-page">
        Loading transfers...
      </div>
    );
  }

  return (
    <div className="dashboard-page">

      <div className="dashboard-header">

        <div>
          <h1>Military Asset Management</h1>
          <p>Transfer Management</p>
        </div>

        <div>
          <strong>{user?.role}</strong>
        </div>

      </div>

      <h2>Transfers</h2>

      {/* Create Transfer */}

      {canCreateTransfer && (
        <div className="form-card">

          <h3>Record New Transfer</h3>

          <form onSubmit={handleCreateTransfer}>

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

                <label>From Base</label>

                <select
                  value={fromBaseId}
                  onChange={(e) => setFromBaseId(e.target.value)}
                  required
                >
                  <option value="">
                    Select Source Base
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

              <div className="form-group">

                <label>To Base</label>

                <select
                  value={toBaseId}
                  onChange={(e) => setToBaseId(e.target.value)}
                  required
                >
                  <option value="">
                    Select Destination Base
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

              <div className="form-group">

                <label>Quantity</label>

                <input
                  type="number"
                  min="1"
                  placeholder="Enter quantity"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />

              </div>

            </div>

            <button
              type="submit"
              className="primary-button"
            >
              Record Transfer
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

      {/* Transfer History */}

      <div className="table-card">

        <h3>Transfer History</h3>

        {transfers.length === 0 ? (
          <p>No transfers found.</p>
        ) : (
          <div className="table-container">

            <table>

              <thead>
                <tr>
                  <th>ID</th>
                  <th>Asset ID</th>
                  <th>From Base</th>
                  <th>To Base</th>
                  <th>Quantity</th>
                  <th>Transfer Date</th>
                  <th>Created By</th>
                </tr>
              </thead>

              <tbody>

                {transfers.map((transfer) => (
                  <tr key={transfer.id}>

                    <td>{transfer.id}</td>

                    <td>{transfer.asset_id}</td>

                    <td>{transfer.from_base_id}</td>

                    <td>{transfer.to_base_id}</td>

                    <td>{transfer.quantity}</td>

                    <td>
                      {new Date(
                        transfer.transfer_date
                      ).toLocaleString()}
                    </td>

                    <td>{transfer.created_by}</td>

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

export default Transfers;