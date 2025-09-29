import React, { useState } from "react";
import { Edit, Trash, Plus, Filter, X, Search } from "lucide-react";
import Select from "react-select";
import AnnouncementDetails from "./AnnouncementDetails";
import { useAnnouncements } from "./AnnouncementProvider";
import { FaBullhorn } from "react-icons/fa";

function AnnouncementsModule() {
  const { announcements, loading, error } = useAnnouncements();

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [filters, setFilters] = useState({
    searchQuery: "",
    status: null,
    target: null,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false); // New state for mobile search

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

  const filteredAnnouncements = announcements.filter((announcement) => {
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
    });
  };

  const handleViewDetailsClick = (announcement) => {
    setSelectedAnnouncement(announcement);
    setShowDetailsModal(true);
  };

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

      {/* Loading and Error States */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <span className="text-gray-500 text-lg">Loading announcements...</span>
        </div>
      )}
      {error && (
        <div className="flex justify-center items-center py-8">
          <span className="text-red-500 text-lg">{error}</span>
        </div>
      )}

      {/* Hide the rest of the UI if loading or error */}
      {(!loading && !error) && (
        <>
          {/* Search and Filter Section */}
          <div className="flex justify-between mb-4">
            {/* Desktop Search Bar */}
            <div className="hidden md:flex items-center gap-2 text-xs rounded-full ring-[1.5px] ring-gray-300 px-3 w-full md:w-[400px]">
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

            {/* Buttons */}
            <div className="flex gap-2">
              {/* Mobile Search Button */}
              <button
                className="md:hidden flex items-center gap-1 px-3 py-2 bg-gray-100 rounded-md text-sm"
                onClick={() => setShowMobileSearch(!showMobileSearch)}
              >
                <Search size={16} />
                Search
              </button>

              {/* Filters Button */}
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
            </div>
          </div>

          {/* Mobile Search Input */}
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
                    {/* <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Target
                    </th> */}
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
                        {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {announcement.target.map((t) => (
                            <span
                              key={t}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-1"
                            >
                              {t}
                            </span>
                          ))}
                        </td> */}
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
                              {announcement.startDate}
                            </span>
                          </div>
                          <div>
                            End:{" "}
                            <span className="font-medium">
                              {announcement.endDate}
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
                            {announcements.length === 0
                              ? "No announcements available"
                              : "No matching announcements found."}
                          </h3>
                          <p className="mt-1 text-sm text-gray-600">
                            {announcements.length === 0
                              ? "There are currently no announcements to display"
                              : "Try adjusting your search or filter criteria"}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modals */}
          {showDetailsModal && (
            <AnnouncementDetails
              onClose={() => setShowDetailsModal(false)}
              data={selectedAnnouncement}
              editable={false}
            />
          )}
        </>
      )}
    </div>
  );
}

export default AnnouncementsModule;