import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Telescope } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <Telescope size={24} />
        <span>ATLAS</span>
      </Link>
      {user && (
        <div className="navbar-right">
          <span className="navbar-user">{user.full_name}</span>
          <button onClick={handleLogout} className="btn btn-ghost" title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      )}
    </nav>
  );
}
