import { useState, useEffect } from "react";
import { role } from "../profile/ProfileContext"; // Assuming this context provides the user role
import { Link, useLocation } from "react-router-dom";
import SIMSLogo from '../../../assets/sims-logo.png';
import { FaSchool,FaChalkboardTeacher,FaUserGraduate,FaUsers,FaCreditCard,
  FaLandmark,FaBook,FaClipboardList,FaRegCalendarAlt,FaClipboardCheck,FaDesktop,
  FaChartBar,FaUserCheck,FaCalendarCheck,FaComments,FaBullhorn,FaQuestionCircle,
  FaLaptopCode,FaTimes,FaBars,FaCalendarAlt,FaUserPlus,FaAddressCard} from "react-icons/fa";

// Define your menu items with absolute paths for better routing consistency
export const menuItems = [ // Export menuItems
  {
    items: [
      { icon: FaSchool, label: "Home", href: "/admin", visible: ["admin", "teacher", "student", "parent"], keywords: ["dashboard", "overview"] },
      { icon: FaChalkboardTeacher, label: "Teachers", href: "/admin/teachers", visible: ["admin", "teacher"], keywords: ["faculty", "staff", "educators"] },
      { icon: FaAddressCard, label: "Admissions", href: "/admin/admissions", visible: ["admin", "teacher"], keywords: ["admission", "users"] },
      { icon: FaUserGraduate, label: "Students", href: "/admin/students", visible: ["admin", "teacher"], keywords: ["pupils", "learners"] },
      { icon: FaUsers, label: "Parents", href: "/admin/parents", visible: ["admin", "teacher"], keywords: ["guardians", "family"] },
      { icon: FaCreditCard, label: "Fee", href: "/admin/fee", visible: ["admin"], keywords: ["payments", "dues", "tuition"] },
      { icon: FaLandmark, label: "Bank", href: "/admin/bank", visible: ["admin"], keywords: ["accounts", "transactions", "finance"] },
      { icon: FaBook, label: "Subjects", href: "/admin/subjects", visible: ["admin"], keywords: ["courses", "curriculum"] },
      { icon: FaLaptopCode, label: "Classes", href: "/admin/classes", visible: ["admin", "teacher"], keywords: ["sections", "grades"] },
      { icon: FaClipboardList, label: "Exam Reports", href: "/admin/exams", visible: ["admin", "teacher", "student", "parent"], keywords: ["tests", "assessments", "grades", "results"] },
      { icon: FaRegCalendarAlt, label: "Schedules", href: "/admin/schedules", visible: ["admin", "teacher", "student", "parent"], keywords: ["timetables", "calendar", "daily plan"] },
      { icon: FaClipboardCheck, label: "Assignments", href: "/admin/assignments", visible: ["admin", "teacher", "student", "parent"], keywords: ["homework", "tasks", "projects"] },
      { icon: FaDesktop, label: "Library", href: "/admin/library", visible: ["admin", "teacher", "student", "parent"], keywords: ["books", "resources", "reading"] },
      { icon: FaChartBar, label: "Results", href: "/admin/results", visible: ["admin", "teacher", "student", "parent"], keywords: ["scores", "performance", "outcomes"] },
      { icon: FaUserCheck, label: "Attendance", href: "/admin/attendance", visible: ["admin", "teacher","parent"], keywords: ["presence", "absent", "roll call"] },
      { icon: FaCalendarAlt, label: "Leaves", href: "/admin/leaves", visible: ["admin", "teacher", "student", "parent"], keywords: ["absences", "vacation", "holiday"] },
      { icon: FaCalendarCheck, label: "Events", href: "/admin/events", visible: ["admin", "teacher", "student", "parent"], keywords: ["activities", "functions", "gatherings"] },
      { icon: FaComments, label: "Messages", href: "/admin/messages", visible: ["admin", "teacher", "student", "parent"], keywords: ["chats", "communications", "inbox"] },
      { icon: FaBullhorn, label: "Announcements", href: "/admin/announcements", visible: ["admin", "teacher", "student", "parent"], keywords: ["notices", "alerts", "news"] },
      { icon: FaQuestionCircle, label: "Help", href: "/admin/help", visible: ["admin", "teacher", "student", "parent"], keywords: ["support", "faq", "guidance"] },
    ],
  },
];

const Menu = ({ isMobileMenuOpen, setIsMobileMenuOpen }) => {
  const location = useLocation();
  // State for controlling the collapsed/expanded state of the desktop menu
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
            <Link to="/" className={`flex items-center gap-3 ${isDesktopMenuCollapsed ? 'justify-center' : ''}`}>
            {/* <img src="/logo.png" alt="logo" className="w-8 h-8" /> */}
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
          <div className="flex-1 overflow-y-auto p-3 scrollbar-hide"> {/* Added scrollbar-hide */}
            {menuItems.map((group, groupIndex) => (
              <div key={groupIndex} className="flex flex-col gap-1">
                {group.items.map((item) => {
                  // Check if the current user role has visibility for this menu item
                  if (item.visible.includes(role)) {
                    // Determine if the link is active based on the current URL
                    const isRootPath = item.href === "/admin";
                    const isActive = isRootPath
                      ? location.pathname === item.href || location.pathname === "/" // Matches /admin or /
                      : location.pathname.startsWith(item.href); // Matches /admin/teachers for /admin/teachers/add

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
                  return null; // Don't render item if not visible for the role
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Menu;