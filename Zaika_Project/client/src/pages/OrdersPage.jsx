import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api';

const currency = new Intl.NumberFormat('en-PK', {
  style: 'currency',
  currency: 'PKR',
  maximumFractionDigits: 0,
});

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const data = await apiFetch('/api/orders');
        setOrders(data);
      } catch (err) {
        setStatus(err.message);
      }
    };

    loadOrders();
  }, []);

  return (
    <section className="panel-stack">
      <div className="section-head">
        <div>
          <span className="eyebrow">Order tracking</span>
          <h2>Your orders</h2>
        </div>
        <p>All confirmed orders appear here with totals, statuses, and item breakdowns.</p>
      </div>
      {status && <div className="status">{status}</div>}
      {orders.length ? (
        <div className="grid-cards order-grid">
          {orders.map((order) => (
            <article className="panel order-card" key={order._id}>
              <div className="order-head">
                <div>
                  <span className="eyebrow">Order #{order._id.slice(-6)}</span>
                  <strong>{order.status}</strong>
                </div>
                <span className="order-total">{currency.format(Number(order.total || 0))}</span>
              </div>
              <ul className="order-items">
                {(order.items || []).map((item, index) => (
                  <li key={`${order._id}-${index}`}>{item.quantity} x {item.name}</li>
                ))}
              </ul>
              <div className="order-meta">
                <span>Delivery address</span>
                <p>{order.deliveryAddress || 'N/A'}</p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h3>No orders yet</h3>
          <p>Once you place an order, it will show here with its payment and delivery details.</p>
        </div>
      )}
    </section>
  );
}
