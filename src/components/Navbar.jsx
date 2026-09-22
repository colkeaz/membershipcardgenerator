import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, CreditCard, LayoutDashboard, Menu, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import './Navbar.css';

export default function Navbar() {
  const { user, member, logout } = useAuth();
  const location  = useLocation();
  const navigate  = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const isOfficer = member?.role === 'officer' || member?.role === 'admin';

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (!user) return null;

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <div className="container navbar-inner">
        {/* Brand */}
        <Link to="/card" className="navbar-brand" id="nav-brand">
          <img src="/logo.jpg" alt="SSC-AL" className="navbar-logo" />
          <span className="navbar-title">SSC<span className="navbar-title-accent">-AL</span></span>
        </Link>

        {/* Desktop nav */}
        <div className="navbar-links">
          <Link
            to="/card"
            id="nav-card"
            className={`navbar-link ${location.pathname === '/card' ? 'active' : ''}`}
          >
            <CreditCard size={16} />
            My Card
          </Link>
          {isOfficer && (
            <Link
              to="/admin"
              id="nav-admin"
              className={`navbar-link ${location.pathname === '/admin' ? 'active' : ''}`}
            >
              <LayoutDashboard size={16} />
              Dashboard
            </Link>
          )}
        </div>

        {/* User info + logout */}
        <div className="navbar-user">
          <span className="navbar-user-name">{user.displayName?.split(' ')[0]}</span>
          <button id="btn-logout" className="btn btn-ghost btn-sm navbar-logout" onClick={handleLogout} aria-label="Log out">
            <LogOut size={15} />
          </button>
          <button className="btn btn-ghost btn-icon navbar-hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="navbar-mobile-menu">
          <Link to="/card" className="navbar-mobile-link" onClick={() => setMenuOpen(false)}>
            <CreditCard size={16} /> My Card
          </Link>
          {isOfficer && (
            <Link to="/admin" className="navbar-mobile-link" onClick={() => setMenuOpen(false)}>
              <LayoutDashboard size={16} /> Dashboard
            </Link>
          )}
          <button className="navbar-mobile-link navbar-mobile-logout" onClick={handleLogout}>
            <LogOut size={16} /> Log Out
          </button>
        </div>
      )}
    </nav>
  );
}
