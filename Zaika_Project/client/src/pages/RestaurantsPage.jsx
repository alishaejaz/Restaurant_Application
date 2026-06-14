import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api';

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState([]);

  useEffect(() => {
    apiFetch('/api/restaurants').then(setRestaurants).catch(() => setRestaurants([]));
  }, []);

  return (
    <section className="panel-stack">
      <div className="section-head">
        <div>
          <span className="eyebrow">Business network</span>
          <h2>Restaurants in the platform</h2>
        </div>
        <p>Owners can register restaurants that later map to menu curation and order fulfillment.</p>
      </div>

      <div className="grid-cards">
        {restaurants.length ? restaurants.map((restaurant) => (
          <article className="panel" key={restaurant._id}>
            <strong>{restaurant.name}</strong>
            <p>{restaurant.location}</p>
            <span>{restaurant.owner?.name || 'No owner assigned'}</span>
          </article>
        )) : (
          <article className="panel">
            <strong>No restaurants found</strong>
            <p>Create one from the admin screen to populate this area.</p>
          </article>
        )}
      </div>
    </section>
  );
}
