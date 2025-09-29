import { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { FaRegCalendarAlt, FaClock, FaInfoCircle } from 'react-icons/fa';
import { eventAPI } from "../../../services/api";

function EventCalendar() {
  const [value, onChange] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await eventAPI.getAllEvents();
        // Filter for upcoming events (status === 'upcoming' and startDate in the future)
        const upcoming = response.data.filter(event => 
          event.status && event.status.toLowerCase() === 'upcoming'
        );
        setEvents(upcoming);
      } catch (err) {
        console.error('Error fetching events:', err);
        setError('Failed to load events');
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md h-full flex flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-4">
          <FaRegCalendarAlt className="text-blue-600" /> Event Calendar
        </h1>
        <Calendar
          onChange={onChange}
          value={value}
          className="w-full border-none rounded-lg shadow-inner p-2 text-sm"
        />
      </div>

      <div className="flex items-center justify-between mt-4 mb-3">
        <h1 className="text-xl font-semibold text-gray-800">Upcoming Events</h1>
      </div>
      <div className="flex flex-col gap-4 overflow-y-auto custom-scrollbar flex-1">
        {loading ? (
          <div className="text-gray-500">Loading events...</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : events.length === 0 ? (
          <div className="text-gray-500">No upcoming events.</div>
        ) : (
          events.map((event) => (
            <div
              className="p-4 rounded-lg border border-gray-200 border-t-4 odd:border-t-blue-500 even:border-t-purple-500 shadow-sm transition-all duration-200 hover:shadow-md"
              key={event._id || event.id}
            >
              <div className="flex items-start justify-between mb-1">
                <h1 className="font-semibold text-gray-700 text-base flex items-center gap-1">
                  <FaInfoCircle className="text-gray-400 text-sm" /> {event.title}
                </h1>
                <span className="text-gray-500 text-xs flex items-center gap-1 mt-0.5">
                  <FaClock className="text-gray-400 text-xs" />
                  {/* Show time range if available, else show start time */}
                  {event.startDate && event.endDate ? (
                    `${new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(event.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                  ) : event.startDate ? (
                    new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  ) : 'N/A'}
                </span>
              </div>
              <p className="mt-2 text-gray-600 text-sm leading-snug">{event.description}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default EventCalendar;