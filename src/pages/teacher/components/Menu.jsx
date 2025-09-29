import { useState, useEffect } from "react";
import { role } from "../profile/ProfileContext"; // Assuming this context provides the user role
import { Link, useLocation } from "react-router-dom";
import SIMSLogo from '../../../assets/sims-logo.png';
import {
  FaSchool, FaChalkboardTeacher, FaUserGraduate, FaUsers, FaJournalWhills,
  FaClipboardList, FaRegCalendarAlt, FaClipboardCheck, FaDesktop, FaChartBar, FaUserCheck,
  FaCalendarCheck, FaComments, FaBullhorn, FaQuestionCircle,
  FaTimes, FaBars,FaCalendarAlt // FaTimes and FaBars for toggle buttons
} from "react-icons/fa";

// Define your menu items with ABSOLUTE paths
export const menuItems = [ // Export menuItems
  {
    items: [
      { icon: FaSchool, label: "Home", href: "/teacher", visible: ["admin", "teacher", "student", "parent"], keywords: ["dashboard", "overview"] },
      { icon: FaUserGraduate, label: "Students", href: "/teacher/students", visible: ["admin", "teacher"], keywords: ["pupils", "enrollment"] },
      { icon: FaUsers, label: "Parents", href: "/teacher/parents", visible: ["admin", "teacher"], keywords: ["guardians"] },
      { icon: FaChalkboardTeacher, label: "My Classes", href: "/teacher/myclasses", visible: ["admin", "teacher", "student", "parent"], keywords: ["courses", "subjects"] },
      { icon: FaJournalWhills, label: "Diary", href: "/teacher/diary", visible: ["admin", "teacher", "student", "parent"], keywords: ["notes", "daily log"] },
      { icon: FaClipboardList, label: "Exam Reports", href: "/teacher/exams", visible: ["admin", "teacher", "student", "parent"], keywords: ["grades", "tests", "results"] },
      { icon: FaRegCalendarAlt, label: "Schedules", href: "/teacher/schedules", visible: ["admin", "teacher", "student", "parent"], keywords: ["timetable", "calendar"] },
      { icon: FaClipboardCheck, label: "Assignments", href: "/teacher/assignments", visible: ["admin", "teacher", "student", "parent"], keywords: ["homework", "tasks"] },
      { icon: FaDesktop, label: "Library", href: "/teacher/library", visible: ["admin", "teacher", "student", "parent"], keywords: ["books", "resources"] },
      { icon: FaUserCheck, label: "Attendance", href: "/teacher/attendance", visible: ["admin", "teacher", "student", "parent"], keywords: ["presence", "absent"] },
      { icon: FaCalendarAlt, label: "Leaves", href: "/teacher/leaves", visible: ["admin", "teacher", "student", "parent"], keywords: ["absences", "vacation", "holiday"] },
      { icon: FaCalendarCheck, label: "Events", href: "/teacher/events", visible: ["admin", "teacher", "student", "parent"], keywords: ["school events", "calendar"] },
      { icon: FaComments, label: "Messages", href: "/teacher/messages", visible: ["admin", "teacher", "student", "parent"], keywords: ["chat", "communication", "inbox"] },
      { icon: FaBullhorn, label: "Announcements", href: "/teacher/announcements", visible: ["admin", "teacher", "student", "parent"], keywords: ["notices", "updates"] },
      { icon: FaQuestionCircle, label: "Help", href: "/teacher/help", visible: ["admin", "teacher", "student", "parent"], keywords: ["support", "faq"] },
    ],
  },
];

const TeacherMenu = ({ isMobileMenuOpen, setIsMobileMenuOpen }) => {
  const location = useLocation();
  const [isDesktopMenuCollapsed, setIsDesktopMenuCollapsed] = useState(false);

  // Effect to close mobile menu whenever the route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location, setIsMobileMenuOpen]);

  // Function to toggle the desktop menu collapse state
  const toggleDesktopMenu = () => {
    setIsDesktopMenuCollapsed(!isDesktopMenuCollapsed);
  };

  return (
    <>
      {/* Mobile Overlay: visible when mobile menu is open on small screens */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Menu Container */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50
        bg-white shadow-xl lg:shadow-none
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isMobileMenuOpen ? 'w-[300px] sm:w-[350px]' : ''} {/* Mobile width when open */}
        ${isDesktopMenuCollapsed ? 'lg:w-25' : 'lg:w-65'} {/* Desktop width (w-64 = 256px) */}
      `}>
        <div className="h-full flex flex-col border-r">
          {/* Menu Header (Logo and Toggle Buttons) */}
          <div className="p-4 border-b flex justify-between items-center">
            {/* Logo and App Name */}
            <Link to="/teacher" className={`flex items-center gap-3 ${isDesktopMenuCollapsed ? 'justify-center' : ''}`}>
              <img src={SIMSLogo} alt="SIMS Logo" className="h-10 w-15 animate-fade-in-down" />
            </Link>

            {/* Mobile Close Button (only visible on small screens) */}
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden p-2 rounded-full hover:bg-gray-100"
              aria-label="Close Mobile Menu"
            >
              <FaTimes className="text-gray-500 text-xl" />
            </button>

            {/* Desktop Toggle Button (only visible on large screens) */}
            <button
                onClick={toggleDesktopMenu}
                className="hidden lg:block p-2 rounded-full hover:bg-gray-100"
                title={isDesktopMenuCollapsed ? "Expand Menu" : "Collapse Menu"}
                aria-label={isDesktopMenuCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
                <FaBars className="text-gray-500 text-xl" />
            </button>
          </div>

          {/* Menu Items List */}
          <div className="flex-1 overflow-y-auto p-3 scrollbar-hide">
            {menuItems.map((group, groupIndex) => (
              <div key={groupIndex} className="flex flex-col gap-1">
                {group.items.map((item) => {
                  // Ensure 'role' is properly defined and accessible
                  // For demonstration, assuming 'role' is a string like "teacher"
                  // If role is undefined, it might cause issues.
                  // You might want to add a default role or handle undefined role gracefully.
                  // For example: if (item.visible.includes(role || 'student')) { ... }
                  if (item.visible.includes(role)) {
                    // Correctly determine if the link is active based on the current URL
                    const isRootPath = item.href === "/teacher";
                    const isActive = isRootPath
                      ? location.pathname === item.href || location.pathname === "/teacher" // Matches /teacher base
                      : location.pathname.startsWith(item.href);

                    return (
                      <Link
                        to={item.href}
                        key={item.label}
                        className={`
                          flex items-center gap-3 p-3 rounded-lg
                          transition-all duration-300 ease-in-out /* Smooth transition for items */
                          ${isDesktopMenuCollapsed ? 'justify-center' : ''} /* Center icon when collapsed */
                          ${isActive
                            ? 'bg-blue-100 text-blue-700 font-medium border-l-4 border-blue-600' // Unique active style
                            : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600' // Normal and hover style
                          }
                          ${isDesktopMenuCollapsed ? 'py-3' : ''} /* Adjust padding when collapsed */
                        `}
                      >
                        <item.icon className="text-lg min-w-[24px]" />
                        {/* Hide label text when desktop menu is collapsed with a fade transition */}
                        {!isDesktopMenuCollapsed && (
                          <span className="transition-opacity duration-300 ease-in-out">
                            {item.label}
                          </span>
                        )}
                      </Link>
                    );
                  }
                  return null;
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default TeacherMenu;