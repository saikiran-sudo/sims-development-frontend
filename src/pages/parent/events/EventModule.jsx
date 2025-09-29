import React, { useState, useEffect } from 'react';
import { Filter, X, Search, CalendarIcon } from 'lucide-react';
import Select from 'react-select';
import axios from 'axios';
import EventDetails from './EventDetails';

// Use import.meta.env to access environment variables.
// The variable name must be prefixed with VITE_ for Vite to expose it to the client-side.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Helper function to format date to DD-MM-YYYY
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const [year, month, day] = dateString.split('-');
  return `${day}-${month}-${year}`;
};

// Helper function to determine event status based on current date
const getEventStatus = (startDateStr, endDateStr) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize today's date to start of day

  const startDate = new Date(startDateStr);
  startDate.setHours(0, 0, 0, 0);

  // If endDateStr is not provided, assume it's a single-day event ending on startDate
  let endDate = startDate;
  if (endDateStr) {
    endDate = new Date(endDateStr);
    endDate.setHours(0, 0, 0, 0);
  }

  if (today > endDate) {
    return 'completed';
  } else if (today >= startDate && today <= endDate) {
    return 'ongoing';
  } else if (today < startDate) {
    return 'upcoming';
  }
  return 'unknown'; // Fallback for any unhandled date cases
};

