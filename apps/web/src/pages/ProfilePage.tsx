import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { Country, City } from '../api/types';
import { useAuth } from '../context/AuthContext';
import './ProfilePage.css';

export function ProfilePage() {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();

  // Profile form
  const [email, setEmail] = useState(user?.email ?? '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Delivery cities (seller only)
  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<number | ''>('');
  const [deliveryIds, setDeliveryIds] = useState<number[]>([]);
  const [deliverySaving, setDeliverySaving] = useState(false);
  const [deliveryMsg, setDeliveryMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    setEmail(user?.email ?? '');
  }, [user]);

  useEffect(() => {
    if (user?.role === 'seller') {
      api.get<Country[]>('/locations/countries').then(setCountries);
      api.get<City[]>('/users/me/delivery-cities').then(c => {
        setDeliveryIds(c.map(x => x.id));
      });
      api.get<City>(`/locations/cities/${user.cityId}`).then(city => {
        if (city.countryId) setSelectedCountry(city.countryId);
      });
    }
  }, [user]);

  useEffect(() => {
    if (selectedCountry) {
      api.get<City[]>(`/locations/countries/${selectedCountry}/cities`).then(setCities);
    } else {
      setCities([]);
    }
  }, [selectedCountry]);

  const handleProfileSave = async (e: FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      await api.patch('/users/me', { email });
      await refreshUser();
      setProfileMsg({ ok: true, text: 'Profile updated' });
    } catch (err: any) {
      setProfileMsg({ ok: false, text: err.data?.message ?? 'Update failed' });
    } finally {
      setProfileSaving(false);
    }
  };

  const toggleCity = (id: number) => {
    setDeliveryIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleDeliverySave = async () => {
    if (deliveryIds.length === 0) return setDeliveryMsg({ ok: false, text: 'Select at least one city' });
    setDeliverySaving(true);
    setDeliveryMsg(null);
    try {
      await api.put('/users/me/delivery-cities', { cityIds: deliveryIds });
      setDeliveryMsg({ ok: true, text: 'Delivery region saved' });
    } catch (err: any) {
      setDeliveryMsg({ ok: false, text: err.data?.message ?? 'Failed to save' });
    } finally {
      setDeliverySaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <main className="profile-page">
      <h1 className="profile-heading">Account</h1>

      <div className="profile-section">
        <div className="avatar-row">
          <div className="profile-avatar">{user.email[0].toUpperCase()}</div>
          <div>
            <p className="profile-email">{user.email}</p>
            <span className={`role-badge role-badge--${user.role}`}>{user.role}</span>
          </div>
        </div>
      </div>

      {/* Profile form */}
      <div className="profile-card">
        <h2 className="card-title">Personal info</h2>
        <form onSubmit={handleProfileSave} className="profile-form">
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          {profileMsg && (
            <p className={`form-msg ${profileMsg.ok ? 'form-msg--ok' : 'form-msg--err'}`}>
              {profileMsg.text}
            </p>
          )}
          <button type="submit" className="btn-save" disabled={profileSaving}>
            {profileSaving ? 'Saving…' : 'Save'}
          </button>
        </form>
      </div>

      {/* Seller: delivery cities */}
      {user.role === 'seller' && (
        <div className="profile-card">
          <h2 className="card-title">Delivery region</h2>
          <p className="card-sub">Choose the cities you deliver to. Customers in these cities will see your listings.</p>

          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label">Filter by country</label>
            <select
              className="form-input"
              value={selectedCountry}
              onChange={e => setSelectedCountry(Number(e.target.value))}
            >
              <option value="">All countries</option>
              {countries.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {cities.length > 0 && (
            <div className="city-checklist">
              {cities.map(city => (
                <label key={city.id} className="city-check-item">
                  <input
                    type="checkbox"
                    checked={deliveryIds.includes(city.id)}
                    onChange={() => toggleCity(city.id)}
                    className="city-checkbox"
                  />
                  <span>{city.name}</span>
                </label>
              ))}
            </div>
          )}

          {deliveryIds.length > 0 && (
            <div className="selected-cities">
              <p className="selected-label">Selected ({deliveryIds.length})</p>
            </div>
          )}

          {deliveryMsg && (
            <p className={`form-msg ${deliveryMsg.ok ? 'form-msg--ok' : 'form-msg--err'}`}>
              {deliveryMsg.text}
            </p>
          )}

          <button
            type="button"
            className="btn-save"
            onClick={handleDeliverySave}
            disabled={deliverySaving || deliveryIds.length === 0}
          >
            {deliverySaving ? 'Saving…' : 'Save delivery region'}
          </button>
        </div>
      )}

      <div className="profile-card">
        <button onClick={handleLogout} className="btn-logout">Log out</button>
      </div>
    </main>
  );
}
