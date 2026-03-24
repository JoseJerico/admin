import React, { useState, useEffect } from 'react'
import './UserApp.css'
import { supabase } from '../supabase'
import RoomMeasurementAR from './RoomMeasurementAR';


export default function UserApp({ user, onLogout }) {
  const [screen, setScreen] = useState('home')
  const [cart, setCart] = useState([])
  const [roomMeasurements, setRoomMeasurements] = useState(null)
  const [recommendedProduct, setRecommendedProduct] = useState(null)
  const [showProfile, setShowProfile] = useState(false)
  const [services, setServices] = useState([])
  const [showAR, setShowAR] = useState(false);
  const [markers, setMarkers] = useState([]);  // tap points
  const [roomData, setRoomData] = useState(null);
  const [resetCounter, setResetCounter] = useState(0);

  // Manual measurement states
  const [manualLength, setManualLength] = useState('')
  const [manualWidth, setManualWidth] = useState('')
  const [manualUnit, setManualUnit] = useState('meters')
  // Sa taas ng UserApp function/component

 

  // Booking form states
  const [bookingService, setBookingService] = useState(null)
  const [bookingName, setBookingName] = useState(user?.name || '')
  const [bookingContact, setBookingContact] = useState('')
  const [bookingEmail, setBookingEmail] = useState(user?.email || '')
  const [bookingDate, setBookingDate] = useState('')
  const [bookingTime, setBookingTime] = useState('')
  const [bookingNotes, setBookingNotes] = useState('')
  const [bookingAddress, setBookingAddress] = useState('')
  const [showConfirm, setShowConfirm] = React.useState(false)
  const [bookingHistory, setBookingHistory] = useState([])
  const [bookings, setBookings] = useState([]);
  const [formData, setFormData] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)
  const [statusFilter, setStatusFilter] = useState('All')
  const [search, setSearch] = useState('')

  const handleMeasureComplete = (result) => {
    setRoomMeasurements(result.measurements);
    setRecommendedProduct({ capacity: result.recommended });
    setShowAR(false);
    setScreen("room-analysis");
  };

  const handleARTap = (position) => {
  setMarkers((prev) => [...prev, position]);
};
const calculateRoomMeasurements = (points) => {
  if (!points || points.length < 2) return { length: 0, width: 0, area: 0 };

  const xs = points.map(p => p.x);
  const zs = points.map(p => p.z);

  const length = Math.max(...xs) - Math.min(...xs);
  const width  = Math.max(...zs) - Math.min(...zs);
  const area   = length * width;

  return {
    length: length.toFixed(2),
    width: width.toFixed(2),
    area: area.toFixed(2)
  };
};
  // --- DASHBOARD SUMMARY LOGIC ---
  const countStatus = (status) => {
  return bookingHistory.filter(
    b => b.status?.toLowerCase() === status
  ).length;
};

  const total = bookingHistory.length;
  const pending = countStatus('pending');
  const confirmed = countStatus('approved');
  const assigned = countStatus('assigned');
  const cancelled = countStatus('cancelled');
  const rejected = countStatus('rejected');
  const [filter, setFilter] = useState('All'); // para sa category highlight
  const [maintenance, setMaintenance] = useState([]);
  const [notification, setNotification] = useState(null);
  const fetchBookings = async () => {
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: false });

  if (!error) setBookings(data);
};

const fetchMaintenance = async () => {
  if (!user?.id) return;

  try {
    const { data, error } = await supabase
      .from('maintenance')
      .select('*')
      .eq('user_id', user.id)          // filter by current user
      .order('date', { ascending: true });

    if (error) throw error;

    setMaintenance(data || []);
  } catch (error) {
    console.error("Error fetching maintenance:", error);
    setMaintenance([]);
  }
};
// Para ma-color code base sa status (pending, done, cancelled)
const getMaintenanceColorByStatus = (status) => {
  switch(status) {
    case 'pending':
      return '#fbbf24'; // yellow
    case 'done':
      return '#34d399'; // green
    case 'cancelled':
      return '#f87171'; // red
    default:
      return '#60a5fa'; // blue default
  }
};

