import React, { useState, useEffect } from 'react'
import Camera from '../shared/Camera'
import './UserApp.css'

const SAMPLE_PRODUCTS = [
  { id: 1, name: '1 Ton Window AC', price: 15000, capacity: '8000-10000 BTU', area: '120-150 sq ft', image: '❄️' },
  { id: 2, name: '1.5 Ton Split AC', price: 28000, capacity: '12000-15000 BTU', area: '150-200 sq ft', image: '❄️' },
  { id: 3, name: '2 Ton Split AC', price: 35000, capacity: '18000 BTU', area: '200-250 sq ft', image: '❄️' },
  { id: 4, name: '2.5 Ton Split AC', price: 42000, capacity: '24000 BTU', area: '250-300 sq ft', image: '❄️' },
  { id: 5, name: '3 Ton Split AC', price: 52000, capacity: '30000 BTU', area: '300-400 sq ft', image: '❄️' },
  { id: 6, name: '5 Ton Central AC', price: 95000, capacity: '50000 BTU', area: '500+ sq ft', image: '❄️' },
]

const SERVICES = [
  { id: 1, name: 'AC Installation', price: 5000, icon: '🔧', duration: '2-3 hours' },
  { id: 2, name: 'AC Maintenance', price: 2000, icon: '🧹', duration: '1 hour' },
  { id: 3, name: 'AC Repair', price: 3000, icon: '🔨', duration: 'Varies' },
  { id: 4, name: 'Annual Service', price: 4500, icon: '📋', duration: '1.5 hours' },
  { id: 5, name: 'Refrigerant Refill', price: 1500, icon: '💨', duration: '30 mins' },
  { id: 6, name: 'Ductwork Cleaning', price: 2500, icon: '🌪️', duration: '1-2 hours' },
]

export default function UserApp({ user, onLogout }) {
  const [screen, setScreen] = useState('home') // home, products, services, measure, booking, cart, profile
  const [cart, setCart] = useState([])
  const [showCamera, setShowCamera] = useState(false)
  const [roomMeasurements, setRoomMeasurements] = useState(null)
  const [recommendedProduct, setRecommendedProduct] = useState(null)
  const [selectedItems, setSelectedItems] = useState({})
  const [showProfile, setShowProfile] = useState(false)

  function addToCart(item) {
    setCart([...cart, { ...item, cartId: Date.now() }])
  }

  function removeFromCart(cartId) {
    setCart(cart.filter(item => item.cartId !== cartId))
  }

  function getRecommendation(area) {
    const areaNum = parseFloat(area)
    if (areaNum <= 150) return SAMPLE_PRODUCTS[0]
    if (areaNum <= 200) return SAMPLE_PRODUCTS[1]
    if (areaNum <= 250) return SAMPLE_PRODUCTS[2]
    if (areaNum <= 300) return SAMPLE_PRODUCTS[3]
    if (areaNum <= 400) return SAMPLE_PRODUCTS[4]
    return SAMPLE_PRODUCTS[5]
  }

  function handleCameraCapture(data) {
    setRoomMeasurements(data)
    const recommendation = getRecommendation(data.measurements.area)
    setRecommendedProduct(recommendation)
    setShowCamera(false)
    setScreen('measure')
  }

  function calculateTotal() {
    return cart.reduce((sum, item) => sum + (item.price || 0), 0)
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
              onClick={() => setShowCamera(true)}
              className="action-card measure"
            >
              <div className="action-icon">📐</div>
              <h3>Measure Room</h3>
              <p>Get AC recommendation</p>
            </button>

            <button 
              onClick={() => setScreen('products')}
              className="action-card products"
            >
              <div className="action-icon">❄️</div>
              <h3>Browse ACs</h3>
              <p>View our products</p>
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

          <section className="featured">
            <h3>Featured Products</h3>
            <div className="products-grid">
              {SAMPLE_PRODUCTS.slice(0, 3).map(product => (
                <div key={product.id} className="product-card">
                  <div className="product-image">{product.image}</div>
                  <h4>{product.name}</h4>
                  <p className="capacity">{product.capacity}</p>
                  <p className="price">₱{product.price.toLocaleString()}</p>
                  <button onClick={() => { addToCart(product); setScreen('cart') }} className="btn-add">
                    Add to Cart
                  </button>
                </div>
              ))}
            </div>
          </section>
        </main>
      )}

      {/* Products Screen */}
      {screen === 'products' && (
        <main className="user-main">
          <div className="screen-header">
            <h2>Air Conditioning Units</h2>
            <p>Select the perfect AC for your space</p>
          </div>

          <div className="products-grid full">
            {SAMPLE_PRODUCTS.map(product => (
              <div key={product.id} className="product-card">
                <div className="product-image">{product.image}</div>
                <h4>{product.name}</h4>
                <p className="capacity">{product.capacity}</p>
                <p className="area">Coverage: {product.area}</p>
                <p className="price">₱{product.price.toLocaleString()}</p>
                <button onClick={() => addToCart(product)} className="btn-add-small">
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
        </main>
      )}

      {/* Services Screen */}
      {screen === 'services' && (
        <main className="user-main">
          <div className="screen-header">
            <h2>Our Services</h2>
            <p>Professional installation and maintenance</p>
          </div>

          <div className="services-grid">
            {SERVICES.map(service => (
              <div key={service.id} className="service-card">
                <div className="service-icon-large">{service.icon}</div>
                <h4>{service.name}</h4>
                <p className="duration">⏱️ {service.duration}</p>
                <p className="service-price">₱{service.price.toLocaleString()}</p>
                <button onClick={() => addToCart(service)} className="btn-add-service-card">
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
        </main>
      )}

      {/* Room Measurement Result */}
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
                  <p>Width: <strong>{roomMeasurements.measurements.width} ft</strong></p>
                  <p>Length: <strong>{roomMeasurements.measurements.height} ft</strong></p>
                  <p>Area: <strong>{roomMeasurements.measurements.area} m²</strong></p>
                </div>
              </div>

              {recommendedProduct && (
                <div className="recommendation">
                  <h3>🎯 Recommended for You</h3>
                  <div className="recommended-card">
                    <div className="rec-image">{recommendedProduct.image}</div>
                    <h4>{recommendedProduct.name}</h4>
                    <p className="capacity">{recommendedProduct.capacity}</p>
                    <p className="coverage">Coverage: {recommendedProduct.area}</p>
                    <p className="rec-price">₱{recommendedProduct.price.toLocaleString()}</p>
                    <button 
                      onClick={() => {
                        addToCart(recommendedProduct)
                        setScreen('cart')
                      }}
                      className="btn-add-recommended"
                    >
                      ✓ Add to Cart
                    </button>
                  </div>
                </div>
              )}

              <div className="actions">
                <button onClick={() => { setShowCamera(true); setScreen('home') }} className="btn-remeasure">
                  📐 Measure Again
                </button>
              </div>
            </div>
          )}
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

              <button onClick={() => setScreen('booking')} className="btn-checkout">
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
              <button className="btn-confirm-booking">✓ Confirm Booking</button>
            </div>
          </div>
        </main>
      )}

      {/* Bottom Navigation */}
      {screen === 'home' && (
        <nav className="bottom-nav">
          <button className="nav-item active" onClick={() => setScreen('home')}>🏠 Home</button>
          <button className="nav-item" onClick={() => setScreen('products')}>❄️ Products</button>
          <button className="nav-item" onClick={() => setScreen('services')}>🔧 Services</button>
          <button className="nav-item" onClick={() => setScreen('cart')}>🛒 Cart ({cart.length})</button>
        </nav>
      )}
    </div>
  )
}
