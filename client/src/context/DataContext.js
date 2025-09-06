import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  const [departments, setDepartments] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [batches, setBatches] = useState([]);
  const [timetables, setTimetables] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch all departments
  const fetchDepartments = async () => {
    try {
      const response = await axios.get('/api/data/departments');
      setDepartments(response.data);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  // Fetch all classrooms
  const fetchClassrooms = async () => {
    try {
      const response = await axios.get('/api/data/classrooms');
      setClassrooms(response.data);
    } catch (error) {
      console.error('Error fetching classrooms:', error);
    }
  };

  // Fetch all faculty
  const fetchFaculty = async () => {
    try {
      const response = await axios.get('/api/data/faculty');
      setFaculty(response.data);
    } catch (error) {
      console.error('Error fetching faculty:', error);
    }
  };

  // Fetch subjects with optional filters
  const fetchSubjects = async (departmentId = null, semester = null) => {
    try {
      const params = {};
      if (departmentId) params.department_id = departmentId;
      if (semester) params.semester = semester;
      
      const response = await axios.get('/api/data/subjects', { params });
      setSubjects(response.data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  // Fetch batches with optional filters
  const fetchBatches = async (departmentId = null, semester = null) => {
    try {
      const params = {};
      if (departmentId) params.department_id = departmentId;
      if (semester) params.semester = semester;
      
      const response = await axios.get('/api/data/batches', { params });
      setBatches(response.data);
    } catch (error) {
      console.error('Error fetching batches:', error);
    }
  };

  // Fetch timetables with optional filters
  const fetchTimetables = async (departmentId = null, status = null) => {
    try {
      const params = {};
      if (departmentId) params.department_id = departmentId;
      if (status) params.status = status;
      
      const response = await axios.get('/api/timetable', { params });
      setTimetables(response.data);
    } catch (error) {
      console.error('Error fetching timetables:', error);
    }
  };

  // Create department
  const createDepartment = async (departmentData) => {
    try {
      const response = await axios.post('/api/data/departments', departmentData);
      await fetchDepartments(); // Refresh list
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create department'
      };
    }
  };

  // Create classroom
  const createClassroom = async (classroomData) => {
    try {
      const response = await axios.post('/api/data/classrooms', classroomData);
      await fetchClassrooms(); // Refresh list
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create classroom'
      };
    }
  };

  // Create faculty
  const createFaculty = async (facultyData) => {
    try {
      const response = await axios.post('/api/data/faculty', facultyData);
      await fetchFaculty(); // Refresh list
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create faculty'
      };
    }
  };

  // Create subject
  const createSubject = async (subjectData) => {
    try {
      const response = await axios.post('/api/data/subjects', subjectData);
      await fetchSubjects(); // Refresh list
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create subject'
      };
    }
  };

  // Create batch
  const createBatch = async (batchData) => {
    try {
      const response = await axios.post('/api/data/batches', batchData);
      await fetchBatches(); // Refresh list
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create batch'
      };
    }
  };

  // Create faculty-subject mapping
  const createFacultySubjectMapping = async (mappingData) => {
    try {
      const response = await axios.post('/api/data/faculty-subjects', mappingData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create mapping'
      };
    }
  };

  // Get faculty subjects
  const getFacultySubjects = async (facultyId) => {
    try {
      const response = await axios.get(`/api/data/faculty-subjects/${facultyId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch faculty subjects'
      };
    }
  };

  // Get optimization parameters
  const getOptimizationParams = async (departmentId) => {
    try {
      const response = await axios.get(`/api/data/optimization-params/${departmentId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch optimization parameters'
      };
    }
  };

  // Save optimization parameters
  const saveOptimizationParams = async (paramsData) => {
    try {
      const response = await axios.post('/api/data/optimization-params', paramsData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to save optimization parameters'
      };
    }
  };

  // Initialize data on mount
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      await Promise.all([
        fetchDepartments(),
        fetchClassrooms(),
        fetchFaculty(),
        fetchSubjects(),
        fetchBatches(),
        fetchTimetables()
      ]);
      setLoading(false);
    };

    initializeData();
  }, []);

  const value = {
    // State
    departments,
    classrooms,
    faculty,
    subjects,
    batches,
    timetables,
    loading,
    
    // Actions
    fetchDepartments,
    fetchClassrooms,
    fetchFaculty,
    fetchSubjects,
    fetchBatches,
    fetchTimetables,
    createDepartment,
    createClassroom,
    createFaculty,
    createSubject,
    createBatch,
    createFacultySubjectMapping,
    getFacultySubjects,
    getOptimizationParams,
    saveOptimizationParams
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};
