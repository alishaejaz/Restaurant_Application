import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { apiFetch } from '../api';

const currency = new Intl.NumberFormat('en-PK', {
  style: 'currency',
  currency: 'PKR',
  maximumFractionDigits: 0,
});

const discountMap = {
  DESI10: 0.1,
  FLAVOR15: 0.15,
  FESTIVE20: 0.2,
};

export default function CheckoutPage() {
  const { user } = useAuth();
  const { items, subtotal, delivery, tax, total, clearCart } = useCart();
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    notes: '',
    discountCode: '',
    paymentMethod: 'cash',
  });
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [navigate, user]);

  const discountRate = discountMap[form.discountCode.trim().toUpperCase()] || 0;
  const discountAmount = Math.round(total * discountRate);
  const grandTotal = total - discountAmount;

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const submitOrder = async (event) => {
    event.preventDefault();

    if (!items.length) {
      setStatus('Your cart is empty.');
      return;
    }

    setLoading(true);
    setStatus('');

    try {
      const order = await apiFetch('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          items: items.map(({ name, price, quantity }) => ({ name, price, quantity })),
          total: grandTotal,
          deliveryAddress: `${form.address}, ${form.city}`,
        }),
      });

      await apiFetch('/api/payments', {
        method: 'POST',
        body: JSON.stringify({
          orderId: order._id,
          amount: grandTotal,
          method: form.paymentMethod,
        }),
      });

      clearCart();
      setStatus('Checkout completed successfully.');
      navigate('/orders');
    } catch (err) {
      setStatus(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="checkout-page panel-stack">
      <div className="section-head">
        <div>
          <span className="eyebrow">Checkout</span>
          <h2>Enter delivery details</h2>
        </div>
        <p>Provide your name, email, address, and discount code before placing the order.</p>
      </div>

      <div className="checkout-grid">
        <form className="panel checkout-form" onSubmit={submitOrder}>
          <div className="two-col">
            <label>
              Full name
              <input name="name" value={form.name} onChange={handleChange} required />
            </label>
            <label>
              Email
              <input name="email" type="email" value={form.email} onChange={handleChange} required />
            </label>
          </div>
          <div className="two-col">
            <label>
              Phone number
              <input name="phone" value={form.phone} onChange={handleChange} required />
            </label>
            <label>
              City
              <input name="city" value={form.city} onChange={handleChange} required />
            </label>
          </div>
          <label>
            Address
            <textarea name="address" rows="4" value={form.address} onChange={handleChange} required />
          </label>
          <label>
            Delivery notes
            <textarea name="notes" rows="3" value={form.notes} onChange={handleChange} placeholder="Apartment, landmark, ring bell, etc." />
          </label>
          <div className="two-col">
            <label>
              Discount code
              <input name="discountCode" value={form.discountCode} onChange={handleChange} placeholder="DESI10" />
            </label>
            <label>
              Payment method
              <select name="paymentMethod" value={form.paymentMethod} onChange={handleChange}>
                <option value="cash">Cash on delivery</option>
                <option value="card">Card</option>
                <option value="online">Online payment</option>
              </select>
            </label>
          </div>

          {status && <div className="status">{status}</div>}
          <button className="primary-button full-width" type="submit" disabled={loading || !items.length}>
            {loading ? 'Placing order...' : 'Place order'}
          </button>
        </form>

        <aside className="panel checkout-summary">
          <span className="eyebrow">Order summary</span>
          <h3>{items.length} items</h3>
          <div className="summary-line"><span>Subtotal</span><strong>{currency.format(subtotal)}</strong></div>
          <div className="summary-line"><span>Delivery</span><strong>{currency.format(delivery)}</strong></div>
          <div className="summary-line"><span>Tax</span><strong>{currency.format(tax)}</strong></div>
          <div className="summary-line"><span>Discount</span><strong>- {currency.format(discountAmount)}</strong></div>
          <div className="summary-line total"><span>Grand total</span><strong>{currency.format(grandTotal)}</strong></div>
          <div className="checkout-notes">
            <p>Accepted codes: DESI10, FLAVOR15, FESTIVE20.</p>
            <p>Your order will be saved to the order page after successful checkout.</p>
          </div>
        </aside>
      </div>
    </section>
  );
}