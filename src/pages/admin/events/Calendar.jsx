import React from 'react';
import { ChevronLeft, ChevronRight, CheckCircle, AlertCircle, Clock, Ban } from 'lucide-react';

const Calendar = ({ 
    currentMonth, 
    monthlyAttendanceData, 
    selectedDate, 
    setSelectedDate, 
    setCurrentMonth, 
    events 
}) => {
    const monthNames = ["January", "February", "March", "April", "May", "June", 
                       "July", "August", "September", "October", "November", "December"];

    const changeMonth = (direction) => {
        const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + direction, 1);
        setCurrentMonth(newMonth);
        setSelectedDate(null);
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'present': return <CheckCircle className="text-green-500" size={18} />;
            case 'absent': return <Ban className="text-red-500" size={18} />;
            case 'late': return <AlertCircle className="text-yellow-500" size={18} />;
            case 'half-day': return <Clock className="text-blue-500" size={18} />;
            case 'holiday': return (
                <div className="w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-bold">H</div>
            );
            default: return null;
        }
    };

    const isPastDate = (date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date < today;
    };

    const generateCalendarDays = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay();

        const days = [];

        // Add null placeholders for days before the 1st of the month
        for (let i = 0; i < startingDay; i++) {
            days.push(null);
        }

        // Populate days of the current month
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(year, month, i);
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const isPast = isPastDate(date);
            const isSunday = date.getDay() === 0;

            // Find events for this day
            const eventsForThisDay = events.filter(event => {
                const eventStartDate = new Date(event.startDate);
                const eventEndDate = new Date(event.endDate);
                return date >= eventStartDate && date <= eventEndDate;
            });

            days.push({
                date,
                dateStr,
                isPast,
                isSunday,
                attendance: isSunday ? null : (monthlyAttendanceData?.find(a => a.date === dateStr)) || null,
                events: eventsForThisDay
            });
        }

        return days;
    };

    const days = generateCalendarDays();

    const handleDateClick = (day) => {
        if (!day.isPast) {
            setSelectedDate(day);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200 mb-6">
            {/* Month Navigation */}
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <button
                    onClick={() => changeMonth(-1)}
                    className="p-2 rounded-full hover:bg-gray-100"
                >
                    <ChevronLeft size={20} />
                </button>
                <h2 className="text-lg font-semibold">
                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </h2>
                <button
                    onClick={() => changeMonth(1)}
                    className="p-2 rounded-full hover:bg-gray-100"
                >
                    <ChevronRight size={20} />
                </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-px bg-gray-200">
                {/* Weekday headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="bg-gray-50 p-2 text-center text-xs font-medium text-gray-500">
                        {day}
                    </div>
                ))}

                {/* Calendar days */}
                {days.map((day, index) => (
                    <div
                        key={index}
                        className={`bg-white min-h-[100px] p-1 relative flex flex-col justify-between items-center text-center
                            ${day ? 'cursor-pointer' : 'bg-gray-50'}
                            ${day?.isSunday ? 'bg-gray-100 text-gray-400' : ''}
                            ${day && selectedDate?.dateStr === day.dateStr ? 'ring-2 ring-blue-500' : ''}
                            ${day?.isPast ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}
                        `}
                        onClick={() => day && handleDateClick(day)}
                    >
                        {day && (
                            <>
                                {/* Day Number */}
                                <span className={`text-sm p-1 rounded-full w-6 h-6 flex items-center justify-center font-medium self-end
                                    ${day.date.toDateString() === new Date().toDateString() ? 'bg-blue-600 text-white' : ''}
                                `}>
                                    {day.date.getDate()}
                                </span>

                                {/* Attendance Icon */}
                                {day.attendance && (
                                    <div className="absolute bottom-1 left-1">
                                        {getStatusIcon(day.attendance.status)}
                                    </div>
                                )}

                                {/* Event Indicator */}
                                {day.events.length > 0 && (
                                    <>
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 absolute top-1 left-1"></div>
                                        <div className="absolute bottom-1 left-0 right-0 overflow-hidden px-1 text-xs text-gray-700 text-left">
                                            <div className="flex flex-col items-start w-full">
                                                {day.events.slice(0, 1).map(event => (
                                                    <span 
                                                        key={event._id} 
                                                        className="truncate w-full bg-blue-100 text-blue-800 px-1 py-0.5 rounded-sm mb-0.5"
                                                    >
                                                        {event.title}
                                                    </span>
                                                ))}
                                                {day.events.length > 1 && (
                                                    <span className="text-gray-600">+{day.events.length - 1} more</span>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Calendar;