import React, { useRef, useEffect, useState } from 'react'
import './Camera.css'

export default function Camera({ title, onClose, onMeasured }) {
  const videoRef = useRef(null)
  const [stream, setStream] = useState(null)
  const [captured, setCaptured] = useState(false)
  const [length, setLength] = useState('')
  const [width, setWidth] = useState('')

  useEffect(() => {
    async function startCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true })
        videoRef.current.srcObject = mediaStream
        setStream(mediaStream)
      } catch (err) {
        console.error('Error accessing camera:', err)
        alert('Cannot access camera. Please use manual input.')
        onClose()
      }
    }

    startCamera()

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  function handleCapture() {
    setCaptured(true)
  }

  function handleSubmit() {
    if (!length || !width) {
      alert('Please enter both length and width')
      return
    }

    const lengthNum = parseFloat(length)
    const widthNum = parseFloat(width)
    const area = lengthNum * widthNum

    const recommendedHP = getAirconHP(area)

    onMeasured({
      length: lengthNum.toFixed(2),
      width: widthNum.toFixed(2),
      area: area.toFixed(2),
      recommendedHP
    })
  }

  function getAirconHP(area) {
    const areaNum = parseFloat(area)
    if (areaNum <= 9) return "0.5 HP"
    if (areaNum <= 18) return "1.0 HP"
    if (areaNum <= 25) return "1.5 HP"
    if (areaNum <= 35) return "2.0 HP"
    if (areaNum <= 45) return "2.5 HP"
    if (areaNum <= 60) return "3.0 HP"
    if (areaNum <= 80) return "4.0 HP"
    return "5.0 HP or higher"
  }

  return (
    <div className="camera-modal-overlay" onClick={onClose}>
      <div className="camera-modal" onClick={e => e.stopPropagation()}>
        <div className="camera-header">
          <h2>{title}</h2>
          <button className="btn-close-modal" onClick={onClose}>✕</button>
        </div>

        {!captured ? (
          <div className="camera-preview">
            <video ref={videoRef} autoPlay playsInline />
            <button className="btn-capture" onClick={handleCapture}>📸 Capture</button>
          </div>
        ) : (
          <div className="camera-inputs">
            <p>Enter captured room dimensions:</p>
            <div className="form-group">
              <label>Length (m)</label>
              <input type="number" value={length} onChange={e => setLength(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Width (m)</label>
              <input type="number" value={width} onChange={e => setWidth(e.target.value)} />
            </div>
            <button className="btn-submit" onClick={handleSubmit}>✅ Submit</button>
          </div>
        )}
      </div>
    </div>
  )
}