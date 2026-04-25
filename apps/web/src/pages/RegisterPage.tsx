import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { Country, City } from '../api/types';
import './AuthPage.css';

export function RegisterPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'customer' | 'seller'>('customer');
  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [countryId, setCountryId] = useState<number | ''>('');
  const [cityId, setCityId] = useState<number | ''>('');
  const [error, setError] = useState<string | string[]>('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get<Country[]>('/locations/countries').then(setCountries);
  }, []);

  useEffect(() => {
    if (countryId) {
      setCityId('');
      api.get<City[]>(`/locations/countries/${countryId}/cities`).then(setCities);
    } else {
      setCities([]);
    }
  }, [countryId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!cityId) return setError('Please select a city');
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/register', { email, password, role, cityId: Number(cityId) });
      setSuccess(true);
    } catch (err: any) {
      const msg = err.data?.message;
      setError(Array.isArray(msg) ? msg : msg ?? 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-card auth-card--success">
          <div className="success-icon">✉️</div>
          <h2>Check your inbox</h2>
          <p>We sent a verification link to <strong>{email}</strong>. Click it to activate your account.</p>
          <button className="btn-primary" onClick={() => navigate('/login')}>Go to login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">westore</div>
        <h1 className="auth-title">Create account</h1>
        <p className="auth-sub">Buy and sell in your city</p>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="auth-error">
              {Array.isArray(error) ? error.map((m, i) => <div key={i}>{m}</div>) : error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">I want to…</label>
            <div className="role-toggle">
              <button
                type="button"
                className={`role-btn ${role === 'customer' ? 'role-btn--active' : ''}`}
                onClick={() => setRole('customer')}
              >
                Buy
              </button>
              <button
                type="button"
                className={`role-btn ${role === 'seller' ? 'role-btn--active' : ''}`}
                onClick={() => setRole('seller')}
              >
                Sell
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
              autoComplete="new-password"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Country</label>
              <select
                className="form-input"
                value={countryId}
                onChange={e => setCountryId(Number(e.target.value))}
                required
              >
                <option value="">Select country</option>
                {countries.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">City</label>
              <select
                className="form-input"
                value={cityId}
                onChange={e => setCityId(Number(e.target.value))}
                disabled={!countryId}
                required
              >
                <option value="">Select city</option>
                {cities.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{' '}
          <Link to="/login" className="auth-link">Log in</Link>
        </p>
      </div>
    </div>
  );
}
