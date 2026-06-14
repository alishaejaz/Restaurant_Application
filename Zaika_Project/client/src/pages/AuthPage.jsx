import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const roleOptions = [
  { value: 'user', label: 'Customer' },
  { value: 'owner', label: 'Restaurant Owner' },
  { value: 'rider', label: 'Rider' },
  { value: 'admin', label: 'Admin' },
];

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const demoAccounts = [
    { label: 'Customer', email: 'customer@flavorloop.pk', password: 'Customer123!' },
    { label: 'Owner', email: 'owner@flavorloop.pk', password: 'Owner123!' },
    { label: 'Rider', email: 'rider@flavorloop.pk', password: 'Rider123!' },
    { label: 'Admin', email: 'admin@flavorloop.pk', password: 'Admin123!' },
  ];

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await register(form);
      }
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const useDemoAccount = (account) => {
    setMode('login');
    setForm({ name: '', email: account.email, password: account.password, role: 'user' });
  };

  return (
    <section className="auth-grid">
      <div className="auth-copy panel">
        <span className="eyebrow">Secure access</span>
        <h2>Login and registration for every actor.</h2>
        <p>
          The same authentication layer powers customers, owners, riders, and admins. Role selection during
          registration makes the dashboard switchable without changing the client app.
        </p>
        <div className="demo-login panel-lite">
          <strong>Demo login information</strong>
          <p>Use these accounts to test the system immediately.</p>
          <div className="demo-login-list">
            {demoAccounts.map((account) => (
              <button key={account.label} type="button" className="demo-login-item" onClick={() => useDemoAccount(account)}>
                <span>{account.label}</span>
                <small>{account.email}</small>
              </button>
            ))}
          </div>
        </div>
        <div className="toggle-row">
          <button type="button" className={mode === 'login' ? 'tab-button active' : 'tab-button'} onClick={() => setMode('login')}>Login</button>
          <button type="button" className={mode === 'register' ? 'tab-button active' : 'tab-button'} onClick={() => setMode('register')}>Register</button>
        </div>
      </div>

      <form className="panel auth-form" onSubmit={handleSubmit}>
        {mode === 'register' && (
          <label>
            Full name
            <input name="name" value={form.name} onChange={handleChange} required />
          </label>
        )}
        <label>
          Email
          <input name="email" type="email" value={form.email} onChange={handleChange} required />
        </label>
        <label>
          Password
          <input name="password" type="password" value={form.password} onChange={handleChange} required />
        </label>
        {mode === 'register' && (
          <label>
            Role
            <select name="role" value={form.role} onChange={handleChange}>
              {roleOptions.map((role) => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>
          </label>
        )}
        {error && <div className="status status-error">{error}</div>}
        <button className="primary-button full-width" type="submit" disabled={loading}>
          {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create account'}
        </button>
      </form>
    </section>
  );
}
