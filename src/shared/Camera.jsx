import React, { useRef, useState, useEffect } from 'react'
import './Camera.css'

export default function Camera({ title, onClose, onCapture }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [stream, setStream] = useState(null)
  const [capturedPhoto, setCapturedPhoto] = useState(null)

  // Start camera function (pwede tawagin sa mount at retake)
  async function startCamera() {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true })
      if (videoRef.current) videoRef.current.srcObject = mediaStream
      setStream(mediaStream)
    } catch (err) {
      console.error('Cannot access camera:', err)
      alert('Cannot access camera.')
      onClose()
    }
  }

  // Start camera sa mount
  useEffect(() => {
    startCamera()
    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop())
    }
  }, [])

  function handleCapture() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    const photoData = canvas.toDataURL('image/png')
    setCapturedPhoto(photoData)

    // Stop stream para hindi tumakbo ang camera habang preview
    if (stream) stream.getTracks().forEach(track => track.stop())
  }

  function handleSubmit() {
    if (capturedPhoto) onCapture(capturedPhoto)
    onClose()
  }

  function handleRetake() {
    setCapturedPhoto(null)
    startCamera() // Restart camera stream para makakuha ulit ng bagong picture
  }

  return (
    <div className="camera-modal-overlay" onClick={onClose}>
      <div className="camera-modal" onClick={e => e.stopPropagation()}>
        <h2>{title}</h2>

        {!capturedPhoto ? (
          <div className="camera-preview">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              style={{
                width: '100%',
                objectFit: 'contain',
                maxHeight: '400px',
                borderRadius: '8px',
                backgroundColor: '#000'
              }}
            />
            <button onClick={handleCapture} className="btn-capture">
              📸 Capture
            </button>
          </div>
        ) : (
          <div className="camera-preview">
            <img
              src={capturedPhoto}
              alt="Captured"
              className="captured-preview"
              style={{
                width: '100%',
                objectFit: 'contain',
                maxHeight: '400px',
                borderRadius: '8px'
              }}
            />
            <div className="camera-actions">
              <button onClick={handleRetake} className="btn-retake">
                🔄 Retake
              </button>
              <button onClick={handleSubmit} className="btn-submit">
                ✅ Submit
              </button>
            </div>
          </div>
        )}

        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    </div>
  )
}