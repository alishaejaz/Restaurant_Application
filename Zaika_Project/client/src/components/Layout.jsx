import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const navLinkClass = ({ isActive }) => `nav-link${isActive ? ' active' : ''}`;

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" to="/">
          <span className="brand-mark">Z</span>
          <span>
            <strong>Zaika Desi Kitchen</strong>
            <small>Authentic Pakistani restaurant ordering</small>
          </span>
        </Link>

        <nav className="nav">
          <NavLink className={navLinkClass} to="/menu">Menu</NavLink>
          <NavLink className={navLinkClass} to="/cart">
            Cart
            {itemCount > 0 && <span className="nav-badge">{itemCount}</span>}
          </NavLink>
          <NavLink className={navLinkClass} to="/checkout">Checkout</NavLink>
          <NavLink className={navLinkClass} to="/orders">Orders</NavLink>
          <NavLink className={navLinkClass} to="/reviews">Reviews</NavLink>
          <NavLink className={navLinkClass} to="/about">About</NavLink>
          {user && <NavLink className={navLinkClass} to="/dashboard">My Dashboard</NavLink>}
          {user?.role === 'owner' && (
            <NavLink className={navLinkClass} to="/owner">🍽️ My Restaurant</NavLink>
          )}
          {user?.role === 'rider' && (
            <NavLink className={navLinkClass} to="/rider">🏍️ Rider</NavLink>
          )}
          {user?.role === 'admin' && <NavLink className={navLinkClass} to="/admin">Admin</NavLink>}
          {user ? (
            <>
              <NavLink className={navLinkClass} to="/profile">Profile</NavLink>
              <button className="ghost-button" type="button" onClick={logout}>Logout</button>
            </>
          ) : (
            <NavLink className={navLinkClass} to="/auth">Login</NavLink>
          )}
        </nav>
      </header>

      <main className="content-frame">{children}</main>
    </div>
  );
}
