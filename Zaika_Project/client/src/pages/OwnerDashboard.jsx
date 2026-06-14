import React, { useEffect, useState, useMemo } from 'react';
import { apiFetch } from '../api';
import { useAuth } from '../context/AuthContext';

const PKR = new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 });

const STATUS_COLORS = {
  Pending:          { bg: '#fef3c7', text: '#d97706' },
  Accepted:         { bg: '#dbeafe', text: '#2563eb' },
  Preparing:        { bg: '#ede9fe', text: '#7c3aed' },
  'Out for delivery': { bg: '#d1fae5', text: '#0f766e' },
  Delivered:        { bg: '#dcfce7', text: '#16a34a' },
  Cancelled:        { bg: '#fee2e2', text: '#dc2626' },
};

const FOOD_CATEGORIES = ['Desi Food', 'Fast Food', 'Sweets', 'Drinks', 'BBQ', 'Breakfast', 'Other'];

const blankItem = { name: '', description: '', price: '', category: 'Desi Food', imageUrl: '', isAvailable: true };

/* ─── tiny sub-components ─────────────────────────────── */

function StatusBadge({ status }) {
  const c = STATUS_COLORS[status] || { bg: '#f3f4f6', text: '#374151' };
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700,
      background: c.bg, color: c.text, whiteSpace: 'nowrap',
    }}>
      {status}
    </span>
  );
}

function StatCard({ label, value, color, sub }) {
  return (
    <div className="panel" style={{ padding: '20px 18px', textAlign: 'center' }}>
      <div style={{ fontSize: 30, fontWeight: 800, color }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{sub}</div>}
      <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>{label}</div>
    </div>
  );
}

/* ─── main component ───────────────────────────────────── */

