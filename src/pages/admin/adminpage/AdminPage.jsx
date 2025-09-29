import Announcements from "../components/Announcements";
import AttendanceChart from "../components/AttendanceChart";
import CountChart from "../components/CountChart";
import EventCalendar from "../components/EventCalendar";
import FinanceChart from "../components/FinanceChart";
import UserCard from "../components/UserCard";
import { useEffect, useState } from "react";
import { studentAPI, teacherAPI, parentAPI } from "../../../services/api";

function AdminPage() {
  const [studentCount, setStudentCount] = useState(0);
  const [teacherCount, setTeacherCount] = useState(0);
  const [parentCount, setParentCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all counts in parallel
        const [studentResponse, teacherResponse, parentResponse] = await Promise.allSettled([
          studentAPI.getStudentCount(),
          teacherAPI.getTeacherCount(),
          parentAPI.getParentCount()
        ]);

        // Handle student count
        if (studentResponse.status === 'fulfilled') {
          setStudentCount(studentResponse.value.data.count);
        } else {
          console.error('Error fetching student count:', studentResponse.reason);
          setStudentCount(0);
        }

        // Handle teacher count
        if (teacherResponse.status === 'fulfilled') {
          setTeacherCount(teacherResponse.value.data.count);
        } else {
          console.error('Error fetching teacher count:', teacherResponse.reason);
          setTeacherCount(0);
        }

        // Handle parent count
        if (parentResponse.status === 'fulfilled') {
          setParentCount(parentResponse.value.data.count);
        } else {
          console.error('Error fetching parent count:', parentResponse.reason);
          setParentCount(0);
        }

      } catch (error) {
        console.error('Error fetching counts:', error);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
  }, []);

  // Show loading state
  if (loading) {
    return (
      <div className="px-0 sm:px-2 md:px-4 lg:p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="px-0 sm:px-2 md:px-4 lg:p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-red-500 text-2xl mb-2">⚠️</div>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-0 sm:px-2 md:px-4 lg:p-6 flex flex-col gap-2 sm:gap-4 lg:gap-8">
      {/* USER CARDS - Now completely edge-to-edge */}
      <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-3 lg:gap-6 w-full">
        <UserCard type="student" count={studentCount} />
        <UserCard type="teacher" count={teacherCount} />
        <UserCard type="parent" count={parentCount} />
      </div>

      <div className="flex flex-col lg:flex-row gap-2 sm:gap-4 lg:gap-8 w-full">
        {/* LEFT SECTION - Zero side margins */}
        <div className="w-full lg:w-2/3 flex flex-col gap-2 sm:gap-4 lg:gap-8">
          {/* MIDDLE CHARTS - No gaps between */}
          <div className="flex flex-col lg:flex-row gap-2 sm:gap-4 lg:gap-8 lg:h-[480px] w-full">
            <div className="w-full lg:w-1/3 h-[300px] lg:h-auto">
              <CountChart count={studentCount}/>
            </div>
            <div className="w-full lg:w-2/3 h-[300px] lg:h-auto">
              <AttendanceChart />
            </div>
          </div>

          {/* BOTTOM CHART - Full bleed */}
          <div className="w-full h-[400px] lg:h-[500px]">
            <FinanceChart />
          </div>
        </div>

        {/* RIGHT SECTION - Edge-to-edge */}
        <div className="w-full lg:w-1/3 flex flex-col gap-2 sm:gap-4 lg:gap-8">
          <EventCalendar />
        </div>
      </div>

      {/* ANNOUNCEMENTS - Full width no padding */}
      <div className="w-full">
        <Announcements />
      </div>
    </div>
  );
};

export default AdminPage;