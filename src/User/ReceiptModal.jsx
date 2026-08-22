import React from 'react';
import './ReceiptModal.css';

export default function ReceiptModal({ payment, order, onClose }) {
  if (!payment) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="receipt-overlay" onClick={onClose}>
      <div className="receipt-modal printable" onClick={(e) => e.stopPropagation()}>
        {/* Screen controls */}
        <div className="receipt-actions no-print">
          <button className="btn-print" onClick={handlePrint}>🖨️ Print / Save as PDF</button>
          <button className="btn-close-receipt" onClick={onClose}>&times;</button>
        </div>

        {/* Printable Paper View */}
        <div className="receipt-paper">
          <div className="receipt-header">
            <h2>AIRCON SERVICE & SALES</h2>
            <p className="subtext">Official Electronic Transaction Receipt</p>
            <span className="receipt-badge">PAID</span>
          </div>

          <div className="receipt-divider"></div>

          <div className="receipt-meta">
            <div>
              <strong>Reference Number:</strong>
              <p className="font-mono">{payment.payment_reference || payment.paymongo_payment_id || payment.id}</p>
            </div>
            <div>
              <strong>Payment Date:</strong>
              <p>{new Date(payment.paid_at || payment.created_at).toLocaleString()}</p>
            </div>
          </div>

          <div className="receipt-customer">
            <div>
              <span className="label">Billed To:</span>
              <p className="name">{order?.customer_name || payment.customer_name || 'Customer'}</p>
              <p className="email">{order?.customer_email || payment.customer_email || ''}</p>
            </div>
            <div>
              <span className="label">Payment Method:</span>
              <p className="method font-bold">{payment.payment_method?.toUpperCase() || 'ONLINE'}</p>
            </div>
          </div>

          <table className="receipt-items-table">
            <thead>
              <tr>
                <th>Description</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>Air Conditioning Unit / Service Order</strong>
                  <div className="item-sub">Order Ref: #{payment.order_id?.slice(0, 8) || payment.id.slice(0, 8)}</div>
                </td>
                <td className="text-right font-bold">
                  ₱{Number(payment.amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="receipt-total-section">
            <div className="total-row">
              <span>Total Amount Paid:</span>
              <span className="grand-total">₱{Number(payment.amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div className="receipt-footer">
            <p>Thank you for choosing our Air Conditioning Services!</p>
            <small>This serves as an official system-generated receipt confirmation.</small>
          </div>
        </div>
      </div>
    </div>
  );
}