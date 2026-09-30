import { useEffect, useState } from "react";

function Purchases() {
  const [purchases, setPurchases] = useState([]);
  const [assets, setAssets] = useState([]);
  const [bases, setBases] = useState([]);

  const [assetId, setAssetId] = useState("");
  const [baseId, setBaseId] = useState("");
  const [quantity, setQuantity] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("access_token");
  const user = JSON.parse(localStorage.getItem("user"));

  const fetchPurchases = async () => {
    try {
      const response = await fetch(
        "http://127.0.0.1:5000/api/purchases",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to load purchases");
        return;
      }

      setPurchases(data.purchases);

    } catch (err) {
      setError("Unable to connect to the server");
    }
  };

  const fetchAssets = async () => {
    try {
      const response = await fetch(
        "http://127.0.0.1:5000/api/assets",
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
        "http://127.0.0.1:5000/api/bases",
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
        fetchPurchases(),
        fetchAssets(),
        fetchBases(),
      ]);

      setLoading(false);
    };

    loadData();
  }, []);

  const handleCreatePurchase = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    try {
      const response = await fetch(
        "http://127.0.0.1:5000/api/purchases",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            asset_id: Number(assetId),
            base_id: Number(baseId),
            quantity: Number(quantity),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to create purchase");
        return;
      }

      setMessage("Purchase created successfully!");

      setAssetId("");
      setBaseId("");
      setQuantity("");

      await fetchPurchases();
      await fetchAssets();

    } catch (err) {
      setError("Unable to connect to the server");
    }
  };

  const canCreatePurchase =
    user?.role === "Admin" ||
    user?.role === "Logistics Officer";

  if (loading) {
    return (
      <div className="dashboard-page">
        Loading purchases...
      </div>
    );
  }

  return (
    <div className="dashboard-page">

      <div className="dashboard-header">

        <div>
          <h1>Military Asset Management</h1>
          <p>Purchase Management</p>
        </div>

        <div>
          <strong>{user?.role}</strong>
        </div>

      </div>

      <h2>Purchases</h2>

      {/* Create Purchase */}

      {canCreatePurchase && (
        <div className="form-card">

          <h3>Record New Purchase</h3>

          <form onSubmit={handleCreatePurchase}>

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
              Record Purchase
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

      {/* Purchase History */}

      <div className="table-card">

        <h3>Purchase History</h3>

        {purchases.length === 0 ? (
          <p>No purchases found.</p>
        ) : (
          <div className="table-container">

            <table>

              <thead>
                <tr>
                  <th>ID</th>
                  <th>Asset ID</th>
                  <th>Base ID</th>
                  <th>Quantity</th>
                  <th>Purchase Date</th>
                  <th>Created By</th>
                </tr>
              </thead>

              <tbody>

                {purchases.map((purchase) => (
                  <tr key={purchase.id}>

                    <td>{purchase.id}</td>

                    <td>{purchase.asset_id}</td>

                    <td>{purchase.base_id}</td>

                    <td>{purchase.quantity}</td>

                    <td>
                      {new Date(
                        purchase.purchase_date
                      ).toLocaleString()}
                    </td>

                    <td>{purchase.created_by}</td>

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

export default Purchases;