// src/shared/Camera.jsx
import React, { useRef, useState, useEffect } from "react";
import "./Camera.css";

export default function Camera({ getRecommendation, onMeasured, onClose, title }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraStarted, setCameraStarted] = useState(false);
  const [points, setPoints] = useState([]); // store 4 tap points
  const [captured, setCaptured] = useState(false);

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setCameraStarted(true);
    } catch (err) {
      console.error("Camera error:", err);
      alert("Cannot access camera. Please allow camera permissions.");
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    setCameraStarted(false);
  };

  // Handle user tap on video
  const handleTap = (e) => {
    if (!cameraStarted || captured) return;
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (points.length < 4) {
      setPoints([...points, { x, y }]);
    }
  };

  // Compute approximate room dimensions (meters)
  useEffect(() => {
    if (points.length === 4) {
      // Approximate width = distance between point0 & point1 (top)
      const dx = points[1].x - points[0].x;
      const dy = points[1].y - points[0].y;
      const widthPx = Math.sqrt(dx*dx + dy*dy);

      // Approximate length = distance between point0 & point3 (left side)
      const dx2 = points[3].x - points[0].x;
      const dy2 = points[3].y - points[0].y;
      const lengthPx = Math.sqrt(dx2*dx2 + dy2*dy2);

      // Reference: assume top edge ~ 2 meters
      const refMeters = 2;
      const scale = refMeters / widthPx;

      const width = (widthPx * scale).toFixed(2);
      const length = (lengthPx * scale).toFixed(2);
      const area = (width * length).toFixed(2);

      const result = {
        measurements: { length, width, area }
      };

      setCaptured(true);

      if (onMeasured) onMeasured(result);
    }
  }, [points, onMeasured]);

  const drawOverlay = () => {
  const canvas = canvasRef.current;
  const video = videoRef.current;
  if (!canvas || !video) return;

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw points with numbers
  points.forEach((p, i) => {
    // Circle
    ctx.beginPath();
    ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = "red";
    ctx.fill();
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();

    // Number label
    ctx.fillStyle = "white";
    ctx.font = "16px Arial";
    ctx.fillText(i + 1, p.x - 5, p.y - 12);
  });

  // Draw connecting lines if more than 1 point
  if (points.length > 1) {
    ctx.strokeStyle = "lime";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.forEach((p, i) => {
      if (i > 0) ctx.lineTo(p.x, p.y);
    });
    if (points.length === 4) ctx.lineTo(points[0].x, points[0].y);
    ctx.stroke();
    ctx.closePath();
  }

  requestAnimationFrame(drawOverlay);
};

  useEffect(() => {
    if (cameraStarted) drawOverlay();
  }, [cameraStarted, points]);

  return (
    <div className="camera-container">
      <h2 className="camera-title">{title || "📏 AR Room Measurement"}</h2>

      <video
        ref={videoRef}
        className="camera-video"
        onClick={handleTap}
      />

      <canvas
        ref={canvasRef}
        className="camera-overlay"
        style={{ position: "absolute", top: 0, left: 0 }}
      />

      <div className="ar-overlay">
        <div className="guide-box">TAP 4 CORNERS OF FLOOR</div>
      </div>

      <div className="camera-actions">
        {!cameraStarted && (
          <button className="btn-capture" onClick={startCamera}>Start</button>
        )}
        {cameraStarted && !captured && (
          <button
            className="btn-capture"
            onClick={() => {
              if (points.length < 4) alert("Please tap 4 corners first!");
            }}
          >
            📌 Done Tapping
          </button>
        )}
        <button
          className="btn-toggle"
          onClick={() => {
            stopCamera();
            if (onClose) onClose();
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}