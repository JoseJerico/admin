import React, { useRef, useState, useEffect } from 'react'
import './Camera.css'
import * as THREE from 'three'
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js'

export default function Camera({ onCapture, title = 'Measure Room', mode = 'measure' }) {
  const [measurements, setMeasurements] = useState({ width: 0, length: 0, area: 0 })
  const [recommendedHP, setRecommendedHP] = useState(null)
  const [error, setError] = useState(null)

  const containerRef = useRef(null)
  const rendererRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const reticleRef = useRef(null)
  const hitTestSourceRef = useRef(null)
  const hitTestSourceRequestedRef = useRef(false)
  const pointsRef = useRef([])

  useEffect(() => {
    if (!navigator.xr) {
      setError('WebXR not supported on this device')
      return
    }

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera()
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.xr.enabled = true
    containerRef.current.appendChild(renderer.domElement)

    sceneRef.current = scene
    cameraRef.current = camera
    rendererRef.current = renderer

    // AR Button
    document.body.appendChild(
      ARButton.createButton(renderer, { requiredFeatures: ['hit-test'] })
    )

    // Reticle
    const geometry = new THREE.RingGeometry(0.08, 0.1, 32).rotateX(-Math.PI / 2)
    const material = new THREE.MeshBasicMaterial({ color: 0x0fff00 })
    const reticle = new THREE.Mesh(geometry, material)
    reticle.visible = false
    scene.add(reticle)
    reticleRef.current = reticle

    // Animation loop
    renderer.setAnimationLoop(render)

    // Bind AR "tap" event (select) para mobile
    const session = renderer.xr.getSession()
    if (session) {
      session.addEventListener('select', handleTap)
    }

    return () => {
      renderer.setAnimationLoop(null)
      renderer.domElement.remove()
      if (session) session.removeEventListener('select', handleTap)
    }
  }, [])

  function render(timestamp, frame) {
    if (!rendererRef.current) return
    const renderer = rendererRef.current
    const scene = sceneRef.current
    const camera = cameraRef.current

    if (frame) {
      const session = renderer.xr.getSession()
      if (!hitTestSourceRequestedRef.current && session) {
        session.requestReferenceSpace('viewer').then((refSpace) => {
          session.requestHitTestSource({ space: refSpace }).then((source) => {
            hitTestSourceRef.current = source
          })
        })
        session.addEventListener('end', () => {
          hitTestSourceRequestedRef.current = false
          hitTestSourceRef.current = null
        })
        hitTestSourceRequestedRef.current = true
      }

      if (hitTestSourceRef.current) {
        const hitTestResults = frame.getHitTestResults(hitTestSourceRef.current)
        if (hitTestResults.length > 0) {
          const hit = hitTestResults[0]
          const pose = hit.getPose(renderer.xr.getReferenceSpace())
          reticleRef.current.visible = true
          reticleRef.current.position.set(
            pose.transform.position.x,
            pose.transform.position.y,
            pose.transform.position.z
          )
        } else {
          reticleRef.current.visible = false
        }
      }
    }

    renderer.render(scene, camera)
  }

  function handleTap() {
    console.log('AR reticle tapped') // debug log
    if (!reticleRef.current.visible) return
    const pos = reticleRef.current.position.clone()
    pointsRef.current.push(pos)

    if (pointsRef.current.length === 2) {
      const [p1, p2] = pointsRef.current
      const dx = p2.x - p1.x
      const dz = p2.z - p1.z
      const width = Math.abs(dx)
      const length = Math.abs(dz)
      const area = (width * length).toFixed(2)

      setMeasurements({ width: width.toFixed(2), length: length.toFixed(2), area })
      setRecommendedHP(getAirconHP(area))

      if (onCapture) onCapture({ measurements: { width, length, area }, photo: null })
    }
  }

  function getAirconHP(area) {
    const a = parseFloat(area)
    if (a <= 9) return '0.5 HP'
    if (a <= 18) return '1.0 HP'
    if (a <= 25) return '1.5 HP'
    if (a <= 35) return '2.0 HP'
    if (a <= 45) return '2.5 HP'
    if (a <= 60) return '3.0 HP'
    if (a <= 80) return '4.0 HP'
    return '5.0 HP or higher'
  }

  return (
    <div
      ref={containerRef}
      className="camera-container"
      style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}
    >
      {error && <p>{error}</p>}

      {measurements.area > 0 && (
        <div
          className="measurement-overlay"
          style={{
            position: 'absolute',
            bottom: '20px',
            left: '20px',
            backgroundColor: 'rgba(0,0,0,0.6)',
            color: '#fff',
            padding: '10px',
            borderRadius: '8px'
          }}
        >
          <p>Width: {measurements.width} m</p>
          <p>Length: {measurements.length} m</p>
          <p>Area: {measurements.area} m²</p>
          <p>Recommended: {recommendedHP}</p>
        </div>
      )}
    </div>
  )
}