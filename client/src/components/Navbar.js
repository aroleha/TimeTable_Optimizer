import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path ? 'nav-link active' : 'nav-link';
  };

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-content">
          <div className="navbar-brand">
            <Link to="/dashboard" className="brand-link">
              <span className="brand-icon">📅</span>
              <span className="brand-text">Timetable Optimizer</span>
            </Link>
          </div>

          <div className={`navbar-menu ${isMenuOpen ? 'active' : ''}`}>
            <div className="navbar-nav">
              <Link to="/dashboard" className={isActive('/dashboard')}>
                Dashboard
              </Link>
              <Link to="/data-management" className={isActive('/data-management')}>
                Data Management
              </Link>
              <Link to="/timetable-generation" className={isActive('/timetable-generation')}>
                Generate Timetable
              </Link>
              {user?.role === 'admin' && (
                <Link to="/user-management" className={isActive('/user-management')}>
                  User Management
                </Link>
              )}
            </div>

            <div className="navbar-user">
              <div className="user-info">
                <span className="user-name">{user?.username}</span>
                <span className="user-role">{user?.role}</span>
              </div>
              <button onClick={handleLogout} className="btn btn-outline logout-btn">
                Logout
              </button>
            </div>
          </div>

          <button 
            className="mobile-menu-btn"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>

      <style jsx>{`
        .navbar {
          background: white;
          border-bottom: 1px solid #e5e7eb;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .navbar-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 0;
        }

        .navbar-brand {
          display: flex;
          align-items: center;
        }

        .brand-link {
          display: flex;
          align-items: center;
          text-decoration: none;
          color: #1f2937;
          font-weight: 600;
          font-size: 1.25rem;
        }

        .brand-icon {
          font-size: 1.5rem;
          margin-right: 0.5rem;
        }

        .navbar-menu {
          display: flex;
          align-items: center;
          gap: 2rem;
        }

        .navbar-nav {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .nav-link {
          text-decoration: none;
          color: #6b7280;
          font-weight: 500;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          transition: all 0.2s;
        }

        .nav-link:hover {
          color: #3b82f6;
          background-color: #f3f4f6;
        }

        .nav-link.active {
          color: #3b82f6;
          background-color: #eff6ff;
        }

        .navbar-user {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .user-info {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .user-name {
          font-weight: 600;
          color: #1f2937;
        }

        .user-role {
          font-size: 0.75rem;
          color: #6b7280;
          text-transform: capitalize;
        }

        .logout-btn {
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
        }

        .mobile-menu-btn {
          display: none;
          flex-direction: column;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.5rem;
        }

        .mobile-menu-btn span {
          width: 25px;
          height: 3px;
          background-color: #374151;
          margin: 3px 0;
          transition: 0.3s;
        }

        @media (max-width: 768px) {
          .navbar-menu {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: white;
            border-top: 1px solid #e5e7eb;
            flex-direction: column;
            padding: 1rem;
            gap: 1rem;
            transform: translateY(-100%);
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
          }

          .navbar-menu.active {
            transform: translateY(0);
            opacity: 1;
            visibility: visible;
          }

          .navbar-nav {
            flex-direction: column;
            width: 100%;
            gap: 0.5rem;
          }

          .nav-link {
            width: 100%;
            text-align: center;
            padding: 0.75rem;
          }

          .navbar-user {
            width: 100%;
            justify-content: space-between;
            padding-top: 1rem;
            border-top: 1px solid #e5e7eb;
          }

          .mobile-menu-btn {
            display: flex;
          }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
