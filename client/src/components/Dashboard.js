import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

const Dashboard = () => {
  const { user } = useAuth();
  const { departments, timetables, loading } = useData();
  const [stats, setStats] = useState({
    totalTimetables: 0,
    approvedTimetables: 0,
    pendingTimetables: 0,
    totalDepartments: 0
  });
  const [recentTimetables, setRecentTimetables] = useState([]);

  useEffect(() => {
    if (timetables.length > 0) {
      setStats({
        totalTimetables: timetables.length,
        approvedTimetables: timetables.filter(t => t.status === 'approved').length,
        pendingTimetables: timetables.filter(t => t.status === 'pending').length,
        totalDepartments: departments.length
      });
      
      // Get recent timetables (last 5)
      const recent = timetables
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);
      setRecentTimetables(recent);
    }
  }, [timetables, departments]);

  const getStatusBadgeClass = (status) => {
    const baseClass = 'status-badge';
    switch (status) {
      case 'approved': return `${baseClass} status-approved`;
      case 'pending': return `${baseClass} status-pending`;
      case 'rejected': return `${baseClass} status-rejected`;
      default: return `${baseClass} status-draft`;
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1>Welcome back, {user?.username}!</h1>
          <p>Manage your timetables and optimize scheduling for your institution.</p>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h3>{stats.totalTimetables}</h3>
              <p>Total Timetables</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>{stats.approvedTimetables}</h3>
              <p>Approved</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">⏳</div>
            <div className="stat-content">
              <h3>{stats.pendingTimetables}</h3>
              <p>Pending Review</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">🏢</div>
            <div className="stat-content">
              <h3>{stats.totalDepartments}</h3>
              <p>Departments</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="dashboard-section">
          <h2>Quick Actions</h2>
          <div className="action-grid">
            <Link to="/timetable-generation" className="action-card">
              <div className="action-icon">🎯</div>
              <h3>Generate Timetable</h3>
              <p>Create optimized timetables with AI-powered scheduling</p>
            </Link>
            
            <Link to="/data-management" className="action-card">
              <div className="action-icon">📝</div>
              <h3>Manage Data</h3>
              <p>Add and edit departments, faculty, subjects, and classrooms</p>
            </Link>
            
            <div className="action-card">
              <div className="action-icon">📈</div>
              <h3>Analytics</h3>
              <p>View reports and insights about your scheduling efficiency</p>
            </div>
            
            {user?.role === 'admin' && (
              <Link to="/user-management" className="action-card">
                <div className="action-icon">👥</div>
                <h3>User Management</h3>
                <p>Manage user accounts and permissions</p>
              </Link>
            )}
          </div>
        </div>

        {/* Recent Timetables */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Recent Timetables</h2>
            <Link to="/timetable-generation" className="btn btn-primary">
              View All
            </Link>
          </div>
          
          {recentTimetables.length > 0 ? (
            <div className="card">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Department</th>
                    <th>Semester</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTimetables.map(timetable => (
                    <tr key={timetable.id}>
                      <td>{timetable.name}</td>
                      <td>{timetable.department_name}</td>
                      <td>Semester {timetable.semester}</td>
                      <td>
                        <span className={getStatusBadgeClass(timetable.status)}>
                          {timetable.status}
                        </span>
                      </td>
                      <td>
                        {new Date(timetable.created_at).toLocaleDateString()}
                      </td>
                      <td>
                        <Link 
                          to={`/timetable/${timetable.id}`}
                          className="btn btn-outline btn-sm"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📅</div>
              <h3>No timetables yet</h3>
              <p>Get started by creating your first optimized timetable</p>
              <Link to="/timetable-generation" className="btn btn-primary">
                Generate Timetable
              </Link>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .dashboard {
          padding: 2rem 0;
        }

        .dashboard-header {
          margin-bottom: 2rem;
        }

        .dashboard-header h1 {
          font-size: 2rem;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 0.5rem;
        }

        .dashboard-header p {
          color: #6b7280;
          font-size: 1.1rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 3rem;
        }

        .stat-card {
          background: white;
          border-radius: 0.75rem;
          padding: 1.5rem;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .stat-icon {
          font-size: 2rem;
          background: #eff6ff;
          padding: 0.75rem;
          border-radius: 0.5rem;
        }

        .stat-content h3 {
          font-size: 2rem;
          font-weight: 700;
          color: #1f2937;
          margin: 0;
        }

        .stat-content p {
          color: #6b7280;
          margin: 0;
        }

        .dashboard-section {
          margin-bottom: 3rem;
        }

        .dashboard-section h2 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 1.5rem;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .action-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
        }

        .action-card {
          background: white;
          border-radius: 0.75rem;
          padding: 2rem;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
          text-decoration: none;
          color: inherit;
          transition: all 0.2s;
          border: 2px solid transparent;
        }

        .action-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
          border-color: #3b82f6;
        }

        .action-icon {
          font-size: 2.5rem;
          margin-bottom: 1rem;
        }

        .action-card h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 0.5rem;
        }

        .action-card p {
          color: #6b7280;
          line-height: 1.5;
        }

        .empty-state {
          text-align: center;
          padding: 3rem;
          background: white;
          border-radius: 0.75rem;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .empty-state h3 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 0.5rem;
        }

        .empty-state p {
          color: #6b7280;
          margin-bottom: 2rem;
        }

        .btn-sm {
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
        }

        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
          
          .action-grid {
            grid-template-columns: 1fr;
          }
          
          .section-header {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
