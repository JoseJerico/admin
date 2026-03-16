import React, { useState, useEffect } from 'react'
import './UserApp.css'
import { supabase } from '../supabase'

export default function UserApp({ user, onLogout }) {
  const [screen, setScreen] = useState('home')
  const [cart, setCart] = useState([])
  const [roomMeasurements, setRoomMeasurements] = useState(null)
  const [recommendedProduct, setRecommendedProduct] = useState(null)
  const [showProfile, setShowProfile] = useState(false)
  const [services, setServices] = useState([])

  // Manual measurement states
  const [manualLength, setManualLength] = useState('')
  const [manualWidth, setManualWidth] = useState('')
  const [manualUnit, setManualUnit] = useState('meters')

  // Booking form states
  const [bookingService, setBookingService] = useState(null)
  const [bookingName, setBookingName] = useState(user?.name || '')
  const [bookingContact, setBookingContact] = useState('')
  const [bookingEmail, setBookingEmail] = useState(user?.email || '')
  const [bookingDate, setBookingDate] = useState('')
  const [bookingTime, setBookingTime] = useState('')
  const [bookingNotes, setBookingNotes] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    fetchServices()
  }, [])

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

  function openBookingForm(service) {
    setBookingService(service)
    setBookingNotes('')
    setBookingDate('')
    setBookingTime('')
    setScreen('booking-form')
  }

  function handleConfirmBooking() {
    if (!bookingName || !bookingContact || !bookingDate || !bookingTime) {
      alert("Please complete all required fields")
      return
    }
    setShowConfirm(true)
  }

  function addToCart() {
    const newItem = {
      cartId: Date.now(),
      serviceId: bookingService.id,
      serviceName: bookingService.name,
      price: bookingService.price,
      roomMeasurements: roomMeasurements?.measurements,
      recommendedProduct: recommendedProduct?.capacity,
      bookingDetails: {
        name: bookingName,
        contact: bookingContact,
        email: bookingEmail,
        date: bookingDate,
        time: bookingTime,
        notes: bookingNotes
      }
    }
    setCart([...cart, newItem])
    alert(`Booking for ${bookingService.name} added to cart`)
    setBookingService(null)
    setShowConfirm(false)
    setScreen('services')
  }

  function removeFromCart(cartId) {
    setCart(cart.filter(item => item.cartId !== cartId))
  }

  function calculateTotal() {
    return cart.reduce((acc, item) => acc + (item.price || 0), 0)
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
              onClick={() => setScreen('manual-measure')}
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
              <div className="recommendation" style={{ backgroundColor: '#000', color: '#fff' }}>
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
              {recommendedProduct && (
                <button
                  className="btn-book-service"
                  onClick={() => openBookingForm({ id: 1, name: 'AC Installation', price: 1500 })}
                >
                  📌 Book this Service
                </button>
              )}
            </div>
          </div>
        </main>
      )}

      {/* Booking Form Screen */}
      {screen === 'booking-form' && bookingService && (
        <main className="user-main">
          <div className="screen-header">
            <h2>📌 Booking: {bookingService.name}</h2>
            {roomMeasurements && recommendedProduct && (
              <p>Room Area: {roomMeasurements.measurements.area} m² | Recommended AC: {recommendedProduct.capacity}</p>
            )}
          </div>

          <div className="booking-form">
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" value={bookingName} onChange={(e) => setBookingName(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Contact Number</label>
              <input type="text" value={bookingContact} onChange={(e) => setBookingContact(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={bookingEmail} onChange={(e) => setBookingEmail(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Preferred Date</label>
              <input type="date" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Preferred Time</label>
              <input type="time" value={bookingTime} onChange={(e) => setBookingTime(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Additional Notes</label>
              <textarea value={bookingNotes} onChange={(e) => setBookingNotes(e.target.value)} placeholder="Optional notes for technician" />
            </div>

            <button className="btn-confirm-booking" onClick={handleConfirmBooking}>
              Confirm Booking
            </button>
            <button className="btn-back" onClick={() => setScreen('services')}>← Back to Services</button>
          </div>
        </main>
      )}

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="confirmation-modal-overlay" onClick={() => setShowConfirm(false)}>
          <div className="confirmation-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Confirm Booking</h3>
            <p>Are you sure you want to add this booking to your cart?</p>
            <button onClick={addToCart}>✅ Yes, Add to Cart</button>
            <button onClick={() => setShowConfirm(false)}>❌ Cancel</button>
          </div>
        </div>
      )}

      {/* Services Screen */}
      {screen === 'services' && (
        <main className="user-main">
          <div className="screen-header">
            <h2>🔧 Services</h2>
            <p>Select a service to book</p>
          </div>

          <div className="services-list">
            {services.map(service => (
              <div key={service.id} className="service-card">
                <h3>{service.name}</h3>
                <p>Price: ₱{service.price}</p>
                {roomMeasurements && recommendedProduct && (
                  <p>Recommended AC: {recommendedProduct.capacity}</p>
                )}
                <button onClick={() => openBookingForm(service)}>Book this Service</button>
              </div>
            ))}
          </div>
        </main>
      )}

      {/* Cart Screen */}
      {screen === 'cart' && (
        <main className="user-main">
          <div className="screen-header">
            <h2>🛒 My Booking</h2>
          </div>

          {cart.length === 0 ? (
            <p>No services added yet.</p>
          ) : (
            <div className="cart-list">
              {cart.map(item => (
                <div key={item.cartId} className="cart-item">
                  <h3>{item.serviceName}</h3>
                  <p>Price: ₱{item.price}</p>
                  {item.roomMeasurements && (
                    <p>Room Area: {item.roomMeasurements.area} m²</p>
                  )}
                  {item.recommendedProduct && (
                    <p>Recommended AC: {item.recommendedProduct}</p>
                  )}
                  {item.bookingDetails && (
                    <>
                      <p>Name: {item.bookingDetails.name}</p>
                      <p>Contact: {item.bookingDetails.contact}</p>
                      <p>Email: {item.bookingDetails.email}</p>
                      <p>Date: {item.bookingDetails.date}</p>
                      <p>Time: {item.bookingDetails.time}</p>
                      {item.bookingDetails.notes && <p>Notes: {item.bookingDetails.notes}</p>}
                    </>
                  )}
                  <button className="btn-delete" onClick={() => removeFromCart(item.cartId)}>Delete</button>
                </div>
              ))}
              <h3>Total: ₱{calculateTotal()}</h3>
            </div>
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