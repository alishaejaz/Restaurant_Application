import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [form, setForm] = useState({ rating: 5, comment: '' });
  const [status, setStatus] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    apiFetch('/api/reviews')
      .then(setReviews)
      .catch((err) => setStatus(err.message));
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const created = await apiFetch('/api/reviews', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setReviews((current) => [created, ...current]);
      setForm({ rating: 5, comment: '' });
      setStatus('Review submitted.');
    } catch (err) {
      setStatus(err.message);
    }
  };

  return (
    <section className="panel-stack">
      <div className="section-head">
        <div>
          <span className="eyebrow">Community feedback</span>
          <h2>Ratings and comments</h2>
        </div>
        <p>Customers can share feedback while the public can read every review.</p>
      </div>

      {user ? (
        <form className="panel inline-form" onSubmit={handleSubmit}>
          <label>
            Rating
            <input type="number" min="1" max="5" value={form.rating} onChange={(event) => setForm((current) => ({ ...current, rating: Number(event.target.value) }))} />
          </label>
          <label className="grow">
            Comment
            <input value={form.comment} onChange={(event) => setForm((current) => ({ ...current, comment: event.target.value }))} placeholder="How was your experience?" />
          </label>
          <button className="primary-button" type="submit">Post review</button>
        </form>
      ) : (
        <div className="status">Log in to submit a review.</div>
      )}

      {status && <div className="status">{status}</div>}
      <div className="grid-cards">
        {reviews.map((review) => (
          <article className="panel review-card" key={review._id}>
            <strong>{review.userId?.name || 'Anonymous'}</strong>
            <span>{'★'.repeat(review.rating || 0)}</span>
            <p>{review.comment}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
