import React, { useEffect, useState } from "react";
import { Edit, Trash, Plus, Filter, X, Search } from "lucide-react";
import { FaBullhorn } from "react-icons/fa";
import Select from "react-select";
import AddAnnouncement from "./AddAnnouncement";
import AnnouncementDetails from "./AnnouncementDetails";
import { useAnnouncements } from "./AnnouncementProvider";
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import { studentAPI, teacherAPI, parentAPI } from '../../../services/api';

// Access API_BASE_URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'; // Fallback for development

function AnnouncementsModule() {
  const { user } = useAuth();
  // Use the useAnnouncements hook to get announcements and handlers
  const {
    announcements,
    handleAddAnnouncement, // This is not used here, but kept for consistency if needed later
    handleUpdateAnnouncement, // This is not used here, but kept for consistency if needed later
    handleDeleteAnnouncement,
    setAnnouncements // Assuming you have a setter for announcements in your context
  } = useAnnouncements();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [displayAnnouncement, setDisplayAnnouncement] = useState([]);
  
  // Ensure displayAnnouncement is always an array
  const safeDisplayAnnouncement = Array.isArray(displayAnnouncement) ? displayAnnouncement : [];
  const [filters, setFilters] = useState({
    searchQuery: "",
    status: null,
    target: null,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false); // New state for mobile search
  const [isLoading, setIsLoading] = useState(true); // Loading state
  const [userCounts, setUserCounts] = useState({
    students: 0,
    teachers: 0,
    parents: 0
  });

  // Filter options (no change)
  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "draft", label: "Draft" },
    { value: "expired", label: "Expired" },
  ];

  // Target options with dynamic counts
  const targetOptions = [
    { value: "all", label: "All" },
    { value: "all_students", label: `Students (${userCounts.students})` },
    { value: "all_teachers", label: `Teachers (${userCounts.teachers})` },
    { value: "all_parents", label: `Parents (${userCounts.parents})` },
  ];

  // Filter announcements (now uses announcements from context)
  const filteredAnnouncements = (announcements || []).filter((announcement) => {
    // Safety check for announcement object
    if (!announcement || typeof announcement !== 'object') {
      return false;
    }
    
    if (
      filters.searchQuery &&
      !announcement.title?.toLowerCase().includes(filters.searchQuery.toLowerCase()) &&
      !announcement.content?.toLowerCase().includes(filters.searchQuery.toLowerCase())
    ) {
      return false;
    }
    if (filters.status && announcement.status !== filters.status.value)
      return false;
    // Note: Target filtering is disabled because targets are stored as User IDs, not group names
    // The backend converts group names to user IDs when creating announcements
    // if (filters.target && filters.target.value !== 'all') {
    //   // Target filtering logic would need to be implemented differently
    //   return false;
    // }
    return true;
  });

  // Function to fetch user counts
  const fetchUserCounts = async () => {
    try {
      const [studentsResponse, teachersResponse, parentsResponse] = await Promise.all([
        studentAPI.getStudentCount(),
        teacherAPI.getTeacherCount(),
        parentAPI.getParentCount()
      ]);

      setUserCounts({
        students: studentsResponse.data.count || 0,
        teachers: teachersResponse.data.count || 0,
        parents: parentsResponse.data.count || 0
      });
    } catch (error) {
      console.error('Error fetching user counts:', error);
      // Keep default values (0) on error
    }
  };

  useEffect(() => {
    const fetchAnnouncements = async () => {
      setIsLoading(true);
      try {
        const token = JSON.parse(localStorage.getItem('authToken'));
        const response = await axios.get(`${API_BASE_URL}/api/announcements/`, { // Using API_BASE_URL
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('fetch data ',response.data);
        // Ensure response.data is an array
        const announcementsData = Array.isArray(response.data) ? response.data : [];
        
        // Assuming setAnnouncements is available from the context to update the global state
        if (setAnnouncements) {
          setAnnouncements(announcementsData);
        }
        setDisplayAnnouncement(announcementsData); // Also update local display state
      } catch (error) {
        console.error('Error fetching announcements:', error);
        // Set empty arrays on error to prevent undefined issues
        if (setAnnouncements) {
          setAnnouncements([]);
        }
        setDisplayAnnouncement([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnnouncements();
    fetchUserCounts(); // Fetch user counts when component mounts
  }, [setAnnouncements]); // Add setAnnouncements to dependency array

  // Update displayAnnouncement when announcements or filters change
  useEffect(() => {
    if (filteredAnnouncements && Array.isArray(filteredAnnouncements)) {
      setDisplayAnnouncement(filteredAnnouncements);
    } else {
      setDisplayAnnouncement([]);
    }
  }, [announcements, filters]);


  // Handler functions (no change, but they will now call the context's functions)
  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      searchQuery: "",
      status: null,
      target: null,
    });
  };

  const handleEditClick = (announcement) => {
    setSelectedAnnouncement(announcement);
    setIsEditMode(true);
    setShowDetailsModal(true);
  };

  const handleDeleteClick = async(id) => {
    // Replaced window.confirm with a custom modal/dialog in a real app
    // For this example, we'll keep it as is, but note the instruction to avoid alert/confirm.
    if (window.confirm("Are you sure you want to delete this announcement?")) {
      try {
        const token = JSON.parse(localStorage.getItem('authToken'));
        await axios.delete(`${API_BASE_URL}/api/announcements/${id}`, { // Using API_BASE_URL
          headers: { Authorization: `Bearer ${token}` }
        });
        handleDeleteAnnouncement(id); // Use context handler
      } catch (error) {
        console.error('Error deleting announcement:', error);
      }
    }
  };

  const handleViewDetailsClick = (announcement) => {
    setSelectedAnnouncement(announcement);
    setIsEditMode(false); // View mode, not edit mode
    setShowDetailsModal(true);
  };

  // Calculate active filter count for the badge
  const activeFilterCount = Object.values(filters).filter(
    (f) => f && (typeof f !== "object" || (f && f.value))
  ).length;

  return (
    <div className="px-0 sm:px-2 md:px-4 lg:p-6 flex flex-col gap-2 sm:gap-4 lg:gap-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <FaBullhorn size={32} className="text-indigo-600" />
          Announcements
        </h1>
      </div>
      <div className="flex justify-between mb-4">
        {/* Search Bar (Desktop) */}
        <div className="hidden md:flex items-center gap-2 text-xs rounded-full ring-[1.5px] ring-gray-300 px-3 w-full md:w-[400px]">
          <Search size={16} className="text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Search announcements..."
            className="p-2 bg-transparent outline-none flex-1 min-w-0"
            value={filters.searchQuery}
            onChange={(e) =>
              handleFilterChange("searchQuery", e.target.value)
            }
          />
          {filters.searchQuery && (
            <button
              onClick={() => handleFilterChange("searchQuery", "")}
              className="text-gray-400 hover:text-gray-600 shrink-0"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          {/* Mobile Search Button */}
          <button
            className='md:hidden flex items-center gap-1 px-3 py-2 bg-gray-100 rounded-md text-sm'
            onClick={() => setShowMobileSearch(!showMobileSearch)} // Toggle mobile search visibility
          >
            <Search size={16} />
            Search
          </button>

          {/* Filters Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm ${showFilters || activeFilterCount > 0
                ? "bg-blue-100 text-blue-600"
                : "bg-gray-100"
              }`}
          >
            {showFilters ? <X size={16} /> : <Filter size={16} />}
            <span className="hidden md:inline">Filters</span>{" "}
            {activeFilterCount > 0 && (
              <span className="ml-0 md:ml-1 inline-flex items-center px-1.5 py-0.5 md:px-2.5 md:py-0.5 rounded-full text-xs font-medium bg-blue-500 text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus size={16} className="mr-2" />
            <span>New Announcement</span>{" "}
          </button>
        </div>
      </div>

      {/* Mobile Search Input */}
      {showMobileSearch && (
        <div className='md:hidden flex items-center gap-2 text-xs rounded-full ring-[1.5px] ring-gray-300 px-3 w-full mb-4 animate-fade-in'>
          <Search size={16} className="text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Search announcements..."
            className="p-2 bg-transparent outline-none flex-1 min-w-0"
            value={filters.searchQuery}
            onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
          />
          {filters.searchQuery && (
            <button
              onClick={() => handleFilterChange('searchQuery', '')}
              className="text-gray-400 hover:text-gray-600 shrink-0"
            >
              <X size={16} />
            </button>
          )}
        </div>
      )}

      {/* Filters Dropdown */}
      {showFilters && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <Select
                options={statusOptions}
                value={filters.status}
                onChange={(selectedOption) =>
                  handleFilterChange("status", selectedOption)
                }
                placeholder="Select Status"
                isClearable
                className="basic-select"
                classNamePrefix="select"
              />
            </div>
            <div className="w-full md:w-auto flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Audience
              </label>
              <Select
                options={targetOptions}
                value={filters.target}
                onChange={(selectedOption) =>
                  handleFilterChange("target", selectedOption)
                }
                placeholder="Select Target"
                isClearable
                className="basic-select"
                classNamePrefix="select"
              />
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={clearFilters}
              className="text-sm font-medium text-blue-600 hover:text-blue-800 px-3 py-1 rounded hover:bg-blue-50 transition-colors duration-200"
            >
              Clear all filters
            </button>
          </div>
        </div>
      )}
      {/* Announcements Table */}
      <div className="bg-white border border-gray-200 shadow overflow-hidden sm:rounded-lg">
        <div className="min-w-full overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Title
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Content Preview
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Target
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Dates
                </th>
                <th
                  scope="col"
                  className="relative px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
                      <h3 className="text-lg font-semibold mb-1">Loading announcements...</h3>
                    </div>
                  </td>
                </tr>
              ) : safeDisplayAnnouncement.length > 0 ? (
                safeDisplayAnnouncement.map((announcement) => (
                  <tr key={announcement._id} className="hover:bg-gray-50"> {/* Use _id for key */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {announcement.title}
                    </td>
                    <td className="px-6 py-4 whitespace-normal max-w-xs text-sm text-gray-500">
                      <div className="line-clamp-2">
                        {announcement.content}
                      </div>
                    </td>
                                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                       {(() => {
                         // Function to convert target group values to display names
                         const getTargetDisplayNames = (targetGroups) => {
                           if (!targetGroups || !Array.isArray(targetGroups) || targetGroups.length === 0) {
                             return ['No targets'];
                           }
                           
                           const displayNames = {
                             'all': 'All',
                             'all_students': 'Students',
                             'all_teachers': 'Teachers',
                             'all_parents': 'Parents',
                           };
                           
                           return targetGroups.map(group => displayNames[group] || group);
                         };
                         
                         const targetDisplayNames = getTargetDisplayNames(announcement.targetGroups);
                         
                         return targetDisplayNames.map((groupName, index) => (
                           <span
                             key={index}
                             className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-1"
                           >
                             {groupName}
                           </span>
                         ));
                       })()}
                     </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${announcement.status === "active"
                            ? "bg-green-100 text-green-800"
                            : announcement.status === "draft"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                      >
                        {announcement.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        Start:{" "}
                        <span className="font-medium">
                          {new Date(announcement.startDate).toLocaleDateString()} {/* Format date */}
                        </span>
                      </div>
                      <div>
                        End:{" "}
                        <span className="font-medium">
                          {new Date(announcement.endDate).toLocaleDateString()} {/* Format date */}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <span
                          onClick={() => handleViewDetailsClick(announcement)}
                          className="text-blue-600 cursor-pointer hover:text-blue-800 text-lg"
                          title="View"
                        >
                          👁️
                        </span>
                        <button
                          onClick={() => handleEditClick(announcement)}
                          className="text-indigo-600 hover:text-indigo-900 p-1 rounded-md hover:bg-indigo-50"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(announcement._id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <Search size={40} className="mb-3 text-gray-400" />
                      <h3 className="text-lg font-semibold mb-1">
                        {(announcements || []).length === 0
                          ? "No announcements yet!"
                          : "No matching announcements found."}
                      </h3>
                      <p className="mt-1 text-sm text-gray-600">
                        {(announcements || []).length === 0
                          ? "Get started by creating a new announcement"
                          : "Try adjusting your search or filter criteria"}
                      </p>
                      {(announcements || []).length === 0 && (
                        <button
                          onClick={() => setShowAddModal(true)}
                          className="mt-6 inline-flex items-center px-5 py-2.5 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                        >
                          <Plus size={20} className="mr-2" />
                          New Announcement
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Modals */}
      {showAddModal && (
        <AddAnnouncement
          onClose={() => setShowAddModal(false)}
        // onSave is removed as AddAnnouncement will use context directly
        />
      )}
      {showDetailsModal && (
        <AnnouncementDetails
          onClose={() => setShowDetailsModal(false)}
          data={selectedAnnouncement}
          editable={isEditMode}
        // onUpdate is removed as AnnouncementDetails will use context directly
        />
      )}
    </div>
  );
}

export default AnnouncementsModule;
