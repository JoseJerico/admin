import React, { useState, useEffect } from 'react';
import Camera from '../shared/Camera'; // latest Camera.jsx na may tap 1-4
import './UserApp.css';
import { supabase } from '../supabase';

export default function UserApp({ user, onLogout }) {
  const [screen, setScreen] = useState('home');
  const [cart, setCart] = useState([]);
  const [showCamera, setShowCamera] = useState(false);
  const [roomMeasurements, setRoomMeasurements] = useState(null);
  const [recommendedProduct, setRecommendedProduct] = useState(null);
  const [showProfile, setShowProfile] = useState(false);

  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);

  // Manual measurement states
  const [manualLength, setManualLength] = useState('');
  const [manualWidth, setManualWidth] = useState('');
  const [manualUnit, setManualUnit] = useState('meters');

  useEffect(() => {
    fetchProducts();
    fetchServices();
  }, []);

  async function fetchProducts() {
    const { data, error } = await supabase.from('products').select('*').order('id');
    if (error) return console.error(error);
    setProducts(data || []);
  }

  async function fetchServices() {
    const { data, error } = await supabase.from('services').select('*').order('id');
    if (error) return console.error(error);
    setServices(data || []);
  }

  function getAirconHP(area) {
    const a = parseFloat(area);
    if (a <= 9) return "0.5 HP";
    if (a <= 18) return "1.0 HP";
    if (a <= 25) return "1.5 HP";
    if (a <= 35) return "2.0 HP";
    if (a <= 45) return "2.5 HP";
    if (a <= 60) return "3.0 HP";
    if (a <= 80) return "4.0 HP";
    return "5.0 HP or higher";
  }

  function handleManualCalculate() {
    if (!manualLength || !manualWidth) return alert("Please enter both length and width");
    let length = parseFloat(manualLength);
    let width = parseFloat(manualWidth);
    if (manualUnit === "feet") {
      length *= 0.3048;
      width *= 0.3048;
    }
    const area = length * width;
    setRoomMeasurements({ measurements: { length: length.toFixed(2), width: width.toFixed(2), area: area.toFixed(2) } });
    setRecommendedProduct({ capacity: getAirconHP(area) });
    setScreen('measure');
  }

  function handleCameraMeasured(data) {
    setRoomMeasurements({ measurements: { length: data.length, width: data.width, area: data.area } });
    setRecommendedProduct({ capacity: data.recommendedHP });
    setShowCamera(false);
    setScreen('measure');
  }

  function calculateTotal() {
    return cart.reduce((acc, item) => acc + (item.price || 0), 0);
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
        {screen !== 'home' && <button onClick={() => setScreen('home')} className="btn-back">← Back</button>}
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
      {screen === 'measure-choice' && !showCamera && (
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
              onClick={() => setShowCamera(true)} // Auto show Camera, hide this screen
            >
              📷 Use Camera AR
            </button>
          </div>
        </main>
      )}

      {/* Camera AR */}
      {showCamera && (
        <Camera
          title="📐 Measure Your Room (AR)"
          onClose={() => setShowCamera(false)}
          onMeasured={handleCameraMeasured}
        />
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
              <input type="number" value={manualLength} onChange={(e) => setManualLength(e.target.value)} placeholder="Enter length" />
            </div>
            <div className="form-group">
              <label>Width</label>
              <input type="number" value={manualWidth} onChange={(e) => setManualWidth(e.target.value)} placeholder="Enter width" />
            </div>
            <div className="form-group">
              <label>Unit</label>
              <select value={manualUnit} onChange={(e) => setManualUnit(e.target.value)}>
                <option value="meters">Meters</option>
                <option value="feet">Feet</option>
              </select>
            </div>

            <button className="btn-calculate" onClick={handleManualCalculate}>Calculate</button>
            <button onClick={() => setScreen('measure-choice')} className="btn-back">← Back</button>
          </div>
        </main>
      )}

      {/* Room Analysis */}
      {screen === 'measure' && roomMeasurements && (
        <main className="user-main">
          <div className="screen-header"><h2>📏 Room Analysis</h2></div>
          <div className="measurement-results">
            <div className="result-card">
              <h3>Room Dimensions</h3>
              <p>Length: <strong>{roomMeasurements.measurements.length} m</strong></p>
              <p>Width: <strong>{roomMeasurements.measurements.width} m</strong></p>
              <p>Area: <strong>{roomMeasurements.measurements.area} m²</strong></p>
            </div>

            {recommendedProduct && (
              <div className="recommendation">
                <h3>🎯 Recommended AirCon</h3>
                <p>{recommendedProduct.capacity}</p>
              </div>
            )}

            <div className="actions">
              <button onClick={() => setScreen('manual-measure')} className="btn-remeasure">📐 Measure Again</button>
              <button onClick={() => setScreen('home')} className="btn-back">← Back to Home</button>
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
              <div className="profile-item"><span className="label">Name:</span> <span>{user?.name || 'Guest'}</span></div>
              <div className="profile-item"><span className="label">Email:</span> <span>{user?.email || 'N/A'}</span></div>
              <div className="profile-item"><span className="label">Role:</span> <span>Customer</span></div>
              <div className="profile-item"><span className="label">Member Since:</span> <span>{new Date().toLocaleDateString()}</span></div>
            </div>
            <div className="modal-actions"><button onClick={() => setShowProfile(false)} className="btn-close">Close</button></div>
          </div>
        </div>
      )}
    </div>
  );
}