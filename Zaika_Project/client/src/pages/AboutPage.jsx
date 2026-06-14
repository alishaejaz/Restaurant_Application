import React from 'react';

const features = [
  'Single restaurant concept with desi Pakistani cuisine.',
  'Menu categories for Desi Food, Sweets, Drinks, and Fast Food.',
  'Dedicated cart and checkout flow with discount code support.',
  'Role-aware backend for customers, riders, owners, and admins.',
];

export default function AboutPage() {
  return (
    <section className="panel-stack about-page">
      <div className="hero-panel accent-card about-hero">
        <span className="eyebrow">About Zaika</span>
        <h1>Built for Pakistani restaurant brands.</h1>
        <p>
          Zaika Desi Kitchen is designed as a focused ordering experience for restaurants.
          The app showcases menu browsing, cart checkout, order placement, and backend CRUD with JWT authentication.
        </p>
      </div>

      <div className="grid-cards">
        {features.map((feature) => (
          <article className="panel about-card" key={feature}>
            <strong>{feature}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}