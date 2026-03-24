import React, { useEffect, useRef, useState } from "react";

export default function RoomMeasurementAR({ onMeasureComplete }) {
  const videoRef = useRef(null);

  const [points, setPoints] = useState([]);
  const [length, setLength] = useState(null);
  const [width, setWidth] = useState(null);
  const [step, setStep] = useState("length"); // length → width

  // 📷 Open Camera
  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        alert("Camera access denied or not supported");
      }
    }

    startCamera();

    return () => {
      // stop camera
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // 👉 Handle Tap
  function handleTap(e) {
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newPoints = [...points, { x, y }];
    setPoints(newPoints);

    // kapag 2 points → compute
    if (newPoints.length === 2) {
      const dx = newPoints[1].x - newPoints[0].x;
      const dy = newPoints[1].y - newPoints[0].y;

      const distance = Math.sqrt(dx * dx + dy * dy);

      // 🔥 FAKE SCALE (adjust mo kung gusto mo)
      const meters = (distance / 100).toFixed(2);

      if (step === "length") {
        setLength(meters);
        setPoints([]);
        setStep("width");
      } else {
        setWidth(meters);
        setPoints([]);
      }
    }
  }

  // 👉 Kapag kumpleto na
  useEffect(() => {
    if (length && width) {
      const area = (length * width).toFixed(2);

      onMeasureComplete({
        measurements: {
          length,
          width,
          area
        },
        recommended:
          area <= 9 ? "0.5 HP" :
          area <= 18 ? "1.0 HP" :
          area <= 25 ? "1.5 HP" :
          area <= 35 ? "2.0 HP" :
          area <= 45 ? "2.5 HP" :
          area <= 60 ? "3.0 HP" :
          area <= 80 ? "4.0 HP" :
          "5.0 HP or higher"
      });
    }
  }, [length, width]);

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000" }}>
      
      {/* 📷 Camera */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        onClick={handleTap}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover"
        }}
      />

      {/* 🟢 Overlay UI */}
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          color: "#fff",
          background: "rgba(0,0,0,0.5)",
          padding: "10px",
          borderRadius: "10px"
        }}
      >
        {step === "length" && !length && "Tap 2 points for LENGTH"}
        {step === "width" && !width && "Tap 2 points for WIDTH"}
        {length && !width && `Length: ${length} m`}
      </div>

    </div>
  );
}