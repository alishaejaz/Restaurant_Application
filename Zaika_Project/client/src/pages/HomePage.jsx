import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../api';

const highlights = [
  {
    title: 'Restaurant-first browsing',
    text: 'Explore authentic Pakistani restaurants with curated menus, trusted locations, and premium dishes.',
  },
  {
    title: 'Seamless ordering',
    text: 'Build your cart, checkout, and complete every order with fast frontend and secure backend flows.',
  },
  {
    title: 'Role-based experience',
    text: 'Admins, restaurant owners, riders, and customers each get the right dashboard and access controls.',
  },
];

// No dummy/featured restaurants — show live restaurants only.

export default function HomePage() {
  const [restaurants, setRestaurants] = useState([]);

  useEffect(() => {
    apiFetch('/api/restaurants')
      .then((data) => setRestaurants(Array.isArray(data) ? data.slice(0, 4) : []))
      .catch(() => setRestaurants([]));
  }, []);

  const displayRestaurants = restaurants; // only live restaurants from the API

  return (
    <>
      <section className="hero-grid">
        <div className="hero-copy">
          <span className="eyebrow">Zaika restaurant portfolio</span>
          <h1>Discover premium Pakistani restaurants with an elegant ordering experience.</h1>
          <p>
            Browse curated dining options, open restaurant menus, and place orders using a polished web app built for
            customers, riders, owners, and admins.
          </p>
          <div className="hero-actions">
            <Link className="primary-button" to="/restaurants">Explore restaurants</Link>
            <Link className="secondary-button" to="/menu">Browse menu</Link>
          </div>
        </div>

        <div className="hero-panel">
          <div className="hero-card accent-card">
            <span>Restaurant showcase</span>
            <strong>Curated dining discovery, professional branding, and seamless menu ordering in one modern UI.</strong>
          </div>
          <div className="stack">
            {highlights.map((item) => (
              <article key={item.title} className="feature-card">
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="panel-stack">
        <div className="section-head">
          <div>
            <span className="eyebrow">Featured restaurants</span>
            <h2>Restaurant partners</h2>
          </div>
          <p>Explore highly rated dining destinations that make the platform feel polished and production-ready.</p>
        </div>

        <div className="grid-cards">
          {displayRestaurants.length > 0 ? (
            displayRestaurants.map((restaurant, index) => (
              <article className="panel feature-card" key={restaurant._id || `${restaurant.name}-${index}`}>
                  <h3>{restaurant.name}</h3>
                  <p>{restaurant.location || 'Location not specified'}</p>
                </article>
            ))
          ) : (
            <article className="panel feature-card">
              <h3>No restaurants available</h3>
              <p>Create one from the admin dashboard to populate this landing page.</p>
            </article>
          )}
        </div>
      </section>
    </>
  );
}
