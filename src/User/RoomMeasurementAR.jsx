// RoomMeasurementAR.jsx
import React, { useEffect, useRef, useState } from "react";

export default function RoomMeasurementAR({ onMeasureComplete, resetTrigger }) {
  const videoRef = useRef(null);
  const [markers, setMarkers] = useState([]);
  const [length, setLength] = useState(null);
  const [width, setWidth] = useState(null);

  // 📷 Open Camera
  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        alert("Camera access denied or not supported");
      }
    }

    // Stop existing stream bago mag-start ulit
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
    }

    startCamera();
  }, [resetTrigger]);

  // Reset markers kapag Measure Again
  useEffect(() => {
    setMarkers([]);
    setLength(null);
    setWidth(null);
  }, [resetTrigger]);

  // Handle user taps
  function handleTap(e) {
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newMarkers = [...markers, { x, y }];
    setMarkers(newMarkers);

    if (newMarkers.length === 4) {
      calculateMeasurements(newMarkers);
    }
  }

  // Compute Length, Width, Area, Recommended HP
  function calculateMeasurements(points) {
    if (points.length < 4) return;

    const distance = (p1, p2) =>
      Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2) / 100; // adjust scale

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

    // ⚡ Trigger callback para lumipat sa Room Analysis
    onMeasureComplete({
      measurements: { length: len.toFixed(2), width: wid.toFixed(2), area: area.toFixed(2) },
      recommended,
    });
  }

  // Helper para display sa overlay
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

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000" }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        onClick={handleTap}
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

        {length && width && (
          <>
            <p>Length: {length} m</p>
            <p>Width: {width} m</p>
            <p>Area: {(length * width).toFixed(2)} m²</p>
            <p>Recommended HP: {recommendedHP()}</p>
            <div>✅ Measurement Complete!</div>
          </>
        )}
      </div>

      {/* Red markers */}
      {markers.map((pos, idx) => (
        <div
          key={idx}
          style={{
            position: "absolute",
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: "red",
            left: pos.x - 6,
            top: pos.y - 6,
          }}
        />
      ))}
    </div>
  );
}