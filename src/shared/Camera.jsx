import React, { useRef, useState, useEffect } from "react";
import "./Camera.css";

export default function Camera({ onClose, onMeasured, title }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [points, setPoints] = useState([]);
  const [areaData, setAreaData] = useState(null);
  const [isARSupported, setIsARSupported] = useState(false);
  const [ARComponents, setARComponents] = useState(null);

  // Dynamic import ng AR libraries (safe sa PC o non-AR devices)
  useEffect(() => {
    async function loadAR() {
      try {
        if (typeof window === "undefined") return;
        const xr = await import("@react-three/xr");
        setARComponents({
          ARCanvas: xr.ARCanvas,
          DefaultXRControllers: xr.DefaultXRControllers,
          Interactive: xr.Interactive,
        });

        if (navigator.xr) {
          const supported = await navigator.xr.isSessionSupported("immersive-ar");
          setIsARSupported(supported);
        }
      } catch (err) {
        setARComponents(null);
        setIsARSupported(false);
      }
    }
    loadAR();
  }, []);

  // Fallback 2D camera
  useEffect(() => {
    if (isARSupported) return;

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
  }, [isARSupported]);

  // Tap handler for fallback 2D
  const handle2DTap = (e) => {
    if (points.length >= 4) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setPoints([...points, { x, y }]);
  };

  // Auto-calculate after 4 taps
  useEffect(() => {
    if (points.length !== 4) return;

    const scale = 0.02; // meters per pixel
    const widthPx = Math.abs(points[1].x - points[0].x);
    const lengthPx = Math.abs(points[3].y - points[0].y);
    const width = (widthPx * scale).toFixed(2);
    const length = (lengthPx * scale).toFixed(2);
    const area = (width * length).toFixed(2);
    const recommendedHP = getAirconHP(area);

    const data = { length, width, area, recommendedHP };
    setAreaData(data);

    // Send back to parent
    onMeasured?.(data);
  }, [points, onMeasured]);

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

  const ARCanvas = ARComponents?.ARCanvas;
  const DefaultXRControllers = ARComponents?.DefaultXRControllers;
  const Interactive = ARComponents?.Interactive;

  return (
    <div className="camera-container">
      <h2>{title || "📏 Room Measurement"}</h2>

      {isARSupported && ARCanvas ? (
        <div className="camera-ar" style={{ height: "60vh" }}>
          <ARCanvas style={{ width: "100%", height: "100%" }}>
            <DefaultXRControllers />
            <ambientLight />
            <Interactive
              onSelect={(e) => {
                if (points.length >= 4) return;
                const x = e.point.x;
                const y = e.point.z; // approximate 2D plane
                setPoints([...points, { x, y }]);
              }}
            />
          </ARCanvas>
        </div>
      ) : (
        <div className="camera-fallback">
          <video ref={videoRef} autoPlay playsInline className="camera-video" />
          <canvas
            ref={canvasRef}
            className="camera-overlay"
            onClick={handle2DTap}
            onTouchStart={handle2DTap}
          />
        </div>
      )}

      <div className="camera-actions">
        <button onClick={onClose}>Close</button>
        {points.length > 0 && <button onClick={handleReset}>🔄 Reset / Tap Again</button>}
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