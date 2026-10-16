import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { LogOut, CreditCard, LayoutDashboard, Gift, QrCode, Bell } from 'lucide-react';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import './Navbar.css';

export default function Navbar() {
  const { user, member, logout } = useAuth();
  const location  = useLocation();
  const navigate  = useNavigate();

  const isOfficer = member?.role === 'officer' || member?.role === 'admin';
  const isPartner = member?.role === 'partner' || isOfficer;

  const [pendingTicketCount, setPendingTicketCount] = useState(0);

  // Real-time pending ticket counter for Officers and Admins
  useEffect(() => {
    if (!user || !isOfficer) {
      setPendingTicketCount(0);
      return;
    }
    const q = query(collection(db, 'tickets'), where('status', '==', 'pending'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setPendingTicketCount(snap.size);
      },
      (err) => {
        console.error('Failed to subscribe to pending tickets:', err);
      }
    );
    return () => unsub();
  }, [user, isOfficer]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <div className="container navbar-inner">
        {/* Brand - navigates to landing/home page */}
        <Link to="/" className="navbar-brand" id="nav-brand" title="Supreme Student Council - Alangilan">
          <img src="/ssc-seal.jpg" alt="SSC-AL Official Seal" className="navbar-logo" />
          <div className="navbar-brand-copy">
            <span className="navbar-title">SSC <span className="navbar-title-red">ALANGILAN</span></span>
            <span className="navbar-tagline">BatStateU · The National Engineering University</span>
          </div>
        </Link>

        {/* Navigation links */}
        <div className="navbar-links">
          <Link
            to="/"
            className={`navbar-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            <CreditCard size={15} />
            <span>Home</span>
          </Link>
          <Link
            to="/benefits"
            id="nav-benefits"
            className={`navbar-link ${location.pathname === '/benefits' ? 'active' : ''}`}
          >
            <Gift size={15} />
            <span>Benefits</span>
          </Link>
          {user && (
            <Link
              to="/card"
              id="nav-card"
              className={`navbar-link ${location.pathname === '/card' ? 'active' : ''}`}
            >
              <CreditCard size={16} />
              <span>My Card</span>
            </Link>
          )}
          {isOfficer && (
            <Link
              to="/admin"
              id="nav-admin"
              className={`navbar-link ${location.pathname === '/admin' ? 'active' : ''}`}
            >
              <LayoutDashboard size={16} />
              <span>Dashboard</span>
              {pendingTicketCount > 0 && (
                <span className="navbar-link-badge" aria-label={`${pendingTicketCount} pending tickets`}>
                  {pendingTicketCount}
                </span>
              )}
            </Link>
          )}
          {isPartner && (
            <Link
              to="/verify"
              id="nav-verify"
              className={`navbar-link ${location.pathname === '/verify' ? 'active' : ''}`}
            >
              <QrCode size={16} />
              <span>Scanner</span>
            </Link>
          )}
        </div>

        {/* User info + notification bell + sign out */}
        {user && (
          <div className="navbar-user">
            {isOfficer && (
              <button
                id="btn-navbar-tickets"
                type="button"
                className={`navbar-notif-btn ${pendingTicketCount > 0 ? 'has-unread' : ''}`}
                onClick={() => navigate('/admin?tickets=1')}
                title={
                  pendingTicketCount > 0
                    ? `${pendingTicketCount} pending correction ticket${pendingTicketCount === 1 ? '' : 's'}`
                    : 'View correction tickets'
                }
                aria-label={
                  pendingTicketCount > 0
                    ? `${pendingTicketCount} pending correction tickets`
                    : 'View correction tickets'
                }
              >
                <Bell size={16} />
                {pendingTicketCount > 0 && (
                  <span className="navbar-notif-badge">{pendingTicketCount}</span>
                )}
              </button>
            )}
            <span className="navbar-user-name">{user.displayName?.split(' ')[0]}</span>
            <button
              id="btn-logout"
              className="btn btn-ghost btn-sm navbar-logout"
              onClick={handleLogout}
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut size={16} />
              <span className="navbar-logout-text">Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
