import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../api';
import { useAuth } from '../context/AuthContext';

// Status values match the backend enum exactly (Title Case)
const statusColors = {
  Pending:           '#d97706',
  Accepted:          '#2563eb',
  Preparing:         '#7c3aed',
  'Out for delivery':'#0f766e',
  Delivered:         '#16a34a',
  Cancelled:         '#dc2626',
};

const statusSteps = ['Pending', 'Accepted', 'Preparing', 'Out for delivery', 'Delivered'];
const statusLabels = {
  Pending:           'Pending',
  Accepted:          'Accepted',
  Preparing:         'Preparing',
  'Out for delivery':'Out for Delivery',
  Delivered:         'Delivered',
  Cancelled:         'Cancelled',
};

const PKR = new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 });

function OrderTracker({ status }) {
  if (status === 'Cancelled') {
    return <div style={{ color: '#dc2626', fontWeight: 600, fontSize: 13 }}>❌ Order Cancelled</div>;
  }
  const currentIdx = statusSteps.indexOf(status);
  return (
    <div style={{ display: 'flex', gap: 0, alignItems: 'center', flexWrap: 'wrap', marginTop: 12 }}>
      {statusSteps.map((step, idx) => (
        <React.Fragment key={step}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: idx <= currentIdx ? statusColors[step] : '#e5e7eb',
              color: idx <= currentIdx ? '#fff' : '#9ca3af',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700,
            }}>
              {idx < currentIdx ? '✓' : idx + 1}
            </div>
            <span style={{ fontSize: 10, color: idx <= currentIdx ? 'var(--ink)' : '#9ca3af', fontWeight: idx === currentIdx ? 700 : 400, textAlign: 'center', maxWidth: 60 }}>
              {statusLabels[step]}
            </span>
          </div>
          {idx < statusSteps.length - 1 && (
            <div style={{ flex: 1, height: 3, minWidth: 16, background: idx < currentIdx ? '#0f766e' : '#e5e7eb', margin: '0 4px', marginBottom: 20, borderRadius: 2 }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/api/orders')
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const active  = orders.filter((o) => o.status !== 'Delivered' && o.status !== 'Cancelled');
  const history = orders.filter((o) => o.status === 'Delivered' || o.status === 'Cancelled');

  if (loading) return <p style={{ padding: 24, color: 'var(--muted)' }}>Loading your dashboard…</p>;

  return (
    <section className="panel-stack">
      <div className="section-head">
        <div>
          <span className="eyebrow">My account</span>
          <h2>Welcome back, {user?.name || 'Guest'} 👋</h2>
        </div>
        <p>Track your orders, view history, and manage your account from here.</p>
      </div>

      {error && <div className="status">{error}</div>}

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Link className="primary-button" to="/menu">🍽️ Browse Menu</Link>
        <Link className="secondary-button" to="/cart">🛒 Go to Cart</Link>
        <Link className="secondary-button" to="/reviews">⭐ Leave a Review</Link>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
        {[
          { label: 'Total Orders',  value: orders.length, color: '#b54e2f' },
          { label: 'Active Orders', value: active.length, color: '#0f766e' },
          { label: 'Delivered',     value: orders.filter(o => o.status === 'Delivered').length, color: '#16a34a' },
          { label: 'Total Spent',   value: PKR.format(orders.filter(o => o.status === 'Delivered').reduce((s, o) => s + (o.total || 0), 0)), color: '#7c3aed', small: true },
        ].map((s) => (
          <div key={s.label} className="panel" style={{ padding: '20px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: s.small ? 20 : 32, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Active Orders */}
      <div className="panel list-card" style={{ padding: 24 }}>
        <h3 style={{ marginTop: 0 }}>🚀 Active Orders</h3>
        {active.length === 0 ? (
          <div style={{ color: 'var(--muted)' }}>
            <p>No active orders. <Link to="/menu" style={{ color: 'var(--primary)' }}>Order something delicious!</Link></p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {active.map((order) => (
              <div key={order._id} style={{
                border: '1px solid var(--line)',
                borderRadius: 14,
                padding: 18,
                background: 'var(--panel-strong)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <strong>Order #{order._id?.slice(-6).toUpperCase()}</strong>
                    <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>
                      📍 {order.deliveryAddress || 'No address provided'}
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--primary)' }}>{PKR.format(order.total || 0)}</div>
                </div>
                <div style={{ marginTop: 8 }}>
                  {(order.items || []).map((item, idx) => (
                    <span key={idx} style={{ fontSize: 12, background: '#f3f4f6', borderRadius: 8, padding: '2px 8px', marginRight: 6, marginBottom: 4, display: 'inline-block' }}>
                      {item.name} × {item.quantity || 1}
                    </span>
                  ))}
                </div>
                {order.rider && (
                  <div style={{ fontSize: 13, marginTop: 8, color: '#0f766e' }}>
                    🏍️ Rider: <strong>{order.rider.name || 'Assigned'}</strong> {order.rider.phone && `• ${order.rider.phone}`}
                  </div>
                )}
                <OrderTracker status={order.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Order History */}
      <div className="panel list-card" style={{ padding: 24 }}>
        <h3 style={{ marginTop: 0 }}>📋 Order History</h3>
        {history.length === 0 ? (
          <p style={{ color: 'var(--muted)' }}>No past orders yet.</p>
        ) : (
          history.map((order) => (
            <div key={order._id} className="list-row" style={{ alignItems: 'flex-start', padding: '12px 0', borderBottom: '1px solid var(--line)' }}>
              <div>
                <strong>#{order._id?.slice(-6).toUpperCase()}</strong>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                  {(order.items || []).map((i) => i.name).join(', ')}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 600 }}>{PKR.format(order.total || 0)}</div>
                <span style={{
                  fontSize: 11, fontWeight: 600,
                  color: statusColors[order.status] || '#374151',
                }}>
                  {statusLabels[order.status] || order.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
