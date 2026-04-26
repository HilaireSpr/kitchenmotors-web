"use client";

import { useState } from "react";

export default function PlanningView() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const runPlanning = async () => {
    setLoading(true);

    const res = await fetch("http://127.0.0.1:8000/api/v1/planning/run", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        start_monday: "2026-04-13",
        start_week: 1,
        cycles: 1,
        explain: true,
        overrides: [],
      }),
    });

    const json = await res.json();
    setData(json.result.rows || []);
    setLoading(false);
  };

  return (
    <div className="card stack">
      <h2>Planning</h2>

      <button onClick={runPlanning}>
        {loading ? "Bezig..." : "Genereer planning"}
      </button>

      {data.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Datum</th>
                <th>Post</th>
                <th>Taak</th>
                <th>Start</th>
                <th>Einde</th>
              </tr>
            </thead>
            <tbody>
              {data.slice(0, 50).map((row, i) => (
                <tr key={i}>
                  <td>{row["Werkdag"]}</td>
                  <td>{row["Post"]}</td>
                  <td>{row["Taak"]}</td>
                  <td>{row["Start"]}</td>
                  <td>{row["Einde"]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}