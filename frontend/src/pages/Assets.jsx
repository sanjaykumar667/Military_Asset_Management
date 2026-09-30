import { useEffect, useState } from "react";
import { API_BASE_URL } from "../config";

function Assets() {
  const [assets, setAssets] = useState([]);
  const [bases, setBases] = useState([]);

  const [name, setName] = useState("");
  const [assetType, setAssetType] = useState("Weapon");
  const [quantity, setQuantity] = useState("");
  const [baseId, setBaseId] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("access_token");
  const user = JSON.parse(localStorage.getItem("user"));

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

      if (!response.ok) {
        setError(data.message || "Failed to load assets");
        return;
      }

      setAssets(data.assets);

    } catch (err) {
      setError("Unable to connect to the server");
    } finally {
      setLoading(false);
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
    fetchAssets();
    fetchBases();
  }, []);

  const handleCreateAsset = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/assets`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            name: name,
            asset_type: assetType,
            quantity: Number(quantity),
            base_id: Number(baseId),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to create asset");
        return;
      }

      setMessage("Asset created successfully!");

      setName("");
      setAssetType("Weapon");
      setQuantity("");
      setBaseId("");

      fetchAssets();

    } catch (err) {
      setError("Unable to connect to the server");
    }
  };

  const canCreateAsset =
    user?.role === "Admin" ||
    user?.role === "Logistics Officer";

  if (loading) {
    return (
      <div className="dashboard-page">
        Loading assets...
      </div>
    );
  }

  return (
    <div className="dashboard-page">

      <div className="dashboard-header">

        <div>
          <h1>Military Asset Management</h1>
          <p>Asset Management</p>
        </div>

        <div>
          <strong>{user?.role}</strong>
        </div>

      </div>

      <h2>Assets</h2>

      {/* Create Asset */}

      {canCreateAsset && (
        <div className="form-card">

          <h3>Add New Asset</h3>

          <form onSubmit={handleCreateAsset}>

            <div className="form-grid">

              <div className="form-group">

                <label>Asset Name</label>

                <input
                  type="text"
                  placeholder="Enter asset name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />

              </div>

              <div className="form-group">

                <label>Equipment Type</label>

                <select
                  value={assetType}
                  onChange={(e) => setAssetType(e.target.value)}
                >
                  <option value="Weapon">Weapon</option>
                  <option value="Vehicle">Vehicle</option>
                  <option value="Ammunition">Ammunition</option>
                  <option value="Equipment">Equipment</option>
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
              Add Asset
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

      {/* Assets Table */}

      <div className="table-card">

        <h3>Asset Inventory</h3>

        {assets.length === 0 ? (
          <p>No assets found.</p>
        ) : (
          <div className="table-container">

            <table>

              <thead>
                <tr>
                  <th>ID</th>
                  <th>Asset Name</th>
                  <th>Type</th>
                  <th>Quantity</th>
                  <th>Base</th>
                </tr>
              </thead>

              <tbody>

                {assets.map((asset) => (
                  <tr key={asset.id}>

                    <td>{asset.id}</td>

                    <td>{asset.name}</td>

                    <td>{asset.asset_type}</td>

                    <td>{asset.quantity}</td>

                    <td>{asset.base_name}</td>

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

export default Assets;