/// Para ma-color code base sa scheduled date
const getMaintenanceColorByDate = (date) => {  // parameter renamed
  const today = new Date();
  const targetDate = new Date(date);           // local variable na ibang pangalan
  const diffDays = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return '#f87171'; // Red = Overdue
  if (diffDays <= 7) return '#fbbf24'; // Yellow = Soon
  return '#34d399'; // Green = Okay
};

// Para ipakita kung ilang araw na lang hanggang maintenance
const calculateDaysRemaining = (date) => {   // parameter renamed
  const today = new Date();
  const targetDate = new Date(date);          // local variable na ibang pangalan
  const diffDays = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "Overdue";
  if (diffDays === 0) return "Today";
  return `${diffDays} days left`;
};


{/*const [maintenance, setMaintenance] = useState([
  { id: 1, service: 'AC Filter Cleaning', date: '2026-03-25', status: 'okay' },
  { id: 2, service: 'Cooling Coil Check', date: '2026-03-28', status: 'soon' },
  { id: 3, service: 'Compressor Inspection', date: '2026-03-30', status: 'overdue' },
]);
*/}
  const getMaintenanceColor = (status) => {
  switch(status) {
    case 'pending':
      return '#fbbf24'; // yellow
    case 'done':
      return '#34d399'; // green
    case 'cancelled':
      return '#f87171'; // red
    default:
      return '#60a5fa'; // blue default
  }
};
const getDaysRemaining = (date) => {
  const today = new Date();
  const target = new Date(date);

  const diffTime = target - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "Overdue";
  if (diffDays === 0) return "Today";
  return `${diffDays} days left`;
};

