import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import './DevLoginSwitcher.css';

const DEV_USERS = [
  { label: 'Seller – Algiers',      email: 'seller@westore.dev' },
  { label: 'Seller 2 – Oran',       email: 'seller2@westore.dev' },
  { label: 'Customer – Algiers',    email: 'customer@westore.dev' },
  { label: 'Customer 2 – Constantine', email: 'customer2@westore.dev' },
];

const PASSWORD = 'Password123!';

export function DevLoginSwitcher() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const loginAs = async (email: string) => {
    setLoading(email);
    try {
      const res = await api.post<{ accessToken: string }>('/auth/login', { email, password: PASSWORD });
      await login(res.accessToken);
      setOpen(false);
      navigate('/');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="dev-switcher">
      <button className="dev-toggle" onClick={() => setOpen(o => !o)} title="Dev login switcher">
        🛠
      </button>

      {open && (
        <div className="dev-panel">
          <p className="dev-panel-title">Login as</p>
          {DEV_USERS.map(u => (
            <button
              key={u.email}
              className="dev-user-btn"
              onClick={() => loginAs(u.email)}
              disabled={loading === u.email}
            >
              <span className="dev-user-label">{u.label}</span>
              <span className="dev-user-email">{u.email}</span>
              {loading === u.email && <span className="dev-spinner">⟳</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
