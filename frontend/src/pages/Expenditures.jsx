import { useEffect, useState } from "react";

function Expenditures() {
  const [expenditures, setExpenditures] = useState([]);
  const [assets, setAssets] = useState([]);
  const [bases, setBases] = useState([]);

  const [assetId, setAssetId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [baseId, setBaseId] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("access_token");
  const user = JSON.parse(localStorage.getItem("user"));

  const fetchExpenditures = async () => {
    try {
      const response = await fetch(
        "http://127.0.0.1:5000/api/expenditures",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to load expenditures");
        return;
      }

      setExpenditures(data.expenditures);

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
        fetchExpenditures(),
        fetchAssets(),
        fetchBases(),
      ]);

      setLoading(false);
    };

    loadData();
  }, []);

  const handleCreateExpenditure = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    try {
      const response = await fetch(
        "http://127.0.0.1:5000/api/expenditures",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            asset_id: Number(assetId),
            quantity: Number(quantity),
            base_id: Number(baseId),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to create expenditure");
        return;
      }

      setMessage("Expenditure created successfully!");

      setAssetId("");
      setQuantity("");
      setBaseId("");

      await fetchExpenditures();
      await fetchAssets();

    } catch (err) {
      setError("Unable to connect to the server");
    }
  };

  const canCreateExpenditure =
    user?.role === "Admin" ||
    user?.role === "Logistics Officer";

  if (loading) {
    return (
      <div className="dashboard-page">
        Loading expenditures...
      </div>
    );
  }

  return (
    <div className="dashboard-page">

      <div className="dashboard-header">

        <div>
          <h1>Military Asset Management</h1>
          <p>Expenditure Management</p>
        </div>

        <div>
          <strong>{user?.role}</strong>
        </div>

      </div>

      <h2>Expenditures</h2>

      {/* Create Expenditure */}

      {canCreateExpenditure && (
        <div className="form-card">

          <h3>Record New Expenditure</h3>

          <form onSubmit={handleCreateExpenditure}>

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
              Record Expenditure
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

      {/* Expenditure History */}

      <div className="table-card">

        <h3>Expenditure History</h3>

        {expenditures.length === 0 ? (
          <p>No expenditures found.</p>
        ) : (
          <div className="table-container">

            <table>

              <thead>
                <tr>
                  <th>ID</th>
                  <th>Asset ID</th>
                  <th>Quantity</th>
                  <th>Base ID</th>
                  <th>Expenditure Date</th>
                  <th>Created By</th>
                </tr>
              </thead>

              <tbody>

                {expenditures.map((expenditure) => (
                  <tr key={expenditure.id}>

                    <td>{expenditure.id}</td>

                    <td>{expenditure.asset_id}</td>

                    <td>{expenditure.quantity}</td>

                    <td>{expenditure.base_id}</td>

                    <td>
                      {new Date(
                        expenditure.expenditure_date
                      ).toLocaleString()}
                    </td>

                    <td>{expenditure.created_by}</td>

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

export default Expenditures;