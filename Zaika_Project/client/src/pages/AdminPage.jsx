import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { sampleMenu } from '../sampleData';

const blankMenu = { name: '', description: '', price: '', category: '', imageUrl: '' };
const blankRestaurant = { name: '', location: '', owner: '' };
const blankRider = { name: '', phone: '', email: '', password: '' };

const currency = new Intl.NumberFormat('en-PK', {
  style: 'currency',
  currency: 'PKR',
  maximumFractionDigits: 0,
});

export default function AdminPage() {
  const [menuForm, setMenuForm] = useState(blankMenu);
  const [restaurantForm, setRestaurantForm] = useState(blankRestaurant);
  const [riderForm, setRiderForm] = useState(blankRider);
  const [users, setUsers] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [riders, setRiders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedRiders, setSelectedRiders] = useState({});
  const [status, setStatus] = useState('');
  const [editingMenu, setEditingMenu] = useState(null);

  const refreshData = async () => {
    try {
      const [usersData, menuData, restaurantData, riderData, paymentData, orderData] = await Promise.all([
        apiFetch('/api/users'),
        apiFetch('/api/menu'),
        apiFetch('/api/restaurants'),
        apiFetch('/api/riders'),
        apiFetch('/api/payments'),
        apiFetch('/api/orders'),
      ]);

      const dbMenu = Array.isArray(menuData) ? menuData : [];
      if (dbMenu.length === 0) {
        await Promise.all(
          sampleMenu.map((item) => apiFetch('/api/menu', {
            method: 'POST',
            body: JSON.stringify({
              name: item.name,
              description: item.description,
              price: Number(item.price),
              category: item.category,
              imageUrl: item.imageUrl,
            }),
          })),
        );

        const freshMenu = await apiFetch('/api/menu');
        setMenuItems(Array.isArray(freshMenu) ? freshMenu : []);
      } else {
        setMenuItems(dbMenu);
      }

      setUsers(Array.isArray(usersData) ? usersData : []);
      setRestaurants(Array.isArray(restaurantData) ? restaurantData : []);
      setRiders(Array.isArray(riderData) ? riderData : []);
      setPayments(Array.isArray(paymentData) ? paymentData : []);
      setOrders(Array.isArray(orderData) ? orderData : []);
    } catch (err) {
      setStatus(err.message);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const notify = (msg) => {
    setStatus(msg);
    window.setTimeout(() => setStatus(''), 3000);
  };

  const saveMenu = async (e) => {
    e.preventDefault();
    try {
      if (editingMenu) {
        await apiFetch(`/api/menu/${editingMenu}`, {
          method: 'PUT',
          body: JSON.stringify({ ...menuForm, price: Number(menuForm.price) }),
        });
        notify('Menu item updated.');
        setEditingMenu(null);
      } else {
        await apiFetch('/api/menu', {
          method: 'POST',
          body: JSON.stringify({ ...menuForm, price: Number(menuForm.price) }),
        });
        notify('Menu item created.');
      }

      setMenuForm(blankMenu);
      refreshData();
    } catch (err) {
      setStatus(err.message);
    }
  };

  const startEditMenu = (item) => {
    setEditingMenu(item._id);
    setMenuForm({
      name: item.name,
      description: item.description || '',
      price: item.price,
      category: item.category || '',
      imageUrl: item.imageUrl || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteMenu = async (id) => {
    if (!window.confirm('Delete this menu item?')) return;

    try {
      await apiFetch(`/api/menu/${id}`, { method: 'DELETE' });
      notify('Menu item deleted.');
      refreshData();
    } catch (err) {
      setStatus(err.message);
    }
  };

  const deleteAllMenuItems = async () => {
    if (!window.confirm('Delete ALL menu items? This cannot be undone.')) return;

    try {
      await apiFetch('/api/menu', { method: 'DELETE' });
      notify('All menu items deleted.');
      refreshData();
    } catch (err) {
      setStatus(err.message);
    }
  };

  const createRestaurant = async (e) => {
    e.preventDefault();
    try {
      await apiFetch('/api/restaurants', { method: 'POST', body: JSON.stringify(restaurantForm) });
      setRestaurantForm(blankRestaurant);
      notify('Restaurant created.');
      refreshData();
    } catch (err) {
      setStatus(err.message);
    }
  };

  const deleteRestaurant = async (id) => {
    if (!window.confirm('Delete this restaurant?')) return;

    try {
      await apiFetch(`/api/restaurants/${id}`, { method: 'DELETE' });
      notify('Restaurant deleted.');
      refreshData();
    } catch (err) {
      setStatus(err.message);
    }
  };

  const createRider = async (e) => {
    e.preventDefault();
    try {
      await apiFetch('/api/riders', { method: 'POST', body: JSON.stringify(riderForm) });
      setRiderForm(blankRider);
      notify('Rider created.');
      refreshData();
    } catch (err) {
      setStatus(err.message);
    }
  };

  const deleteRider = async (id) => {
    if (!window.confirm('Delete this rider?')) return;

    try {
      await apiFetch(`/api/riders/${id}`, { method: 'DELETE' });
      notify('Rider deleted.');
      refreshData();
    } catch (err) {
      setStatus(err.message);
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Delete this user?')) return;

    try {
      await apiFetch(`/api/users/${id}`, { method: 'DELETE' });
      notify('User deleted.');
      refreshData();
    } catch (err) {
      setStatus(err.message);
    }
  };

  const handleOrderAction = async (orderId, action) => {
    try {
      const selectedRiderId = selectedRiders[orderId];

      if (action === 'reject') {
        await apiFetch(`/api/orders/${orderId}`, {
          method: 'PUT',
          body: JSON.stringify({ status: 'Cancelled' }),
        });
        notify('Order rejected.');
      } else if (action === 'accept') {
        if (selectedRiderId) {
          await apiFetch('/api/riders/assign', {
            method: 'PUT',
            body: JSON.stringify({ riderId: selectedRiderId, orderId }),
          });
          notify('Order accepted and rider assigned.');
        } else {
          await apiFetch(`/api/orders/${orderId}`, {
            method: 'PUT',
            body: JSON.stringify({ status: 'Accepted' }),
          });
          notify('Order accepted.');
        }
      }

      refreshData();
    } catch (err) {
      setStatus(err.message);
    }
  };

  const pendingOrders = orders.filter((order) => order.status === 'Pending');
  const activeOrders = orders.filter((order) => ['Accepted', 'Preparing', 'Out for delivery'].includes(order.status));
  const availableRiders = riders.filter((rider) => rider.isAvailable);

  const btnDanger = {
    background: 'none',
    border: '1px solid #dc2626',
    color: '#dc2626',
    borderRadius: 8,
    padding: '4px 12px',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600,
  };

  const btnEdit = {
    background: 'none',
    border: '1px solid #2563eb',
    color: '#2563eb',
    borderRadius: 8,
    padding: '4px 12px',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600,
    marginRight: 6,
  };

  return (
    <section className="panel-stack">
      <div className="section-head">
        <div>
          <span className="eyebrow">Admin console</span>
          <h2>Manage the platform</h2>
        </div>
        <p>CRUD views for menu, restaurants, riders, users, payments, and order approvals.</p>
      </div>

      {status && <div className="status">{status}</div>}

      <div className="admin-grid">
        <form className="panel admin-card" onSubmit={saveMenu}>
          <h3>{editingMenu ? '✏️ Edit menu item' : 'Create menu item'}</h3>
          <input placeholder="Name" value={menuForm.name} onChange={(e) => setMenuForm((current) => ({ ...current, name: e.target.value }))} required />
          <input placeholder="Description" value={menuForm.description} onChange={(e) => setMenuForm((current) => ({ ...current, description: e.target.value }))} />
          <input placeholder="Price (PKR)" type="number" value={menuForm.price} onChange={(e) => setMenuForm((current) => ({ ...current, price: e.target.value }))} required />
          <input placeholder="Category" value={menuForm.category} onChange={(e) => setMenuForm((current) => ({ ...current, category: e.target.value }))} />
          <input placeholder="Image URL" value={menuForm.imageUrl} onChange={(e) => setMenuForm((current) => ({ ...current, imageUrl: e.target.value }))} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="primary-button" type="submit">{editingMenu ? 'Update item' : 'Save item'}</button>
            {editingMenu && (
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setEditingMenu(null);
                  setMenuForm(blankMenu);
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <form className="panel admin-card" onSubmit={createRestaurant}>
          <h3>Create restaurant</h3>
          <input placeholder="Name" value={restaurantForm.name} onChange={(e) => setRestaurantForm((current) => ({ ...current, name: e.target.value }))} required />
          <input placeholder="Location" value={restaurantForm.location} onChange={(e) => setRestaurantForm((current) => ({ ...current, location: e.target.value }))} />
          <label style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>Assign owner (optional)</label>
          <select value={restaurantForm.owner || ''} onChange={(e) => setRestaurantForm((current) => ({ ...current, owner: e.target.value }))}>
            <option value="">No owner</option>
            {users.filter((user) => user.role === 'owner' || user.role === 'admin').map((user) => (
              <option key={user._id} value={user._id}>{`${user.name} (${user.email})`}</option>
            ))}
          </select>
          <button className="primary-button" type="submit">Save restaurant</button>
        </form>

        <form className="panel admin-card" onSubmit={createRider}>
          <h3>Create rider</h3>
          <input placeholder="Name" value={riderForm.name} onChange={(e) => setRiderForm((current) => ({ ...current, name: e.target.value }))} required />
          <input placeholder="Email" type="email" value={riderForm.email} onChange={(e) => setRiderForm((current) => ({ ...current, email: e.target.value }))} required />
          <input placeholder="Password" type="password" value={riderForm.password} onChange={(e) => setRiderForm((current) => ({ ...current, password: e.target.value }))} required />
          <input placeholder="Phone" value={riderForm.phone} onChange={(e) => setRiderForm((current) => ({ ...current, phone: e.target.value }))} />
          <button className="primary-button" type="submit">Save rider</button>
        </form>
      </div>

      <div className="panel list-card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ marginTop: 0 }}>🧾 Pending Orders</h3>
            <p style={{ marginTop: 4, color: 'var(--muted)' }}>
              Approve or reject orders and assign a rider so deliveries can be tracked.
            </p>
          </div>
          <div style={{ color: 'var(--muted)', fontSize: 13 }}>
            {pendingOrders.length} pending • {activeOrders.length} in progress
          </div>
        </div>

        {pendingOrders.length === 0 ? (
          <p style={{ color: 'var(--muted)' }}>No pending orders right now.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 12 }}>
            {pendingOrders.map((order) => {
              const selectedValue = selectedRiders[order._id] || '';

              return (
                <div
                  key={order._id}
                  style={{
                    border: '1px solid var(--line)',
                    borderRadius: 14,
                    padding: 16,
                    background: 'var(--panel-strong)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 4 }}>Order #{order._id?.slice(-6).toUpperCase()}</div>
                      <div style={{ fontWeight: 700 }}>{order.user?.name || order.user?.email || 'Customer'}</div>
                      <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>{order.deliveryAddress || 'No address'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--primary)' }}>{currency.format(Number(order.total || 0))}</div>
                      <div style={{ marginTop: 6, fontSize: 12, color: 'var(--muted)' }}>
                        {order.items?.length || 0} item(s)
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {(order.items || []).map((item, index) => (
                      <span
                        key={`${order._id}-${index}`}
                        style={{
                          fontSize: 12,
                          background: '#f3f4f6',
                          borderRadius: 999,
                          padding: '4px 10px',
                        }}
                      >
                        {item.quantity} x {item.name}
                      </span>
                    ))}
                  </div>

                  <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 220 }}>
                      <span style={{ fontSize: 12, color: 'var(--muted)' }}>Assign rider</span>
                      <select
                        value={selectedValue}
                        onChange={(e) => setSelectedRiders((current) => ({ ...current, [order._id]: e.target.value }))}
                        style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--line)' }}
                      >
                        <option value="">Select rider (optional)</option>
                        {availableRiders.map((rider) => (
                          <option key={rider._id} value={rider._id}>{rider.name}</option>
                        ))}
                      </select>
                    </label>

                    <button className="primary-button" onClick={() => handleOrderAction(order._id, 'accept')}>
                      Accept
                    </button>
                    <button className="secondary-button" onClick={() => handleOrderAction(order._id, 'reject')}>
                      Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="admin-lists">
        <article className="panel list-card">
          <h3>👤 Users</h3>
          {users.length === 0 && <p style={{ color: 'var(--muted)', fontSize: 13 }}>No users found (requires MongoDB).</p>}
          {users.map((item) => (
            <div className="list-row" key={item._id} style={{ gap: 8 }}>
              <span style={{ flex: 1 }}>{item.name}</span>
              <small style={{ color: 'var(--muted)' }}>{item.role}</small>
              <button style={btnDanger} onClick={() => deleteUser(item._id)}>Delete</button>
            </div>
          ))}
        </article>

        <article className="panel list-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
            <h3>🍽️ Menu Items</h3>
            <button style={btnDanger} type="button" onClick={deleteAllMenuItems}>Delete all items</button>
          </div>
          {menuItems.length === 0 && <p style={{ color: 'var(--muted)', fontSize: 13 }}>No items found (requires MongoDB).</p>}
          {menuItems.map((item) => (
            <div
              className="list-row"
              key={item._id}
              style={{ gap: 8, opacity: item.isSample ? 0.75 : 1, cursor: 'pointer' }}
              onClick={() => deleteMenu(item._id)}
            >
              <span style={{ flex: 1, minWidth: 0 }}>
                {item.name}
                {item.isSample && <small style={{ marginLeft: 8, color: 'var(--muted)', fontSize: 11 }}>(sample)</small>}
              </span>
              <div className="button-group">
                <button type="button" style={btnEdit} onClick={(e) => { e.stopPropagation(); startEditMenu(item); }}>Edit</button>
                <button type="button" style={btnDanger} onClick={(e) => { e.stopPropagation(); deleteMenu(item._id); }}>Delete</button>
              </div>
            </div>
          ))}
        </article>

        <article className="panel list-card">
          <h3>🏪 Restaurants</h3>
          {restaurants.length === 0 && <p style={{ color: 'var(--muted)', fontSize: 13 }}>No restaurants found.</p>}
          {restaurants.map((item) => (
            <div className="list-row" key={item._id} style={{ gap: 8 }}>
              <span style={{ flex: 1 }}>{item.name}</span>
              <small style={{ color: 'var(--muted)' }}>{item.location}</small>
              <button style={btnDanger} onClick={() => deleteRestaurant(item._id)}>Delete</button>
            </div>
          ))}
        </article>

        <article className="panel list-card">
          <h3>🏍️ Riders</h3>
          {riders.length === 0 && <p style={{ color: 'var(--muted)', fontSize: 13 }}>No riders found.</p>}
          {riders.map((item) => (
            <div className="list-row" key={item._id} style={{ gap: 8 }}>
              <span style={{ flex: 1 }}>{item.name}</span>
              <small style={{ color: 'var(--muted)' }}>{item.isAvailable ? '✅ Available' : '🚚 Busy'}</small>
              <button style={btnDanger} onClick={() => deleteRider(item._id)}>Delete</button>
            </div>
          ))}
        </article>

        <article className="panel list-card">
          <h3>💳 Payments</h3>
          {payments.length === 0 && <p style={{ color: 'var(--muted)', fontSize: 13 }}>No payments found.</p>}
          {payments.map((item) => (
            <div className="list-row" key={item._id}>
              <span>{item.method}</span>
              <small style={{ color: 'var(--muted)' }}>{item.status}</small>
            </div>
          ))}
        </article>
      </div>
    </section>
  );
}
