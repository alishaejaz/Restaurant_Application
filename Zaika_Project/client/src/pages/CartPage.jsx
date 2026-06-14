import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { sampleMenu } from '../sampleData';

const currency = new Intl.NumberFormat('en-PK', {
  style: 'currency',
  currency: 'PKR',
  maximumFractionDigits: 0,
});

export default function CartPage() {
  const {
    items,
    subtotal,
    delivery,
    tax,
    total,
    itemCount,
    updateQuantity,
    removeItem,
  } = useCart();
  const fallbackImage = sampleMenu[0]?.imageUrl || 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=800&q=80';
  const validImageUrl = (value) => typeof value === 'string' && /^https?:\/\//i.test(value.trim());
  const cartImageFor = (item) => (validImageUrl(item.imageUrl) ? item.imageUrl.trim() : fallbackImage);

  return (
    <section className="cart-layout">
      <div className="section-head cart-header">
        <div>
          <span className="eyebrow">Shopping cart</span>
          <h2>Your order basket</h2>
        </div>
        <p>{itemCount ? `${itemCount} items ready for checkout.` : 'Start adding Pakistani dishes from the menu.'}</p>
      </div>

      <div className="cart-grid">
        <div className="panel cart-items-panel">
          {items.length ? items.map((item) => (
            <article className="cart-item-card" key={item._id}>
              <div className="cart-item-image-wrap">
                <img
                  className="cart-item-image"
                  src={cartImageFor(item)}
                  alt={item.name}
                  onError={(e) => { e.target.src = fallbackImage; }}
                />
              </div>
              <div className="cart-item-copy">
                <span className="pill">{item.category}</span>
                <strong>{item.name}</strong>
                <p>{item.description}</p>
                <div className="cart-item-controls">
                  <div className="qty-stepper" aria-label={`${item.name} quantity controls`}>
                    <button type="button" className="qty-btn qty-minus" onClick={() => updateQuantity(item._id, item.quantity - 1)} aria-label={`Decrease ${item.name}`}>−</button>
                    <span className="qty-value">{item.quantity}</span>
                    <button type="button" className="qty-btn qty-plus" onClick={() => updateQuantity(item._id, item.quantity + 1)} aria-label={`Increase ${item.name}`}>+</button>
                  </div>
                  <button type="button" className="text-button danger" onClick={() => removeItem(item._id)}>Remove</button>
                </div>
              </div>
              <strong className="cart-item-price">{currency.format(item.price * item.quantity)}</strong>
            </article>
          )) : (
            <div className="empty-state">
              <h3>Your cart is empty</h3>
              <p>Browse the menu to add biryani, kebabs, sweets, and drinks.</p>
              <Link className="primary-button" to="/menu">Go to menu</Link>
            </div>
          )}
        </div>

        <aside className="panel checkout-panel">
          <span className="eyebrow">Summary</span>
          <h3>Cart totals</h3>
          <div className="summary-line"><span>Subtotal</span><strong>{currency.format(subtotal)}</strong></div>
          <div className="summary-line"><span>Delivery</span><strong>{currency.format(delivery)}</strong></div>
          <div className="summary-line"><span>Tax</span><strong>{currency.format(tax)}</strong></div>
          <div className="summary-line total"><span>Total</span><strong>{currency.format(total)}</strong></div>

          <Link className="primary-button full-width" to="/checkout" style={{ textAlign: 'center' }}>
            Proceed to checkout
          </Link>
        </aside>
      </div>
    </section>
  );
}
