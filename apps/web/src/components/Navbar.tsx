import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">westore</Link>

        <nav className="navbar-nav">
          {user ? (
            <>
              {user.role === 'seller' && (
                <Link to="/sell" className="btn-sell">+ Sell</Link>
              )}
              <Link to="/profile" className="navbar-link">
                <div className="avatar">{user.email[0].toUpperCase()}</div>
              </Link>
              <button onClick={handleLogout} className="navbar-link navbar-logout">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="navbar-link">Log in</Link>
              <Link to="/register" className="btn-sell">Register</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
