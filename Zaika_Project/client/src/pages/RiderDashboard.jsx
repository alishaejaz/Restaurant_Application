import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { useAuth } from '../context/AuthContext';

const statusColors = {
  Pending: '#d97706',
  Accepted: '#2563eb',
  Preparing: '#7c3aed',
  'Out for delivery': '#0f766e',
  Delivered: '#16a34a',
  Cancelled: '#dc2626',
};

const PKR = new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 });

export default function RiderDashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [riders, setRiders] = useState([]);
  const [myRider, setMyRider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [ordersData, ridersData] = await Promise.all([
        apiFetch('/api/orders'),
        apiFetch('/api/riders'),
      ]);

      setOrders(Array.isArray(ordersData) ? ordersData : []);
      const allRiders = Array.isArray(ridersData) ? ridersData : [];
      setRiders(allRiders);

      const matched =
        allRiders.find((r) => r.userId && String(r.userId) === String(user?.id)) ||
        allRiders.find((r) => r.name?.toLowerCase() === user?.name?.toLowerCase());

      setMyRider(matched || null);
    } catch (err) {
      setStatus('Could not load data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id, user?.name]);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await apiFetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      setStatus(`Order status updated to "${newStatus}".`);
      loadData();
    } catch (err) {
      setStatus(err.message);
    }
  };

  const markAvailable = async () => {
    if (!myRider) return;

    try {
      await apiFetch(`/api/riders/${myRider._id}`, {
        method: 'PUT',
        body: JSON.stringify({ isAvailable: !myRider.isAvailable }),
      });
      loadData();
    } catch (err) {
      setStatus(err.message);
    }
  };

  const assignedOrders = myRider
    ? orders.filter((order) => order.rider && (String(order.rider._id || order.rider) === String(myRider._id)))
    : [];

  const pendingPickup = assignedOrders.filter((order) => order.status !== 'Delivered' && order.status !== 'Cancelled');
  const delivered = assignedOrders.filter((order) => order.status === 'Delivered');

  if (loading) {
    return <p style={{ padding: 24, color: 'var(--muted)' }}>Loading rider dashboard…</p>;
  }

  return (
    <section className="panel-stack">
      <div className="section-head">
        <div>
          <span className="eyebrow">Rider console</span>
          <h2>Delivery Dashboard</h2>
        </div>
        <p>Manage your active deliveries and update order statuses in real time.</p>
      </div>

      {status && <div className="status">{status}</div>}

      {myRider ? (
        <div className="panel admin-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 style={{ margin: 0 }}>🏍️ {myRider.name}</h3>
            <small style={{ color: 'var(--muted)' }}>📞 {myRider.phone}</small>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                background: myRider.isAvailable ? '#dcfce7' : '#fee2e2',
                color: myRider.isAvailable ? '#16a34a' : '#dc2626',
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              {myRider.isAvailable ? '✅ Available' : '🚚 On Delivery'}
            </span>
            <button className="secondary-button" onClick={markAvailable}>
              {myRider.isAvailable ? 'Go Offline' : 'Mark Available'}
            </button>
          </div>
        </div>
      ) : (
        <div className="panel" style={{ padding: 16, color: 'var(--muted)', fontStyle: 'italic' }}>
          No rider profile linked to your account. Ask an admin to create your rider profile with your name: <strong>{user?.name}</strong>.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
        {[
          { label: 'Active Deliveries', value: pendingPickup.length, color: '#0f766e' },
          { label: 'Completed Today', value: delivered.length, color: '#16a34a' },
          { label: 'Total Riders', value: riders.length, color: '#2563eb' },
          { label: 'Available Riders', value: riders.filter((r) => r.isAvailable).length, color: '#7c3aed' },
        ].map((stat) => (
          <div key={stat.label} className="panel" style={{ padding: '20px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="panel list-card" style={{ padding: 24 }}>
        <h3 style={{ marginTop: 0 }}>🚚 Active / Assigned Orders</h3>
        {pendingPickup.length === 0 ? (
          <p style={{ color: 'var(--muted)' }}>No assigned orders right now.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {pendingPickup.map((order) => (
              <div
                key={order._id}
                style={{
                  border: '1px solid var(--line)',
                  borderRadius: 14,
                  padding: 16,
                  background: 'var(--panel-strong)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <strong style={{ fontSize: 15 }}>Order #{order._id?.slice(-6).toUpperCase()}</strong>
                    <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 2 }}>
                      {order.user?.name || order.user?.email || 'Customer'} • {order.deliveryAddress || 'No address'}
                    </div>
                    <div style={{ marginTop: 6 }}>
                      {(order.items || []).map((item, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: 12,
                            background: '#f3f4f6',
                            borderRadius: 8,
                            padding: '2px 8px',
                            marginRight: 6,
                          }}
                        >
                          {item.name} x{item.quantity || 1}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--primary)' }}>{PKR.format(order.total || 0)}</div>
                    <span
                      style={{
                        display: 'inline-block',
                        marginTop: 4,
                        padding: '3px 10px',
                        borderRadius: 12,
                        fontSize: 11,
                        fontWeight: 600,
                        background: (statusColors[order.status] || '#374151') + '22',
                        color: statusColors[order.status] || '#374151',
                      }}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
                <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {order.status === 'Accepted' && (
                    <button className="secondary-button" onClick={() => updateOrderStatus(order._id, 'Preparing')}>
                      Mark Preparing
                    </button>
                  )}
                  {order.status === 'Preparing' && (
                    <button className="secondary-button" onClick={() => updateOrderStatus(order._id, 'Out for delivery')}>
                      🚀 Out for Delivery
                    </button>
                  )}
                  {order.status === 'Out for delivery' && (
                    <button className="primary-button" onClick={() => updateOrderStatus(order._id, 'Delivered')}>
                      ✅ Mark Delivered
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="panel list-card" style={{ padding: 24 }}>
        <h3 style={{ marginTop: 0 }}>👥 All Riders</h3>
        {riders.length === 0 ? (
          <p style={{ color: 'var(--muted)' }}>No riders registered.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {riders.map((rider) => (
              <div
                key={rider._id}
                style={{
                  border: '1px solid var(--line)',
                  borderRadius: 12,
                  padding: 14,
                  background: 'var(--panel-strong)',
                }}
              >
                <div style={{ fontWeight: 600 }}>🏍️ {rider.name}</div>
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>📞 {rider.phone}</div>
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    color: rider.isAvailable ? '#16a34a' : '#dc2626',
                  }}
                >
                  {rider.isAvailable ? '✅ Available' : '🚚 On Delivery'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {delivered.length > 0 && (
        <div className="panel list-card" style={{ padding: 24 }}>
          <h3 style={{ marginTop: 0 }}>✅ Completed Deliveries</h3>
          {delivered.map((order) => (
            <div key={order._id} className="list-row">
              <span>Order #{order._id?.slice(-6).toUpperCase()} — {order.user?.name || 'Customer'}</span>
              <small style={{ color: '#16a34a', fontWeight: 600 }}>{PKR.format(order.total || 0)}</small>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