useEffect(() => {
  if (!user?.id) return;

  async function fetchMaintenance() {
    const { data, error } = await supabase
      .from("maintenance")          // table name mo sa Supabase
      .select("*")
      .eq("user_id", user.id)       // filtered sa current user
      .order("date", { ascending: true });

    if (error) {
      console.error("Error fetching maintenance:", error);
      setMaintenance([]);
      return;
    }

    setMaintenance(data || []);
  }

  async function createMaintenance(booking) {
  try {
    // 👉 add 30 days
    const nextDate = new Date(booking.date);
    nextDate.setDate(nextDate.getDate() + 30);

    // 🔍 check muna kung may existing na (para di duplicate)
    const { data: existing } = await supabase
      .from("maintenance")
      .select("*")
      .eq("user_id", booking.user_id)
      .eq("notes", `Auto maintenance for ${booking.service}`);

    if (existing && existing.length > 0) return;

    const { error } = await supabase
      .from("maintenance")
      .insert([
        {
          user_id: booking.user_id,
          service_id: booking.service_id || null,
          scheduled_date: nextDate.toISOString(),
          status: "pending",
          notes: `Auto maintenance for ${booking.service}`,
        },
      ]);

    if (error) {
      console.error("❌ Maintenance insert error:", error);
    } else {
      console.log("✅ Maintenance auto-created!");
    }
  } catch (err) {
    console.error("❌ Unexpected error:", err);
  }
}

async function handleConfirmBooking() {
  if (!bookingName || !bookingContact || !bookingDate || !bookingTime) {
    alert('Please complete all required fields');
    return;
  }

  try {
    // ✅ Check if any booking exists at the same date & time (same user or others)
    const { data: existing, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('date', bookingDate)
      .eq('time', bookingTime)
      .eq('status', 'pending');

    if (error) {
      console.error(error);
      alert("❌ Could not verify slot availability");
      return;
    }

    if (existing && existing.length > 0) {
      // Check if it's the same user or different user
      const conflictWithUser = existing.some(b => b.user_id === user.id);
      if (conflictWithUser) {
        alert("⚠️ You already have a booking at this date and time!");
        return;
      } else {
        alert("⚠️ Slot already booked by another customer!");
        return;
      }
    }

    // ✅ No conflict, puwede nang mag-proceed
    setShowConfirm(true);

  } catch (err) {
    console.error(err);
    alert("❌ Unexpected error occurred");
  }
}

  fetchMaintenance();
}, [user]);

useEffect(() => {
  if (user?.id) {
    fetchMaintenance();
  }
}, [user]);

useEffect(() => {
  const getSession = async () => {
    const { data, error } = await supabase.auth.getSession();

    if (error || !data.session) {
      console.log("No valid session, logout user");
      onLogout(); // 🔥 force logout
    }
  };

  getSession();
}, []);

useEffect(() => {
  if (notification) {
    const timer = setTimeout(() => {
      setNotification(null); // automatic na tatanggalin after 5 sec
    }, 5000); // 5000ms = 5 seconds

    return () => clearTimeout(timer); // cleanup in case may bago agad na notification
  }
}, [notification]);

useEffect(() => {
  if (!user?.id) return;

  const channel = supabase
    .channel('booking-status')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'bookings',
        filter: `user_id=eq.${user.id}`
      },
      (payload) => {
        const updatedBooking = payload.new;

        // 🔔 Notification
        if (updatedBooking.status !== 'pending') {
          setNotification(
            `📢 Your booking "${updatedBooking.service}" is now ${updatedBooking.status.toUpperCase()}`
          );
          fetchBookingHistory();
        }

        // 🔥 AUTO GENERATE MAINTENANCE
        if (updatedBooking.status === 'completed') {
          createMaintenance(updatedBooking);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [user]);

useEffect(() => {
  if (!user?.id || maintenance.length === 0) return;

  const now = new Date();

  maintenance.forEach((m) => {
    const schedDate = new Date(m.scheduled_date); // importante: scheduled_date

    const diffTime = schedDate - now;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    // 🔔 3 days before reminder
    if (diffDays <= 3 && diffDays > 0 && m.status === "pending") {
      setNotification(
        `🛠️ Reminder: Your maintenance "${m.notes}" is scheduled on ${schedDate.toLocaleDateString()}`
      );
    }

    // ❗ overdue
    if (diffDays < 0 && m.status === "pending") {
      setNotification(
        `⚠️ Maintenance overdue: "${m.notes}" scheduled last ${schedDate.toLocaleDateString()}`
      );
    }
  });

}, [maintenance, user]);

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
  fetchBookings();
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

  setLoading(true)
  setErrorMsg(null)

  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', user.id.trim())
      .order('created_at', { ascending: false })
      .range(0, 9); // 🔥 pagination (top 10 only)

    if (error) {
      console.error(error)
      setErrorMsg("❌ Failed to load booking history")
    }

    setBookingHistory(data || [])
  } catch (err) {
    console.error(err)
    setErrorMsg("❌ Unexpected error occurred")
  }

  setLoading(false)
}

  async function fetchServices() {
  setLoading(true)

  const { data, error } = await supabase
    .from('services')
    .select('*')
    .order('id')

  if (error) {
    setErrorMsg("Failed to load services")
  }

  setServices(data || [])
  setLoading(false)
}

useEffect(() => {
  fetchServices();
}, []);
 // --- BookingForm Component ---
function BookingForm({ service, roomMeasurements, recommendedProduct, onConfirm, onCancel, setScreen }) {
  const [name, setName] = React.useState('')
  const [contact, setContact] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [address, setAddress] = React.useState('')
  const [date, setDate] = React.useState('')
  const [time, setTime] = React.useState('')
  const [notes, setNotes] = React.useState('')

  return (
    <div className="booking-modal-overlay" onClick={onCancel}>
      <div className="booking-modal" onClick={(e) => e.stopPropagation()}>
        <h3>📌 Booking: {service.name}</h3>

        {roomMeasurements && recommendedProduct && (
          <p>
            Room Area: {roomMeasurements.measurements.area} m² | Recommended AC: {recommendedProduct?.capacity}
          </p>
        )}

        <div className="booking-form">
          <label>Full Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" />

          <label>Contact Number</label>
          <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Contact Number" />

          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />

          <label>Address</label>
          <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" />

          <label>Preferred Date</label>
          <input
            type="date"
             value={date}
             min={new Date().toISOString().split("T")[0]}
             onChange={(e) => setDate(e.target.value)}
          />

          <label>Preferred Time</label>
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />

          <label>Additional Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" />
        </div>

        {/* --- Footer na palaging nakikita sa ilalim --- */}
        <div className="booking-footer">
          <h3>Confirm Booking</h3>
          <p>Are you sure you want to add this booking to your cart?</p>

          <div className="footer-buttons">
            <button
              className="btn-confirm-modern"
              onClick={() =>
                onConfirm({
                  fullName: name,
                  mobileNumber: contact,
                  email,
                  address,
                  date,
                  time,
                  notes,
                })
              }
            >
              ✅ Yes, Add to Cart
            </button>

            <button className="btn-header-style" onClick={onCancel}>
              ❌ Cancel
            </button>

            <button className="btn-header-style" onClick={() => setScreen('services')}>
              ← Back to Services
            </button>
          </div>
        </div>
      </div>
    </div>
  )
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

  function parseARResult(result) {
  if (!result) return { length: 0, width: 0, area: 0 };

  // Subukan hanapin ang tamang property kahit iba-iba ang pangalan
  const length = result.length || result.lengthMeters || result.xDiff || 0;
  const width  = result.width  || result.widthMeters  || result.zDiff || 0;
  const area   = result.area   || length * width;

  return {
    length: length.toFixed(2),
    width: width.toFixed(2),
    area: area.toFixed(2)
  };
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

    const existing = bookings.find(
  (b) => b.date === bookingDate && b.time === bookingTime
)

if (existing) {
  alert("⚠️ You already have a booking at this time!")
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

   function handleRebook(item) {
    setBookingService({ id: item.id, name: item.service, price: 1500 });
    setBookingName(item.full_name);
    setBookingContact(item.mobile_number);
    setBookingEmail(item.email);
    setBookingAddress(item.address);
    setBookingDate(item.date);
    setBookingTime(item.time);
    setBookingNotes(item.notes || '');

    setRoomMeasurements({ measurements: { area: item.room_area, length: '', width: '' } });
    setRecommendedProduct({ capacity: item.recommended_hp });

    setScreen('booking-form');
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
  🛒 View Cart 
  {cart.length > 0 && <span className="cart-badge">{cart.length}</span>}
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

      {notification && (
  <div className="notification">
    <p>{notification}</p>
    <button onClick={() => setNotification(null)}>✕</button>
  </div>
)}

      {/* --- Home Screen --- */}
      {screen === 'home' && (
        <main className="user-main">
          <div className="hero">
            <div className="hero-content">
              <h2>Smart Cooling Solutions</h2>
              <p>Professional AC installation, maintenance & repair services</p>
            </div>
          </div>

          <div className="dashboard-summary">

  {/*<div className="maintenance-preview">
  {maintenance.map((m) => (
    <div
      key={m.id}
      className="maintenance-item"
      style={{
        backgroundColor: getMaintenanceColor(m.status),
        padding: '1rem',
        borderRadius: '10px',
        marginBottom: '0.5rem',
        cursor: 'pointer'
      }}
      onClick={() => {
        setStatusFilter(m.status); // kung gusto mo i-filter sa history
        setScreen('history');
      }}
    >
      <p>{m.service}</p>
      <p>{m.date}</p>
    </div>
  ))}
</div>
*/}



 <div className="dashboard-summary">

  <div 
    className="card total" 
    onClick={() => {
      setStatusFilter('All')
      setScreen('history')
    }}
  >
    <h3>{total}</h3>
    <p>Total Bookings</p>
  </div>

  <div 
    className="card pending" 
    onClick={() => {
      setStatusFilter('pending')
      setScreen('history')
    }}
  >
    <h3>{pending}</h3>
    <p>Pending</p>
  </div>

  <div 
    className="card confirmed" 
    onClick={() => {
      setStatusFilter('approved')
      setScreen('history')
    }}
  >
    <h3>{confirmed}</h3>
    <p>Confirmed</p>
  </div>

  <div 
    className="card assigned" 
    onClick={() => {
      setStatusFilter('assigned')
      setScreen('history')
    }}
  >
    <h3>{assigned}</h3>
    <p>Assigned</p>
  </div>

  <div 
    className="card cancelled" 
    onClick={() => {
      setStatusFilter('cancelled')
      setScreen('history')
    }}
  >
    <h3>{cancelled}</h3>
    <p>Cancelled</p>
  </div>
</div>
</div>



 <div  
  style={{
    backgroundColor: "#1e293b", // dark para premium look
    color: "#fff",
    padding: "1rem",
    borderRadius: "12px",
    marginBottom: "1rem",
    cursor: "pointer"
  }}  
  onClick={() => setScreen('preventive')}
>
  <h3>🔔 Upcoming Preventive Maintenance</h3>

  {maintenance.length === 0 ? (
    <p>No upcoming maintenance. You're all good! ✅</p>
  ) : (
    maintenance.slice(0, 3).map(item => (
      <div
        key={item.id}
        style={{
          backgroundColor: getMaintenanceColor(item.status),
          padding: "0.5rem",
          borderRadius: "8px",
          marginTop: "0.5rem",
          color: "#000",
          fontWeight: "bold"
        }}
      >
        <p>{item.notes}</p>
        <p>{new Date(item.date).toLocaleDateString()}</p>
        <p>⏳ {getDaysRemaining(item.date)}</p>
      </div>
    ))
  )}
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

      {/* --- Measure Choice --- */}
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
        onClick={() => setShowAR(true)}
      >
        <div className="measure-icon">📷</div>
        <div className="measure-text">
          <h3>Use Camera AR</h3>
          <p>Scan your room using camera</p>
          <small style={{ display: 'block', marginTop: '0.5rem', color: '#fbbf24' }}>
            ⚠️ Tap at least 2 corners of your room to measure
          </small>
        </div>
      </button>
    </div>
  </main>
)}

  {showAR && (
  <RoomMeasurementAR
    resetTrigger={resetCounter}
    onMeasureComplete={(result) => {
      console.log("AR Result raw:", result);

      if (!result || !result.points || result.points.length < 2) {
        return alert("⚠️ Tap at least 2 corners of your room!");
      }

      // 1️⃣ Kalkulahin ang measurements
      const measurements = calculateRoomMeasurements(result.points); // return {length, width}
      console.log("Calculated measurements:", measurements);

      const length = parseFloat(measurements.length);
      const width = parseFloat(measurements.width);
      const area = (length * width).toFixed(2); // Area sa m²
      const recommendedHP = getAirconHP(area);   // function mo para sa HP

      // 2️⃣ I-save sa state para magamit sa Room Analysis page
      setRoomMeasurements({ length, width, area });
      setRecommendedProduct({ capacity: recommendedHP });

      // 3️⃣ Ipakita sa screen
      setShowAR(false);
      setScreen('measure'); // punta sa Room Analysis page
    }}
  />
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
          <p>Length: <strong>{roomMeasurements.measurements.length} m</strong></p>
          <p>Width: <strong>{roomMeasurements.measurements.width} m</strong></p>
          <p>Area: <strong>{roomMeasurements.measurements.area} m²</strong></p>
        </div>
      </div>

      {recommendedProduct && (
        <div className="recommendation" style={{ backgroundColor: '#000', color: '#fff', padding: '1rem', borderRadius: '8px', marginTop: '1rem' }}>
          <h3>🎯 Recommended AirCon</h3>
          <p>{recommendedProduct.capacity}</p>
        </div>
      )}

      <div className="actions">
        <button
          className="btn-remeasure"
          onClick={() => {
            setRoomMeasurements(null);
            setRecommendedProduct(null);
            setScreen('manual-measure');

            setManualLength('');
            setManualWidth('');
            setManualUnit('Meters');
            
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
                {recommendedProduct?.capacity}
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

      {/* 🔍 SEARCH */}
      <input
        type="text"
        placeholder="Search service..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="search-input"
      />

      {/* 🔥 STATUS LEGEND */}
      <div className="legend">
        <button onClick={() => setStatusFilter('All')}>All</button>
        <button onClick={() => setStatusFilter('pending')}>Pending</button>
        <button onClick={() => setStatusFilter('approved')}>Confirmed</button>
        <button onClick={() => setStatusFilter('cancelled')}>Cancelled</button>
        <button onClick={() => setStatusFilter('rejected')}>Rejected</button>
        <button onClick={() => setStatusFilter('assigned')}>Assigned</button>
      </div>
    </div>

    {/* 🔄 LOADING */}
    {loading && <p>Loading bookings...</p>}

    {/* ❌ ERROR */}
    {errorMsg && <div className="error">{errorMsg}</div>}

    {/* 😢 EMPTY STATE */}
    {!loading && bookingHistory.length === 0 && (
      <div className="empty-state">
        <h3>No bookings yet 😢</h3>
        <button onClick={() => setScreen('services')}>
          Book Now
        </button>
      </div>
    )}

    {/* 📋 LIST */}
    <div className="history-list">
      {bookingHistory
        // 🔍 SEARCH FILTER
        .filter((item) =>
          item.service?.toLowerCase().includes(search.toLowerCase())
        )

        // 🔥 STATUS FILTER (FIXED)
        .filter((item) => {
          if (statusFilter === 'All') return true;

          if (statusFilter === 'pending') return item.status === 'pending';
          if (statusFilter === 'approved') return item.status === 'approved';
          if (statusFilter === 'assigned') return item.status === 'assigned';
          if (statusFilter === 'cancelled') return item.status === 'cancelled';
          if (statusFilter === 'rejected') return item.status === 'rejected';

          return true;
        })

        .map((item) => {
          let statusClass = '';

          if (item.status === 'pending') statusClass = 'history-pending';
          if (item.status === 'approved') statusClass = 'history-confirmed';
          if (item.status === 'assigned') statusClass = 'history-assigned';
          if (item.status === 'cancelled') statusClass = 'history-cancelled';
          if (item.status === 'rejected') statusClass = 'history-rejected';

          return (
            <div key={item.id} className={`history-item ${statusClass}`}>
              <h3>{item.service}</h3>
              <p>Date: {item.date} | Time: {item.time}</p>

              {/* 🔹 Status Badge */}
              <p>
                Status:{" "}
                <span
                  className="status-badge"
                  style={{
                    backgroundColor:
                      item.status === "pending"
                        ? "#fbbf24"
                        : item.status === "approved"
                        ? "#34d399"
                        : item.status === "assigned"
                        ? "#3b82f6"
                        : item.status === "cancelled"
                        ? "#f87171"
                        : item.status === "rejected"
                        ? "#ef4444"
                        : "#9ca3af",
                    color: "#fff",
                    padding: "4px 8px",
                    borderRadius: "6px",
                    fontWeight: "bold"
                  }}
                >
                  {item.status === "pending" && "⏳ Pending"}
                  {item.status === "approved" && "✅ Confirmed"}
                  {item.status === "assigned" && "👨‍🔧 Assigned"}
                  {item.status === "cancelled" && "❌ Cancelled"}
                  {item.status === "rejected" && "🚫 Rejected"}
                </span>
              </p>

              <p>Room Area: {item.room_area || 'N/A'} m²</p>
              <p>Recommended AC: {item.recommended_hp || 'N/A'}</p>

              <p>👤 {item.full_name}</p>
              <p>📞 {item.mobile_number}</p>
              <p>📧 {item.email}</p>
              <p>📍 {item.address}</p>

              {item.notes && <p>📝 {item.notes}</p>}
              {/* 🔁 QUICK REBOOK */}
              <button
                onClick={() =>
                  openBookingForm({
                    id: item.id,
                    name: item.service,
                    price: 1500,
                  })
                }
              >
                🔁 Book Again
              </button>

              {item.status === "pending" && (
                <div className="history-actions">
                  <button onClick={() => handleEdit(item)}>✏ Edit</button>
                  <button onClick={() => handleCancel(item.id)}>🗑 Cancel</button>
                </div>
              )}
            </div>
          )
        })}
    </div>

    <button onClick={() => setScreen('home')} className="btn-back">
      ← Back
    </button>
  </main>
)}
    
  {/* --- Services Catalog --- */}
{screen === 'services' && (
  <main className="user-main">
    <div className="screen-header">
      <h2>🔧 Services Catalog</h2>
      <p>Select a service to book</p>

      {/* --- Category Filters --- */}
      <div className="service-filters">
        {['Installation', 'Repair', 'Maintenance'].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`filter-btn ${filter === cat ? 'active' : ''}`}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>

    {/* --- Services Grid --- */}
    <div className="services-grid">
      {services
        .filter((s) => s.category.toLowerCase() === filter.toLowerCase())
        .map((service) => (
          <div key={service.id} className="service-card">
            <h3>{service.name}</h3>
            <p>Category: {service.category}</p>
            <p>Price: ₱{service.price}</p>
            <p>Duration: {service.duration}</p>
            {roomMeasurements && recommendedProduct && (
              <p>Recommended AC: {recommendedProduct?.capacity}</p>
            )}
            <button onClick={() => openBookingForm(service)}>
              Book this Service
            </button>
          </div>
        ))}

      {/* --- No Services Message --- */}
      {services.filter((s) => s.category.toLowerCase() === filter.toLowerCase()).length === 0 && (
        <p>No services available in this category yet.</p>
      )}
    </div>

    {/* --- Booking Form Modal --- */}
{bookingService && (
  <BookingForm
    service={bookingService}
    onCancel={() => setBookingService(null)}
    onConfirm={(data, localMeasurements, localRecommendation) => {
      const newItem = {
        cartId: Date.now(),
        serviceId: bookingService.id,
        serviceName: bookingService.name,
        price: bookingService.price,
        roomMeasurements: localMeasurements,
        recommendedProduct: localRecommendation?.capacity,
        bookingDetails: data,
      }

      setCart([...cart, newItem])
      setBookingService(null)

      alert(`Booking for ${bookingService.name} added to cart`)
    }}
  />
)}
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

      {screen === "preventive" && (
  <main className="user-main">
    <div className="screen-header">
      <h2>🛠️ Preventive Maintenance Schedule</h2>
      <button onClick={() => setScreen("home")} className="btn-back">
        ← Back
      </button>
    </div>

    <div className="maintenance-list">
      {maintenance.length === 0 && <p>No preventive maintenance scheduled.</p>}

      {maintenance.map((m) => (
  <div
    key={m.id}
    className="maintenance-item"
    style={{
      backgroundColor: getMaintenanceColorByDate(m.date),
      padding: "0.5rem",
      borderRadius: "8px",
      marginBottom: "0.5rem",
      display: "flex",
      justifyContent: "space-between",
      color: "#000",
      fontWeight: "bold",
      cursor: "pointer",
    }}
    onClick={() => alert(`Maintenance Details:\nService: ${m.service}\nDate: ${m.date}\nStatus: ${m.status}`)}
  >
    <span>{m.service}</span>
    <span>{new Date(m.date).toLocaleDateString()}</span>
    <span>⏳ {calculateDaysRemaining(m.date)}</span>
  </div>
))}
    </div>
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
