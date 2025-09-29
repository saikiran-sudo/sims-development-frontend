// A new component for the teacher's announcements module
import React, { useEffect, useState } from "react";
import { Edit, Trash, Plus, Filter, X, Search } from "lucide-react";
import { FaBullhorn } from "react-icons/fa";
import Select from "react-select";
import AddAnnouncement from "./AddAnnouncement";
import AnnouncementDetails from "./AnnouncementDetails";
import { useAnnouncements } from "./AnnouncementProvider";
import api from "../../../utils/axiosConfig";

function TeacherAnnouncementsModule() {
  const { handleDeleteAnnouncement } = useAnnouncements();

  const [activeTab, setActiveTab] = useState("adminAnnouncements");
  const [adminAnnouncements, setAdminAnnouncements] = useState([]);
  const [teacherAnnouncements, setTeacherAnnouncements] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [filters, setFilters] = useState({
    searchQuery: "",
    status: null,
    target: null,
    class: null,
    section: null,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "draft", label: "Draft" },
    { value: "expired", label: "Expired" },
  ];

  const targetOptions = [
    { value: "all", label: "All" },
    { value: "all_students", label: "Students" },
    { value: "all_parents", label: "Parents" },
    { value: "all_teachers", label: "Teachers" },
  ];

  const classOptions = [
    { value: "1", label: "Class 1" },
    { value: "2", label: "Class 2" },
    { value: "3", label: "Class 3" },
  ];

  const sectionOptions = [
    { value: "A", label: "Section A" },
    { value: "B", label: "Section B" },
    { value: "C", label: "Section C" },
  ];

  const fetchData = async () => {
    try {
      if (activeTab === "adminAnnouncements") {
        const response = await api.get("/announcements/under-my-admin");
        console.log("Admin announcements:", response.data);
        setAdminAnnouncements(response.data);
      } else {
        const response = await api.get("/announcements/created-by-me");
        console.log("Teacher announcements:", response.data);
        setTeacherAnnouncements(response.data);
      }
    } catch (error) {
      console.error("Error fetching announcements:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const displayedAnnouncements =
    activeTab === "adminAnnouncements"
      ? adminAnnouncements
      : teacherAnnouncements;

  const filteredAnnouncements = displayedAnnouncements.filter((announcement) => {
    if (
      filters.searchQuery &&
      !announcement.title
        .toLowerCase()
        .includes(filters.searchQuery.toLowerCase()) &&
      !announcement.content
        .toLowerCase()
        .includes(filters.searchQuery.toLowerCase())
    ) {
      return false;
    }
    if (filters.status && announcement.status !== filters.status.value)
      return false;
    if (filters.target && !announcement.target.includes(filters.target.value))
      return false;
    if (filters.class && announcement.class !== filters.class.value)
      return false;
    if (filters.section && announcement.section !== filters.section.value)
      return false;
    return true;
  });

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      searchQuery: "",
      status: null,
      target: null,
      class: null,
      section: null,
    });
  };

  const handleEditClick = (announcement) => {
    setSelectedAnnouncement(announcement);
    setIsEditMode(true);
    setShowDetailsModal(true);
  };

  const handleDeleteClick = async (id) => {
    if (window.confirm("Are you sure you want to delete this announcement?")) {
      try {
        await api.delete(`/announcements/${id}`);
        handleDeleteAnnouncement(id);
        fetchData();
      } catch (error) {
        console.error("Error deleting announcement:", error);
      }
    }
  };

  const handleViewDetailsClick = (announcement) => {
    setSelectedAnnouncement(announcement);
    setIsEditMode(false);
    setShowDetailsModal(true);
  };

  const activeFilterCount = Object.values(filters).filter(
    (f) => f && (typeof f !== "object" || (f && f.value))
  ).length;

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="px-0 sm:px-2 md:px-4 lg:p-6 flex flex-col gap-2 sm:gap-4 lg:gap-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <FaBullhorn size={32} className="text-indigo-600" />
          Announcements
        </h1>

        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("adminAnnouncements")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              activeTab === "adminAnnouncements"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-800"
            }`}
          >
            Admin Announcements
          </button>
          <button
            onClick={() => setActiveTab("myAnnouncements")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              activeTab === "myAnnouncements"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-800"
            }`}
          >
            My Announcements
          </button>
        </div>
      </div>

      <div className="flex justify-between mb-4">
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

        <div className="flex gap-2">
          <button
            className="md:hidden flex items-center gap-1 px-3 py-2 bg-gray-100 rounded-md text-sm"
            onClick={() => setShowMobileSearch(!showMobileSearch)}
          >
            <Search size={16} />
            Search
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm ${
              showFilters || activeFilterCount > 0
                ? "bg-blue-100 text-blue-600"
                : "bg-gray-100"
            }`}
          >
            {showFilters ? <X size={16} /> : <Filter size={16} />}
            <span className="hidden md:inline">Filters</span>
            {activeFilterCount > 0 && (
              <span className="ml-0 md:ml-1 inline-flex items-center px-1.5 py-0.5 md:px-2.5 md:py-0.5 rounded-full text-xs font-medium bg-blue-500 text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
          {activeTab === "myAnnouncements" && (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus size={16} className="mr-2" />
              <span>New Announcement</span>
            </button>
          )}
        </div>
      </div>

      {showMobileSearch && (
        <div className="md:hidden flex items-center gap-2 text-xs rounded-full ring-[1.5px] ring-gray-300 px-3 w-full mb-4 animate-fade-in">
          <Search size={16} className="text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Search announcements..."
            className="p-2 bg-transparent outline-none flex-1 min-w-0"
            value={filters.searchQuery}
            onChange={(e) => handleFilterChange("searchQuery", e.target.value)}
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
      )}

      {showFilters && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-1">
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
            <div className="md:col-span-1">
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
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Class
              </label>
              <Select
                options={classOptions}
                value={filters.class}
                onChange={(selectedOption) =>
                  handleFilterChange("class", selectedOption)
                }
                placeholder="Select Class"
                isClearable
                className="basic-select"
                classNamePrefix="select"
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Section
              </label>
              <Select
                options={sectionOptions}
                value={filters.section}
                onChange={(selectedOption) =>
                  handleFilterChange("section", selectedOption)
                }
                placeholder="Select Section"
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
                {activeTab === "myAnnouncements" && (
                  <>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Class
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Section
                    </th>
                  </>
                )}
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
              {filteredAnnouncements.length > 0 ? (
                filteredAnnouncements.map((announcement) => (
                  <tr key={announcement.id} className="hover:bg-gray-50">
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
                        const getTargetDisplayNames = (targetGroups) => {
                          if (
                            !targetGroups ||
                            !Array.isArray(targetGroups) ||
                            targetGroups.length === 0
                          ) {
                            return ["No targets"];
                          }

                          const displayNames = {
                            all: "All",
                            all_students: "Students",
                            all_teachers: "Teachers",
                            all_parents: "Parents",
                            staff: "Staff",
                          };

                          return targetGroups.map(
                            (group) => displayNames[group] || group
                          );
                        };

                        const targetDisplayNames = getTargetDisplayNames(
                          announcement.targetGroups
                        );

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
                    {activeTab === "myAnnouncements" && (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {announcement.class ? announcement.class.class_name : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {announcement.section || 'N/A'}
                        </td>
                      </>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          announcement.status === "active"
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
                          {formatDate(announcement.startDate)}
                        </span>
                      </div>
                      <div>
                        End:{" "}
                        <span className="font-medium">
                          {formatDate(announcement.endDate)}
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
                        {activeTab === "myAnnouncements" && (
                          <>
                            <button
                              onClick={() => handleEditClick(announcement)}
                              className="text-indigo-600 hover:text-indigo-900 p-1 rounded-md hover:bg-indigo-50"
                              title="Edit"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteClick(announcement._id)
                              }
                              className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50"
                              title="Delete"
                            >
                              <Trash size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={activeTab === "myAnnouncements" ? "8" : "6"} className="px-6 py-8 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <Search size={40} className="mb-3 text-gray-400" />
                      <h3 className="text-lg font-semibold mb-1">
                        {filteredAnnouncements.length === 0
                          ? "No announcements found."
                          : "No matching announcements found."}
                      </h3>
                      <p className="mt-1 text-sm text-gray-600">
                        {activeTab === "myAnnouncements" &&
                        filteredAnnouncements.length === 0
                          ? "Get started by creating a new announcement"
                          : "Try adjusting your search or filter criteria"}
                      </p>
                      {activeTab === "myAnnouncements" &&
                        filteredAnnouncements.length === 0 && (
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
      {showAddModal && (
        <AddAnnouncement onClose={() => setShowAddModal(false)} />
      )}
      {showDetailsModal && (
        <AnnouncementDetails
          onClose={() => setShowDetailsModal(false)}
          data={selectedAnnouncement}
          editable={isEditMode}
        />
      )}
    </div>
  );
}

export default TeacherAnnouncementsModule;