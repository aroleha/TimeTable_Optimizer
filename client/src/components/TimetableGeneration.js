import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { toast } from 'react-toastify';
import axios from 'axios';

const TimetableGeneration = () => {
  const { departments, fetchSubjects, fetchBatches } = useData();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    department_id: '',
    semester: '',
    academic_year: '',
    optimization_options: {}
  });
  const [timetableOptions, setTimetableOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [loading, setLoading] = useState(false);
  const [optimizationParams, setOptimizationParams] = useState({
    max_classes_per_day: 6,
    min_break_duration: 15,
    start_time: '09:00',
    end_time: '17:00',
    lunch_break_start: '13:00',
    lunch_break_end: '14:00',
    working_days: 5
  });

  useEffect(() => {
    if (formData.department_id) {
      fetchOptimizationParams();
    }
  }, [formData.department_id]);

  const fetchOptimizationParams = async () => {
    try {
      const response = await axios.get(`/api/data/optimization-params/${formData.department_id}`);
      setOptimizationParams(response.data);
    } catch (error) {
      console.error('Error fetching optimization parameters:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleParamChange = (e) => {
    const { name, value } = e.target;
    setOptimizationParams(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const saveOptimizationParams = async () => {
    try {
      await axios.post('/api/data/optimization-params', {
        ...optimizationParams,
        department_id: formData.department_id
      });
      toast.success('Optimization parameters saved!');
    } catch (error) {
      toast.error('Failed to save optimization parameters');
    }
  };

  const generateTimetableOptions = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/api/timetable/generate-options', {
        department_id: formData.department_id,
        semester: parseInt(formData.semester),
        academic_year: formData.academic_year,
        num_options: 3,
        optimization_options: optimizationParams
      });

      setTimetableOptions(response.data.options);
      setStep(3);
      toast.success(`Generated ${response.data.options.length} timetable options!`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate timetable options');
    }
    setLoading(false);
  };

  const saveTimetable = async () => {
    if (!selectedOption) {
      toast.error('Please select a timetable option');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/timetable/save-option', {
        name: formData.name,
        department_id: formData.department_id,
        semester: parseInt(formData.semester),
        academic_year: formData.academic_year,
        selected_option: selectedOption
      });

      toast.success('Timetable saved successfully!');
      // Reset form
      setStep(1);
      setFormData({
        name: '',
        department_id: '',
        semester: '',
        academic_year: '',
        optimization_options: {}
      });
      setTimetableOptions([]);
      setSelectedOption(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save timetable');
    }
    setLoading(false);
  };

  const renderStep1 = () => (
    <div className="step-content">
      <h2>Basic Information</h2>
      <p>Provide basic details for your timetable generation</p>

      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">Timetable Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="form-input"
            placeholder="e.g., CSE Semester 3 - Fall 2023"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Department</label>
          <select
            name="department_id"
            value={formData.department_id}
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

        <div className="form-group">
          <label className="form-label">Semester</label>
          <select
            name="semester"
            value={formData.semester}
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
          <label className="form-label">Academic Year</label>
          <input
            type="text"
            name="academic_year"
            value={formData.academic_year}
            onChange={handleInputChange}
            className="form-input"
            placeholder="e.g., 2023-24"
            required
          />
        </div>
      </div>

      <div className="step-actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setStep(2)}
          disabled={!formData.name || !formData.department_id || !formData.semester || !formData.academic_year}
        >
          Next: Optimization Settings
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="step-content">
      <h2>Optimization Parameters</h2>
      <p>Configure scheduling constraints and preferences</p>

      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">Max Classes per Day</label>
          <input
            type="number"
            name="max_classes_per_day"
            value={optimizationParams.max_classes_per_day}
            onChange={handleParamChange}
            className="form-input"
            min="1"
            max="12"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Working Days</label>
          <select
            name="working_days"
            value={optimizationParams.working_days}
            onChange={handleParamChange}
            className="form-select"
          >
            <option value="5">5 Days (Mon-Fri)</option>
            <option value="6">6 Days (Mon-Sat)</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Start Time</label>
          <input
            type="time"
            name="start_time"
            value={optimizationParams.start_time}
            onChange={handleParamChange}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label className="form-label">End Time</label>
          <input
            type="time"
            name="end_time"
            value={optimizationParams.end_time}
            onChange={handleParamChange}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Lunch Break Start</label>
          <input
            type="time"
            name="lunch_break_start"
            value={optimizationParams.lunch_break_start}
            onChange={handleParamChange}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Lunch Break End</label>
          <input
            type="time"
            name="lunch_break_end"
            value={optimizationParams.lunch_break_end}
            onChange={handleParamChange}
            className="form-input"
          />
        </div>
      </div>

      <div className="step-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setStep(1)}
        >
          Back
        </button>
        <button
          type="button"
          className="btn btn-outline"
          onClick={saveOptimizationParams}
        >
          Save Parameters
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={generateTimetableOptions}
          disabled={loading}
        >
          {loading ? 'Generating...' : 'Generate Options'}
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="step-content">
      <h2>Select Timetable Option</h2>
      <p>Choose from the generated optimized timetable options</p>

      <div className="options-grid">
        {timetableOptions.map((option, index) => (
          <div
            key={index}
            className={`option-card ${selectedOption === option ? 'selected' : ''}`}
            onClick={() => setSelectedOption(option)}
          >
            <div className="option-header">
              <h3>Option {option.option}</h3>
              <div className="option-score">
                Score: {option.score}/100
              </div>
            </div>
            
            <div className="option-stats">
              <div className="stat">
                <span className="stat-label">Total Slots:</span>
                <span className="stat-value">{option.slots.length}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Days Used:</span>
                <span className="stat-value">
                  {new Set(option.slots.map(s => s.day_of_week)).size}
                </span>
              </div>
            </div>

            <div className="option-preview">
              <h4>Schedule Preview</h4>
              <div className="preview-grid">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, dayIndex) => (
                  <div key={day} className="preview-day">
                    <div className="day-header">{day}</div>
                    <div className="day-slots">
                      {option.slots
                        .filter(slot => slot.day_of_week === dayIndex)
                        .length} classes
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedOption === option && (
              <div className="selected-indicator">
                ✓ Selected
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="step-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setStep(2)}
        >
          Back
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={saveTimetable}
          disabled={!selectedOption || loading}
        >
          {loading ? 'Saving...' : 'Save Timetable'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="timetable-generation">
      <div className="container">
        <div className="page-header">
          <h1>Generate Timetable</h1>
          <p>Create optimized timetables using AI-powered scheduling</p>
        </div>

        <div className="progress-bar">
          <div className="progress-steps">
            {[1, 2, 3].map(stepNum => (
              <div
                key={stepNum}
                className={`progress-step ${step >= stepNum ? 'active' : ''} ${step > stepNum ? 'completed' : ''}`}
              >
                <div className="step-number">{stepNum}</div>
                <div className="step-label">
                  {stepNum === 1 && 'Basic Info'}
                  {stepNum === 2 && 'Parameters'}
                  {stepNum === 3 && 'Select Option'}
                </div>
              </div>
            ))}
          </div>
          <div className="progress-line">
            <div 
              className="progress-fill"
              style={{ width: `${((step - 1) / 2) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="generation-card">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </div>
      </div>

      <style jsx>{`
        .timetable-generation {
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

        .progress-bar {
          margin-bottom: 2rem;
          position: relative;
        }

        .progress-steps {
          display: flex;
          justify-content: space-between;
          position: relative;
          z-index: 2;
        }

        .progress-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .step-number {
          width: 3rem;
          height: 3rem;
          border-radius: 50%;
          background: #e5e7eb;
          color: #6b7280;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          transition: all 0.3s;
        }

        .progress-step.active .step-number {
          background: #3b82f6;
          color: white;
        }

        .progress-step.completed .step-number {
          background: #10b981;
          color: white;
        }

        .step-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #6b7280;
        }

        .progress-step.active .step-label {
          color: #3b82f6;
        }

        .progress-line {
          position: absolute;
          top: 1.5rem;
          left: 1.5rem;
          right: 1.5rem;
          height: 2px;
          background: #e5e7eb;
          z-index: 1;
        }

        .progress-fill {
          height: 100%;
          background: #3b82f6;
          transition: width 0.3s ease;
        }

        .generation-card {
          background: white;
          border-radius: 0.75rem;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
          padding: 2rem;
        }

        .step-content h2 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 0.5rem;
        }

        .step-content p {
          color: #6b7280;
          margin-bottom: 2rem;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .step-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          padding-top: 2rem;
          border-top: 1px solid #e5e7eb;
        }

        .options-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .option-card {
          border: 2px solid #e5e7eb;
          border-radius: 0.75rem;
          padding: 1.5rem;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
        }

        .option-card:hover {
          border-color: #3b82f6;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
        }

        .option-card.selected {
          border-color: #3b82f6;
          background-color: #eff6ff;
        }

        .option-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .option-header h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
        }

        .option-score {
          background: #f3f4f6;
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
        }

        .option-stats {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .stat {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .stat-label {
          font-size: 0.75rem;
          color: #6b7280;
          text-transform: uppercase;
          font-weight: 500;
        }

        .stat-value {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
        }

        .option-preview h4 {
          font-size: 1rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 0.75rem;
        }

        .preview-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 0.5rem;
        }

        .preview-day {
          text-align: center;
        }

        .day-header {
          font-size: 0.75rem;
          font-weight: 500;
          color: #6b7280;
          margin-bottom: 0.25rem;
        }

        .day-slots {
          font-size: 0.875rem;
          font-weight: 600;
          color: #1f2937;
          background: #f3f4f6;
          padding: 0.25rem;
          border-radius: 0.25rem;
        }

        .selected-indicator {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: #10b981;
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        @media (max-width: 768px) {
          .form-grid {
            grid-template-columns: 1fr;
          }
          
          .options-grid {
            grid-template-columns: 1fr;
          }
          
          .step-actions {
            flex-direction: column;
          }
          
          .progress-steps {
            flex-direction: column;
            gap: 1rem;
          }
          
          .progress-line {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default TimetableGeneration;
