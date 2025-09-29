// src/routes/TeacherRouter.jsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'; // Added useLocation
import SIMSLogo from '../assets/sims-logo.png';
import TeacherMenu, { menuItems } from '../pages/teacher/components/Menu'; // Import menuItems
import Navbar from '../pages/teacher/components/Navbar';
import TeacherPage from '../pages/teacher/teacherpage/TeacherPage';
import ProfileModule from '../pages/teacher/profile/ProfileModule';
import StudentModule from '../pages/teacher/students/StudentModule';
import ParentModule from '../pages/teacher/parents/ParentModule';
import MyClassesModule from '../pages/teacher/myclasses/MyClassesModule';
import DiaryModule from '../pages/teacher/diary/DiaryModule'
import ExamModule from '../pages/teacher/exams/ExamModule';
import SchedulesModule from '../pages/teacher/schedules/SchedulesModule';
import AssignmentModule from '../pages/teacher/assignments/AssignmentModule';
import LibraryModule from '../pages/teacher/library/LibraryModule';
import AttendanceModule from '../pages/teacher/attendance/AttendanceModule';
import EventModule from '../pages/teacher/events/EventModule';
import MessageModule from '../pages/teacher/messages/MessageModule';
import AnnouncementModule from '../pages/teacher/announcements/AnnouncementModule';
import AnnouncementOverviewModal from '../pages/teacher/announcements/AnnouncementOverviewModal';
import HelpModule from '../pages/teacher/help/HelpModule';
import { MessageProvider } from '../pages/teacher/messages/MessageProvider';
import AnnouncementProvider from '../pages/teacher/announcements/AnnouncementProvider';
import { ProfileProvider } from '../pages/teacher/profile/ProfileContext';
import AboutUs from '../pages/AboutUs';
import PrivacyPolicy from '../pages/PrivacyPolicy';
import LeavesModule from '../pages/teacher/leaves/LeaveModule';

// Simple NoPageFound component for demonstration
const NoPageFound = ({ query }) => (
  <div className="flex flex-col items-center justify-center h-full text-gray-600">
    <h2 className="text-2xl font-bold mb-2">No Page Found</h2>
    <p className="text-lg">Your search for "<span className="font-semibold text-blue-600">{query}</span>" did not match any pages.</p>
    <p className="text-md mt-2">Redirecting to the previous page...</p>
  </div>
);

function TeacherRouter() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNoPageFound, setShowNoPageFound] = useState(false);
  const [lastSearchQuery, setLastSearchQuery] = useState('');
  const [lastVisitedPath, setLastVisitedPath] = useState('/teacher'); // State to store the path before search

  const navigate = useNavigate();
  const location = useLocation(); // Get current location

  // Effect to update lastVisitedPath when the route changes, excluding when NoPageFound is shown
  useEffect(() => {
    if (!showNoPageFound) {
      setLastVisitedPath(location.pathname);
    }
  }, [location.pathname, showNoPageFound]); //


  // Effect for redirection after displaying NoPageFound
  useEffect(() => {
    let timer;
    if (showNoPageFound) {
      timer = setTimeout(() => {
        setShowNoPageFound(false);
        navigate(lastVisitedPath); // Navigate back to the last visited path
      }, 2000); // 2 seconds
    }
    return () => clearTimeout(timer); // Cleanup the timer
  }, [showNoPageFound, navigate, lastVisitedPath]); //

  const handleSearchNavigate = (query) => {
    setShowNoPageFound(false); // Reset no page found on new search
    setLastSearchQuery(''); // Clear previous search query feedback

    const lowerCaseQuery = query.toLowerCase().trim();

    if (!lowerCaseQuery) {
      // If query is empty, navigate to teacher home and do nothing else
      navigate('/teacher');
      return;
    }

    let foundMatch = false;

    // Flatten menuItems for easier search
    const allMenuItems = menuItems.flatMap(group => group.items);

    for (const item of allMenuItems) {
      const allSearchableTerms = [item.label.toLowerCase(), ...(item.keywords || []).map(k => k.toLowerCase())]; //

      if (allSearchableTerms.some(term => term.includes(lowerCaseQuery))) { //
        navigate(item.href); //
        foundMatch = true; //
        break;
      }
    }

    if (!foundMatch) { //
      setShowNoPageFound(true); //
      setLastSearchQuery(query); //
      // No need to navigate here, the useEffect will handle it after 2 seconds
    }
  };

  return (
    <ProfileProvider>
      <div className="h-screen flex flex-col lg:flex-row bg-gray-50">
        {/* Sidebar Menu */}
        <TeacherMenu isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <AnnouncementProvider>
            <MessageProvider>
              {/* Desktop and Mobile Navbar - now includes mobile toggle and search handler */}
              <Navbar
                isMobileMenuOpen={isMobileMenuOpen}
                setIsMobileMenuOpen={setIsMobileMenuOpen}
                onSearchNavigate={handleSearchNavigate} // Pass the search handler
              />

              {/* Content */}
              <main className="flex-1 overflow-y-auto p-4 lg:p-6">
                {showNoPageFound ? (
                  <NoPageFound query={lastSearchQuery} />
                ) : (
                  <Routes>
                    <Route path="/" element={<TeacherPage />} />
                    {/* Ensure all routes are absolute and match menuItems href */}
                    <Route path="/profile" element={<ProfileModule />} />
                    <Route path="/students" element={<StudentModule />} />
                    <Route path="/parents" element={<ParentModule />} />
                    <Route path="/myclasses" element={<MyClassesModule />} />
                    <Route path="/diary" element={<DiaryModule />} />
                    <Route path="/exams" element={<ExamModule />} />
                    <Route path="/schedules" element={<SchedulesModule />} />
                    <Route path="/assignments" element={<AssignmentModule />} />
                    <Route path="/library" element={<LibraryModule />} />
                    <Route path="/attendance" element={<AttendanceModule />} />
                    <Route path="/leaves" element={<LeavesModule />} />
                    <Route path="/messages" element={<MessageModule />} />
                    <Route path="/events" element={<EventModule />} />
                    <Route path="/announcements" element={<AnnouncementModule />} />
                    <Route path="/announcements/overview" element={<AnnouncementOverviewModal />} />
                    <Route path="/help" element={<HelpModule />} />
                    <Route path="/aboutus" element={<AboutUs />} />
                    <Route path="/privacypolicy" element={<PrivacyPolicy />} />
                  </Routes>
                )}
              </main>
            </MessageProvider>
          </AnnouncementProvider>
        </div>
      </div>
    </ProfileProvider>
  );
}

export default TeacherRouter;