import React from 'react';
import './DashboardCards.css';

export default function DashboardCards({ schedules }) {
  const statusCounts = {
    total: schedules.length,
    pending: schedules.filter(s => s.status?.toLowerCase() === 'pending').length,
    approved: schedules.filter(s => s.status?.toLowerCase() === 'approved').length,
    assigned: schedules.filter(s => s.status?.toLowerCase() === 'assigned').length,
    in_progress: schedules.filter(s => s.status?.toLowerCase() === 'in_progress').length,
    completed: schedules.filter(s => s.status?.toLowerCase() === 'completed').length,
    cancelled: schedules.filter(s => s.status?.toLowerCase() === 'cancelled').length,  // New status
    rejected: schedules.filter(s => s.status?.toLowerCase() === 'rejected').length,      // New status
  };

  const completionRate = schedules.length > 0 
    ? Math.round((statusCounts.completed / schedules.length) * 100) 
    : 0;

  const cards = [
    {
      icon: '📊',
      label: 'Total Bookings',
      value: statusCounts.total,
      color: 'primary',
      description: 'All time bookings'
    },
    {
      icon: '⏳',
      label: 'Pending',
      value: statusCounts.pending,
      color: 'warning',
      description: 'Awaiting approval'
    },
    {
      icon: '✅',
      label: 'Approved',
      value: statusCounts.approved,
      color: 'success',
      description: 'Ready to assign'
    },
    {
      icon: '👨‍🔧',
      label: 'Assigned',
      value: statusCounts.assigned,
      color: 'info',
      description: 'In queue'
    },
    {
      icon: '⚙️',
      label: 'In Progress',
      value: statusCounts.in_progress,
      color: 'danger',
      description: 'Being serviced'
    },
    {
      icon: '🎉',
      label: 'Completed',
      value: statusCounts.completed,
      color: 'success',
      description: 'Finished'
    },
    {
      icon: '❌',
      label: 'Cancelled',
      value: statusCounts.cancelled,
      color: 'secondary',
      description: 'Cancelled bookings'
    },
    {
      icon: '🛑',
      label: 'Rejected',
      value: statusCounts.rejected,
      color: 'danger',
      description: 'Rejected bookings'
    }
  ];

  return (
    <div className="dashboard-cards-container">
      <div className="dashboard-cards-header">
        <div className="overview-header">
          <h2>Overview</h2>
          <p>Your dashboard metrics at a glance</p>
        </div>
        <div className="completion-badge">
          <div className="completion-circle">
            <svg viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" className="bg-circle" />
              <circle
                cx="50"
                cy="50"
                r="45"
                className="progress-circle"
                style={{
                  strokeDasharray: `${completionRate * 2.83} 283`, // Stroke for progress
                }}
              />
            </svg>
            <div className="completion-text">
              <span className="completion-value">{completionRate}%</span>
              <span className="completion-label">Completed</span>
            </div>
          </div>
        </div>
      </div>

      <div className="cards-grid">
        {cards.map((card, index) => (
          <div key={index} className={`card card-${card.color}`}>
            <div className="card-icon">{card.icon}</div>
            <div className="card-content">
              <div className="card-value">{card.value}</div>
              <div className="card-label">{card.label}</div>
              <div className="card-description">{card.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}