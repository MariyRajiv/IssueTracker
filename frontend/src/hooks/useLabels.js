import { useEffect, useState } from "react";

export default function useLabels() {
  const [labels, setLabels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("http://localhost:5000/api/labels", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch labels");
        return res.json();
      })
      .then((data) => setLabels(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { labels, loading, error };
}
