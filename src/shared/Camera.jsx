import React, { useRef, useState, useEffect } from "react";
import "./Camera.css";

export default function Camera({ onClose, title }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [points, setPoints] = useState([]);
  const [areaData, setAreaData] = useState(null);

  // Start fallback camera
  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        alert("Unable to access camera");
      }
    }
    startCamera();
  }, []);

  // Handle taps / touches
  const handleTap = (e) => {
    e.preventDefault();
    if (points.length >= 4) return;

    const rect = canvasRef.current.getBoundingClientRect();
    let x, y;

    if (e.touches && e.touches.length > 0) {
      // touch event
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      // mouse click
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    setPoints([...points, { x, y }]);
  };

  // Calculate area after 4 taps
  useEffect(() => {
    if (points.length !== 4) return;

    const scale = 0.02; // meters per pixel
    const widthPx = Math.abs(points[1].x - points[0].x);
    const lengthPx = Math.abs(points[3].y - points[0].y);
    const width = (widthPx * scale).toFixed(2);
    const length = (lengthPx * scale).toFixed(2);
    const area = (width * length).toFixed(2);
    const recommendedHP = getAirconHP(area);

    setAreaData({ length, width, area, recommendedHP });
  }, [points]);

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

  const handleReset = () => {
    setPoints([]);
    setAreaData(null);
  };

  return (
    <div className="camera-container">
      <h2>{title || "📏 Room Measurement"}</h2>

      <div className="camera-fallback">
        <video ref={videoRef} autoPlay playsInline className="camera-video" />
        <canvas
          ref={canvasRef}
          className="camera-overlay"
          onClick={handleTap}
          onTouchStart={handleTap}
        />
      </div>

      <div className="camera-actions">
        <button onClick={onClose}>Close</button>
        {points.length > 0 && (
          <button onClick={handleReset}>🔄 Reset / Tap Again</button>
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