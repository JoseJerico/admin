import React, { useEffect, useRef, useState } from "react";
import "./RoomMeasurementAR.css"; // For static crosshair

export default function RoomMeasurementAR({ onMeasureComplete, resetTrigger, setShowAR, setScreen }) {
  const videoRef = useRef(null);
  const [markers, setMarkers] = useState([]);
  const [length, setLength] = useState(null);
  const [width, setWidth] = useState(null);
  const [showRectangle, setShowRectangle] = useState(false);

  // Crosshair state
  const [crosshair, setCrosshair] = useState({ x: 0, y: 0, visible: true }); // Always visible in center

  // Handle measuring complete
  const handleMeasurementComplete = () => {
    setShowAR(false);  // Hide AR view
    setScreen('home');  // Go to home screen after measurement
  };

  // Animation trigger for markers
  const [popMarkers, setPopMarkers] = useState({}); // { idx: true }

  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        alert("Camera access denied or not supported");
      }
    }

    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
    }

    startCamera();
  }, [resetTrigger]);

  useEffect(() => {
    setMarkers([]);
    setLength(null);
    setWidth(null);
    setShowRectangle(false);
    setCrosshair({ x: 0, y: 0, visible: true }); // Ensure crosshair is visible initially
    setPopMarkers({});
  }, [resetTrigger]);

  const distance = (p1, p2) =>
    Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2) / 100;

  function calculateMeasurements(points) {
    if (points.length < 4) return;

    const len = distance(points[0], points[1]);
    const wid = distance(points[2], points[3]);

    setLength(len.toFixed(2));
    setWidth(wid.toFixed(2));

    const area = len * wid;
    const recommended =
      area <= 9 ? "0.5 HP" :
      area <= 18 ? "1.0 HP" :
      area <= 25 ? "1.5 HP" :
      area <= 35 ? "2.0 HP" :
      area <= 45 ? "2.5 HP" :
      area <= 60 ? "3.0 HP" :
      area <= 80 ? "4.0 HP" :
      "5.0 HP or higher";

    onMeasureComplete({
      measurements: { length: len.toFixed(2), width: wid.toFixed(2), area: area.toFixed(2) },
      recommended,
    });
  }

  function handleTap(e) {
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Define the center area tolerance (larger area)
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const tolerance = 100; // Expand the area for easier clicking

    // Check if the tap is within the center area
    if (
      Math.abs(x - centerX) <= tolerance &&
      Math.abs(y - centerY) <= tolerance
    ) {
      // Only start measuring if tapped in the center
      setMarkers([]); // Reset markers for new measurement
      setLength(null);
      setWidth(null);
      setShowRectangle(false);
      setPopMarkers({});

      console.log("Center area tapped. Start measurement!");
    }
  }

  function handleMouseMove(e) {
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCrosshair({ x, y, visible: true });
  }

  function handleMouseLeave() {
    setCrosshair({ ...crosshair, visible: false });
  }

  function handleTouchMove(e) {
    const touch = e.touches[0];
    const rect = e.target.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    setCrosshair({ x, y, visible: true });
  }

  function handleTouchEnd() {
    setCrosshair({ ...crosshair, visible: false });
  }

  function recommendedHP() {
    const area = length * width;
    if (!area) return "";
    if (area <= 9) return "0.5 HP";
    if (area <= 18) return "1.0 HP";
    if (area <= 25) return "1.5 HP";
    if (area <= 35) return "2.0 HP";
    if (area <= 45) return "2.5 HP";
    if (area <= 60) return "3.0 HP";
    if (area <= 80) return "4.0 HP";
    return "5.0 HP or higher";
  }

  const getRectangleBounds = (points) => {
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const left = Math.min(...xs);
    const top = Math.min(...ys);
    const right = Math.max(...xs);
    const bottom = Math.max(...ys);
    return { left, top, width: right - left, height: bottom - top };
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000" }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        onClick={handleTap}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />

      {/* Overlay UI */}
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          color: "#fff",
          background: "rgba(0,0,0,0.5)",
          padding: "10px",
          borderRadius: "10px",
        }}
      >
        {markers.length < 2 && "Tap 1st 2 points for LENGTH"}
        {markers.length >= 2 && markers.length < 4 && "Tap next 2 points for WIDTH"}

        {length && width && showRectangle && (
          <>
            <p>Length: {length} m</p>
            <p>Width: {width} m</p>
            <p>Area: {(length * width).toFixed(2)} m²</p>
            <p>Recommended HP: {recommendedHP()}</p>
            <div>✅ Measurement Complete!</div>
            <button
              style={{
                backgroundColor: "#007BFF",
                color: "#fff",
                padding: "10px 20px",
                borderRadius: "5px",
                cursor: "pointer",
                marginTop: "1rem",
              }}
              onClick={handleMeasurementComplete}
            >
              Go to Home
            </button>
          </>
        )}
      </div>

      {/* Red numbered markers with pop animation */}
      {markers.map((pos, idx) => (
        <div
          key={idx}
          className={popMarkers[idx] ? "pop-marker" : ""}
          style={{
            position: "absolute",
            left: pos.x - 12,
            top: pos.y - 12,
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: "red",
            color: "white",
            fontWeight: "bold",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontSize: "14px",
            pointerEvents: "none",
          }}
        >
          {idx + 1}
        </div>
      ))}

      {/* Yellow rectangle */}
      {showRectangle && markers.length === 4 && (() => {
        const rect = getRectangleBounds(markers);
        return (
          <div
            style={{
              position: "absolute",
              left: rect.left,
              top: rect.top,
              width: rect.width,
              height: rect.height,
              border: "2px dashed yellow",
              backgroundColor: "rgba(255, 255, 0, 0.2)",
              pointerEvents: "none",
            }}
          />
        );
      })()}

      {/* Static Crosshair with larger clickable area */}
      {crosshair.visible && (
        <div
          className="static-crosshair"
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)", // Center it
            width: 40, // Size of the crosshair
            height: 40,
            borderRadius: "50%", // Round shape
            border: "2px solid yellow", // Yellow border
            backgroundColor: "rgba(255,255,0,0.2)", // Light yellow background for better visibility
            pointerEvents: "none", // Prevents interference with user clicks or taps
          }}
        />
      )}
    </div>
  );
}