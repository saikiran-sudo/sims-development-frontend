import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { FaChartBar } from 'react-icons/fa';
import { attendanceAPI } from "../../../services/api";

const AttendanceChart = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch attendance data for the last 5 days
        const response = await attendanceAPI.getAllStudentAttendance();
        const allAttendance = response.data;

        // Process attendance data for the last 5 days
        const last5Days = [];
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
        
        for (let i = 4; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dayName = days[4 - i];
          
          // Filter attendance for this specific date
          const dayAttendance = allAttendance.filter(att => {
            const attDate = new Date(att.date);
            return attDate.toDateString() === date.toDateString();
          });

          // Calculate present and absent counts
          const present = dayAttendance.filter(att => att.status === 'present').length;
          const absent = dayAttendance.filter(att => att.status === 'absent').length;

          last5Days.push({
            name: dayName,
            present,
            absent,
          });
        }

        setAttendanceData(last5Days);
      } catch (error) {
        console.error('Error fetching attendance data:', error);
        setError('Failed to load attendance data');
        // Set default data on error
        setAttendanceData([
          { name: "Mon", present: 0, absent: 0 },
          { name: "Tue", present: 0, absent: 0 },
          { name: "Wed", present: 0, absent: 0 },
          { name: "Thu", present: 0, absent: 0 },
          { name: "Fri", present: 0, absent: 0 },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendanceData();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-4 md:p-6 shadow-md h-full flex flex-col min-h-[350px]">
        <div className="flex justify-between items-center mb-3 md:mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2 sm:gap-3">
            <FaChartBar className="text-teal-500 text-lg sm:text-xl" /> Attendance Overview
          </h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg p-4 md:p-6 shadow-md h-full flex flex-col min-h-[350px]">
        <div className="flex justify-between items-center mb-3 md:mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2 sm:gap-3">
            <FaChartBar className="text-teal-500 text-lg sm:text-xl" /> Attendance Overview
          </h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-red-600">
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-4 md:p-6 shadow-md h-full flex flex-col min-h-[350px]">
      {/* Title Section */}
      <div className="flex justify-between items-center mb-3 md:mb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2 sm:gap-3">
          <FaChartBar className="text-teal-500 text-lg sm:text-xl" /> Attendance Overview
        </h1>
      </div>
      {/* Chart Section */}
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={attendanceData}
          barSize={25}
          margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
          <XAxis
            dataKey="name"
            axisLine={false}
            tick={{ fill: "#6b7280", fontSize: 10 }}
            tickLine={false}
            padding={{ left: 5, right: 5 }}
          />
          <YAxis
            axisLine={false}
            tick={{ fill: "#6b7280", fontSize: 10 }}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: 'rgba(0,0,0,0.05)' }}
            contentStyle={{ borderRadius: "8px", borderColor: "#e0e0e0", boxShadow: "0 2px 10px rgba(0,0,0,0.1)", fontSize: 12 }}
            labelStyle={{ color: '#374151', fontWeight: 'bold', fontSize: 12 }}
            itemStyle={{ color: '#4b5563', fontSize: 12 }}
          />
          <Legend
            align="center"
            verticalAlign="top"
            wrapperStyle={{ paddingTop: "5px", paddingBottom: "10px", fontSize: 11 }}
            iconType="circle"
          />
          <Bar
            dataKey="present"
            fill="#82ca9d"
            legendType="circle"
            radius={[6, 6, 0, 0]}
          />
          <Bar
            dataKey="absent"
            fill="#ef4444"
            legendType="circle"
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AttendanceChart;