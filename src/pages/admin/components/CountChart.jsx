import React, { useState, useEffect } from 'react';
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
} from "recharts";
import { FaGraduationCap } from 'react-icons/fa';
import { studentAPI } from "../../../services/api";

function CountChart({ count }) {
  const [studentData, setStudentData] = useState({
    total: count,
    boys: count,
    girls: count
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all students to get gender distribution
        const response = await studentAPI.getAllStudents();
        const students = response.data;

        // Calculate gender distribution
        const boys = students.filter(student => student.gender === 'Male').length;
        const girls = students.filter(student => student.gender === 'Female').length;
        const total = students.length;
        console.log('boys ', boys);
        console.log('girls ', girls);
        console.log('total ', total);

        setStudentData({ total, boys, girls });
      } catch (error) {
        console.error('Error fetching student data:', error);
        setError('Failed to load student data');
        // Set default values on error
        setStudentData({ total: 0, boys: 0, girls: 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, []);

  // Prepare chart data
  const chartData = [
    {
      name: "Total",
      count: studentData.total,
      fill: "white",
    },
    {
      name: "Girls",
      count: studentData.girls,
      fill: "#facc15", // Tailwind yellow-500
    },
    {
      name: "Boys",
      count: studentData.boys,
      fill: "#3b82f6", // Tailwind blue-500
    },
  ];

  // Calculate percentages
  const boysPercentage = studentData.total > 0 ? Math.round((studentData.boys / studentData.total) * 100) : 0;
  const girlsPercentage = studentData.total > 0 ? Math.round((studentData.girls / studentData.total) * 100) : 0;

  if (loading) {
    return (
      <div className="bg-white rounded-xl w-full h-full p-4 md:p-6 shadow-md flex flex-col min-h-[300px] md:min-h-0">
        <div className="flex justify-between items-center mb-3 md:mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2 sm:gap-3">
            <FaGraduationCap className="text-indigo-500 text-lg sm:text-xl" /> Total Students
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
      <div className="bg-white rounded-xl w-full h-full p-4 md:p-6 shadow-md flex flex-col min-h-[300px] md:min-h-0">
        <div className="flex justify-between items-center mb-3 md:mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2 sm:gap-3">
            <FaGraduationCap className="text-indigo-500 text-lg sm:text-xl" /> Total Students
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
    <div className="bg-white rounded-xl w-full h-full p-4 md:p-6 shadow-md flex flex-col min-h-[300px] md:min-h-0">
      {/* TITLE */}
      <div className="flex justify-between items-center mb-3 md:mb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2 sm:gap-3">
          <FaGraduationCap className="text-indigo-500 text-lg sm:text-xl" /> Total Students
        </h1>
      </div>
      {/* CHART */}
      <div className="relative w-full h-[60%] sm:h-[70%] flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="60%"
            outerRadius="90%"
            barSize={15}
            data={chartData}
            startAngle={90}
            endAngle={-270}
          >
            <RadialBar background clockWise dataKey="count" cornerRadius={10} />
          </RadialBarChart>
        </ResponsiveContainer>
        <img
          src="/maleFemale.png"
          alt="Male Female Icon"
          width={60}
          height={60}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 object-contain sm:w-70 sm:h-70"
        />
      </div>
      {/* BOTTOM */}
      <div className="flex justify-center gap-4 sm:gap-8 mt-4 sm:mt-6">
        <div className="flex flex-col items-center gap-0.5 sm:gap-1">
          <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-500 rounded-full shadow-md" />
          <h1 className="font-bold text-base sm:text-lg text-gray-800">{studentData.boys}</h1>
          <h2 className="text-xs sm:text-sm text-gray-600">Boys ({boysPercentage}%)</h2>
        </div>
        <div className="flex flex-col items-center gap-0.5 sm:gap-1">
          <div className="w-5 h-5 sm:w-6 sm:h-6 bg-yellow-500 rounded-full shadow-md" />
          <h1 className="font-bold text-base sm:text-lg text-gray-800">{studentData.girls}</h1>
          <h2 className="text-xs sm:text-sm text-gray-600">Girls ({girlsPercentage}%)</h2>
        </div>
      </div>
    </div>
  );
}

export default CountChart;