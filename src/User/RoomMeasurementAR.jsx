import React, { useState } from "react";

export default function RoomMeasurementAR({ onMeasurementComplete }) {
  const [points, setPoints] = useState([]);
  const [measurements, setMeasurements] = useState(null);

  const addPoint = (x, y, z) => {
    if (points.length >= 4) return;
    const newPoints = [...points, { x, y, z }];
    setPoints(newPoints);

    if (newPoints.length === 4) {
      // compute length, width, area (simplified)
      const length = Math.abs(newPoints[1].x - newPoints[0].x);
      const width = Math.abs(newPoints[3].z - newPoints[0].z);
      const area = length * width;

      const recommendedHP = getAirconHP(area);

      const data = {
        measurements: { length: length.toFixed(2), width: width.toFixed(2), area: area.toFixed(2) },
        recommended: recommendedHP,
      };

      setMeasurements(data);
      onMeasurementComplete && onMeasurementComplete(data);
    }
  };

  const getAirconHP = (area) => {
    if (area <= 9) return "0.5 HP";
    if (area <= 18) return "1.0 HP";
    if (area <= 25) return "1.5 HP";
    if (area <= 35) return "2.0 HP";
    if (area <= 45) return "2.5 HP";
    if (area <= 60) return "3.0 HP";
    if (area <= 80) return "4.0 HP";
    return "5.0 HP or higher";
  };

  return (
    <div style={{ padding: "1rem", border: "2px dashed #ccc", borderRadius: "12px" }}>
      <h3>📏 Tap 4 points to measure your room</h3>
      <p>Points tapped: {points.length} / 4</p>
      <button onClick={() => addPoint(Math.random() * 5, 0, Math.random() * 5)}>Tap Point</button>

      {measurements && (
        <div style={{ marginTop: "1rem", background: "#000", color: "#fff", padding: "1rem", borderRadius: "8px" }}>
          <p>Length: {measurements.measurements.length} m</p>
          <p>Width: {measurements.measurements.width} m</p>
          <p>Area: {measurements.measurements.area} m²</p>
          <p>Recommended AC: {measurements.recommended}</p>
        </div>
      )}
    </div>
  );
}