import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api';

export default function ProfilePage() {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', password: '' });
  const [status, setStatus] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const updated = await apiFetch('/api/users/profile', {
        method: 'PUT',
        body: JSON.stringify(form),
      });
      setStatus(`Saved profile for ${updated.name}`);
    } catch (err) {
      setStatus(err.message);
    }
  };

  return (
    <section className="panel-stack">
      <div className="section-head">
        <div>
          <span className="eyebrow">Account</span>
          <h2>Profile</h2>
        </div>
        <p>Update your account details without leaving the SPA.</p>
      </div>

      <form className="panel auth-form" onSubmit={handleSubmit}>
        <label>
          Name
          <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
        </label>
        <label>
          Email
          <input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
        </label>
        <label>
          New password
          <input type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} />
        </label>
        <button className="primary-button" type="submit">Save profile</button>
      </form>

      {status && <div className="status">{status}</div>}
    </section>
  );
}
