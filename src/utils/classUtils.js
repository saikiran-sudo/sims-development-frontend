import axios from 'axios';

// Access API_BASE_URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

/**
 * Fetch all classes under the current teacher's admin
 * @returns {Promise<Array>} Array of class objects
 */
export const fetchClassesUnderMyAdmin = async () => {
  try {
    const token = JSON.parse(localStorage.getItem('authToken'));
    const response = await axios.get(`${API_BASE_URL}/api/classes/under-my-admin`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching classes:', error);
    throw error;
  }
};

/**
 * Fetch predefined sections for different grades
 * @returns {Promise<Object>} Object with grade-wise sections
 */
export const fetchPredefinedSections = async () => {
  try {
    const token = JSON.parse(localStorage.getItem('authToken'));
    const response = await axios.get(`${API_BASE_URL}/api/classes/sections`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching predefined sections:', error);
    throw error;
  }
};

/**
 * Get all unique sections from class data
 * @param {Array} classes - Array of class objects
 * @returns {Array} Array of unique section strings
 */
export const extractSectionsFromClasses = (classes) => {
  const sections = new Set();
  classes.forEach(cls => {
    if (cls.section) {
      sections.add(cls.section);
    }
  });
  return Array.from(sections);
};

/**
 * Get sections for a specific class
 * @param {Array} classes - Array of class objects
 * @param {string} className - Name of the class
 * @returns {Array} Array of section strings for the specified class
 */
export const getSectionsForClass = (classes, className) => {
  return classes
    .filter(cls => cls.class_name === className)
    .map(cls => cls.section)
    .filter(Boolean);
};

/**
 * Convert sections array to select options format
 * @param {Array} sections - Array of section strings
 * @returns {Array} Array of option objects with value and label
 */
export const sectionsToOptions = (sections) => {
  return sections.map(section => ({
    value: section,
    label: `${section}`
  }));
};

/**
 * Fetch comprehensive section data combining class data and predefined sections
 * @returns {Promise<Array>} Array of section option objects
 */
export const fetchAllSections = async () => {
  try {
    // Fetch both classes and predefined sections
    const [classes, predefinedSections] = await Promise.all([
      fetchClassesUnderMyAdmin(),
      fetchPredefinedSections()
    ]);

    // Extract sections from actual class data
    const sectionsFromClasses = extractSectionsFromClasses(classes);

    // Combine sections from classes and predefined sections
    const allSections = new Set(sectionsFromClasses);
    
    // Add predefined sections
    Object.values(predefinedSections).forEach(sectionArray => {
      sectionArray.forEach(section => {
        allSections.add(section);
      });
    });

    return sectionsToOptions(Array.from(allSections));
  } catch (error) {
    console.error('Error fetching all sections:', error);
    throw error;
  }
};

/**
 * Fetch sections for a specific class
 * @param {string} className - Name of the class
 * @returns {Promise<Array>} Array of section option objects for the specified class
 */
export const fetchSectionsForClass = async (className) => {
  try {
    const classes = await fetchClassesUnderMyAdmin();
    const classSections = getSectionsForClass(classes, className);
    return sectionsToOptions(classSections);
  } catch (error) {
    console.error('Error fetching sections for class:', error);
    throw error;
  }
};

/**
 * Fetch class details with sections for a specific class
 * @param {string} className - Name of the class
 * @returns {Promise<Object>} Object containing class details and sections
 */
export const fetchClassDetailsWithSections = async (className) => {
  try {
    const classes = await fetchClassesUnderMyAdmin();
    const classDetails = classes.filter(cls => cls.class_name === className);
    const sections = getSectionsForClass(classes, className);
    
    return {
      classDetails,
      sections: sectionsToOptions(sections),
      totalSections: sections.length
    };
  } catch (error) {
    console.error('Error fetching class details with sections:', error);
    throw error;
  }
};

/**
 * Get class options with section count
 * @returns {Promise<Array>} Array of class option objects with section count
 */
export const fetchClassOptionsWithSectionCount = async () => {
  try {
    const classes = await fetchClassesUnderMyAdmin();
    
    // Group classes by name and count sections
    const classGroups = classes.reduce((acc, cls) => {
      if (!acc[cls.class_name]) {
        acc[cls.class_name] = {
          id: cls._id,
          name: cls.class_name,
          sections: new Set()
        };
      }
      if (cls.section) {
        acc[cls.class_name].sections.add(cls.section);
      }
      return acc;
    }, {});
    
    // Convert to options format
    return Object.values(classGroups).map(cls => ({
      value: cls.id,
      label: `${cls.name} (${cls.sections.size} sections)`
    }));
  } catch (error) {
    console.error('Error fetching class options with section count:', error);
    throw error;
  }
};
