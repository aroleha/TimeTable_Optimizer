import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { toast } from 'react-toastify';

const DataManagement = () => {
  const {
    departments,
    classrooms,
    faculty,
    subjects,
    batches,
    createDepartment,
    createClassroom,
    createFaculty,
    createSubject,
    createBatch,
    fetchSubjects,
    fetchBatches
  } = useData();

  const [activeTab, setActiveTab] = useState('departments');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);

  const tabs = [
    { id: 'departments', label: 'Departments', icon: '🏢' },
    { id: 'classrooms', label: 'Classrooms', icon: '🏫' },
    { id: 'faculty', label: 'Faculty', icon: '👨‍🏫' },
    { id: 'subjects', label: 'Subjects', icon: '📚' },
    { id: 'batches', label: 'Student Batches', icon: '👥' }
  ];

  const openModal = (type) => {
    setModalType(type);
    setFormData({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalType('');
    setFormData({});
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    let result;
    switch (modalType) {
      case 'department':
        result = await createDepartment(formData);
        break;
      case 'classroom':
        result = await createClassroom(formData);
        break;
      case 'faculty':
        result = await createFaculty(formData);
        break;
      case 'subject':
        result = await createSubject(formData);
        break;
      case 'batch':
        result = await createBatch(formData);
        break;
      default:
        result = { success: false, message: 'Invalid form type' };
    }

    if (result.success) {
      toast.success(`${modalType} created successfully!`);
      closeModal();
    } else {
      toast.error(result.message);
    }

    setLoading(false);
  };

  const renderDepartments = () => (
    <div className="data-section">
      <div className="section-header">
        <h2>Departments</h2>
        <button 
          className="btn btn-primary"
          onClick={() => openModal('department')}
        >
          Add Department
        </button>
      </div>
      
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Code</th>
              <th>Head</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {departments.map(dept => (
              <tr key={dept.id}>
                <td>{dept.name}</td>
                <td>{dept.code}</td>
                <td>{dept.head_name || 'Not assigned'}</td>
                <td>{new Date(dept.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderClassrooms = () => (
    <div className="data-section">
      <div className="section-header">
        <h2>Classrooms</h2>
        <button 
          className="btn btn-primary"
          onClick={() => openModal('classroom')}
        >
          Add Classroom
        </button>
      </div>
      
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Capacity</th>
              <th>Type</th>
              <th>Department</th>
              <th>Equipment</th>
            </tr>
          </thead>
          <tbody>
            {classrooms.map(room => (
              <tr key={room.id}>
                <td>{room.name}</td>
                <td>{room.capacity}</td>
                <td>{room.type}</td>
                <td>{room.department_name || 'Shared'}</td>
                <td>{room.equipment || 'Basic'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderFaculty = () => (
    <div className="data-section">
      <div className="section-header">
        <h2>Faculty</h2>
        <button 
          className="btn btn-primary"
          onClick={() => openModal('faculty')}
        >
          Add Faculty
        </button>
      </div>
      
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Employee ID</th>
              <th>Email</th>
              <th>Department</th>
              <th>Max Hours/Day</th>
              <th>Max Hours/Week</th>
            </tr>
          </thead>
          <tbody>
            {faculty.map(f => (
              <tr key={f.id}>
                <td>{f.name}</td>
                <td>{f.employee_id}</td>
                <td>{f.email}</td>
                <td>{f.department_name}</td>
                <td>{f.max_hours_per_day}</td>
                <td>{f.max_hours_per_week}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSubjects = () => (
    <div className="data-section">
      <div className="section-header">
        <h2>Subjects</h2>
        <button 
          className="btn btn-primary"
          onClick={() => openModal('subject')}
        >
          Add Subject
        </button>
      </div>
      
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Code</th>
              <th>Department</th>
              <th>Semester</th>
              <th>Credits</th>
              <th>Hours/Week</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map(subject => (
              <tr key={subject.id}>
                <td>{subject.name}</td>
                <td>{subject.code}</td>
                <td>{subject.department_name}</td>
                <td>{subject.semester}</td>
                <td>{subject.credits}</td>
                <td>{subject.hours_per_week}</td>
                <td>{subject.type}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderBatches = () => (
    <div className="data-section">
      <div className="section-header">
        <h2>Student Batches</h2>
        <button 
          className="btn btn-primary"
          onClick={() => openModal('batch')}
        >
          Add Batch
        </button>
      </div>
      
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Department</th>
              <th>Semester</th>
              <th>Student Count</th>
              <th>Academic Year</th>
              <th>Shift</th>
            </tr>
          </thead>
          <tbody>
            {batches.map(batch => (
              <tr key={batch.id}>
                <td>{batch.name}</td>
                <td>{batch.department_name}</td>
                <td>{batch.semester}</td>
                <td>{batch.student_count}</td>
                <td>{batch.academic_year}</td>
                <td>{batch.shift}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderModal = () => {
    if (!showModal) return null;

    const renderForm = () => {
      switch (modalType) {
        case 'department':
          return (
            <>
              <div className="form-group">
                <label className="form-label">Department Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name || ''}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Department Code</label>
                <input
                  type="text"
                  name="code"
                  value={formData.code || ''}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>
            </>
          );

        case 'classroom':
          return (
            <>
              <div className="form-group">
                <label className="form-label">Classroom Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name || ''}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Capacity</label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity || ''}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Type</label>
                <select
                  name="type"
                  value={formData.type || 'classroom'}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  <option value="classroom">Classroom</option>
                  <option value="laboratory">Laboratory</option>
                  <option value="auditorium">Auditorium</option>
                  <option value="seminar_hall">Seminar Hall</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <select
                  name="department_id"
                  value={formData.department_id || ''}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  <option value="">Shared (All Departments)</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Equipment</label>
                <input
                  type="text"
                  name="equipment"
                  value={formData.equipment || ''}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="e.g., Projector, Whiteboard, Lab Equipment"
                />
              </div>
            </>
          );

        case 'faculty':
          return (
            <>
              <div className="form-group">
                <label className="form-label">Faculty Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name || ''}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Employee ID</label>
                <input
                  type="text"
                  name="employee_id"
                  value={formData.employee_id || ''}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email || ''}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <select
                  name="department_id"
                  value={formData.department_id || ''}
                  onChange={handleInputChange}
                  className="form-select"
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">Max Hours per Day</label>
                  <input
                    type="number"
                    name="max_hours_per_day"
                    value={formData.max_hours_per_day || 6}
                    onChange={handleInputChange}
                    className="form-input"
                    min="1"
                    max="12"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Max Hours per Week</label>
                  <input
                    type="number"
                    name="max_hours_per_week"
                    value={formData.max_hours_per_week || 30}
                    onChange={handleInputChange}
                    className="form-input"
                    min="1"
                    max="60"
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Average Leaves per Month</label>
                <input
                  type="number"
                  name="avg_leaves_per_month"
                  value={formData.avg_leaves_per_month || 2}
                  onChange={handleInputChange}
                  className="form-input"
                  min="0"
                  max="10"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Specializations</label>
                <input
                  type="text"
                  name="specializations"
                  value={formData.specializations || ''}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="e.g., Mathematics, Physics, Computer Science"
                />
              </div>
            </>
          );

        case 'subject':
          return (
            <>
              <div className="form-group">
                <label className="form-label">Subject Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name || ''}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Subject Code</label>
                <input
                  type="text"
                  name="code"
                  value={formData.code || ''}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <select
                  name="department_id"
                  value={formData.department_id || ''}
                  onChange={handleInputChange}
                  className="form-select"
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-3">
                <div className="form-group">
                  <label className="form-label">Semester</label>
                  <select
                    name="semester"
                    value={formData.semester || ''}
                    onChange={handleInputChange}
                    className="form-select"
                    required
                  >
                    <option value="">Select Semester</option>
                    {[1,2,3,4,5,6,7,8].map(sem => (
                      <option key={sem} value={sem}>Semester {sem}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Credits</label>
                  <input
                    type="number"
                    name="credits"
                    value={formData.credits || ''}
                    onChange={handleInputChange}
                    className="form-input"
                    min="1"
                    max="10"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Hours per Week</label>
                  <input
                    type="number"
                    name="hours_per_week"
                    value={formData.hours_per_week || ''}
                    onChange={handleInputChange}
                    className="form-input"
                    min="1"
                    max="20"
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Type</label>
                <select
                  name="type"
                  value={formData.type || 'theory'}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  <option value="theory">Theory</option>
                  <option value="practical">Practical</option>
                  <option value="tutorial">Tutorial</option>
                </select>
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="requires_lab"
                    checked={formData.requires_lab || false}
                    onChange={handleInputChange}
                  />
                  Requires Laboratory
                </label>
              </div>
            </>
          );

        case 'batch':
          return (
            <>
              <div className="form-group">
                <label className="form-label">Batch Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name || ''}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <select
                  name="department_id"
                  value={formData.department_id || ''}
                  onChange={handleInputChange}
                  className="form-select"
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">Semester</label>
                  <select
                    name="semester"
                    value={formData.semester || ''}
                    onChange={handleInputChange}
                    className="form-select"
                    required
                  >
                    <option value="">Select Semester</option>
                    {[1,2,3,4,5,6,7,8].map(sem => (
                      <option key={sem} value={sem}>Semester {sem}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Student Count</label>
                  <input
                    type="number"
                    name="student_count"
                    value={formData.student_count || ''}
                    onChange={handleInputChange}
                    className="form-input"
                    min="1"
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Academic Year</label>
                <input
                  type="text"
                  name="academic_year"
                  value={formData.academic_year || ''}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="e.g., 2023-24"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Shift</label>
                <select
                  name="shift"
                  value={formData.shift || 'morning'}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  <option value="morning">Morning</option>
                  <option value="afternoon">Afternoon</option>
                  <option value="evening">Evening</option>
                </select>
              </div>
            </>
          );

        default:
          return null;
      }
    };

    return (
      <div className="modal-overlay" onClick={closeModal}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3 className="modal-title">
              Add {modalType.charAt(0).toUpperCase() + modalType.slice(1)}
            </h3>
            <button className="close-button" onClick={closeModal}>
              ×
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            {renderForm()}
            
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={closeModal}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="data-management">
      <div className="container">
        <div className="page-header">
          <h1>Data Management</h1>
          <p>Manage departments, classrooms, faculty, subjects, and student batches</p>
        </div>

        <div className="tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="tab-content">
          {activeTab === 'departments' && renderDepartments()}
          {activeTab === 'classrooms' && renderClassrooms()}
          {activeTab === 'faculty' && renderFaculty()}
          {activeTab === 'subjects' && renderSubjects()}
          {activeTab === 'batches' && renderBatches()}
        </div>

        {renderModal()}
      </div>

      <style jsx>{`
        .data-management {
          padding: 2rem 0;
        }

        .page-header {
          margin-bottom: 2rem;
        }

        .page-header h1 {
          font-size: 2rem;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 0.5rem;
        }

        .page-header p {
          color: #6b7280;
          font-size: 1.1rem;
        }

        .tabs {
          display: flex;
          border-bottom: 2px solid #e5e7eb;
          margin-bottom: 2rem;
          overflow-x: auto;
        }

        .tab {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem 1.5rem;
          border: none;
          background: none;
          cursor: pointer;
          font-weight: 500;
          color: #6b7280;
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .tab:hover {
          color: #3b82f6;
          background-color: #f9fafb;
        }

        .tab.active {
          color: #3b82f6;
          border-bottom-color: #3b82f6;
        }

        .tab-icon {
          font-size: 1.2rem;
        }

        .data-section {
          margin-bottom: 2rem;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .section-header h2 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #1f2937;
        }

        .modal-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          margin-top: 2rem;
          padding-top: 1rem;
          border-top: 1px solid #e5e7eb;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }

        .checkbox-label input[type="checkbox"] {
          width: auto;
        }

        @media (max-width: 768px) {
          .section-header {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }
          
          .modal-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default DataManagement;
