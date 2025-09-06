import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import axios from 'axios';

const TimetableView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [timetable, setTimetable] = useState(null);
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showConflicts, setShowConflicts] = useState(false);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const timeSlots = [
    '09:00-10:00', '10:00-11:00', '11:00-12:00', '12:00-13:00',
    '14:00-15:00', '15:00-16:00', '16:00-17:00'
  ];

  useEffect(() => {
    fetchTimetable();
    fetchConflicts();
  }, [id]);

  const fetchTimetable = async () => {
    try {
      const response = await axios.get(`/api/timetable/${id}`);
      setTimetable(response.data);
    } catch (error) {
      toast.error('Failed to fetch timetable');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchConflicts = async () => {
    try {
      const response = await axios.get(`/api/timetable/${id}/conflicts`);
      setConflicts(response.data.conflicts || []);
    } catch (error) {
      console.error('Error fetching conflicts:', error);
    }
  };

  const updateTimetableStatus = async (status) => {
    try {
      await axios.put(`/api/timetable/${id}/status`, { status });
      toast.success(`Timetable ${status} successfully!`);
      fetchTimetable();
    } catch (error) {
      toast.error(`Failed to ${status} timetable`);
    }
  };

  const getSlotForTimeAndDay = (dayIndex, timeSlot) => {
    if (!timetable?.slots) return null;
    
    const [startTime] = timeSlot.split('-');
    return timetable.slots.find(slot => 
      slot.day_of_week === dayIndex && slot.start_time === startTime + ':00'
    );
  };

  const getStatusBadgeClass = (status) => {
    const baseClass = 'status-badge';
    switch (status) {
      case 'approved': return `${baseClass} status-approved`;
      case 'pending': return `${baseClass} status-pending`;
      case 'rejected': return `${baseClass} status-rejected`;
      default: return `${baseClass} status-draft`;
    }
  };

  const exportTimetable = () => {
    // Create a simple CSV export
    let csv = 'Time,Monday,Tuesday,Wednesday,Thursday,Friday\n';
    
    timeSlots.forEach(timeSlot => {
      let row = timeSlot;
      days.forEach((day, dayIndex) => {
        const slot = getSlotForTimeAndDay(dayIndex, timeSlot);
        const cellContent = slot 
          ? `${slot.subject_name} (${slot.faculty_name} - ${slot.classroom_name})`
          : '';
        row += ',' + cellContent;
      });
      csv += row + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${timetable.name}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!timetable) {
    return (
      <div className="container">
        <div className="alert alert-error">
          Timetable not found
        </div>
      </div>
    );
  }

  return (
    <div className="timetable-view">
      <div className="container">
        <div className="timetable-header">
          <div className="header-content">
            <div className="header-info">
              <h1>{timetable.name}</h1>
              <div className="timetable-meta">
                <span>{timetable.department_name}</span>
                <span>•</span>
                <span>Semester {timetable.semester}</span>
                <span>•</span>
                <span>{timetable.academic_year}</span>
              </div>
              <div className="timetable-status">
                <span className={getStatusBadgeClass(timetable.status)}>
                  {timetable.status}
                </span>
                {conflicts.length > 0 && (
                  <span className="conflict-badge">
                    {conflicts.length} conflicts
                  </span>
                )}
              </div>
            </div>
            
            <div className="header-actions">
              <button
                className="btn btn-outline"
                onClick={() => setShowConflicts(!showConflicts)}
              >
                {showConflicts ? 'Hide' : 'Show'} Conflicts
              </button>
              <button
                className="btn btn-outline"
                onClick={exportTimetable}
              >
                Export CSV
              </button>
              
              {user?.role === 'admin' && timetable.status === 'pending' && (
                <>
                  <button
                    className="btn btn-success"
                    onClick={() => updateTimetableStatus('approved')}
                  >
                    Approve
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => updateTimetableStatus('rejected')}
                  >
                    Reject
                  </button>
                </>
              )}
              
              {timetable.status === 'draft' && (
                <button
                  className="btn btn-primary"
                  onClick={() => updateTimetableStatus('pending')}
                >
                  Submit for Review
                </button>
              )}
            </div>
          </div>
        </div>

        {showConflicts && conflicts.length > 0 && (
          <div className="conflicts-section">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Conflicts Detected</h3>
              </div>
              <div className="conflicts-list">
                {conflicts.map((conflict, index) => (
                  <div key={index} className="conflict-item">
                    <div className="conflict-type">
                      {conflict.type.replace('_', ' ').toUpperCase()}
                    </div>
                    <div className="conflict-details">
                      <strong>
                        {conflict.faculty_name || conflict.classroom_name || conflict.batch_name}
                      </strong>
                      <span>
                        {days[conflict.day_of_week]} at {conflict.start_time}-{conflict.end_time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="timetable-grid-container">
          <div className="timetable-grid">
            {/* Header row */}
            <div className="timetable-header-cell">Time</div>
            {days.map(day => (
              <div key={day} className="timetable-header-cell">
                {day}
              </div>
            ))}

            {/* Time slots and schedule */}
            {timeSlots.map(timeSlot => (
              <React.Fragment key={timeSlot}>
                <div className="timetable-time-cell">
                  {timeSlot}
                </div>
                {days.map((day, dayIndex) => {
                  const slot = getSlotForTimeAndDay(dayIndex, timeSlot);
                  return (
                    <div
                      key={`${day}-${timeSlot}`}
                      className={`timetable-slot ${slot ? 'occupied' : 'empty'}`}
                    >
                      {slot && (
                        <div className="slot-content">
                          <div className="slot-subject">{slot.subject_name}</div>
                          <div className="slot-faculty">{slot.faculty_name}</div>
                          <div className="slot-room">{slot.classroom_name}</div>
                          <div className="slot-batch">{slot.batch_name}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="timetable-info">
          <div className="info-grid">
            <div className="info-card">
              <h4>Created By</h4>
              <p>{timetable.created_by_name}</p>
              <small>{new Date(timetable.created_at).toLocaleString()}</small>
            </div>
            
            {timetable.approved_by_name && (
              <div className="info-card">
                <h4>Approved By</h4>
                <p>{timetable.approved_by_name}</p>
                <small>{new Date(timetable.approved_at).toLocaleString()}</small>
              </div>
            )}
            
            <div className="info-card">
              <h4>Statistics</h4>
              <p>{timetable.slots?.length || 0} total classes</p>
              <p>{new Set(timetable.slots?.map(s => s.faculty_id)).size} faculty members</p>
              <p>{new Set(timetable.slots?.map(s => s.classroom_id)).size} classrooms used</p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .timetable-view {
          padding: 2rem 0;
        }

        .timetable-header {
          margin-bottom: 2rem;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 2rem;
        }

        .header-info h1 {
          font-size: 2rem;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 0.5rem;
        }

        .timetable-meta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #6b7280;
          margin-bottom: 1rem;
        }

        .timetable-status {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .conflict-badge {
          background-color: #fef3c7;
          color: #92400e;
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .header-actions {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .conflicts-section {
          margin-bottom: 2rem;
        }

        .conflicts-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .conflict-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background-color: #fef2f2;
          border-left: 4px solid #ef4444;
          border-radius: 0.5rem;
        }

        .conflict-type {
          background-color: #ef4444;
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          font-weight: 600;
          white-space: nowrap;
        }

        .conflict-details {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .conflict-details strong {
          color: #1f2937;
        }

        .conflict-details span {
          color: #6b7280;
          font-size: 0.875rem;
        }

        .timetable-grid-container {
          background: white;
          border-radius: 0.75rem;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
          overflow: hidden;
          margin-bottom: 2rem;
        }

        .timetable-grid {
          display: grid;
          grid-template-columns: 120px repeat(5, 1fr);
          border: 1px solid #e5e7eb;
        }

        .timetable-header-cell {
          background-color: #f9fafb;
          padding: 1rem;
          font-weight: 600;
          text-align: center;
          border-right: 1px solid #e5e7eb;
          border-bottom: 1px solid #e5e7eb;
        }

        .timetable-time-cell {
          background-color: #f9fafb;
          padding: 1rem;
          font-weight: 500;
          text-align: center;
          border-right: 1px solid #e5e7eb;
          border-bottom: 1px solid #e5e7eb;
          font-size: 0.875rem;
        }

        .timetable-slot {
          padding: 0.75rem;
          min-height: 80px;
          border-right: 1px solid #e5e7eb;
          border-bottom: 1px solid #e5e7eb;
          position: relative;
        }

        .timetable-slot.empty {
          background-color: #fafafa;
        }

        .timetable-slot.occupied {
          background-color: #eff6ff;
          border-left: 4px solid #3b82f6;
        }

        .slot-content {
          font-size: 0.75rem;
          line-height: 1.3;
        }

        .slot-subject {
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 0.25rem;
        }

        .slot-faculty {
          color: #6b7280;
          margin-bottom: 0.25rem;
        }

        .slot-room {
          color: #9ca3af;
          margin-bottom: 0.25rem;
        }

        .slot-batch {
          color: #9ca3af;
          font-size: 0.6875rem;
        }

        .timetable-info {
          margin-top: 2rem;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
        }

        .info-card {
          background: white;
          border-radius: 0.75rem;
          padding: 1.5rem;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        }

        .info-card h4 {
          font-size: 1rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 0.5rem;
        }

        .info-card p {
          color: #374151;
          margin-bottom: 0.25rem;
        }

        .info-card small {
          color: #6b7280;
          font-size: 0.875rem;
        }

        @media (max-width: 768px) {
          .header-content {
            flex-direction: column;
            align-items: stretch;
          }
          
          .header-actions {
            justify-content: stretch;
          }
          
          .header-actions .btn {
            flex: 1;
          }
          
          .timetable-grid {
            grid-template-columns: 80px repeat(5, 1fr);
            font-size: 0.75rem;
          }
          
          .timetable-header-cell,
          .timetable-time-cell {
            padding: 0.5rem;
          }
          
          .timetable-slot {
            padding: 0.5rem;
            min-height: 60px;
          }
          
          .slot-content {
            font-size: 0.625rem;
          }
        }

        @media (max-width: 480px) {
          .timetable-grid {
            grid-template-columns: 60px repeat(5, 1fr);
          }
          
          .slot-batch {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default TimetableView;
