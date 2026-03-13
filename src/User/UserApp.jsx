import React, { useState, useEffect } from 'react'
import Camera from '../shared/Camera'
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
    alert("Please enter both length and width");
    return;
  }

  let length = parseFloat(manualLength);
  let width = parseFloat(manualWidth);

  if (manualUnit === "feet") {
    length = length * 0.3048; // feet to meters
    width = width * 0.3048;
  }

  const area = length * width;

  setRoomMeasurements({
    measurements: {
      length: length.toFixed(2),
      width: width.toFixed(2),
      area: area.toFixed(2)
    }
  });

  const recommendedHP = getAirconHP(area);
  setRecommendedProduct({ capacity: recommendedHP });

  setScreen('measure'); // Go to Room Analysis screen
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
  function getRecommendation(area) {
    if (!products.length) return null

    const areaNum = parseFloat(area)

    if (areaNum <= 150) return products[0]
    if (areaNum <= 200) return products[1] || products[0]
    if (areaNum <= 250) return products[2] || products[products.length - 1]
    if (areaNum <= 300) return products[3] || products[products.length - 1]
    if (areaNum <= 400) return products[4] || products[products.length - 1]

    return products[products.length - 1]
  }

  function handleCameraCapture(data) {
    // 1. I-set ang na-capture na measurements
    setRoomMeasurements(data);

    // 2. Kunin ang area mula sa camera capture
    const area = parseFloat(data.measurements.area);

    // 3. I-calculate ang recommended HP gamit ang function na meron ka na
    const recommendedHP = getAirconHP(area);

    // 4. I-set sa state para ipakita sa UI
    setRecommendedProduct({ capacity: recommendedHP });

    // 5. Isara ang camera at ipakita ang measure result screen
    setShowCamera(false);
    setScreen('measure');
}

  async function handleConfirmBooking() {
    if (!user?.id) {
      alert('User not logged in')
      return
    }

    const { error } = await supabase
      .from('bookings')
      .insert({
        user_id: user.id,
        total_amount: calculateTotal() + 500,
        items: cart
      })

    if (error) {
      console.error(error)
      alert('Failed to save booking')
      return
    }

    setCart([])
    setScreen('home')
    alert('Booking saved!')
  }

  if (showCamera) {
    return (
      <div className="user-app">
        <Camera
          onCapture={handleCameraCapture}
          title="📐 Measure Your Room"
          mode="measure"
        />
        <button onClick={() => setShowCamera(false)} className="btn-close-camera">
          ✕
        </button>
      </div>
    )
  }

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
          {/*
            <button
              onClick={() => setScreen('products')}
              className="action-card products"
            >
              <div className="action-icon">❄️</div>
              <h3>Browse ACs</h3>
              <p>View our products</p>
            </button>
          */}
            <button
              onClick={() => setScreen('services')}
              className="action-card services"
            >
              <div className="action-icon">🔧</div>
              <h3>Services</h3>
              <p>Installation & repair</p>
            </button>
          </div>
          {/*
          <section className="featured">
            <h3>Featured Products</h3>
            <div className="products-grid">
              {products.slice(0, 3).map(product => (
                <div key={product.id} className="product-card">
                  <div className="product-image">{product.image || '❄️'}</div>
                  <h4>{product.name}</h4>
                  <p className="capacity">{product.capacity}</p>
                  <p className="price">₱{product.price.toLocaleString()}</p>
                  <button
                    onClick={() => { addToCart(product); setScreen('cart') }}
                    className="btn-add"
                  >
                    Add to Cart
                  </button>
                </div>
              ))}
            </div>
          </section>
         */}
        </main>
      )}
      
      {/* Products Screen */}
      {/*
      {screen === 'products' && (
        <main className="user-main">
          <div className="screen-header">
            <h2>Air Conditioning Units</h2>
            <p>Select the perfect AC for your space</p>
          </div>

          <div className="products-grid full">
            {products.map(product => (
              <div key={product.id} className="product-card">
                <div className="product-image">{product.image || '❄️'}</div>
                <h4>{product.name}</h4>
                <p className="capacity">{product.capacity}</p>
                <p className="area">Coverage: {product.area}</p>
                <p className="price">₱{product.price.toLocaleString()}</p>
                <button
                  onClick={() => addToCart(product)}
                  className="btn-add-small"
                >
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
        </main>
      )}
      */}
      {/* Services Screen */}
      {screen === 'services' && (
        <main className="user-main">
          <div className="screen-header">
            <h2>Our Services</h2>
            <p>Professional installation and maintenance</p>
          </div>

          <div className="services-grid">
            {services.map(service => (
              <div key={service.id} className="service-card">
                <div className="service-icon-large">{service.icon || '🔧'}</div>
                <h4>{service.name}</h4>
                <p className="duration">⏱️ {service.duration}</p>
                <p className="service-price">₱{service.price.toLocaleString()}</p>
                <button
                  onClick={() => addToCart(service)}
                  className="btn-add-service-card"
                >
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
        </main>
      )}

      {/* Room Measurement Result */} 
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
        ✏️ Manual Input
      </button>

      <button
        className="measure-option ar"
        onClick={() => setShowCamera(true)}
      >
        📷 Use AR Camera
      </button>
    </div>

    <button onClick={() => setScreen('home')} className="btn-back">
      ← Back
    </button>
  </main>
)}
     
      {screen === 'measure' && (
        <main className="user-main">
          <div className="screen-header">
            <h2>📏 Room Analysis</h2>
          </div>

          {roomMeasurements && (
  <div className="measurement-results">
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
      <button onClick={() => setScreen('manual-measure')} className="btn-remeasure">
        📐 Measure Again
      </button>
      <button onClick={() => setScreen('home')} className="btn-back">
        ← Back to Home
      </button>
    </div>
  </div>
)}
        </main>
      )}
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

      <button onClick={() => setScreen('measure-choice')} className="btn-back">
        ← Back
      </button>
    </div>
  </main>
)}
      {/* Shopping Cart */}
      {screen === 'cart' && (
        <main className="user-main">
          <div className="screen-header">
            <h2>🛒 Shopping Cart</h2>
          </div>

          {cart.length === 0 ? (
            <div className="empty-cart">
              <div className="empty-icon">🛒</div>
              <p>Your cart is empty</p>
              <button onClick={() => setScreen('home')} className="btn-continue">
                Continue Shopping
              </button>
            </div>
          ) : (
            <>
              <div className="cart-items">
                {cart.map(item => (
                  <div key={item.cartId} className="cart-item">
                    <div className="item-icon">{item.image || item.icon || '📦'}</div>
                    <div className="item-details">
                      <h4>{item.name}</h4>
                      <p className="item-price">₱{item.price.toLocaleString()}</p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.cartId)}
                      className="btn-remove"
                      title="Remove from cart"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <div className="cart-summary">
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>₱{calculateTotal().toLocaleString()}</span>
                </div>
                <div className="summary-row">
                  <span>Delivery</span>
                  <span>₱500</span>
                </div>
                <div className="summary-row total">
                  <span>Total</span>
                  <span>₱{(calculateTotal() + 500).toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={() => setScreen('booking')}
                className="btn-checkout"
              >
                📅 Schedule Service
              </button>
            </>
          )}
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

      {/* Booking Screen */}
      {screen === 'booking' && (
        <main className="user-main">
          <div className="screen-header">
            <h2>📅 Schedule Service</h2>
            <p>Book your appointment</p>
          </div>

          <div className="booking-form">
            <div className="form-group">
              <label>Preferred Date</label>
              <input type="date" className="form-input" />
            </div>

            <div className="form-group">
              <label>Preferred Time</label>
              <select className="form-input">
                <option>9:00 AM</option>
                <option>10:00 AM</option>
                <option>11:00 AM</option>
                <option>1:00 PM</option>
                <option>2:00 PM</option>
                <option>3:00 PM</option>
                <option>4:00 PM</option>
                <option>5:00 PM</option>
              </select>
            </div>

            <div className="form-group">
              <label>Additional Notes</label>
              <textarea className="form-input" rows="4" placeholder="Any special requirements or notes..."></textarea>
            </div>

            <div className="booking-summary">
              <h3>Order Summary</h3>
              <div className="summary-items">
                {cart.map((item, idx) => (
                  <div key={idx} className="summary-item">
                    <span>{item.name}</span>
                    <span>₱{item.price.toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="summary-total">
                <span>Total:</span>
                <span>₱{(calculateTotal() + 500).toLocaleString()}</span>
              </div>
            </div>

            <div className="booking-actions">
              <button onClick={() => setScreen('cart')} className="btn-back-booking">← Back</button>
              <button onClick={() => { setCart([]); setScreen('home'); }} className="btn-confirm-booking">✓ Confirm Booking</button>
            </div>
          </div>
        </main>
      )}

      {/* Bottom Navigation */}
      {screen === 'home' && (
        <nav className="bottom-nav">
          <button className="nav-item active" onClick={() => setScreen('home')}>🏠 Home</button>
          {/*<button className="nav-item" onClick={() => setScreen('products')}>❄️ Products</button>*/}
          <button className="nav-item" onClick={() => setScreen('services')}>🔧 Services</button>
          <button className="nav-item" onClick={() => setScreen('cart')}>🛒 Cart ({cart.length})</button>
        </nav>
      )}
    </div>
  )
}{}