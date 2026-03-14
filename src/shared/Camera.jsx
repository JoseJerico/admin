import React, { useRef, useState } from "react";
import cv from "@techstark/opencv-js"; // OpenCV.js in browser

export default function Camera({ getRecommendation }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [roomData, setRoomData] = useState(null);

  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
    videoRef.current.srcObject = stream;
    videoRef.current.play();
  };

  const captureAndMeasure = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to OpenCV Mat
    let src = cv.imread(canvas);
    let gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.GaussianBlur(gray, gray, new cv.Size(5,5), 0);

    // Edge detection
    let edges = new cv.Mat();
    cv.Canny(gray, edges, 50, 150);

    // Contour detection
    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();
    cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    // Find largest contour (assume floor)
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
      // Width & Length in pixels
      const widthPx = rect.width;
      const lengthPx = rect.height;

      // Reference object length in meters (example: door 2m)
      const refObjectMeters = 2;
      const scale = refObjectMeters / lengthPx;

      const width = widthPx * scale;
      const length = lengthPx * scale;
      const area = width * length;

      let recommendedAC = getRecommendation ? getRecommendation(area) : "N/A";

      setRoomData({
        width: width.toFixed(2),
        length: length.toFixed(2),
        area: area.toFixed(2),
        recommendedAC
      });
    }

    // Clean up
    src.delete(); gray.delete(); edges.delete(); contours.delete(); hierarchy.delete();
  };

  const reset = () => setRoomData(null);

  return (
    <div>
      {!roomData && (
        <>
          <video ref={videoRef} style={{ width: "100%" }} />
          <button onClick={startCamera}>Start Camera</button>
          <button onClick={captureAndMeasure}>Capture & Measure</button>
        </>
      )}
      <canvas ref={canvasRef} style={{ display: roomData ? "block" : "none", width: "100%" }} />
      {roomData && (
        <div>
          <h3>Room Measurement</h3>
          <p>Length: {roomData.length} m</p>
          <p>Width: {roomData.width} m</p>
          <p>Area: {roomData.area} m²</p>
          <p>Recommended AC: {roomData.recommendedAC}</p>
          <button onClick={reset}>Take Another</button>
        </div>
      )}
    </div>
  );
}