function EventsModule() {
  const [events, setEvents] = useState([]);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [filters, setFilters] = useState({
    searchQuery: '',
    status: null,
    eventType: null
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  // Fetch events from backend API
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const token = JSON.parse(localStorage.getItem('authToken'));
        // Use the API_BASE_URL variable for the API call
        const response = await axios.get(`${API_BASE_URL}/api/events/under-my-parent`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        // Map backend events to frontend format if needed
        const eventsWithStatus = (response.data || []).map(event => ({
          ...event,
          // If status is not set or is null, calculate it from dates
          status: event.status === 'cancelled' ? 'cancelled' : getEventStatus(event.startDate, event.endDate),
          // Ensure eventType is always an array
          eventType: Array.isArray(event.eventType) ? event.eventType : (event.eventType ? [event.eventType] : []),
          // Ensure targetAudience is always a string for display (join if array)
          targetAudience: Array.isArray(event.targetAudience) ? event.targetAudience.join(', ') : (event.targetAudience || ''),
        }));
        setEvents(eventsWithStatus);
      } catch (error) {
        setEvents([]);
        // Optionally, show error to user
        // console.error('Failed to fetch events:', error);
      }
    };
    fetchEvents();
  }, []);

  const statusOptions = [
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'ongoing', label: 'Ongoing' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const eventTypeOptions = [
    { value: 'Academic', label: 'Academic' },
    { value: 'Sport', label: 'Sport' },
    { value: 'Cultural', label: 'Cultural' },
    { value: 'Meeting', label: 'Meeting' },
    { value: 'Other', label: 'Other' }
  ];

  const filteredEvents = events.filter(event => {
    const matchesSearch = (
      event.title?.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
      event.description?.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
      event.eventName?.toLowerCase().includes(filters.searchQuery.toLowerCase())
    );

    const matchesStatus = filters.status ? event.status === filters.status.value : true;
    const matchesType = filters.eventType ? event.eventType.includes(filters.eventType.value) : true;

    return matchesSearch && matchesStatus && matchesType;
  });

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      searchQuery: '',
      status: null,
      eventType: null
    });
  };

  const handleViewDetailsClick = (event) => {
    setSelectedEvent(event);
    setShowDetailsModal(true);
  };

  const activeFilterCount = [
    filters.searchQuery,
    filters.status,
    filters.eventType
  ].filter(f => f && (typeof f !== 'object' || (f && f.value))).length;

  return (
    <div className="px-0 sm:px-2 md:px-4 lg:p-6 flex flex-col gap-2 sm:gap-4 lg:gap-8">
      <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
        <CalendarIcon size={32} className="text-indigo-600" />
        Events List
      </h1>
      {/* Header with Search and Filter Buttons */}
      <div className='flex justify-between mb-4'>
        {/* Desktop Search Bar */}
        <div className='hidden md:flex items-center gap-2 text-xs rounded-full ring-[1.5px] ring-gray-300 px-3 w-full md:w-[400px]'>
          <Search size={16} className="text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Search events..."
            className="p-2 bg-transparent outline-none flex-1 min-w-0"
            value={filters.searchQuery}
            onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
          />
          {filters.searchQuery && (
            <button
              onClick={() => handleFilterChange('searchQuery', '')}
              className="text-gray-400 hover:text-gray-600 shrink-0"
              aria-label="Clear search query"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className='flex gap-2'>
          {/* Mobile Search Button */}
          <button
            className='md:hidden flex items-center gap-1 px-3 py-2 bg-gray-100 rounded-md text-sm'
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
                ? 'bg-blue-100 text-blue-600'
                : 'bg-gray-100'
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
        <div className='md:hidden flex items-center gap-2 text-xs rounded-full ring-[1.5px] ring-gray-300 px-3 w-full mb-4 animate-fade-in'>
          <Search size={16} className="text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Search events..."
            className="p-2 bg-transparent outline-none flex-1 min-w-0"
            value={filters.searchQuery}
            onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
          />
          {filters.searchQuery && (
            <button
              onClick={() => handleFilterChange('searchQuery', '')}
              className="text-gray-400 hover:text-gray-600 shrink-0"
              aria-label="Clear search query"
            >
              <X size={16} />
            </button>
          )}
        </div>
      )}

      {/* Filters Dropdown Section */}
      {showFilters && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200 animate-fade-in">
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div>
              <label htmlFor="status-select" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <Select
                id="status-select"
                options={statusOptions}
                value={filters.status}
                onChange={(selectedOption) => handleFilterChange('status', selectedOption)}
                placeholder="Select Status"
                isClearable
                className="basic-select"
                classNamePrefix="select"
              />
            </div>
            <div>
              <label htmlFor="event-type-select" className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
              <Select
                id="event-type-select"
                options={eventTypeOptions}
                value={filters.eventType}
                onChange={(selectedOption) => handleFilterChange('eventType', selectedOption)}
                placeholder="Select Type"
                isClearable
                className="basic-select"
                classNamePrefix="select"
              />
            </div>
          </div>
          <div className='flex justify-end mt-4'>
            <button
              onClick={clearFilters}
              className='text-sm font-medium text-blue-600 hover:text-blue-800 px-3 py-1 rounded hover:bg-blue-50 transition-colors duration-200'
            >
              Clear all filters
            </button>
          </div>
        </div>
      )}

      {/* Events Table Display */}
      <div className="bg-white border border-gray-200 shadow overflow-hidden sm:rounded-lg">
        <div className="min-w-full overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description Preview
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dates
                </th>
                <th scope="col" className="relative px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEvents.length > 0 ? (
                filteredEvents.map((event) => (
                  <tr key={event._id || event.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {event.title}
                    </td>
                    <td className="px-6 py-4 whitespace-normal max-w-xs text-sm text-gray-500">
                      <div className='line-clamp-2'>{event.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {event.eventType.map((t, index) => (
                        <span key={`${event._id || event.id}-${t}-${index}`} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-1">
                          {t}
                        </span>
                      ))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          event.status === 'upcoming' ? 'bg-green-100 text-green-800' :
                          event.status === 'ongoing' ? 'bg-blue-100 text-blue-800' :
                          event.status === 'completed' ? 'bg-purple-100 text-purple-800' :
                          'bg-red-100 text-red-800'
                      }`}>
                        {event.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {event.endDate && (event.startDate !== event.endDate) ? (
                        <>
                          <div>Start: <span className='font-medium'>{formatDate(event.startDate?.slice(0, 10))}</span></div>
                          <div>End: <span className='font-medium'>{formatDate(event.endDate?.slice(0, 10))}</span></div>
                        </>
                      ) : (
                        <span className='font-medium'>{formatDate(event.startDate?.slice(0, 10))}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <span
                          onClick={() => handleViewDetailsClick(event)}
                          className="text-blue-600 cursor-pointer hover:text-blue-800 text-lg"
                          title="View Details"
                          role="button"
                          tabIndex="0"
                          onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                  handleViewDetailsClick(event);
                              }
                          }}
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
                      <Search size={40} className='mb-3 text-gray-400' />
                      <h3 className='text-lg font-semibold mb-1'>
                        {events.length === 0 ? 'No events available' : 'No matching events found.'}
                      </h3>
                      <p className='mt-1 text-sm text-gray-600'>
                        {events.length === 0 ? 'There are currently no events to display' :
                        'Try adjusting your search or filter criteria'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Event Details Modal */}
      {showDetailsModal && (
        <EventDetails
          onClose={() => setShowDetailsModal(false)}
          eventData={selectedEvent}
        />
      )}
    </div>
  );
}

export default EventsModule;
