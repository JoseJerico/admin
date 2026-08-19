
import React, { useState, useEffect } from 'react'
import './UserApp.css'
import { supabase } from '../supabase'
import RoomMeasurementAR from './RoomMeasurementAR';


export default function UserApp({ user, onLogout }) {
  const [screen, setScreen] = useState('home')
  const [cart, setCart] = useState([])
  const [productCart, setProductCart] = useState([])
  const [showProductCheckout, setShowProductCheckout] = useState(false)

  const [orderFullName, setOrderFullName] = useState('')
  const [orderEmail, setOrderEmail] = useState(user?.email || '')
  const [orderMobile, setOrderMobile] = useState('')
  const [orderAddress, setOrderAddress] = useState('')
  const [orderSubmitting, setOrderSubmitting] = useState(false)
  const [roomMeasurements, setRoomMeasurements] = useState(null)
  const [recommendedProduct, setRecommendedProduct] = useState(null)
  const [showProfile, setShowProfile] = useState(false)
  const [services, setServices] = useState([])
  const [products, setProducts] = useState([])
  const [showAR, setShowAR] = useState(false);
  const menuItems = [
    { id: 'home', label: 'Dashboard', icon: '🏠', screen: 'home' },
    { id: 'measure-choice', label: 'Measure Room', icon: '📐', screen: 'measure-choice' },
    { id: 'services', label: 'Services', icon: '🔧', screen: 'services' },
    { id: 'products', label: 'Products', icon: '❄️', screen: 'products' },
    { id: 'orders', label: 'My Orders', icon: '📦', screen: 'orders' },
    { id: 'history', label: 'Bookings', icon: '📅', screen: 'history' },
    { id: 'preventive', label: 'Maintenance', icon: '🛠️', screen: 'preventive' },
    { id: 'cart', label: 'Cart', icon: '🛒', screen: 'cart' },
  ];

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Toggle ang sidebar (bukas o sarado) kapag pinindot ang button
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  const [markers, setMarkers] = useState([]);  // tap points
  const [roomData, setRoomData] = useState(null);
  const [resetCounter, setResetCounter] = useState(0);
  const [fullName, setFullName] = useState("");
  const [roleName, setRoleName] = useState("");
  const [notificationIndex, setNotificationIndex] = useState(0);

  // Manual measurement states
  const [manualLength, setManualLength] = useState('')
  const [manualWidth, setManualWidth] = useState('')
  const [manualUnit, setManualUnit] = useState('meters')

  // State Setup for Modal
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [feedbackRating, setFeedbackRating] = useState(5);  // Default rating (5 stars)
  const [feedbackMessage, setFeedbackMessage] = useState('');  // Default empty feedback
  const [feedbackType, setFeedbackType] = useState('feedback');  // Default type is 'feedback'
  const [feedbacks, setFeedbacks] = useState([]);
  const [hasSubmittedFeedback, setHasSubmittedFeedback] = useState(false);



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
  const [formData, setFormData] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)
  const [statusFilter, setStatusFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1);
  const pageSize = 10; // 10 records per page

  const preventiveIntervals = {
    "4d376ac8-2b4e-4918-b3d3-7f026cb99ba7": 60, // AC Installation Basic
    "01a76081-771d-463b-9508-1ae2410dde47": 45, // AC Repair
    "1dd16c71-7392-48a0-926d-5b0fcc1818ec": 30, // AC Maintenance
    "0935c1b6-ca4f-4d76-b9eb-4d67df5d227f": 60, // Split-type AC Installation
    "82091676-9819-44a5-9784-45c0642082a1": 60, // Window-type AC Installation
    "4d802600-9ec2-4893-8674-8c78bc6ecb14": 60, // Ceiling Cassette AC Installation
    "dc6fb40e-32b9-45bb-a295-beff8f6072c8": 30, // Portable AC Setup
    "745185be-b8d9-4e69-8b81-69a45b42fd13": 60, // Ducted AC Installation
    "cf0c1e3a-86ca-49e3-ade0-fbac6307c5a9": 45, // AC Not Cooling
    "8a6eebcb-727c-4fb9-af39-18fd692ad86e": 30, // Water Leakage Fix
    "d3adddb7-13ee-413f-9045-11f311491bfe": 45, // AC Compressor Replacement
    "3f04cce4-e0a6-41d2-9527-e499af381c89": 45, // AC Electrical Fault
    "7d83399d-f639-4633-aecb-0112831a159f": 30, // Strange AC Noise Repair
    "3f049aca-f623-4a9c-8b15-4f52af6db177": 60, // AC Coil Cleaning
    "48352c7f-6ca3-445f-8597-7fb7958fd98d": 30, // Filter Cleaning/Replacement
    "32128b70-c635-4419-b1cf-c6ea6cecab15": 60, // Full AC Check-up
    "7ecce893-74cf-4b7b-936d-0a285e4b6d09": 30, // Gas Top-up
    "e2692bd6-5e65-48a2-a61c-ff091d812789": 45, // Thermostat Calibration
    "c1e524c8-64f5-4922-8537-19ffcc41a18b": 60, // Aircon Unit Relocation 
    "19a6029e-a206-423d-8088-09ad2cb22a90": 60, // AC Energy Optimization Services 
    "82cc28a6-f812-4f5c-8cb0-f0ff242e8c9a": 60, // Cooling System Consultation & Assessment 
    "5bd67041-7f29-4b7c-960a-8ed9e1418587": 30, // Centralized AC System Installation 
    "94e42a93-2771-4efe-9f66-8aa63fe24e0d": 60, // Thermal Insulation and AC Efficiency Upgrade 
  };

  const handleMeasureComplete = (result) => {
    setRoomMeasurements(result.measurements);
    setRecommendedProduct({ capacity: result.recommended });
    setShowAR(false);
    setScreen("home");
  };

  const handleARTap = (position) => {
    setMarkers((prev) => [...prev, position]);
  };
  const calculateRoomMeasurements = (points) => {
    if (!points || points.length < 2) return { length: 0, width: 0, area: 0 };

    const xs = points.map(p => p.x);
    const zs = points.map(p => p.z);

    const length = Math.max(...xs) - Math.min(...xs);
    const width = Math.max(...zs) - Math.min(...zs);
    const area = length * width;

    return {
      length: length.toFixed(2),
      width: width.toFixed(2),
      area: area.toFixed(2)
    };
  };
  // --- DASHBOARD SUMMARY LOGIC ---
  const countStatus = (status) => {
    return bookingHistory.filter(
      b => b.status?.trim().toLowerCase() === status.toLowerCase()
    ).length;
  };

  const total = bookingHistory.length;
  const pending = countStatus('pending');
  const confirmed = countStatus('approved');
  const assigned = countStatus('assigned');
  const cancelled = countStatus('cancelled');
  const rejected = countStatus('rejected');
  const completed = countStatus('completed');
  const [filter, setFilter] = useState('All'); // para sa category highlight
  const [maintenance, setMaintenance] = useState([]);
  const [notification, setNotification] = useState(null);


  const fetchMaintenance = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from("maintenance")
        .select(`
        id,
        status,
        date,
        reminder_days,
        service_id,
        service:maintenance_service_id_fkey (id, name)
      `)
        .eq("user_id", user.id)
        .order("date", { ascending: true });

      if (error) throw error;

      console.log("Fetched maintenance data:", data);  // Debugging log

      // Map data for the dashboard
      const mapped = data.map((m) => {
        // Get the interval for the service (30, 45, or 60 days)
        const intervalDays = preventiveIntervals[m.service_id] || 30;
        const serviceName = m.service?.name || "Service";

        // Get today's date
        const today = new Date();

        // Calculate the next maintenance date
        const serviceDate = new Date(today);  // Start from today
        serviceDate.setDate(today.getDate() + intervalDays); // Add the interval days to today's date

        // Calculate days left from today to the next maintenance date
        const diffTime = serviceDate - today;
        const daysLeft = Math.max(Math.ceil(diffTime / (1000 * 60 * 60 * 24)), 0);

        // Define the next action message
        const nextAction = `Scheduled maintenance in ${intervalDays} day(s)`;

        return {
          ...m,
          service: serviceName,
          nextAction: nextAction, // Show the dynamic next action
          daysLeft: daysLeft, // Show the calculated days left
          formattedDate: serviceDate.toLocaleDateString(), // Format the date (45 or 60 days from today)
        };
      });

      console.log("Mapped Maintenance Data:", mapped);  // Check the mapped data
      setMaintenance(mapped);  // Set the mapped data to the state
    } catch (err) {
      console.error("Failed to fetch maintenance records:", err.message);
      setMaintenance([]);  // If there's an error, set maintenance to empty array
    }
  };



  const createMaintenance = async (booking) => {
    if (!booking || !user?.id) return;

    try {
      const maintenanceData = {
        user_id: booking.user_id,
        service_id: booking.service_id, // ✅ tama na
        technician_id: booking.technician_id, // 🔥 ADD THIS
        notes: `Maintenance for ${booking.service || 'Service'}`,
        date: new Date(new Date().setDate(new Date().getDate() + 30)),
        status: "pending",
        reminder_days: 3,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const { data, error } = await supabase
        .from("maintenance")
        .insert([maintenanceData])
        .select();

      if (error) throw error;

      console.log("✅ Maintenance created:", data);
    } catch (err) {
      console.error("❌ Error creating maintenance:", err.message);
    }
  };




  // Para ma-color code base sa status (pending, done, cancelled)
  const getMaintenanceColorByStatus = (status) => {
    switch (status) {
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
  const getMaintenanceColorByDate = (date) => {
    const today = new Date();
    const target = new Date(date);
    const diffDays = Math.ceil((target - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return '#f87171';
    if (diffDays <= 3) return '#fbbf24';
    return '#34d399';
  };

  // Para ipakita kung ilang araw na lang hanggang maintenance
  const calculateDaysRemaining = (nextDate) => {
    const today = new Date();
    const diffTime = nextDate - today;
    return Math.max(Math.ceil(diffTime / (1000 * 60 * 60 * 24)), 0);
  };

  const getMaintenanceAction = (service_id) => {
    const days = preventiveIntervals[service_id] || 30;
    return `Scheduled maintenance in ${days} day(s)`;
  };

  useEffect(() => {
    // cleanup function kapag nag-unmount ang manual-measure screen
    return () => {
      setManualLength("");
      setManualWidth("");
      setManualUnit("meters");
    };
  }, []);



  useEffect(() => {
    if (user?.id) fetchMaintenance();
  }, [user]);

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('maintenance-updates')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'maintenance',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Realtime maintenance payload:', payload);

          if (payload.eventType === 'INSERT') {
            setMaintenance(prev => [payload.new, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setMaintenance(prev => prev.map(m => m.id === payload.new.id ? payload.new : m));
          } else if (payload.eventType === 'DELETE') {
            setMaintenance(prev => prev.filter(m => m.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    async function fetchProfile() {
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, role_id")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
      } else {
        setFullName(data?.full_name || user.email);

        // Optional: kunin role name galing sa role_id
        const { data: roleData } = await supabase
          .from("roles")
          .select("name") // ✅ tama na
          .eq("id", data.role_id)
          .single();

        setRoleName(roleData?.name || "Customer");
      }
    }

    fetchProfile();
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
        async (payload) => {
          const updatedBooking = payload.new;

          if (updatedBooking.service_status === 'completed') {
            // 1️⃣ Auto create maintenance
            await createMaintenance(updatedBooking);

            // 2️⃣ Notify user
            setNotification(
              `🛠️ Maintenance scheduled after your "${updatedBooking.service}" service`
            );

          } else if (updatedBooking.status === 'assigned') {
            setNotification(
              `👨‍🔧 Technician assigned for "${updatedBooking.service}"`
            );
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
    const newNotifications = [];

    maintenance.forEach((m) => {
      if (!m.date || m.status !== "pending") return;

      const schedDate = new Date(m.date);
      const diffDays = Math.ceil((schedDate - now) / (1000 * 60 * 60 * 24));
      const reminderDays = m.reminder_days || 3;

      if (diffDays > 0 && diffDays <= reminderDays) {
        const msg = `🛠️ Reminder: "${m.service}" on ${schedDate.toLocaleDateString()}`;
        if (!newNotifications.includes(msg)) newNotifications.push(msg);
      } else if (diffDays < 0) {
        const msg = `⚠️ Overdue: "${m.service}" scheduled last ${schedDate.toLocaleDateString()}`;
        if (!newNotifications.includes(msg)) newNotifications.push(msg);
      }
    });

    if (newNotifications.length === 0) {
      setNotification(null);
      return;
    }

    let index = 0;
    setNotification(newNotifications[index]);

    const interval = setInterval(() => {
      index += 1;
      if (index < newNotifications.length) {
        setNotification(newNotifications[index]);
      } else {
        setNotification(null); // mawawala pagkatapos maipakita lahat
        clearInterval(interval); // stop sa cycle
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [maintenance, user]);

  const handleCancel = async (id) => {
    const confirmCancel = window.confirm("Cancel this booking?");
    if (!confirmCancel) return;

    const { error } = await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error cancelling booking:", error);
      alert("❌ Failed to cancel booking: " + error.message);
      return;
    }

    alert("✅ Booking cancelled!");
    fetchBookingHistory();
  };

  const handleEdit = (booking) => {
    setFormData({
      full_name: booking.full_name || "",
      mobile_number: booking.mobile_number || "",
      email: booking.email || "",
      address: booking.address || "",
      date: booking.date || "",
      time: booking.time || "",
      notes: booking.notes || ""
    });
    setEditingId(booking.id);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!editingId) {
      alert("No booking selected.");
      return;
    }

    const updateData = {
      full_name: formData.full_name || "",
      mobile_number: formData.mobile_number || "",
      email: formData.email || "",
      address: formData.address || "",
      date: formData.date || "",
      time: formData.time || "",
      notes: formData.notes || ""
    };

    const { data, error } = await supabase
      .from("bookings")
      .update(updateData)
      .eq("id", editingId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating booking:", error);
      alert("❌ Failed to update booking: " + error.message);
      return;
    }

    alert("✅ Booking updated successfully!");

    setBookingHistory((prev) =>
      prev.map((item) =>
        item.id === editingId ? { ...item, ...data } : item
      )
    );

    setEditingId(null);
    setFormData({});
    fetchBookingHistory();
  };

  useEffect(() => {
    console.log("User prop changed:", user);
    console.log("User ID type:", typeof user.id, "value:", user.id);

    if (user?.id) {
      console.log("Fetching booking history for user ID:", user.id);

      // Log the request URL and parameters before making the request
      const requestUrl = `https://your-supabase-url.com/bookings?offset=0&limit=10`;
      console.log("Request URL:", requestUrl);

      fetchBookingHistory();
    }
  }, [user]);

  useEffect(() => {
    fetchBookingHistory();
  }, [page]); // Fetch new data whenever page changes

  async function fetchBookingHistory() {
    if (!user?.id) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error } = await supabase
        .from('bookings')
        .select(`
        *,
        technicians:technician_id (name, contact, speciality)
      `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        console.error("Error fetching booking history:", error.message);
        setErrorMsg("❌ Failed to load booking history");
      } else {
        if (page === 1) {
          setBookingHistory(data || []);
        } else {
          setBookingHistory(prev => [...prev, ...(data || [])]);
        }
      }
    } catch (err) {
      console.error("Unexpected error occurred:", err);
      setErrorMsg("❌ Unexpected error occurred");
    }

    setLoading(false);
  }
  const loadMore = () => {
    setPage(prevPage => prevPage + 1); // Increase the page number to load the next set of records
  };

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

  async function fetchProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('brand')
      .order('model');

    if (error) {
      console.error('Failed to load products:', error.message);
      setProducts([]);
      return;
    }

    setProducts(data || []);
  }

  useEffect(() => {
    fetchServices();
    fetchProducts();
  }, []);

  function hasFeedbackForBooking(bookingId) {
    return feedbacks.some(
      (feedback) =>
        feedback.booking_id === bookingId &&
        feedback.user_id === user?.id
    );
  }

  function handleOpenFeedback(booking) {
    const alreadySubmitted = hasFeedbackForBooking(booking.id); // Check if feedback exists

    if (alreadySubmitted) {
      alert("You have already submitted feedback for this booking.");
      return; // Stop execution if feedback exists
    }

    setSelectedBooking(booking);  // Set selected booking
    setFeedbackRating(5);  // Reset rating to default 5
    setFeedbackMessage('');  // Clear any previous feedback message
    setFeedbackType('feedback');  // Set the default feedback type
    setShowFeedbackModal(true);  // Show the feedback modal
  }

  // Function to fetch feedbacks
  async function fetchFeedbacks() {
    try {
      const { data, error } = await supabase
        .from('booking_feedback')  // Ensure correct table name
        .select('*')
        .order('created_at', { ascending: false });  // Order by latest feedback

      if (error) throw error;

      console.log('Fetched feedbacks:', data);
      // Set the feedback data to state or use it as needed
      setFeedbacks(data);
    } catch (err) {
      console.error('Error fetching feedbacks:', err.message);
    }
  }

  async function submitFeedback() {
    if (!selectedBooking?.id) return;  // Ensure booking exists
    if (!feedbackMessage.trim()) {  // Ensure feedback message is not empty
      alert("Please enter your message");
      return;
    }

    // Insert feedback into Supabase
    const { data, error } = await supabase
      .from('booking_feedback')
      .insert([
        {
          booking_id: selectedBooking.id,  // Correct column name
          user_id: user.id,
          rating: feedbackRating,
          type: feedbackType,
          message: feedbackMessage.trim(),
        }
      ]);

    if (error) {
      console.error("Error submitting feedback:", error); // Log the error
      alert("❌ Failed to submit feedback");
    } else {
      alert("✅ Feedback submitted successfully!");
      setShowFeedbackModal(false);  // Close modal
      fetchFeedbacks();  // Reload feedbacks after submission
    }
  }

  useEffect(() => {
    fetchFeedbacks();  // Fetch feedbacks when the component is mounted
  }, [user]);  // Call when user changes or first load

  useEffect(() => {
    if (selectedBooking?.id) {
      checkIfFeedbackExists();  // Function na titingin kung may existing feedback
    }
  }, [selectedBooking]);
  const checkIfFeedbackExists = async () => {
    const { data, error } = await supabase
      .from('booking_feedback')
      .select('*')
      .eq('booking_id', selectedBooking.id)
      .eq('user_id', user.id)
      .single();

    if (data) {
      setHasSubmittedFeedback(true);  // Kung may data, ibig sabihin may feedback na
    } else {
      setHasSubmittedFeedback(false);  // Kung wala, wala pang feedback
    }
  };


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
    const width = result.width || result.widthMeters || result.zDiff || 0;
    const area = result.area || length * width;

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

  // 👉 ILAGAY SA TAAS NG COMPONENT

  function getNextActionByService(serviceName) {
    switch (serviceName) {

      case "AC Installation Basic":
      case "Split-type AC Installation":
      case "Window-type AC Installation":
      case "Ceiling Cassette AC Installation":
      case "Ducted AC Installation":
      case "Portable AC Setup":
        return "Schedule preventive check";

      case "AC Repair":
      case "Water Leakage Fix":
      case "AC Compressor Replacement":
      case "AC Electrical Fault":
      case "Strange AC Noise Repair":
        return "Monitor performance & check for issues";

      case "Filter Cleaning/Replacement":
      case "Full AC Check-up":
      case "AC Coil Cleaning":
      case "Thermostat Calibration":
      case "Gas Top-up":
        return "Perform routine maintenance";

      default:
        return "Perform maintenance";
    }
  }

  function calculateNextActionDate(date) {
    const d = new Date(date);
    d.setDate(d.getDate() + 30);
    return d;
  }


  async function handleConfirmBooking() {
    if (!bookingName || !bookingContact || !bookingDate || !bookingTime) {
      alert('Please complete all required fields');
      return;
    }

    console.log("DEBUG:");
    console.log("Date:", bookingDate);
    console.log("Time:", bookingTime);

    try {
      const { data: existing, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('date', bookingDate)
        .eq('time', bookingTime) // ✅ WALANG dagdag
        .in('status', ['pending', 'approved', 'assigned']);

      if (error) {
        console.error("❌ Supabase error:", error);
        alert("Error: " + error.message);
        return;
      }

      if (existing && existing.length > 0) {
        const conflictWithUser = existing.some(b => b.user_id === user.id);

        if (conflictWithUser) {
          alert("⚠️ You already have a booking at this date and time!");
        } else {
          alert("⚠️ Slot already booked!");
        }
        return;
      }

      // ✅ OK NA
      setShowConfirm(true);

    } catch (err) {
      console.error("❌ Unexpected error:", err);
      alert("Unexpected error occurred");
    }
  }

  function addToCart() {
    if (!bookingService || !bookingService.id) {
      alert(`❌ Invalid service selected! Please choose a valid service.`);
      return;
    }

    const newItem = {
      cartId: Date.now(),
      serviceId: bookingService.id, // siguraduhing defined
      serviceName: bookingService.name || "Unknown Service",
      price: bookingService.price || 0,
      roomMeasurements: roomMeasurements?.measurements || null,
      recommendedProduct: recommendedProduct?.capacity || null,
      bookingDetails: {
        fullName: bookingName || "",
        mobileNumber: bookingContact || "",
        email: bookingEmail || "",
        address: bookingAddress || "",
        date: bookingDate || "",
        time: bookingTime || "",
        notes: bookingNotes || "",
      },
    };

    setCart([...cart, newItem]);
    alert(`✅ Booking for ${bookingService.name} added to cart`);

    setBookingService(null);
    setShowConfirm(false);
    setScreen('services');
  }

  function addProductToCart(product) {
    if (!product || !product.id) {
      alert("❌ Invalid product.");
      return;
    }

    if (product.stock <= 0) {
      alert("❌ This product is currently out of stock.");
      return;
    }

    const existingProduct = productCart.find(
      (item) => item.productId === product.id
    );

    if (existingProduct) {
      if (existingProduct.quantity >= product.stock) {
        alert("❌ Maximum available stock reached.");
        return;
      }

      setProductCart(
        productCart.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      const newProductItem = {
        cartId: Date.now(),
        productId: product.id,
        brand: product.brand,
        model: product.model,
        hp: product.hp,
        type: product.type,
        price: Number(product.price) || 0,
        stock: product.stock,
        quantity: 1,
        imageUrl: product.image_url || null,
      };

      setProductCart([...productCart, newProductItem]);
    }

    alert(`✅ ${product.brand} ${product.model} added to product cart`);
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
  function removeProductFromCart(cartId) {
    setProductCart(
      productCart.filter((item) => item.cartId !== cartId)
    )
  }
  function increaseProductQuantity(cartId) {
    setProductCart(
      productCart.map((item) =>
        item.cartId === cartId && item.quantity < item.stock
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    )
  }

  function decreaseProductQuantity(cartId) {
    setProductCart(
      productCart
        .map((item) =>
          item.cartId === cartId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    )
  }

  function calculateTotal() {
    return cart.reduce((acc, item) => acc + (item.price || 0), 0)
  }

  function calculateProductTotal() {
    return productCart.reduce(
      (total, item) => total + (item.price * item.quantity),
      0
    )
  }

  async function submitProductOrder() {
    if (productCart.length === 0) {
      alert("❌ Product cart is empty.");
      return;
    }

    if (!orderFullName.trim()) {
      alert("❌ Please enter your full name.");
      return;
    }

    if (!orderMobile.trim()) {
      alert("❌ Please enter your mobile number.");
      return;
    }

    if (!orderAddress.trim()) {
      alert("❌ Please enter your complete address.");
      return;
    }

    setOrderSubmitting(true);

    try {
      const orderItems = productCart.map((item) => ({
        product_id: item.productId,
        quantity: item.quantity,
      }));

      const { data, error } = await supabase.rpc(
        'create_product_order',
        {
          p_full_name: orderFullName.trim(),
          p_email: orderEmail.trim(),
          p_mobile_number: orderMobile.trim(),
          p_address: orderAddress.trim(),
          p_items: orderItems,
        }
      );

      if (error) {
        console.error("Order error:", error);
        alert("❌ Failed to submit order: " + error.message);
        return;
      }

      console.log("Created order ID:", data);

      alert("✅ Your product order has been submitted successfully!");

      setProductCart([]);
      setShowProductCheckout(false);

      setOrderFullName('');
      setOrderMobile('');
      setOrderAddress('');

      await fetchProducts();

    } catch (err) {
      console.error("Unexpected checkout error:", err);
      alert("❌ Unexpected error while submitting your order.");
    } finally {
      setOrderSubmitting(false);
    }
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

    // Simple UUID validation function
    const isUUID = (val) => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      return uuidRegex.test(val);
    };

    if (!isUUID(user.id)) {
      console.error("Invalid user.id:", user.id);
      alert("❌ Invalid user ID. Please log in again.");
      return;
    }

    try {
      const bookingsToInsert = [];

      for (const item of cart) {
        // Validate service_id
        if (!isUUID(item.serviceId)) {
          console.error("Invalid serviceId for item:", item);
          alert(`❌ Invalid service ID for service "${item.serviceName}"`);
          continue; // skip this item
        }

        bookingsToInsert.push({
          user_id: user.id,
          service_id: item.serviceId,          // ✅ Dapat UUID galing sa services table
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
          created_at: new Date()
        });
      }

      if (bookingsToInsert.length === 0) {
        alert("No valid bookings to submit.");
        return;
      }

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
      {/* Button para buksan ang sidebar sa mobile */}
      <button className="toggle-sidebar-btn" onClick={toggleSidebar}>
        <span className="hamburger-icon">☰</span> {/* Hamburger Icon */}
      </button>

      <aside className={`user-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-brand">
          <div className="brand-mark">❄</div>
          <div>
            <div className="brand-title">AirCon Hub</div>
            <div className="brand-subtitle">Customer Dashboard</div>
          </div>
        </div>

        <div className="sidebar-user">
          <div className="avatar">
            {fullName ? fullName.split(' ').map((name) => name[0]).join('').slice(0, 2) : 'AC'}
          </div>
          <div className="sidebar-user-info">
            <p>Welcome back</p>
            <h2>{fullName || 'Customer'}</h2>
          </div>
        </div>

        <nav className="sidebar-menu">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`sidebar-link ${screen === item.screen ? 'active' : ''}`}
              onClick={() => {
                setScreen(item.screen)
                setIsSidebarOpen(false)
              }}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-logout" onClick={onLogout}>
            Logout
          </button>
        </div>
      </aside>
      <div className={`user-view ${screen === 'home' ? 'home-active' : ''}`}>
        <header className="user-header">
          <div className="header-top">
            <h1>❄️ AirCon Hub</h1>
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
          <main className="user-main home-screen dashboard-page">
            <div className="dashboard-topbar">
              <div className="dashboard-title-group">
                <p className="page-label">Customer Dashboard</p>
                <h2>Welcome back, {fullName || 'AirCon Hub'}</h2>
              </div>
              <div className="dashboard-top-actions">
                <button className="btn-compact" onClick={() => setScreen('history')}>
                  📖 Bookings
                </button>
                <button className="btn-compact" onClick={() => setScreen('cart')}>
                  🛒 Cart {cart.length > 0 && <span className="cart-badge mini">{cart.length}</span>}
                </button>
              </div>
            </div>

            <section className="dashboard-content">
              <div className="hero dashboard-hero">
                <div className="hero-content">
                  <h2>Smart Cooling Solutions</h2>
                  <p>Professional AC installation, maintenance & repair services</p>
                </div>
              </div>

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

                <div
                  className="card rejected"
                  onClick={() => {
                    setStatusFilter('rejected')
                    setScreen('history')
                  }}
                >
                  <h3>{rejected}</h3>
                  <p>Rejected</p>
                </div>

                <div
                  className="card completed"
                  onClick={() => {
                    setStatusFilter('completed')
                    setScreen('history')
                  }}
                >
                  <h3>{completed}</h3>
                  <p>Completed</p>
                </div>
              </div>

              <button
                className="maintenance-card"
                onClick={() => setScreen('preventive')}
              >
                <div>
                  <h3>🔔 Preventive Maintenance</h3>
                  {maintenance.length === 0 ? (
                    <p>You're all good — no upcoming maintenance.</p>
                  ) : (
                    <p>You have {maintenance.length} upcoming item(s). Tap to view details.</p>
                  )}
                </div>
              </button>

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
            </section>
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
                onClick={() => {
                  setManualLength('');   // ✅ Reset length
                  setManualWidth('');    // ✅ Reset width
                  setManualUnit('Meters'); // ✅ Reset unit
                  setScreen('manual-measure');
                }}
              >
                <div className="measure-icon">📏</div>
                <div className="measure-text">
                  <h3>Manual Measurement</h3>
                  <p>Enter area dimensions manually</p>
                </div>
              </button>

              <button
                className="measure-option ar"
                onClick={() => setShowAR(true)}
              >
                <div className="measure-icon">📷</div>
                <div className="measure-text">
                  <h3>Use Camera</h3>
                  <p>Tap at least 4 corners of the area to measure length and width</p>
                  <small style={{ display: 'block', marginTop: '0.5rem', color: '#007BFF' }}>
                    ⚠️ Disclaimer: Measurements taken using the camera are estimates only (80–90% accuracy). For precise results, please use manual measuring tools
                  </small>
                </div>
              </button>
            </div>
          </main>
        )}

        {/* Show AR Component if showAR is true */}
        {showAR && (
          <RoomMeasurementAR
            resetTrigger={resetCounter}
            onMeasureComplete={(result) => {
              console.log("AR Result raw:", result);

              if (!result || !result.points || result.points.length < 2) {
                return alert("See your room measurements now.");
              }

              // 1️⃣ Kalkulahin ang measurements
              const measurements = calculateRoomMeasurements(result.points); // return {length, width}
              console.log("Calculated measurements:", measurements);

              const length = parseFloat(measurements.length);
              const width = parseFloat(measurements.width);
              const area = (length * width).toFixed(2); // Area sa m²
              const recommendedHP = getAirconHP(area);   // function mo para sa HP

              // 2️⃣ I-save sa state para magamit sa Room Analysis page
              setRoomMeasurements({
                measurements: {
                  length,
                  width,
                  area
                }
              });
              setRecommendedProduct({ capacity: recommendedHP });

              // 3️⃣ Ipakita sa screen
              setShowAR(false);  // Hiding the AR component
              setScreen('home');  // Going back to the home screen
            }}
            setShowAR={setShowAR}  // Pass setShowAR here
            setScreen={setScreen}  // Pass setScreen here
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
                  className="unit-dropdown" // ✅ add lang
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
                  <p>Length: <strong>{roomMeasurements?.measurements?.length || 0} m</strong></p>
                  <p>Width: <strong>{roomMeasurements?.measurements?.width || 0} m</strong></p>
                  <p>Area: <strong>{roomMeasurements?.measurements?.area || 0} m²</strong></p>
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
                    setManualUnit('meters');

                  }}
                >
                  📐 Measure Again
                </button>
                {recommendedProduct && (
                  <button
                    className="btn-choose-aircon"
                    onClick={() => {
                      setFilter('Installation'); // para automatic na naka-installation yung services screen
                      setScreen('services');      // lilipat sa services screen
                    }}
                  >
                    🎯 Choose Aircon Type to Install
                  </button>
                )}
              </div>
            </div>
          </main>
        )}

        {screen === "maintenance" && (
          <main className="user-main maintenance-screen">
            <div className="screen-header">
              <h2>🛠️ Preventive Maintenance Schedule</h2>
              <p className="screen-subtitle">
                Track upcoming maintenance, due dates, and next actions in a premium dashboard view.
              </p>
            </div>

            <div className="maintenance-legend">
              <span className="legend-pill legend-upcoming">✅ Upcoming (more than 5 days)</span>
              <span className="legend-pill legend-soon">⚠️ Due Soon (1-5 days)</span>
              <span className="legend-pill legend-overdue">❌ Overdue</span>
            </div>

            {maintenance.length === 0 ? (
              <p>No maintenance records yet.</p>
            ) : (
              <div className="maintenance-grid">
                {maintenance.map((m) => {
                  // ✅ fallback interval
                  const interval = preventiveIntervals[m.service_id] ?? 30;

                  // ✅ current date
                  const today = new Date();

                  // ✅ gamitin ang ORIGINAL date (ito ang pinaka-fix)
                  const baseDate = new Date(m.date);

                  // ✅ fixed next maintenance date
                  const nextDate = new Date(baseDate);
                  nextDate.setDate(baseDate.getDate() + interval);

                  // ✅ compute days left (countdown)
                  const diffTime = nextDate - today;
                  const daysLeft = isNaN(diffTime)
                    ? 0
                    : Math.max(
                      0,
                      Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                    );

                  // ✅ next action
                  const nextAction =
                    m.status === "completed"
                      ? "No action needed ✅"
                      : daysLeft === 0
                        ? "Maintenance due today ⚠️"
                        : `Scheduled maintenance in ${daysLeft} day(s)`;

                  // ✅ service name fallback
                  const serviceName = m.service ?? "Unnamed Service";
                  const accent = getMaintenanceColorByDate(nextDate);
                  const statusLabel =
                    m.status === "completed"
                      ? "Completed"
                      : m.status === "cancelled"
                        ? "Cancelled"
                        : m.status === "pending"
                          ? "Pending"
                          : m.status === "approved"
                            ? "Confirmed"
                            : m.status === "assigned"
                              ? "Assigned"
                              : m.status;

                  return (
                    <article
                      key={m.id}
                      className="maintenance-card"
                      style={{ borderLeft: `5px solid ${accent}` }}
                    >
                      <div className="maintenance-card-header">
                        <div>
                          <span className="maintenance-label">Preventive</span>
                          <h3>{serviceName}</h3>
                        </div>
                        <span
                          className="maintenance-status"
                          style={{ backgroundColor: accent, color: '#fff' }}
                        >
                          {statusLabel}
                        </span>
                      </div>

                      <div className="maintenance-card-details">
                        <div className="maintenance-meta">
                          <span className="meta-label">Next date</span>
                          <strong>{isNaN(nextDate) ? 'TBD' : nextDate.toLocaleDateString()}</strong>
                        </div>
                        <div className="maintenance-meta">
                          <span className="meta-label">Days left</span>
                          <strong>{daysLeft}</strong>
                        </div>
                        <div className="maintenance-meta">
                          <span className="meta-label">Interval</span>
                          <strong>{interval} days</strong>
                        </div>
                      </div>

                      <p className="maintenance-action">{nextAction}</p>

                      {m.notes && (
                        <div className="maintenance-note">
                          <strong>Notes:</strong> {m.notes}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}

            <div className="maintenance-actions-row">
              <button className="btn-back" onClick={() => setScreen("home")}>⬅️ Back to Dashboard</button>
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
              <div className="booking-summary">
                <div className="summary-card">
                  <h4>Service</h4>
                  <p>{bookingService.name}</p>
                </div>
                {roomMeasurements && (
                  <div className="summary-card">
                    <h4>Room Area</h4>
                    <p>{roomMeasurements.measurements.area} m²</p>
                  </div>
                )}
                {recommendedProduct && (
                  <div className="summary-card">
                    <h4>Recommended AC</h4>
                    <p>{recommendedProduct.capacity}</p>
                  </div>
                )}
              </div>

              <div className="form-grid">
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
                <button
                  className={statusFilter === 'All' ? 'active' : ''}
                  onClick={() => setStatusFilter('All')}
                >
                  All
                </button>
                <button
                  className={statusFilter === 'pending' ? 'active' : ''}
                  onClick={() => setStatusFilter('pending')}
                >
                  Pending
                </button>
                <button
                  className={statusFilter === 'approved' ? 'active' : ''}
                  onClick={() => setStatusFilter('approved')}
                >
                  Confirmed
                </button>
                <button
                  className={statusFilter === 'cancelled' ? 'active' : ''}
                  onClick={() => setStatusFilter('cancelled')}
                >
                  Cancelled
                </button>
                <button
                  className={statusFilter === 'rejected' ? 'active' : ''}
                  onClick={() => setStatusFilter('rejected')}
                >
                  Rejected
                </button>
                <button
                  className={statusFilter === 'assigned' ? 'active' : ''}
                  onClick={() => setStatusFilter('assigned')}
                >
                  Assigned
                </button>
                <button
                  className={statusFilter === 'completed' ? 'active' : ''}
                  onClick={() => setStatusFilter('completed')}
                >
                  Completed
                </button>
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
                  if (statusFilter === 'completed') return item.status === 'completed';

                  return true;
                })

                .map((item) => {
                  let statusClass = '';

                  if (item.status === 'pending') statusClass = 'history-pending';
                  if (item.status === 'approved') statusClass = 'history-approved';
                  if (item.status === 'assigned') statusClass = 'history-assigned';
                  if (item.status === 'cancelled') statusClass = 'history-cancelled';
                  if (item.status === 'rejected') statusClass = 'history-rejected';

                  return (
                    <div key={item.id} className={`history-item ${statusClass}`}>
                      <div className="history-card-header">
                        <div>
                          <h3>{item.service}</h3>
                          <p className="history-subtitle">
                            {item.date} · {item.time}
                          </p>
                        </div>
                        <span
                          className="status-badge"
                          style={{
                            backgroundColor:
                              item.status === "pending"
                                ? "#f59e0b"
                                : item.status === "approved"
                                  ? "#34d399"
                                  : item.status === "assigned"
                                    ? "#3b82f6"
                                    : item.status === "cancelled"
                                      ? "#ef4444"
                                      : item.status === "rejected"
                                        ? "#6b7280"
                                        : item.status === "completed"
                                          ? "#2563eb"
                                          : "#9ca3af",
                            color: "#fff"
                          }}
                        >
                          {item.status === "pending" && "⏳ Pending"}
                          {item.status === "approved" && "✅ Confirmed"}
                          {item.status === "assigned" && "👨‍🔧 Assigned"}
                          {item.status === "cancelled" && "❌ Cancelled"}
                          {item.status === "rejected" && "🚫 Rejected"}
                          {item.status === "completed" && "✅ Completed"}
                        </span>
                      </div>

                      <div className="history-card-grid">
                        <div>
                          <p>
                            <strong>Room Area:</strong> {item.room_area || 'N/A'} m²
                          </p>
                          <p>
                            <strong>Recommended AC:</strong> {item.recommended_hp || 'N/A'}
                          </p>
                          <p>
                            <strong>Customer:</strong> {item.full_name}
                          </p>
                          <p>
                            <strong>Contact:</strong> {item.mobile_number}
                          </p>
                        </div>
                        <div>
                          <p>
                            <strong>Email:</strong> {item.email}
                          </p>
                          <p>
                            <strong>Address:</strong> {item.address}
                          </p>
                          {item.status === 'assigned' && item.technicians && (
                            <>
                              <p>
                                <strong>Technician:</strong> {item.technicians.name}
                              </p>
                              <p>
                                <strong>Tech Contact:</strong> {item.technicians.contact}
                              </p>
                            </>
                          )}
                        </div>
                      </div>

                      {item.notes && (
                        <div className="history-note">
                          <strong>Notes:</strong> {item.notes}
                        </div>
                      )}

                      <div className="history-actions">
                        <button
                          onClick={() =>
                            openBookingForm({
                              id: item.id,
                              name: item.service,
                              price: 1500,
                            })
                          }
                        >
                          🔁 Rebook
                        </button>

                        {item.status === 'completed' && (
                          <button onClick={() => handleOpenFeedback(item)}>
                            ⭐ Feedback
                          </button>
                        )}

                        {item.status === 'pending' && (
                          <>
                            <button onClick={() => handleEdit(item)}>✏ Edit</button>
                            <button onClick={() => handleCancel(item.id)}>🗑 Cancel</button>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
            </div>

            {/* "Load More" Button */}
            {bookingHistory.length >= pageSize && (
              <button onClick={loadMore}>Load More</button>
            )}

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
          </main>
        )}

        {/* --- Products Catalog --- */}
        {screen === 'products' && (
          <main className="user-main">
            <div className="screen-header">
              <h2>❄️ Aircon Products</h2>
              <p>Browse available air conditioning units</p>
            </div>

            <div className="services-grid">
              {products.length === 0 ? (
                <p>No products available yet.</p>
              ) : (
                products.map((product) => (
                  <div key={product.id} className="service-card">
                    <h3>{product.brand} {product.model}</h3>

                    <p><strong>HP:</strong> {product.hp} HP</p>
                    <p><strong>Type:</strong> {product.type}</p>
                    <p>
                      <strong>Price:</strong> ₱
                      {Number(product.price).toLocaleString('en-PH', {
                        minimumFractionDigits: 2
                      })}
                    </p>

                    <p><strong>Stock:</strong> {product.stock}</p>

                    {product.description && (
                      <p>{product.description}</p>
                    )}

                    <p>
                      <strong>Status:</strong>{' '}
                      {product.stock > 0 ? 'Available' : 'Out of Stock'}
                    </p>
                    <button
                      onClick={() => addProductToCart(product)}
                      disabled={product.stock <= 0}
                    >
                      {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </main>
        )}


        {/* --- Cart --- */}
        {screen === 'cart' && (
          <main className="user-main">
            <div className="screen-header">
              <h2>🛒 My Booking</h2>
            </div>

            {/* --- Product Cart --- */}
            {productCart.length > 0 && (
              <div className="cart-list">
                <h3>❄️ Aircon Products</h3>

                {productCart.map((item) => (
                  <div key={item.cartId} className="cart-item">
                    <h3>{item.brand} {item.model}</h3>
                    <p>HP: {item.hp} HP</p>
                    <p>Type: {item.type}</p>
                    <p>Price: ₱{item.price.toLocaleString('en-PH')}</p>
                    <div>
                      <strong>Quantity:</strong>{' '}
                      <button
                        onClick={() => decreaseProductQuantity(item.cartId)}
                      >
                        −
                      </button>

                      <span style={{ margin: '0 10px' }}>
                        {item.quantity}
                      </span>

                      <button
                        onClick={() => increaseProductQuantity(item.cartId)}
                        disabled={item.quantity >= item.stock}
                      >
                        +
                      </button>
                    </div>
                    <p>
                      Subtotal: ₱
                      {(item.price * item.quantity).toLocaleString('en-PH')}
                    </p>
                    <button
                      className="btn-delete"
                      onClick={() => removeProductFromCart(item.cartId)}
                    >
                      Delete
                    </button>
                  </div>
                ))}
                <h3>
                  Product Total: ₱
                  {calculateProductTotal().toLocaleString('en-PH')}
                </h3>
                <button
                  className="btn-submit"
                  onClick={() => setShowProductCheckout(true)}
                >
                  Proceed to Checkout
                </button>
                {showProductCheckout && (
                  <div className="checkout-form">
                    <h3>Customer Information</h3>

                    <input
                      type="text"
                      placeholder="Full Name"
                      value={orderFullName}
                      onChange={(e) => setOrderFullName(e.target.value)}
                    />

                    <input
                      type="email"
                      placeholder="Email Address"
                      value={orderEmail}
                      onChange={(e) => setOrderEmail(e.target.value)}
                    />

                    <input
                      type="text"
                      placeholder="Mobile Number"
                      value={orderMobile}
                      onChange={(e) => setOrderMobile(e.target.value)}
                    />

                    <textarea
                      placeholder="Complete Address"
                      value={orderAddress}
                      onChange={(e) => setOrderAddress(e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn-submit"
                      onClick={submitProductOrder}
                      disabled={orderSubmitting}
                    >
                      {orderSubmitting ? 'Submitting Order...' : 'Place Order'}
                    </button>
                    
                    <button
                      type="button"
                      className="btn-delete"
                      onClick={() => setShowProductCheckout(false)}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}

            {cart.length === 0 ? (
              productCart.length === 0 ? (
                <p>Your cart is empty.</p>
              ) : null
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
          <div className="maintenance-list">
            <h2>🛠️ Preventive Maintenance Schedule</h2>

            {/* --- Legend --- */}
            <div className="legend" style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <div style={{ width: "20px", height: "20px", backgroundColor: "#4caf50" }}></div>
                <span>✅ Upcoming (More than 5 days left)</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <div style={{ width: "20px", height: "20px", backgroundColor: "#ff9800" }}></div>
                <span>⚠️ Due Soon (1-5 days left)</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <div style={{ width: "20px", height: "20px", backgroundColor: "#f44336" }}></div>
                <span>❌ Overdue (0 days left)</span>
              </div>
            </div>

            {maintenance.length === 0 ? (
              <p>✅ No upcoming maintenance. You're all good!</p>
            ) : (
              maintenance.map((m) => {
                const interval = preventiveIntervals[m.service_id] || 30; // static interval
                const today = new Date();
                const maintenanceDate = new Date(m.date); // fixed booked date
                const diffTime = maintenanceDate - today;
                const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // dynamic

                // Background color based on daysLeft
                let bgColor = "#4caf50"; // default green
                if (daysLeft <= 5 && daysLeft > 0) bgColor = "#ff9800"; // due soon
                if (daysLeft <= 0) bgColor = "#f44336"; // overdue

                return (
                  <div
                    key={m.id}
                    className="maintenance-item"
                    style={{
                      backgroundColor: bgColor,
                      padding: "0.5rem",
                      borderRadius: "8px",
                      marginBottom: "0.5rem",
                      color: "#000",
                      fontWeight: "bold",
                    }}
                  >
                    <h3>{m.service}</h3>
                    <p>Date: {maintenanceDate.toLocaleDateString()}</p> {/* static */}
                    <p>⏳ {daysLeft} days left</p> {/* dynamic */}
                    <p>Next Action: Scheduled maintenance in {interval} day(s)</p> {/* static */}
                  </div>
                );
              })
            )}
          </div>
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
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  />
                </label>
                <label>
                  Contact:
                  <input
                    type="text"
                    value={formData.mobile_number || ''}
                    onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                  />
                </label>
                <label>
                  Email:
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </label>
                <label>
                  Address:
                  <input
                    type="text"
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </label>
                <label>
                  Date:
                  <input
                    type="date"
                    value={formData.date || ''}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </label>
                <label>
                  Time:
                  <input
                    type="time"
                    value={formData.time || ''}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  />
                </label>
                <label>
                  Notes:
                  <textarea
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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

        {showFeedbackModal && (
          <div className="modal-overlay" onClick={() => setShowFeedbackModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h3>Rate & Provide Feedback</h3>

              {/* Rating (1-5 stars) */}
              <div className="rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    onClick={() => setFeedbackRating(star)}
                    style={{ color: star <= feedbackRating ? "gold" : "gray" }}
                  >
                    ★
                  </span>
                ))}
              </div>

              {/* Feedback Type */}
              <label>Type of Feedback</label>
              <select value={feedbackType} onChange={(e) => setFeedbackType(e.target.value)}>
                <option value="feedback">Feedback</option>
                <option value="complaint">Complaint</option>
              </select>

              {/* Message Input */}
              <textarea
                placeholder="Enter your message here..."
                value={feedbackMessage}
                onChange={(e) => setFeedbackMessage(e.target.value)}
              />

              {/* Footer note */}
              <div className="modal-footer">
                Your feedback is important to us and will help us improve our services.
              </div>

              {/* Action Buttons */}
              <button onClick={submitFeedback}>Submit Feedback</button>
              <button className="cancel" onClick={() => setShowFeedbackModal(false)}>Cancel</button>
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
                  <span>{fullName || 'User'}</span>
                </div>
                <div className="profile-item">
                  <span className="label">Email:</span>
                  <span>{user?.email || 'N/A'}</span>
                </div>
                <div className="profile-item">
                  <span className="label">Role:</span>
                  <span>{roleName || 'Customer'}</span>
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
    </div>
  )
}
