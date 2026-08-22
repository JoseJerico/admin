import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import './AdminPayments.css';

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [selectedPayment, setSelectedPayment] = useState(null);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);

    // 1. Fetch payments data
    const { data: paymentsData } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false });

    const rawPayments = Array.isArray(paymentsData) ? paymentsData : [];

    // 2. Fetch profiles data
    let profilesMap = {};
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('*');

    if (Array.isArray(profilesData)) {
      profilesMap = profilesData.reduce((acc, profile) => {
        if (profile && profile.id) {
          acc[profile.id] = profile;
        }
        return acc;
      }, {});
    }

    // 3. Match profiles to payment records
    const mergedPayments = rawPayments.map(p => {
      const userProfile = profilesMap[p.user_id] || {};
      
      const resolvedName = 
        userProfile.full_name || 
        userProfile.fullname ||
        userProfile.name ||
        (userProfile.first_name ? `${userProfile.first_name} ${userProfile.last_name || ''}`.trim() : null) ||
        userProfile.username ||
        p.customer_name ||
        null;

      const resolvedEmail = 
        userProfile.email || 
        p.customer_email || 
        null;

      return {
        ...p,
        customer_name: resolvedName,
        customer_email: resolvedEmail,
      };
    });

    setPayments(mergedPayments);
    setLoading(false);
  };

  const totalRevenue = payments
    .filter(p => (p.status || '').toLowerCase() === 'paid')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const paidCount = payments.filter(p => (p.status || '').toLowerCase() === 'paid').length;
  const pendingCount = payments.filter(p => (p.status || '').toLowerCase() === 'pending').length;
  const failedCount = payments.filter(p => ['failed', 'expired'].includes((p.status || '').toLowerCase())).length;

  const filteredPayments = payments.filter(payment => {
    const status = (payment.status || '').toUpperCase();
    const method = (payment.payment_method || '').toUpperCase();
    const ref = (payment.payment_reference || payment.paymongo_payment_id || '').toLowerCase();
    const customer = (payment.customer_name || payment.customer_email || payment.user_id || '').toLowerCase();
    const query = searchTerm.toLowerCase();

    const matchesStatus = statusFilter === 'ALL' || status === statusFilter;
    const matchesMethod = methodFilter === 'ALL' || method === methodFilter;
    const matchesSearch = ref.includes(query) || customer.includes(query);

    return matchesStatus && matchesMethod && matchesSearch;
  });

  return (
    <div className="admin-payments-container">
      <div className="payments-header">
        <div>
          <h2>Payment & Transaction Management</h2>
          <p className="subtitle">Audit, monitor, and verify online customer transactions</p>
        </div>
        <button onClick={fetchPayments} className="btn-refresh">
          🔄 Refresh Data
        </button>
      </div>

      <div className="metrics-grid">
        <div className="metric-card revenue">
          <span className="metric-label">Total Verified Revenue</span>
          <span className="metric-value">₱{totalRevenue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="metric-card paid">
          <span className="metric-label">Successful Transactions</span>
          <span className="metric-value">{paidCount}</span>
        </div>
        <div className="metric-card pending">
          <span className="metric-label">Pending Verifications</span>
          <span className="metric-value">{pendingCount}</span>
        </div>
        <div className="metric-card failed">
          <span className="metric-label">Failed / Expired</span>
          <span className="metric-value">{failedCount}</span>
        </div>
      </div>

      <div className="table-controls">
        <input
          type="text"
          placeholder="Search by Reference Code or Customer..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />

        <div className="filter-group">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="select-filter">
            <option value="ALL">All Statuses</option>
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
          </select>

          <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)} className="select-filter">
            <option value="ALL">All Methods</option>
            <option value="GCASH">GCash</option>
            <option value="CARD">Card</option>
            <option value="QRPH">QRPh</option>
          </select>
        </div>
      </div>

      <div className="table-wrapper">
        {loading ? (
          <div className="loading-state">Loading payment records...</div>
        ) : filteredPayments.length === 0 ? (
          <div className="empty-state">No payment records found matching your filters.</div>
        ) : (
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
              {filteredPayments.map((p) => (
                <tr key={p.id}>
                  <td>{new Date(p.created_at || p.paid_at).toLocaleString()}</td>
                  <td className="font-mono">{p.payment_reference || p.paymongo_payment_id || p.id.slice(0, 8)}</td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>
                      {p.customer_name || `User ${p.user_id?.slice(0, 8) || 'N/A'}`}
                    </div>
                    {p.customer_email && (
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {p.customer_email}
                      </div>
                    )}
                  </td>
                  <td className="amount">₱{Number(p.amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                  <td><span className={`method-badge ${p.payment_method?.toLowerCase()}`}>{p.payment_method || 'N/A'}</span></td>
                  <td><span className={`status-badge ${p.status?.toLowerCase()}`}>{p.status}</span></td>
                  <td>
                    <button onClick={() => setSelectedPayment(p)} className="btn-view">
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedPayment && (
        <div className="modal-overlay" onClick={() => setSelectedPayment(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Transaction Audit Details</h3>
              <button className="close-btn" onClick={() => setSelectedPayment(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <span className="label">Internal Payment ID:</span>
                <span className="value font-mono">{selectedPayment.id}</span>
              </div>
              <div className="detail-row">
                <span className="label">PayMongo Reference:</span>
                <span className="value font-mono">{selectedPayment.payment_reference || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span className="label">Payment Intent ID:</span>
                <span className="value font-mono">{selectedPayment.payment_intent_id || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span className="label">Customer Name:</span>
                <span className="value">{selectedPayment.customer_name || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span className="label">Customer Email:</span>
                <span className="value">{selectedPayment.customer_email || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span className="label">Total Amount:</span>
                <span className="value font-bold">₱{Number(selectedPayment.amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="detail-row">
                <span className="label">Payment Channel:</span>
                <span className="value">{selectedPayment.payment_method?.toUpperCase()}</span>
              </div>
              <div className="detail-row">
                <span className="label">Transaction Status:</span>
                <span className={`status-badge ${selectedPayment.status?.toLowerCase()}`}>{selectedPayment.status}</span>
              </div>
              <div className="detail-row">
                <span className="label">Timestamp:</span>
                <span className="value">{new Date(selectedPayment.created_at).toLocaleString()}</span>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-close" onClick={() => setSelectedPayment(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}