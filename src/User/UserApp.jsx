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
  const [bookingAddress, setBookingAddress] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [bookingHistory, setBookingHistory] = useState([])
  const [bookings, setBookings] = useState([]);
  const [formData, setFormData] = useState({});
  const [editingId, setEditingId] = useState(null);

  const fetchBookings = async () => {
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: false });

  if (!error) setBookings(data);
};

useEffect(() => {
  fetchBookings();
}, []);

const handleCancel = async (id) => {
  const confirmCancel = window.confirm("Cancel this booking?");
  if (!confirmCancel) return;

  const { data, error } = await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", id);

  if (error) {
    console.error("Error cancelling booking:", error);
    alert("❌ Failed to cancel booking.");
    return;
  }

  alert("Booking cancelled!");
  fetchBookingHistory(); // 🔹 refresh history para makita agad ang cancelled status
};

const handleEdit = (booking) => {
  setFormData(booking);
  setEditingId(booking.id);
};

const handleUpdate = async (e) => {
  e.preventDefault();

  await supabase
    .from("bookings")
    .update(formData)
    .eq("id", editingId);

  alert("Booking updated!");
  setEditingId(null);
  setFormData({});
  fetchBookings();
};

 useEffect(() => {
  console.log("User prop changed:", user);
  console.log("User ID type:", typeof user.id, "value:", user.id);
  if (user?.id) {
    console.log("Fetching booking history for user ID:", user.id);
    fetchBookingHistory();
  }
}, [user]);

  async function fetchBookingHistory() {
  if (!user?.id) return;

  console.log("Attempting to fetch booking history for user ID:", user.id, "Type:", typeof user.id);

  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', user.id.trim()) // ensure walang whitespace
      .order('created_at', { ascending: false });

    if (error) console.error("Error fetching booking history:", error);

    console.log(`Fetched booking history for user ${user.id}:`, data);
    console.log("Number of bookings fetched:", data?.length);

    setBookingHistory(data || []);
  } catch (err) {
    console.error("Unexpected error fetching booking history:", err);
  }
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

  function handleManualCalculate() {
    if (!manualLength || !manualWidth) {
      alert('Please enter both length and width')
      return
    }

    let length = parseFloat(manualLength)
    let width = parseFloat(manualWidth)

    if (manualUnit === 'feet') {
      length = length * 0.3048
      width = width * 0.3048
    }

    const area = length * width

    setRoomMeasurements({
      measurements: {
        length: length.toFixed(2),
        width: width.toFixed(2),
        area: area.toFixed(2),
      },
    })

    const recommendedHP = getAirconHP(area)
    setRecommendedProduct({ capacity: recommendedHP })

    setScreen('measure')
  }

  function getAirconHP(area) {
    const areaNum = parseFloat(area)
    if (areaNum <= 9) return '0.5 HP'
    if (areaNum <= 18) return '1.0 HP'
    if (areaNum <= 25) return '1.5 HP'
    if (areaNum <= 35) return '2.0 HP'
    if (areaNum <= 45) return '2.5 HP'
    if (areaNum <= 60) return '3.0 HP'
    if (areaNum <= 80) return '4.0 HP'
    return '5.0 HP or higher'
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
      alert('Please complete all required fields')
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
        fullName: bookingName,
        mobileNumber: bookingContact,
        email: bookingEmail,
        address: bookingAddress,
        date: bookingDate,
        time: bookingTime,
        notes: bookingNotes,
      },
    }
    setCart([...cart, newItem])
    alert(`Booking for ${bookingService.name} added to cart`)
    setBookingService(null)
    setShowConfirm(false)
    setScreen('services')
  }

  function removeFromCart(cartId) {
    setCart(cart.filter((item) => item.cartId !== cartId))
  }

  function calculateTotal() {
    return cart.reduce((acc, item) => acc + (item.price || 0), 0)
  }

  async function submitAllBookings() {
  if (cart.length === 0) {
    alert("Cart is empty");
    return;
  }

  if (!user?.id) {
    alert("User not logged in properly");
    return;
  }

  try {
    const bookingsToInsert = cart.map(item => ({
      user_id: user.id,
      full_name: item.bookingDetails.fullName,
      email: item.bookingDetails.email,
      mobile_number: item.bookingDetails.mobileNumber,
      address: item.bookingDetails.address,
      service: item.serviceName,
      room_area: parseFloat(item.roomMeasurements?.area) || null,
      recommended_hp: item.recommendedProduct,
      date: item.bookingDetails.date,
      time: item.bookingDetails.time,
      notes: item.bookingDetails.notes,
      status: "pending",
      created_at: new Date() // siguraduhin may timestamp para sa order
    }));

    const { data, error } = await supabase
      .from("bookings")
      .insert(bookingsToInsert);

    if (error) {
      console.error("Supabase insert error:", error);
      alert("❌ Failed to submit bookings: " + error.message);
      return;
    }

    console.log("Inserted bookings:", data);
    alert("✅ Bookings submitted to admin!");

    setCart([]);
    await fetchBookingHistory(); // refresh history para lumabas agad
    setScreen('history');        // switch screen to show history

  } catch (err) {
    console.error("Unexpected error submitting bookings:", err);
    alert("❌ Unexpected error occurred");
  }
}

  return (
    <div className="user-app">
      <header className="user-header">
        <div className="header-top">
          <h1>❄️ AirCon Hub</h1>
          <div className="header-actions">
            <button
              onClick={() => setShowProfile(true)}
              className="user-info"
              title="View profile"
            >
              👤 {user?.name || 'Guest'}
            </button>
            <button
              onClick={() => setScreen('cart')}
              className="btn-cart"
              title="View cart"
            >
              🛒 {cart.length > 0 && <span className="cart-badge">{cart.length}</span>}
            </button>
            <button
              onClick={async () => {
                if (user?.id) await fetchBookingHistory()
                setScreen('history')
              }}
              className="btn-history"
              title="View past bookings"
            >
              📖 My Booking History
            </button>
            <button onClick={onLogout} className="btn-logout-user">
              🚪 Logout
            </button>
          </div>
        </div>
        {screen !== 'home' && (
          <button onClick={() => setScreen('home')} className="btn-back">
            ← Back
          </button>
        )}
      </header>

      {/* --- Home Screen --- */}
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

      {/* --- Manual Measurement --- */}
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

      {/* --- Room Analysis --- */}
      {screen === 'measure' && roomMeasurements && (
        <main className="user-main">
          <div className="screen-header">
            <h2>📏 Room Analysis</h2>
          </div>

          <div className="room-analysis-container">
            <div className="result-card">
              <h3>Room Dimensions</h3>
              <div className="measurements">
                <p>
                  Length: <strong>{roomMeasurements.measurements.length} m</strong>
                </p>
                <p>
                  Width: <strong>{roomMeasurements.measurements.width} m</strong>
                </p>
                <p>
                  Area: <strong>{roomMeasurements.measurements.area} m²</strong>
                </p>
              </div>
            </div>

            {recommendedProduct && (
              <div
                className="recommendation"
                style={{ backgroundColor: '#000', color: '#fff' }}
              >
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
                  onClick={() =>
                    openBookingForm({ id: 1, name: 'AC Installation', price: 1500 })
                  }
                >
                  📌 Book this Service
                </button>
              )}
            </div>
          </div>
        </main>
      )}

      {/* --- Booking Form --- */}
      {screen === 'booking-form' && bookingService && (
        <main className="user-main">
          <div className="screen-header">
            <h2>📌 Booking: {bookingService.name}</h2>
            {roomMeasurements && recommendedProduct && (
              <p>
                Room Area: {roomMeasurements.measurements.area} m² | Recommended AC:{' '}
                {recommendedProduct.capacity}
              </p>
            )}
          </div>

          <div className="booking-form">
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                value={bookingName}
                onChange={(e) => setBookingName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Contact Number</label>
              <input
                type="text"
                value={bookingContact}
                onChange={(e) => setBookingContact(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={bookingEmail}
                onChange={(e) => setBookingEmail(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Address</label>
              <input
                type="text"
                value={bookingAddress}
                onChange={(e) => setBookingAddress(e.target.value)}
                placeholder="Enter full address"
              />
            </div>
            <div className="form-group">
              <label>Preferred Date</label>
              <input
                type="date"
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Preferred Time</label>
              <input
                type="time"
                value={bookingTime}
                onChange={(e) => setBookingTime(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Additional Notes</label>
              <textarea
                value={bookingNotes}
                onChange={(e) => setBookingNotes(e.target.value)}
                placeholder="Optional notes for technician"
              />
            </div>

            <button className="btn-confirm-booking" onClick={handleConfirmBooking}>
              Confirm Booking
            </button>
            <button className="btn-back" onClick={() => setScreen('services')}>
              ← Back to Services
            </button>
          </div>
        </main>
      )}

      {/* --- Confirmation Modal --- */}
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

{/* --- Booking History --- */}
{screen === 'history' && (
  <main className="user-main">
    <div className="screen-header">
      <h2>📖 My Booking History</h2>
    </div>

    {bookingHistory.length === 0 ? (
      <p>No past bookings yet.</p>
    ) : (
      <div className="history-list">
        {bookingHistory.map((item) => {
          // Mag-set ng class base sa status para sa kulay ng box
          let statusClass = '';
          if (item.status === 'pending') statusClass = 'history-pending';
          if (item.status === 'approved') statusClass = 'history-approved';
          if (item.status === 'cancelled') statusClass = 'history-cancelled';
          if (item.status === 'rejected') statusClass = 'history-rejected';

          return (
            <div key={item.id} className={`history-item ${statusClass}`}>
              <h3>{item.service}</h3>
              <p>Date: {item.date} | Time: {item.time}</p>
              <p>Room Area: {item.room_area || 'N/A'} m²</p>
              <p>Recommended AC: {item.recommended_hp || 'N/A'}</p>
              <p>Status: {item.status}</p>
              <p>Name: {item.full_name}</p>
              <p>Contact: {item.mobile_number}</p>
              <p>Email: {item.email}</p>
              <p>Address: {item.address}</p>
              {item.notes && <p>Notes: {item.notes}</p>}

              {/* 🔹 Actions depende sa status */}
                  {item.status === "pending" ? (
                <div className="history-actions">
                <button className="btn-edit" onClick={() => handleEdit(item)}>
                   ✏ Edit
                </button>
                <button className="btn-cancel" onClick={() => handleCancel(item.id)}>
                   🗑 Cancel
               </button>
             </div>
          ) : (
                <div className="history-actions-locked">
                  {item.status === 'approved' && (
                    <span className="status-badge approved" title="Booking approved by admin, cannot edit or cancel">
                      ✔ Approved
                    </span>
                  )}
                  {item.status === 'cancelled' && (
                    <span className="status-badge cancelled" title="You cancelled this booking">
                      ❌ Cancelled
                    </span>
                  )}
                  {item.status === 'rejected' && (
                    <span className="status-badge rejected" title="Booking rejected by admin">
                      ⚠ Rejected
                    </span>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )}
    <button onClick={() => setScreen('home')} className="btn-back">
      ← Back
    </button>
  </main>
)}
    
      {/* --- Services --- */}
      {screen === 'services' && (
        <main className="user-main">
          <div className="screen-header">
            <h2>🔧 Services</h2>
            <p>Select a service to book</p>
          </div>

          <div className="services-list">
            {services.map((service) => (
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

      {/* --- Cart --- */}
      {screen === 'cart' && (
        <main className="user-main">
          <div className="screen-header">
            <h2>🛒 My Booking</h2>
          </div>

          {cart.length === 0 ? (
            <p>No services added yet.</p>
          ) : (
            <div className="cart-list">
              {cart.map((item) => (
                <div key={item.cartId} className="cart-item">
                  <h3>{item.serviceName}</h3>
                  <p>Price: ₱{item.price}</p>
                  {item.roomMeasurements && (
                    <p>Room Area: {item.roomMeasurements.area} m²</p>
                  )}
                  {item.recommendedProduct && <p>Recommended AC: {item.recommendedProduct}</p>}
                  {item.bookingDetails && (
                    <>
                      <p>👤 {item.bookingDetails.fullName}</p>
                      <p>📞 {item.bookingDetails.mobileNumber}</p>
                      <p>📍 {item.bookingDetails.address}</p>
                      <p>📧 {item.bookingDetails.email}</p>
                      <p>📅 {item.bookingDetails.date}</p>
                      <p>⏰ {item.bookingDetails.time}</p>
                      {item.bookingDetails.notes && <p>📝 {item.bookingDetails.notes}</p>}
                    </>
                  )}
                  <button className="btn-delete" onClick={() => removeFromCart(item.cartId)}>
                    Delete
                  </button>
                </div>
              ))}
              <h3>Total: ₱{calculateTotal()}</h3>
              <button onClick={submitAllBookings} className="btn-submit">
                Submit All Bookings
              </button>
            </div>
          )}
        </main>
      )}

    {/* --- Edit Modal --- */}
{editingId && (
  <div className="edit-modal-overlay" onClick={() => setEditingId(null)}>
    <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
      <h3>Edit Booking</h3>
      <form onSubmit={handleUpdate} className="edit-form">
        <label>
          Full Name:
          <input
            type="text"
            value={formData.full_name || ''}
            onChange={(e) => setFormData({...formData, full_name: e.target.value})}
          />
        </label>
        <label>
          Contact:
          <input
            type="text"
            value={formData.mobile_number || ''}
            onChange={(e) => setFormData({...formData, mobile_number: e.target.value})}
          />
        </label>
        <label>
          Email:
          <input
            type="email"
            value={formData.email || ''}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
          />
        </label>
        <label>
          Address:
          <input
            type="text"
            value={formData.address || ''}
            onChange={(e) => setFormData({...formData, address: e.target.value})}
          />
        </label>
        <label>
          Date:
          <input
            type="date"
            value={formData.date || ''}
            onChange={(e) => setFormData({...formData, date: e.target.value})}
          />
        </label>
        <label>
          Time:
          <input
            type="time"
            value={formData.time || ''}
            onChange={(e) => setFormData({...formData, time: e.target.value})}
          />
        </label>
        <label>
          Notes:
          <textarea
            value={formData.notes || ''}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
          />
        </label>
        <div className="modal-buttons">
          <button type="submit" className="btn-update">Update Booking</button>
          <button type="button" onClick={() => setEditingId(null)} className="btn-cancel">Cancel</button>
        </div>
      </form>
    </div>
  </div>
)}

      {/* --- Profile Modal --- */}
      {showProfile && (
        <div className="profile-modal-overlay" onClick={() => setShowProfile(false)}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>👤 My Profile</h2>
              <button onClick={() => setShowProfile(false)} className="btn-close-modal">
                ✕
              </button>
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
              <button onClick={() => setShowProfile(false)} className="btn-close">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
