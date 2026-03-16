import React, { useState, useEffect } from 'react'
import Camera from '../shared/Camera' // latest OpenCV.js Camera
import './UserApp.css'
import { supabase } from '../supabase'

export default function UserApp({ user, onLogout }) {
  const [screen, setScreen] = useState('home')
  const [cart, setCart] = useState([])
  const [showCamera, setShowCamera] = useState(false)
  const [roomMeasurements, setRoomMeasurements] = useState(null)
  const [recommendedProduct, setRecommendedProduct] = useState(null)
  const [showProfile, setShowProfile] = useState(false)

  const [products, setProducts] = useState([])
  const [services, setServices] = useState([])

  // Manual measurement states
  const [manualLength, setManualLength] = useState('')
  const [manualWidth, setManualWidth] = useState('')
  const [manualUnit, setManualUnit] = useState('meters')

  useEffect(() => {
    fetchProducts()
    fetchServices()
  }, [])

  async function fetchProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('id')

    if (error) {
      console.error('Products error:', error)
      return
    }

    setProducts(data || [])
  }

  async function fetchServices() {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('id')

    if (error) {
      console.error('Services error:', error)
      return
    }

    setServices(data || [])
  }

  function addToCart(item) {
    setCart([...cart, { ...item, cartId: Date.now() }])
  }

  function removeFromCart(cartId) {
    setCart(cart.filter(item => item.cartId !== cartId))
  }

  function handleManualCalculate() {
    if (!manualLength || !manualWidth) {
      alert("Please enter both length and width")
      return
    }

    let length = parseFloat(manualLength)
    let width = parseFloat(manualWidth)

    if (manualUnit === "feet") {
      length = length * 0.3048
      width = width * 0.3048
    }

    const area = length * width

    setRoomMeasurements({
      measurements: {
        length: length.toFixed(2),
        width: width.toFixed(2),
        area: area.toFixed(2)
      }
    })

    const recommendedHP = getAirconHP(area)
    setRecommendedProduct({ capacity: recommendedHP })

    setScreen('measure')
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

  function handleCameraCapture(data) {
    setRoomMeasurements(data)
    const area = parseFloat(data.measurements.area)
    const recommendedHP = getAirconHP(area)
    setRecommendedProduct({ capacity: recommendedHP })
    setShowCamera(false)
    setScreen('measure')
  }

  function calculateTotal() {
    return cart.reduce((acc, item) => acc + (item.price || 0), 0)
  }

  // Camera Screen (photo-based, AR-free)
  {showCamera && (
    <Camera
      title="📐 Measure Your Room (AR)"
      onClose={() => setShowCamera(false)}
      onMeasured={(data) => {
        setRoomMeasurements({
          measurements: {
            length: data.length,
            width: data.width,
            area: data.area,
          },
        })

        setRecommendedProduct({
          capacity: data.recommendedHP,
        })

        setShowCamera(false)
        setScreen('measure')
      }}
    />
  )}

  return (
    <div className="user-app">
      {/* Header */}
      <header className="user-header">
        <div className="header-top">
          <h1>❄️ AirCon Hub</h1>
          <div className="header-actions">
            <button onClick={() => setShowProfile(true)} className="user-info" title="View profile">
              👤 {user?.name || 'Guest'}
            </button>
            <button onClick={() => setScreen('cart')} className="btn-cart" title="View cart">
              🛒 {cart.length > 0 && <span className="cart-badge">{cart.length}</span>}
            </button>
            <button onClick={onLogout} className="btn-logout-user">🚪 Logout</button>
          </div>
        </div>
        {screen !== 'home' && (
          <button onClick={() => setScreen('home')} className="btn-back">← Back</button>
        )}
      </header>

      {/* Home Screen */}
      {screen === 'home' && (
        <main className="user-main">
          <div className="hero">
            <div className="hero-content">
              <h2>Smart Cooling Solutions</h2>
              <p>Professional AC installation, maintenance & repair services</p>
            </div>
          </div>

          <div className="quick-actions">
            <button
              onClick={() => setScreen('measure-choice')}
              className="action-card measure"
            >
              <div className="action-icon">📐</div>
              <h3>Measure Room</h3>
              <p>Get AC recommendation</p>
            </button>

            <button
              onClick={() => setScreen('services')}
              className="action-card services"
            >
              <div className="action-icon">🔧</div>
              <h3>Services</h3>
              <p>Installation & repair</p>
            </button>
          </div>
        </main>
      )}

      {/* Measure Choice */}
{screen === 'measure-choice' && (
  <main className="user-main">
    <div className="screen-header">
      <h2>📏 Choose Measurement Method</h2>
      <p>Select how you want to measure your room</p>
    </div>

    <div className="measure-options">
      <button
        className="measure-option manual"
        onClick={() => setScreen('manual-measure')}
      >
        <div className="measure-icon">📏</div>
        <div className="measure-text">
          <h3>Manual Measurement</h3>
          <p>Enter room size manually</p>
        </div>
      </button>

      <button
        className="measure-option ar"
        onClick={() => setShowCamera(true)}
      >
        <div className="measure-icon">📷</div>
        <div className="measure-text">
          <h3>Use Camera AR</h3>
          <p>Scan your room using camera</p>
        </div>
      </button>
    </div>
  </main>
)}

{/* Manual Measurement */}
{screen === 'manual-measure' && (
  <main className="user-main">
    <div className="screen-header">
      <h2>✏️ Manual Room Measurement</h2>
      <p>Enter your room dimensions below</p>
    </div>

    <div className="manual-form">
      <div className="form-group">
        <label>Length</label>
        <input
          type="number"
          value={manualLength}
          onChange={(e) => setManualLength(e.target.value)}
          placeholder="Enter length"
        />
      </div>

      <div className="form-group">
        <label>Width</label>
        <input
          type="number"
          value={manualWidth}
          onChange={(e) => setManualWidth(e.target.value)}
          placeholder="Enter width"
        />
      </div>

      <div className="form-group">
        <label>Unit</label>
        <select
          value={manualUnit}
          onChange={(e) => setManualUnit(e.target.value)}
        >
          <option value="meters">Meters</option>
          <option value="feet">Feet</option>
        </select>
      </div>

      <button className="btn-calculate" onClick={handleManualCalculate}>
        Calculate
      </button>
    </div>
  </main>
)}

      {/* Room Analysis */}
{screen === 'measure' && roomMeasurements && (
  <main className="user-main">
    <div className="screen-header">
      <h2>📏 Room Analysis</h2>
    </div>

    {/* Wrap results in new container */}
    <div className="room-analysis-container">
      <div className="result-card">
        <h3>Room Dimensions</h3>
        <div className="measurements">
          <p>Length: <strong>{roomMeasurements.measurements.length} m</strong></p>
          <p>Width: <strong>{roomMeasurements.measurements.width} m</strong></p>
          <p>Area: <strong>{roomMeasurements.measurements.area} m²</strong></p>
        </div>
      </div>

      {recommendedProduct && (
        <div className="recommendation">
          <h3>🎯 Recommended AirCon</h3>
          <p>{recommendedProduct.capacity}</p>
        </div>
      )}

      <div className="actions">
        <button
          className="btn-remeasure"
          onClick={() => {
            setManualLength('')
            setManualWidth('')
            setManualUnit('meters')
            setRoomMeasurements(null)
            setRecommendedProduct(null)
            setScreen('manual-measure')
          }}
        >
          📐 Measure Again
        </button>
        <button onClick={() => setScreen('home')} className="btn-back">
          ← Back to Home
        </button>
      </div>
    </div>
  </main>
)}

      {/* Profile Modal */}
      {showProfile && (
        <div className="profile-modal-overlay" onClick={() => setShowProfile(false)}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>👤 My Profile</h2>
              <button onClick={() => setShowProfile(false)} className="btn-close-modal">✕</button>
            </div>
            <div className="profile-content">
              <div className="profile-item">
                <span className="label">Name:</span>
                <span>{user?.name || 'Guest'}</span>
              </div>
              <div className="profile-item">
                <span className="label">Email:</span>
                <span>{user?.email || 'N/A'}</span>
              </div>
              <div className="profile-item">
                <span className="label">Role:</span>
                <span>Customer</span>
              </div>
              <div className="profile-item">
                <span className="label">Member Since:</span>
                <span>{new Date().toLocaleDateString()}</span>
              </div>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowProfile(false)} className="btn-close">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}