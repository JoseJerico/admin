import React, { useState, useEffect } from "react";
import { supabase } from "../supabase";
import ReceiptModal from "../User/ReceiptModal";
import "./AdminPayments.css";

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const [{ data: rawPayments, error: pErr }, { data: ordersData }, { data: bookingsData }, { data: profilesData }] = await Promise.all([
        supabase.from("payments").select("*").order("created_at", { ascending: false }),
        supabase.from("orders").select("*"),
        supabase.from("bookings").select("*"),
        supabase.from("profiles").select("*")
      ]);

      if (pErr) throw pErr;

      const orderMap = new Map((ordersData || []).map((o) => [o.id, o]));
      const bookingMap = new Map((bookingsData || []).map((b) => [b.id, b]));
      const profileMap = new Map((profilesData || []).map((p) => [p.id || p.user_id, p]));

      // 1. Process regular payments - STRICTLY sasalain na dapat totoo ngang paid at hindi failed/pending
      const processedPayments = (rawPayments || []).filter((p) => {
        const statusStr = String(p.status || "").toLowerCase();
        // Siguraduhing kasama ang paid/success AT HINDI kasama ang failed/pending/expired
        const isPaid = statusStr.includes("paid") || statusStr.includes("success");
        const isNotFailed = !statusStr.includes("failed") && !statusStr.includes("pending") && !statusStr.includes("expired");
        return isPaid && isNotFailed;
      }).map((p) => {
        let refStr = (p.paymongo_reference || p.reference_number || "").trim();
        let relatedData = null;

        if (refStr.startsWith("ORDER-")) {
          const orderId = refStr.replace("ORDER-", "").trim();
          relatedData = orderMap.get(orderId);
        } else if (refStr.startsWith("BOOKING-")) {
          const bookingId = refStr.replace("BOOKING-", "").trim();
          relatedData = bookingMap.get(bookingId);
        }

        if (!relatedData) {
          if (p.booking_id) relatedData = bookingMap.get(p.booking_id);
          if (!relatedData && p.order_id) relatedData = orderMap.get(p.order_id);
        }

        const userProfile = p.user_id ? profileMap.get(p.user_id) : (relatedData?.user_id ? profileMap.get(relatedData.user_id) : null);

        const customerName =
          relatedData?.customer_name ||
          relatedData?.full_name ||
          relatedData?.name ||
          p.customer_name ||
          p.full_name ||
          userProfile?.full_name ||
          userProfile?.name ||
          "Customer";

        const customerEmail =
          relatedData?.customer_email ||
          relatedData?.email ||
          p.customer_email ||
          p.email ||
          userProfile?.email ||
          "customer@gmail.com";

        const contactNumber =
          relatedData?.contact_number ||
          relatedData?.phone_number ||
          relatedData?.phone ||
          p.contact_number ||
          p.phone_number ||
          userProfile?.phone_number ||
          userProfile?.contact_number ||
          "09087615843";

        const address =
          relatedData?.address ||
          p.address ||
          userProfile?.address ||
          "General Mariano Alvarez, Cavite";

        let finalAmt = Number(p.amount || relatedData?.total_service_fee || relatedData?.total_amount || 0);

        return {
          ...p,
          amount: finalAmt,
          status: "paid",
          sub_status_label: "PAID",
          resolved_name: customerName,
          resolved_email: customerEmail,
          resolved_phone: contactNumber,
          resolved_address: address,
          related_data: relatedData,
          user_profile: userProfile
        };
      });

      // 2. Process bookings virtual payments (Para sa mga bookings na may paid status talaga)
      const existingIds = new Set(processedPayments.map((p) => p.booking_id || p.paymongo_reference));

      const bookingVirtualPayments = [];
      (bookingsData || []).forEach((b) => {
        const statusStr = String(b.payment_status || "").toLowerCase();
        const amtPaid = Number(b.amount_paid || 0);

        const isActuallyPaid = statusStr === "paid" && amtPaid > 0;

        if (isActuallyPaid && !existingIds.has(b.id) && !existingIds.has(`BOOKING-${b.id}`)) {
          const userProfile = b.user_id ? profileMap.get(b.user_id) : null;
          const custName = b.customer_name || b.full_name || b.name || userProfile?.full_name || userProfile?.name || "Customer";
          const custEmail = b.customer_email || b.email || userProfile?.email || "customer@gmail.com";
          const custPhone = b.contact_number || b.phone_number || b.phone || userProfile?.phone_number || "09087615843";
          const custAddress = b.address || userProfile?.address || "General Mariano Alvarez, Cavite";

          bookingVirtualPayments.push({
            id: `booking-pay-${b.id}`,
            booking_id: b.id,
            paymongo_reference: `BOOKING-${b.id}`,
            amount: amtPaid, 
            payment_channel: b.payment_method || "ONLINE PAYMENT",
            status: "paid",
            sub_status_label: "PAID",
            created_at: b.created_at || new Date().toISOString(),
            resolved_name: custName,
            resolved_email: custEmail,
            resolved_phone: custPhone,
            resolved_address: custAddress,
            related_data: b,
            user_profile: userProfile
          });
        }
      });

      const combined = [...processedPayments, ...bookingVirtualPayments].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );

      setPayments(combined);
    } catch (err) {
      console.error("Error fetching payments:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter((item) => {
    const refCode = item.paymongo_reference || item.reference_number || item.id || "";
    const name = item.resolved_name || "";
    const email = item.resolved_email || "";

    const matchesSearch =
      refCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesMethod =
      methodFilter === "all" ||
      (item.payment_channel && item.payment_channel.toLowerCase() === methodFilter.toLowerCase()) ||
      (item.payment_method && item.payment_method.toLowerCase() === methodFilter.toLowerCase());

    return matchesSearch && matchesMethod;
  });

  const handleExportCSV = () => {
    if (filteredPayments.length === 0) {
      alert("No data to export!");
      return;
    }

    const headers = ["Date & Time", "Reference ID", "Customer Name", "Customer Email", "Amount", "Payment Method", "Status"];
    const rows = filteredPayments.map((p) => [
      `"${new Date(p.created_at).toLocaleString()}"`,
      `"${p.paymongo_reference || p.reference_number || p.id}"`,
      `"${p.resolved_name}"`,
      `"${p.resolved_email}"`,
      p.amount || 0,
      `"${p.payment_channel || p.payment_method || "ONLINE PAYMENT"}"`,
      `"PAID"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `online_payments_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalVerifiedRevenue = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const successfulCount = payments.length;

  return (
    <div className="admin-payments-container">
      <div className="payments-metrics-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
        <div className="metric-card revenue-card">
          <span className="metric-title">TOTAL VERIFIED REVENUE</span>
          <h2>₱{totalVerifiedRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}</h2>
        </div>
        <div className="metric-card success-card">
          <span className="metric-title">SUCCESSFUL ONLINE PAYMENTS</span>
          <h2>{successfulCount}</h2>
        </div>
      </div>

      <div className="payments-controls" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
        <input
          type="text"
          placeholder="Search by Reference, Customer Name, or Email..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: "1", minWidth: "250px" }}
        />
        <div className="filter-group" style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)}>
            <option value="all">All Methods</option>
            <option value="gcash">GCash</option>
            <option value="qrph">QRPH</option>
            <option value="card">Card</option>
            <option value="paymaya">Maya</option>
          </select>

          <button
            onClick={handleExportCSV}
            style={{
              backgroundColor: "#10b981",
              color: "#fff",
              padding: "10px 16px",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
            }}
          >
            📥 Export CSV
          </button>
        </div>
      </div>

      <div className="table-responsive">
        <table className="payments-table">
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Reference / ID</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="text-center">Loading online payments...</td>
              </tr>
            ) : filteredPayments.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center">No successful online payments found.</td>
              </tr>
            ) : (
              filteredPayments.map((p) => {
                const methodBadge = p.payment_channel || p.payment_method || "ONLINE PAYMENT";
                const refDisplay = p.paymongo_reference || p.reference_number || p.id?.substring(0, 8);

                return (
                  <tr key={p.id}>
                    <td>{new Date(p.created_at).toLocaleString()}</td>
                    <td className="ref-cell">{refDisplay}</td>
                    <td className="customer-cell">{p.resolved_name}</td>
                    <td className="amount-cell">₱{Number(p.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                    <td>
                      <span className="channel-badge">{methodBadge}</span>
                    </td>
                    <td>
                      <span className="status-badge status-paid">PAID</span>
                    </td>
                    <td>
                      <button
                        className="btn-view-details"
                        onClick={() => setSelectedPayment(p)}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Audit Modal */}
      {selectedPayment && !showReceipt && (
        <div className="modal-overlay" onClick={() => setSelectedPayment(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Transaction & Balance Audit</h3>
              <button className="btn-close" onClick={() => setSelectedPayment(null)}>×</button>
            </div>
            <div className="modal-body audit-details">
              <div className="audit-row">
                <span>Internal Reference ID:</span>
                <code>{selectedPayment.id}</code>
              </div>
              <div className="audit-row">
                <span>PayMongo / Ref:</span>
                <span>{selectedPayment.paymongo_reference || selectedPayment.reference_number || "N/A"}</span>
              </div>
              <div className="audit-row">
                <span>Customer Name:</span>
                <strong>{selectedPayment.resolved_name}</strong>
              </div>
              <div className="audit-row">
                <span>Customer Email:</span>
                <span>{selectedPayment.resolved_email}</span>
              </div>
              <div className="audit-row">
                <span>Contact Number:</span>
                <span>{selectedPayment.resolved_phone}</span>
              </div>
              <div className="audit-row">
                <span>Address:</span>
                <span>{selectedPayment.resolved_address}</span>
              </div>

              {selectedPayment.related_data?.total_service_fee ? (
                <>
                  <div className="audit-row" style={{ borderTop: "1px dashed #cbd5e1", marginTop: "8px", paddingTop: "8px" }}>
                    <span>Total Service Fee:</span>
                    <strong>₱{Number(selectedPayment.related_data.total_service_fee || 1500).toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong>
                  </div>
                  <div className="audit-row">
                    <span>Amount Paid:</span>
                    <span style={{ color: "#2563eb", fontWeight: "600" }}>₱{Number(selectedPayment.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="audit-row">
                    <span>Remaining Balance:</span>
                    <span style={{ color: (Number(selectedPayment.related_data.total_service_fee || 1500) - Number(selectedPayment.amount || 0)) > 0 ? "#dc2626" : "#16a34a", fontWeight: "700" }}>
                      ₱{(Math.max(0, Number(selectedPayment.related_data.total_service_fee || 1500) - Number(selectedPayment.amount || 0))).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </>
              ) : (
                <div className="audit-row">
                  <span>Total Amount Paid:</span>
                  <strong>₱{Number(selectedPayment.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong>
                </div>
              )}

              <div className="audit-row">
                <span>Payment Channel:</span>
                <span>{selectedPayment.payment_channel || selectedPayment.payment_method || "ONLINE PAYMENT"}</span>
              </div>
              <div className="audit-row">
                <span>Payment Status:</span>
                <span className="status-badge status-paid">PAID</span>
              </div>
              <div className="audit-row">
                <span>Timestamp:</span>
                <span>{new Date(selectedPayment.created_at).toLocaleString()}</span>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-primary"
                style={{ marginRight: "10px", backgroundColor: "#2563eb", color: "#fff", padding: "8px 16px", borderRadius: "6px", border: "none", cursor: "pointer", fontWeight: "600" }}
                onClick={() => setShowReceipt(true)}
              >
                🖨️ View Official Receipt
              </button>
              <button className="btn-secondary" onClick={() => setSelectedPayment(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Printable Receipt Modal */}
      {showReceipt && selectedPayment && (
        <ReceiptModal
          payment={{
            ...selectedPayment,
            customer_name: selectedPayment.resolved_name,
            customer_email: selectedPayment.resolved_email,
            reference_number: selectedPayment.paymongo_reference || selectedPayment.reference_number || selectedPayment.id,
          }}
          booking={{
            id: selectedPayment.related_data?.id || selectedPayment.booking_id || selectedPayment.id,
            service_type: selectedPayment.related_data?.service_type || "Air Conditioning Unit / Service Order",
            ac_type: selectedPayment.related_data?.ac_type || "Standard Unit",
            preferred_date: selectedPayment.related_data?.preferred_date || new Date(selectedPayment.created_at).toLocaleDateString(),
            preferred_time: selectedPayment.related_data?.preferred_time || "Standard Schedule",
            address: selectedPayment.resolved_address,
            contact_number: selectedPayment.resolved_phone,
            customer_name: selectedPayment.resolved_name,
            customer_email: selectedPayment.resolved_email,
            full_name: selectedPayment.resolved_name,
            name: selectedPayment.resolved_name,
          }}
          onClose={() => setShowReceipt(false)}
        />
      )}
    </div>
  );
}