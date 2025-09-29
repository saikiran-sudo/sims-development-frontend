// MessageData.jsx - Updated to use real backend API
import axios from 'axios';

// Access API_BASE_URL from environment variables
const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'; // Fallback for development
const API_BASE_URL = `${API_URL}/api/messages`; // Use the base URL for the API endpoint

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = JSON.parse(localStorage.getItem('authToken'));
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Fetches users from the backend based on search query or group
 * @param {string} query The search string (can be an ID or part of a name)
 * @param {string} group Optional group filter (all_students, all_teachers, all_parents, all)
 * @returns {Array} An array of user objects matching the query
 */
export const fetchUsers = async (query = '', group = null) => {
  try {
    const params = {};
    if (query) params.search = query;
    if (group) params.group = group;
    
    const response = await axios.get(`${API_BASE_URL}/users/under-my-admin-for-parent`, {
      headers: getAuthHeaders(),
      params
    });
    
    return response.data.map(user => ({
      id: user._id,
      name: user.full_name,
      type: user.role,
      email: user.email,
      user_id: user.user_id || user._id // Use user_id if available, fallback to _id
    }));
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

/**
 * Fetches a single user by their ID from the backend
 * @param {string} id The user ID to look up
 * @returns {object|null} The user object if found, otherwise null
 */
export const fetchUserById = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/users/under-my-admin-for-parent`, {
      headers: getAuthHeaders(),
      params: { search: id }
    });
    
    const user = response.data.find(u => u._id === id || u.user_id === id);
    if (user) {
      return {
        id: user._id,
        name: user.full_name,
        type: user.role,
        email: user.email,
        user_id: user.user_id || user._id
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    return null;
  }
};

// Group options for quick selection
export const groupOptions = [
  { value: 'all', label: 'All Users (Students, Teachers, Parents)' },
  { value: 'all_students', label: 'All Students' },
  { value: 'all_teachers', label: 'All Teachers' },
  { value: 'all_parents', label: 'All Parents' },
];

export default { fetchUsers, fetchUserById, groupOptions };