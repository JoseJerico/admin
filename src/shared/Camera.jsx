import React, { useRef, useState, useEffect } from 'react'
import './Camera.css'

export default function Camera({ onCapture, title = 'Take Photo', mode = 'photo' }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const fileInputRef = useRef(null)
  const [stream, setStream] = useState(null)
  const [photo, setPhoto] = useState(null)
  const [error, setError] = useState(null)
  const [facingMode, setFacingMode] = useState('environment')
  const [measurements, setMeasurements] = useState({ width: 0, height: 0, area: 0 })

  useEffect(() => {
    startCamera()
    return () => {
      stopCamera()
    }
  }, [facingMode])

  async function startCamera() {
    try {
      setError(null)
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (err) {
      setError(`Camera access denied: ${err.message}`)
    }
  }

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
  }

  function capturePhoto() {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d')
      canvasRef.current.width = videoRef.current.videoWidth
      canvasRef.current.height = videoRef.current.videoHeight
      context.drawImage(videoRef.current, 0, 0)
      const photoData = canvasRef.current.toDataURL('image/jpeg')
      setPhoto(photoData)
      stopCamera()
    }
  }

  function retakePhoto() {
    setPhoto(null)
    startCamera()
  }

  function confirmPhoto() {
    if (photo) {
      onCapture({
        photo,
        measurements: mode === 'measure' ? measurements : null
      })
    }
  }

  function toggleCamera() {
    setFacingMode(facingMode === 'environment' ? 'user' : 'environment')
  }

  function handleMeasurementInput(field, value) {
    const val = parseFloat(value) || 0
    const newMeasurements = { ...measurements, [field]: val }
    
    if (newMeasurements.width && newMeasurements.height) {
      newMeasurements.area = (newMeasurements.width * newMeasurements.height / 10.764).toFixed(2) // Convert to sq meters
    }
    
    setMeasurements(newMeasurements)
  }

  if (error) {
    return (
      <div className="camera-container">
        <div className="camera-error">
          <div className="error-icon">📷</div>
          <h3>Camera Error</h3>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="btn-retry">
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (photo) {
    return (
      <div className="camera-container">
        <div className="camera-preview">
          <div className="preview-header">
            <h3>Photo Preview</h3>
          </div>
          <img src={photo} alt="Captured" className="photo-preview" />
          
          {mode === 'measure' && (
            <div className="measurement-inputs">
              <h4>📏 Room Dimensions</h4>
              <div className="input-group">
                <label>Width (feet)</label>
                <input
                  type="number"
                  value={measurements.width}
                  onChange={(e) => handleMeasurementInput('width', e.target.value)}
                  placeholder="Enter width in feet"
                />
              </div>
              <div className="input-group">
                <label>Length (feet)</label>
                <input
                  type="number"
                  value={measurements.height}
                  onChange={(e) => handleMeasurementInput('height', e.target.value)}
                  placeholder="Enter length in feet"
                />
              </div>
              {measurements.area > 0 && (
                <div className="area-display">
                  <strong>Room Area: {measurements.area} m²</strong>
                </div>
              )}
            </div>
          )}

          <div className="camera-actions">
            <button onClick={retakePhoto} className="btn-retake">
              ↻ Retake
            </button>
            <button 
              onClick={confirmPhoto} 
              className="btn-confirm"
              disabled={mode === 'measure' && !measurements.area}
            >
              ✓ Confirm
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="camera-container">
      <div className="camera-live">
        <div className="camera-header">
          <h3>{title}</h3>
        </div>
        
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="camera-video"
        />

        {mode === 'measure' && (
          <div className="camera-guide">
            <div className="guide-box">
              <p>📐 Position room corners in frame</p>
            </div>
          </div>
        )}

        <div className="camera-actions">
          <button onClick={toggleCamera} className="btn-toggle" title="Switch camera">
            🔄
          </button>
          <button onClick={capturePhoto} className="btn-capture">
            📷 Capture
          </button>
        </div>
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}
