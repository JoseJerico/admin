// src/shared/Camera.jsx
import React, { useRef, useState } from "react";
import cv from "@techstark/opencv-js";
import "./Camera.css";

export default function Camera({ getRecommendation, onClose, onMeasured }) {

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [roomData, setRoomData] = useState(null);
  const [cameraStarted, setCameraStarted] = useState(false);

  const startCamera = async () => {

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" }
    });

    videoRef.current.srcObject = stream;
    videoRef.current.play();

    setCameraStarted(true);
  };

  const captureAndMeasure = () => {

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    let src = cv.imread(canvas);
    let gray = new cv.Mat();

    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.GaussianBlur(gray, gray, new cv.Size(5,5), 0);

    let edges = new cv.Mat();
    cv.Canny(gray, edges, 50, 150);

    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();

    cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    let maxArea = 0;
    let floorContour = null;

    for (let i = 0; i < contours.size(); i++) {

      const cnt = contours.get(i);
      const area = cv.contourArea(cnt);

      if (area > maxArea) {
        maxArea = area;
        floorContour = cnt;
      }
    }

    if (floorContour) {

      let rect = cv.boundingRect(floorContour);

      const widthPx = rect.width;
      const lengthPx = rect.height;

      const refObjectMeters = 2;

      const scale = refObjectMeters / lengthPx;

      const width = widthPx * scale;
      const length = lengthPx * scale;

      const area = width * length;

      const recommendedAC = getRecommendation
        ? getRecommendation(area)
        : "N/A";

      const result = {

        width: width.toFixed(2),
        length: length.toFixed(2),
        area: area.toFixed(2),
        recommendedAC

      };

      setRoomData(result);

      if (onMeasured) onMeasured(result);
    }

    src.delete();
    gray.delete();
    edges.delete();
    contours.delete();
    hierarchy.delete();
  };

  const reset = () => {
    setRoomData(null);
  };

  return (

    <div className="camera-container">

      {!roomData && (

        <div className="camera-live">

          <h2 className="camera-title">
            📏 AR Room Measurement
          </h2>

          <video
            ref={videoRef}
            className="camera-video"
          />

          {/* AR GUIDE OVERLAY */}
          <div className="ar-overlay">
            <div className="guide-box">
              ALIGN FLOOR HERE
            </div>
          </div>

          <div className="camera-buttons">

            {!cameraStarted && (
              <button
                onClick={startCamera}
                className="btn-camera start"
              >
                Start Camera
              </button>
            )}

            {cameraStarted && (
              <button
                onClick={captureAndMeasure}
                className="btn-camera capture"
              >
                📸 Capture & Measure
              </button>
            )}

              <button
               onClick={() => {
                if (videoRef.current && videoRef.current.srcObject) {
                videoRef.current.srcObject.getTracks().forEach(track => track.stop());
        }
             if (onClose) onClose();
            }}
              className="btn-camera"
  >
            Close
              </button>

          </div>

        </div>
      )}

      <canvas
        ref={canvasRef}
        style={{ display: "none" }}
      />

      {roomData && (

        <div className="measurement-results">

          <h3>Room Measurement Result</h3>

          <p>Length: {roomData.length} m</p>
          <p>Width: {roomData.width} m</p>
          <p>Area: {roomData.area} m²</p>

          <p>
            Recommended AC:
            <strong> {roomData.recommendedAC}</strong>
          </p>

          <button
            onClick={reset}
            className="btn-camera"
          >
            Measure Again
          </button>

          <button
            onClick={onClose}
            className="btn-camera close"
          >
            Close
          </button>

        </div>

      )}

    </div>
  );
}