export default function OwnerDashboard() {
  const { user } = useAuth();

  const [tab, setTab] = useState('overview');
  const [restaurants, setRestaurants] = useState([]);
  const [myRestaurant, setMyRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState('');

  // forms
  const [restForm, setRestForm] = useState({ name: '', location: '' });
  const [editingRest, setEditingRest] = useState(false);
  const [itemForm, setItemForm] = useState(blankItem);
  const [editingItem, setEditingItem] = useState(null); // null = new, else id

  /* ── load ── */
  const load = async () => {
    setLoading(true);
    try {
      const [restData, menuData, orderData, riderData] = await Promise.all([
        apiFetch('/api/restaurants'),
        apiFetch('/api/menu'),
        apiFetch('/api/orders').catch(() => []),
        apiFetch('/api/riders').catch(() => []),
      ]);
      setRestaurants(Array.isArray(restData) ? restData : []);
      setMenuItems(Array.isArray(menuData) ? menuData : []);
      setOrders(Array.isArray(orderData) ? orderData : []);
      setRiders(Array.isArray(riderData) ? riderData : []);

      // find restaurant owned by logged-in user
      const mine = (Array.isArray(restData) ? restData : []).find(
        (r) => r.owner?._id === user?.id || r.owner === user?.id
      );
      setMyRestaurant(mine || null);
      if (mine) setRestForm({ name: mine.name, location: mine.location });
    } catch (err) {
      setFlash('Error loading data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const notify = (msg) => { setFlash(msg); setTimeout(() => setFlash(''), 3500); };

  /* ── restaurant ── */
  const saveRestaurant = async () => {
    try {
      if (myRestaurant) {
        await apiFetch(`/api/restaurants/${myRestaurant._id}`, {
          method: 'PUT',
          body: JSON.stringify(restForm),
        });
        notify('Restaurant updated.');
      } else {
        await apiFetch('/api/restaurants', {
          method: 'POST',
          body: JSON.stringify({ ...restForm, owner: user?.id }),
        });
        notify('Restaurant created!');
      }
      setEditingRest(false);
      load();
    } catch (err) { notify(err.message); }
  };

  /* ── menu item ── */
  const saveItem = async () => {
    if (!itemForm.name || !itemForm.price) { notify('Name and price are required.'); return; }
    try {
      if (editingItem) {
        await apiFetch(`/api/menu/${editingItem}`, {
          method: 'PUT',
          body: JSON.stringify({ ...itemForm, price: Number(itemForm.price) }),
        });
        notify('Item updated.');
      } else {
        await apiFetch('/api/menu', {
          method: 'POST',
          body: JSON.stringify({ ...itemForm, price: Number(itemForm.price) }),
        });
        notify('Item added to menu!');
      }
      setItemForm(blankItem);
      setEditingItem(null);
      load();
    } catch (err) { notify(err.message); }
  };

  const startEdit = (item) => {
    setEditingItem(item._id);
    setItemForm({
      name: item.name || '',
      description: item.description || '',
      price: item.price || '',
      category: item.category || 'Desi Food',
      imageUrl: item.imageUrl || '',
      isAvailable: item.isAvailable !== false,
    });
    setTab('menu');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteItem = async (id) => {
    if (!window.confirm('Delete this menu item?')) return;
    try {
      await apiFetch(`/api/menu/${id}`, { method: 'DELETE' });
      notify('Item deleted.');
      load();
    } catch (err) { notify(err.message); }
  };

  const toggleAvailable = async (item) => {
    try {
      await apiFetch(`/api/menu/${item._id}`, {
        method: 'PUT',
        body: JSON.stringify({ isAvailable: !item.isAvailable }),
      });
      load();
    } catch (err) { notify(err.message); }
  };

  /* ── order status ── */
  const updateOrderStatus = async (orderId, status) => {
    try {
      await apiFetch(`/api/orders/${orderId}`, { method: 'PUT', body: JSON.stringify({ status }) });
      notify(`Order marked as "${status}".`);
      load();
    } catch (err) { notify(err.message); }
  };

  const assignRider = async (orderId, riderId) => {
    if (!riderId) return;
    try {
      await apiFetch('/api/riders/assign', {
        method: 'PUT',
        body: JSON.stringify({ riderId, orderId }),
      });
      notify('Rider assigned.');
      load();
    } catch (err) { notify(err.message); }
  };

  /* ── derived stats ── */
  const activeOrders  = orders.filter((o) => o.status !== 'Delivered' && o.status !== 'Cancelled');
  const todayRevenue  = orders
    .filter((o) => o.status === 'Delivered')
    .reduce((s, o) => s + (o.total || 0), 0);
  const availableRiders = riders.filter((r) => r.isAvailable);

  const menuByCategory = useMemo(() => {
    const map = {};
    menuItems.forEach((item) => {
      const cat = item.category || 'Other';
      if (!map[cat]) map[cat] = [];
      map[cat].push(item);
    });
    return map;
  }, [menuItems]);

  /* ── tab styles ── */
  const tabBtn = (id) => ({
    padding: '8px 20px',
    borderRadius: 20,
    border: '1px solid var(--line)',
    fontWeight: 600,
    fontSize: 13,
    cursor: 'pointer',
    background: tab === id ? 'var(--primary)' : 'transparent',
    color: tab === id ? '#fff' : 'var(--ink)',
    transition: 'all .15s',
  });

  if (loading) return <p style={{ padding: 24, color: 'var(--muted)' }}>Loading owner dashboard…</p>;

  return (
    <section className="panel-stack">

      {/* ── Header ── */}
      <div className="section-head">
        <div>
          <span className="eyebrow">Restaurant owner</span>
          <h2>Owner Dashboard</h2>
        </div>
        <p>Manage your restaurant, menu items, and incoming orders from one place.</p>
      </div>

      {flash && (
        <div className="status" style={{
          background: flash.startsWith('Error') ? '#fee2e2' : '#d1fae5',
          color: flash.startsWith('Error') ? '#dc2626' : '#065f46',
          border: 'none', borderRadius: 10, padding: '10px 16px',
        }}>{flash}</div>
      )}

      {/* ── Restaurant banner ── */}
      {myRestaurant && !editingRest && (
        <div className="panel" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 12, padding: '18px 22px',
          background: 'linear-gradient(135deg, var(--primary) 0%, #8f351e 100%)',
          color: '#fff', borderRadius: 18,
        }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>🍽️ {myRestaurant.name}</div>
            <div style={{ opacity: 0.85, fontSize: 14, marginTop: 2 }}>📍 {myRestaurant.location}</div>
          </div>
          <button onClick={() => setEditingRest(true)}
            style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 10, padding: '8px 18px', fontWeight: 600, cursor: 'pointer' }}>
            ✏️ Edit Restaurant
          </button>
        </div>
      )}

      {/* ── Restaurant form ── */}
      {(!myRestaurant || editingRest) && (
        <div className="panel admin-card" style={{ padding: 24 }}>
          <h3 style={{ marginTop: 0 }}>{myRestaurant ? '✏️ Edit Restaurant' : '🏪 Register Your Restaurant'}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input
              placeholder="Restaurant name"
              value={restForm.name}
              onChange={(e) => setRestForm((c) => ({ ...c, name: e.target.value }))}
              style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--panel-strong)' }}
            />
            <input
              placeholder="Location / address"
              value={restForm.location}
              onChange={(e) => setRestForm((c) => ({ ...c, location: e.target.value }))}
              style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--panel-strong)' }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="primary-button" onClick={saveRestaurant}>
                {myRestaurant ? 'Save Changes' : 'Create Restaurant'}
              </button>
              {myRestaurant && (
                <button className="ghost-button" onClick={() => setEditingRest(false)}>Cancel</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {[
          { id: 'overview', label: '📊 Overview' },
          { id: 'menu',     label: '🍜 Menu' },
          { id: 'orders',   label: `📦 Orders ${activeOrders.length ? `(${activeOrders.length})` : ''}` },
        ].map((t) => (
          <button key={t.id} style={tabBtn(t.id)} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {/* ════════════════ OVERVIEW TAB ════════════════ */}
      {tab === 'overview' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
            <StatCard label="Active Orders"    value={activeOrders.length}  color="#b54e2f" />
            <StatCard label="Menu Items"       value={menuItems.length}     color="#0f766e" />
            <StatCard label="Available Riders" value={availableRiders.length} color="#2563eb" />
            <StatCard label="Total Revenue"    value={PKR.format(todayRevenue)} color="#16a34a" sub="delivered orders" />
          </div>

          {/* Recent orders preview */}
          <div className="panel list-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>🕐 Recent Orders</h3>
              <button style={{ ...tabBtn('orders'), padding: '6px 14px' }} onClick={() => setTab('orders')}>View All</button>
            </div>
            {orders.length === 0 ? (
              <p style={{ color: 'var(--muted)' }}>No orders yet.</p>
            ) : (
              orders.slice(0, 5).map((o) => (
                <div key={o._id} className="list-row" style={{ padding: '10px 0', borderBottom: '1px solid var(--line)', alignItems: 'flex-start' }}>
                  <div>
                    <strong>#{o._id?.slice(-6).toUpperCase()}</strong>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                      {(o.items || []).map((i) => i.name).slice(0, 3).join(', ')}
                      {(o.items || []).length > 3 ? ` +${o.items.length - 3} more` : ''}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <strong>{PKR.format(o.total || 0)}</strong>
                    <StatusBadge status={o.status} />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Menu category breakdown */}
          <div className="panel list-card" style={{ padding: 24 }}>
            <h3 style={{ marginTop: 0 }}>📋 Menu Breakdown</h3>
            {Object.keys(menuByCategory).length === 0 ? (
              <p style={{ color: 'var(--muted)' }}>No menu items yet. <button className="ghost-button" onClick={() => setTab('menu')}>Add items →</button></p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
                {Object.entries(menuByCategory).map(([cat, items]) => (
                  <div key={cat} style={{ border: '1px solid var(--line)', borderRadius: 12, padding: 14 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{cat}</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--primary)', margin: '6px 0' }}>{items.length}</div>
                    <div style={{ fontSize: 12, color: '#16a34a' }}>
                      {items.filter((i) => i.isAvailable !== false).length} available
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ════════════════ MENU TAB ════════════════ */}
      {tab === 'menu' && (
        <>
          {/* Add / Edit form */}
          <div className="panel admin-card" style={{ padding: 24 }}>
            <h3 style={{ marginTop: 0 }}>{editingItem ? '✏️ Edit Menu Item' : '➕ Add Menu Item'}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
              <input
                placeholder="Item name *"
                value={itemForm.name}
                onChange={(e) => setItemForm((c) => ({ ...c, name: e.target.value }))}
                style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--panel-strong)' }}
              />
              <input
                placeholder="Price (PKR) *"
                type="number"
                value={itemForm.price}
                onChange={(e) => setItemForm((c) => ({ ...c, price: e.target.value }))}
                style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--panel-strong)' }}
              />
              <select
                value={itemForm.category}
                onChange={(e) => setItemForm((c) => ({ ...c, category: e.target.value }))}
                style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--panel-strong)' }}
              >
                {FOOD_CATEGORIES.map((cat) => <option key={cat}>{cat}</option>)}
              </select>
              <input
                placeholder="Image URL (optional)"
                value={itemForm.imageUrl}
                onChange={(e) => setItemForm((c) => ({ ...c, imageUrl: e.target.value }))}
                style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--panel-strong)' }}
              />
              <input
                placeholder="Description"
                value={itemForm.description}
                onChange={(e) => setItemForm((c) => ({ ...c, description: e.target.value }))}
                style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--panel-strong)', gridColumn: 'span 2' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 14, alignItems: 'center' }}>
              <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={itemForm.isAvailable}
                  onChange={(e) => setItemForm((c) => ({ ...c, isAvailable: e.target.checked }))}
                />
                Available on menu
              </label>
              <button className="primary-button" onClick={saveItem}>
                {editingItem ? 'Save Changes' : 'Add Item'}
              </button>
              {editingItem && (
                <button className="ghost-button" onClick={() => { setEditingItem(null); setItemForm(blankItem); }}>
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* Menu items list by category */}
          {Object.entries(menuByCategory).length === 0 ? (
            <div className="panel" style={{ padding: 24, color: 'var(--muted)' }}>No menu items yet. Add one above!</div>
          ) : (
            Object.entries(menuByCategory).map(([cat, items]) => (
              <div key={cat} className="panel list-card" style={{ padding: 24 }}>
                <h3 style={{ marginTop: 0 }}>
                  {cat}
                  <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--muted)', marginLeft: 8 }}>
                    {items.length} item{items.length !== 1 ? 's' : ''}
                  </span>
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                  {items.map((item) => (
                    <div key={item._id} style={{
                      border: '1px solid var(--line)', borderRadius: 14, overflow: 'hidden',
                      background: 'var(--panel-strong)',
                      opacity: item.isAvailable === false ? 0.55 : 1,
                    }}>
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          style={{ width: '100%', height: 130, objectFit: 'cover', display: 'block' }}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      )}
                      <div style={{ padding: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 15 }}>{item.name}</div>
                            {item.description && (
                              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3, lineHeight: 1.4 }}>
                                {item.description.slice(0, 70)}{item.description.length > 70 ? '…' : ''}
                              </div>
                            )}
                          </div>
                          <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--primary)', whiteSpace: 'nowrap' }}>
                            {PKR.format(item.price)}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                          <button
                            onClick={() => toggleAvailable(item)}
                            style={{
                              fontSize: 11, padding: '4px 10px', borderRadius: 8, border: '1px solid var(--line)',
                              background: item.isAvailable !== false ? '#dcfce7' : '#fee2e2',
                              color:      item.isAvailable !== false ? '#16a34a'  : '#dc2626',
                              cursor: 'pointer', fontWeight: 600,
                            }}>
                            {item.isAvailable !== false ? '✅ Available' : '❌ Unavailable'}
                          </button>
                          <button className="secondary-button" style={{ fontSize: 12, padding: '4px 12px' }} onClick={() => startEdit(item)}>
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => deleteItem(item._id)}
                            style={{ fontSize: 12, padding: '4px 12px', borderRadius: 8, border: '1px solid #fca5a5', background: '#fff', color: '#dc2626', cursor: 'pointer', fontWeight: 600 }}>
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </>
      )}

      {/* ════════════════ ORDERS TAB ════════════════ */}
      {tab === 'orders' && (
        <>
          {/* filter pills */}
          {orders.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['All', 'Pending', 'Accepted', 'Preparing', 'Out for delivery', 'Delivered', 'Cancelled'].map((s) => {
                const count = s === 'All' ? orders.length : orders.filter((o) => o.status === s).length;
                return count > 0 ? (
                  <span key={s} style={{
                    padding: '4px 14px', borderRadius: 16, fontSize: 12, fontWeight: 600,
                    background: 'var(--panel-strong)', border: '1px solid var(--line)',
                    color: 'var(--muted)',
                  }}>
                    {s} ({count})
                  </span>
                ) : null;
              })}
            </div>
          )}

          {orders.length === 0 ? (
            <div className="panel" style={{ padding: 24, color: 'var(--muted)' }}>No orders yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {orders.map((order) => (
                <div key={order._id} style={{
                  border: '1px solid var(--line)', borderRadius: 16,
                  background: 'var(--panel-strong)', overflow: 'hidden',
                }}>
                  {/* order header */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    flexWrap: 'wrap', gap: 8, padding: '14px 18px',
                    borderBottom: '1px solid var(--line)',
                    background: 'rgba(255,255,255,0.5)',
                  }}>
                    <div>
                      <strong style={{ fontSize: 15 }}>Order #{order._id?.slice(-6).toUpperCase()}</strong>
                      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                        👤 {order.user?.name || order.user?.email || 'Customer'}
                        {order.deliveryAddress ? ` · 📍 ${order.deliveryAddress}` : ''}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <strong style={{ color: 'var(--primary)' }}>{PKR.format(order.total || 0)}</strong>
                      <StatusBadge status={order.status} />
                    </div>
                  </div>

                  {/* items */}
                  <div style={{ padding: '12px 18px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {(order.items || []).map((item, idx) => (
                      <span key={idx} style={{
                        fontSize: 12, background: '#f3f4f6', borderRadius: 8,
                        padding: '3px 10px', color: 'var(--ink)',
                      }}>
                        {item.name} ×{item.quantity || 1}
                      </span>
                    ))}
                  </div>

                  {/* actions */}
                  {order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                    <div style={{ padding: '12px 18px', borderTop: '1px solid var(--line)', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      {order.status === 'Pending' && (
                        <>
                          <button className="primary-button" style={{ fontSize: 12 }} onClick={() => updateOrderStatus(order._id, 'Accepted')}>
                            ✅ Accept
                          </button>
                          <button onClick={() => updateOrderStatus(order._id, 'Cancelled')}
                            style={{ fontSize: 12, padding: '8px 14px', borderRadius: 10, border: '1px solid #fca5a5', background: '#fff', color: '#dc2626', cursor: 'pointer', fontWeight: 600 }}>
                            ❌ Reject
                          </button>
                        </>
                      )}
                      {order.status === 'Accepted' && (
                        <button className="secondary-button" style={{ fontSize: 12 }} onClick={() => updateOrderStatus(order._id, 'Preparing')}>
                          👨‍🍳 Start Preparing
                        </button>
                      )}
                      {order.status === 'Preparing' && (
                        <button className="secondary-button" style={{ fontSize: 12 }} onClick={() => updateOrderStatus(order._id, 'Out for delivery')}>
                          🚀 Ready for Delivery
                        </button>
                      )}
                      {/* Assign rider */}
                      {(order.status === 'Preparing' || order.status === 'Out for delivery') && (
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <select
                            defaultValue=""
                            onChange={(e) => assignRider(order._id, e.target.value)}
                            style={{ padding: '7px 12px', borderRadius: 10, border: '1px solid var(--line)', fontSize: 12, background: 'var(--panel-strong)' }}
                          >
                            <option value="" disabled>🏍️ Assign rider…</option>
                            {availableRiders.map((r) => (
                              <option key={r._id} value={r._id}>{r.name} ({r.phone})</option>
                            ))}
                          </select>
                        </div>
                      )}
                      {order.status === 'Out for delivery' && (
                        <button className="primary-button" style={{ fontSize: 12 }} onClick={() => updateOrderStatus(order._id, 'Delivered')}>
                          ✅ Mark Delivered
                        </button>
                      )}
                      {/* rider info */}
                      {order.rider && (
                        <span style={{ fontSize: 12, color: '#0f766e', marginLeft: 4 }}>
                          🏍️ {order.rider.name || 'Rider assigned'}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

    </section>
  );
}
