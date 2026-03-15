import React, { useRef, useEffect, useState } from "react"
import "./Camera.css"

export default function Camera({ onMeasured, onClose, title }) {

  const videoRef = useRef(null)
  const canvasRef = useRef(null)

  const [points, setPoints] = useState([])

  // Start Camera
  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }
        })

        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }

      } catch (err) {
        console.error("Camera error:", err)
        alert("Unable to access camera")
      }
    }

    startCamera()

    return () => {
      stopCamera()
    }

  }, [])

  // Stop camera
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop())
    }
  }

  // Draw overlay points
  useEffect(() => {

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    ctx.strokeStyle = "lime"
    ctx.lineWidth = 3

    ctx.fillStyle = "red"

    points.forEach((p, index) => {

      ctx.beginPath()
      ctx.arc(p.x, p.y, 8, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = "white"
      ctx.font = "18px Arial"
      ctx.fillText(index + 1, p.x + 10, p.y - 10)

      ctx.fillStyle = "red"

      if (index > 0) {
        ctx.beginPath()
        ctx.moveTo(points[index - 1].x, points[index - 1].y)
        ctx.lineTo(p.x, p.y)
        ctx.stroke()
      }

    })

    if (points.length === 4) {

      ctx.beginPath()
      ctx.moveTo(points[3].x, points[3].y)
      ctx.lineTo(points[0].x, points[0].y)
      ctx.stroke()

    }

  }, [points])

  // Compute after 4 taps
  useEffect(() => {

    if (points.length !== 4) return

    const widthPx = Math.abs(points[1].x - points[0].x)
    const heightPx = Math.abs(points[2].y - points[1].y)

    const scale = 0.02

    const length = (widthPx * scale).toFixed(2)
    const width = (heightPx * scale).toFixed(2)

    const area = (length * width).toFixed(2)

    const result = {
      measurements: {
        length,
        width,
        area
      }
    }

    if (onMeasured) {
      onMeasured(result)
    }

    stopCamera()

    if (onClose) {
      onClose()
    }

  }, [points])

  // Tap handler
  function handleTap(e) {

    if (points.length >= 4) return

    const rect = canvasRef.current.getBoundingClientRect()

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setPoints([...points, { x, y }])

  }

  return (

    <div className="camera-container">

      <div className="camera-header">
        <h2>{title || "📏 Measure Room"}</h2>
        <p>Tap the 4 corners of your floor</p>
      </div>

      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="camera-video"
      />

      <canvas
        ref={canvasRef}
        className="camera-overlay"
        onClick={handleTap}
      />

      <button
        className="camera-close"
        onClick={() => {
          stopCamera()
          if (onClose) onClose()
        }}
      >
        ✕ Close
      </button>

    </div>

  )
}