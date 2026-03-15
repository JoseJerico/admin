// src/shared/Camera.jsx
import React, { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { XR, Hands, Controllers, useHitTest } from "@react-three/xr";
import "./Camera.css";

export default function Camera({ onClose, title }) {
  const [points, setPoints] = useState([]);
  const [areaData, setAreaData] = useState(null);

  // Tap handler sa AR scene
  const handleTap = (hit) => {
    if (points.length >= 4) return;

    const newPoints = [...points, hit.position.clone()];
    setPoints(newPoints);

    if (newPoints.length === 4) {
      calculateMeasurements(newPoints);
    }
  };

  // Compute measurements at 4 points
  const calculateMeasurements = (pts) => {
    const p0 = pts[0];
    const p1 = pts[1];
    const p3 = pts[3];

    const width = p0.distanceTo(p1).toFixed(2);
    const length = p0.distanceTo(p3).toFixed(2);
    const area = (width * length).toFixed(2);
    const recommendedHP = getAirconHP(area);

    setAreaData({ length, width, area, recommendedHP });
  };

  // AirCon HP recommendation
  const getAirconHP = (area) => {
    const a = parseFloat(area);
    if (a <= 9) return "0.5 HP";
    if (a <= 18) return "1.0 HP";
    if (a <= 25) return "1.5 HP";
    if (a <= 35) return "2.0 HP";
    if (a <= 45) return "2.5 HP";
    if (a <= 60) return "3.0 HP";
    if (a <= 80) return "4.0 HP";
    return "5.0 HP or higher";
  };

  // Reset points & measurements
  const handleReset = () => {
    setPoints([]);
    setAreaData(null);
  };

  return (
    <div className="camera-container">
      <h2>{title || "📏 AR Room Measurement"}</h2>

      <Canvas style={{ width: "100%", height: "100%" }}>
        <XR>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <Hands />
          <Controllers />

          <HitTestPlane onTap={handleTap} />

          {points.map((p, idx) => (
            <mesh key={idx} position={[p.x, p.y, p.z]}>
              <sphereGeometry args={[0.05, 16, 16]} />
              <meshStandardMaterial color="red" />
            </mesh>
          ))}

          {points.length >= 2 && <LinePoints points={points} />}
        </XR>
      </Canvas>

      <div className="camera-actions">
        <button className="btn-toggle" onClick={onClose}>
          Close
        </button>
        {points.length > 0 && (
          <button className="btn-reset" onClick={handleReset}>
            🔄 Reset / Tap Again
          </button>
        )}
      </div>

      {areaData && (
        <div className="measurement-results">
          <h3>📏 Room Analysis</h3>
          <p>Length: {areaData.length} m</p>
          <p>Width: {areaData.width} m</p>
          <p>Area: {areaData.area} m²</p>
          <p>🎯 Recommended AC: {areaData.recommendedHP}</p>
        </div>
      )}
    </div>
  );
}

// Invisible floor for AR hit testing
function HitTestPlane({ onTap }) {
  useHitTest((hit) => {
    if (onTap) onTap(hit);
  });
  return null;
}

// Lines connecting points
function LinePoints({ points }) {
  return points.map((p, idx) => {
    if (idx === 0) return null;
    const prev = points[idx - 1];
    const positions = [prev.x, prev.y, prev.z, p.x, p.y, p.z];
    return (
      <mesh key={idx}>
        <bufferGeometry attach="geometry">
          <bufferAttribute
            attachObject={["attributes", "position"]}
            count={positions.length / 3}
            array={new Float32Array(positions)}
            itemSize={3}
          />
        </bufferGeometry>
        <meshBasicMaterial color="lime" />
      </mesh>
    );
  });
}