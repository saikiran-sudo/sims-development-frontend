// Calendar.jsx
import React from 'react';
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

const Calendar = ({ currentMonth, monthlyAttendanceData, selectedDate, setSelectedDate, setCurrentMonth }) => {

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const changeMonth = (direction) => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + direction, 1));
        setSelectedDate(null); // Clear selected date when month changes
    };

    // Helper function for getting the attendance icon for a calendar day
    const getStatusIcon = (status) => {
        switch (status) {
            case 'present':
                return <CheckCircle className="text-green-500" size={18} />;
            case 'absent':
                return <XCircle className="text-red-500" size={18} />;
            case 'half-day':
                return <Clock className="text-blue-500" size={18} />;
            case 'leave': // Added case for leave
                return <AlertCircle className="text-yellow-600" size={18} />; // Icon for leave
            default:
                return null;
        }
    };

    // Generate calendar days for the current month
    const generateCalendarDays = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();

        const startingDay = firstDay.getDay(); // 0 for Sunday, 1 for Monday, etc.

        const days = [];

        // Add null placeholders for days before the 1st of the month to align with weekdays
        for (let i = 0; i < startingDay; i++) {
            days.push(null);
        }

        // Populate days of the current month
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(year, month, i);
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const attendance = monthlyAttendanceData.find(a => a.date === dateStr);

            // Determine if the current day is a Sunday
            const isSunday = date.getDay() === 0; // Sunday is 0

            days.push({
                date,
                dateStr,
                // If it's a Sunday, attendance is null to prevent icons from showing
                attendance: isSunday ? null : attendance
            });
        }

        return days;
    };

    const days = generateCalendarDays();

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
                        className={`bg-white min-h-16 p-1 relative flex flex-col justify-between items-center text-center
                            ${day ? 'cursor-pointer hover:bg-gray-50' : 'bg-gray-50'}
                            ${day && day.date.getDay() === 0 ? 'bg-gray-100 text-gray-400' : ''} {/* Style Sundays */}
                            ${selectedDate && day && selectedDate.dateStr === day.dateStr ? 'ring-2 ring-blue-500' : ''}
                        `}
                        onClick={() => day && setSelectedDate(day)}
                    >
                        {day && (
                            <>
                                {/* Day Number */}
                                <span className={`text-sm p-1 rounded-full w-6 h-6 flex items-center justify-center font-medium
                                    ${day.date.toDateString() === new Date().toDateString() ? 'bg-blue-600 text-white' : ''}
                                `}>
                                    {day.date.getDate()}
                                </span>
                                {/* Attendance Icon (only if not Sunday and attendance exists) */}
                                {day.attendance && day.date.getDay() !== 0 && (
                                    <div className="absolute bottom-1 right-1">
                                        {getStatusIcon(day.attendance.status)}
                                    </div>
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