import React, { useRef, useState, useEffect } from 'react'
import './Camera.css'

export default function Camera({ title, onClose, onCapture }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [stream, setStream] = useState(null)
  const [capturedPhoto, setCapturedPhoto] = useState(null)

  useEffect(() => {
    async function startCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true })
        videoRef.current.srcObject = mediaStream
        setStream(mediaStream)
      } catch (err) {
        console.error('Cannot access camera:', err)
        alert('Cannot access camera.')
        onClose()
      }
    }
    startCamera()

    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop())
    }
  }, [])

  function handleCapture() {
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const photoData = canvas.toDataURL('image/png')
    setCapturedPhoto(photoData)
  }

  function handleSubmit() {
    if (capturedPhoto) onCapture(capturedPhoto)
    onClose()
  }

  function handleRetake() {
    setCapturedPhoto(null)
  }

  return (
    <div className="camera-modal-overlay" onClick={onClose}>
      <div className="camera-modal" onClick={e => e.stopPropagation()}>
        <h2>{title}</h2>
        {!capturedPhoto ? (
          <div>
            <video ref={videoRef} autoPlay playsInline />
            <button onClick={handleCapture}>📸 Capture</button>
          </div>
        ) : (
          <div>
            <img src={capturedPhoto} alt="Captured" className="captured-preview"/>
            <div>
              <button onClick={handleRetake}>🔄 Retake</button>
              <button onClick={handleSubmit}>✅ Submit</button>
            </div>
          </div>
        )}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    </div>
  )
}