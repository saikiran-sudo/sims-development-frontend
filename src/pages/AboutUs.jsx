// src/pages/AboutUs.jsx
import React from 'react';
import { Eye, Target, Feather, Users, PhoneCall, ArrowLeft } from 'lucide-react'; // Importing new icons and ArrowLeft

const AboutUs = () => {
    // Function to handle back button click
    const goBack = () => {
        window.history.back();
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen font-sans">
            {/* Back Button */}
            <div className="mb-4">
                <button
                    onClick={goBack}
                    className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-200"
                >
                    <ArrowLeft size={20} className="mr-2" />
                    Back
                </button>
            </div>

            {/* Hero Section */}
            <div className="relative bg-gradient-to-r from-blue-700 to-blue-900 text-white p-8 rounded-lg shadow-xl mb-8 overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-pattern"></div> {/* Optional: Add a subtle pattern if you have one */}
                <div className="relative z-10 max-w-3xl mx-auto text-center">
                    <h1 className="text-3xl md:text-4xl font-extrabold mb-2 leading-tight">
                        About Smart Institute Management System (SIMS)
                    </h1>
                    <p className="text-md md:text-lg font-light opacity-90">
                        Revolutionizing Education Management with Innovation and Efficiency.
                    </p>
                </div>
            </div>

            {/* Main Content */}
                <p className="text-gray-700 leading-relaxed text-lg mb-6">
                    Welcome to **SIMS**, your partner in transforming educational administration. Our comprehensive platform is meticulously designed to streamline daily operations, foster seamless communication among all stakeholders, and cultivate an enriching learning environment for students.
                </p>

                {/* Vision Section */}
                <div className="flex items-start mb-6 border-b pb-6">
                    <div className="flex-shrink-0 mr-4 text-blue-600">
                        <Eye size={36} /> {/* Vision Icon */}
                    </div>
                    <div>
                        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Our Vision</h2>
                        <p className="text-gray-700 leading-relaxed">
                            To empower educational institutions worldwide with cutting-edge technology, fostering an environment where efficiency meets innovation, and learning flourishes without administrative bottlenecks. We believe in building a smarter, more connected future for education.
                        </p>
                    </div>
                </div>

                {/* Mission Section */}
                <div className="flex items-start mb-6 border-b pb-6">
                    <div className="flex-shrink-0 mr-4 text-green-600">
                        <Target size={36} /> {/* Mission Icon */}
                    </div>
                    <div>
                        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Our Mission</h2>
                        <p className="text-gray-700 leading-relaxed">
                            To develop and provide an intuitive, secure, and robust management system that caters to the diverse needs of schools, colleges, and training centers. We aim to simplify student admissions, class scheduling, attendance tracking, grade management, fee collection, and much more, all within a single, integrated platform.
                        </p>
                    </div>
                </div>

                {/* Features Section */}
                <h2 className="text-2xl font-semibold text-gray-800 mb-4 mt-6">Key Features of SIMS</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700 leading-relaxed mb-6">
                    <div className="flex items-center">
                        <Feather size={20} className="mr-2 text-purple-600 flex-shrink-0" />
                        <span>Efficient Student & Staff Management</span>
                    </div>
                    <div className="flex items-center">
                        <Feather size={20} className="mr-2 text-purple-600 flex-shrink-0" />
                        <span>Comprehensive Class & Timetable Scheduling</span>
                    </div>
                    <div className="flex items-center">
                        <Feather size={20} className="mr-2 text-purple-600 flex-shrink-0" />
                        <span>Automated Attendance & Grade Tracking</span>
                    </div>
                    <div className="flex items-center">
                        <Feather size={20} className="mr-2 text-purple-600 flex-shrink-0" />
                        <span>Streamlined Fee Management</span>
                    </div>
                    <div className="flex items-center">
                        <Feather size={20} className="mr-2 text-purple-600 flex-shrink-0" />
                        <span>Robust Communication Tools (Announcements, Messaging)</span>
                    </div>
                    <div className="flex items-center">
                        <Feather size={20} className="mr-2 text-purple-600 flex-shrink-0" />
                        <span>Secure Data Management & Reporting</span>
                    </div>
                    <div className="flex items-center">
                        <Feather size={20} className="mr-2 text-purple-600 flex-shrink-0" />
                        <span>Intuitive Teacher, Student, and Parent Portals</span>
                    </div>
                </div>

                {/* Our Team Section (Placeholder) */}
                <h2 className="text-2xl font-semibold text-gray-800 mb-4 mt-6">Our Team</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                    Behind SIMS is a passionate team of educators, developers, and designers committed to empowering institutions. We combine deep understanding of educational needs with cutting-edge technology to build a system that truly makes a difference.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {/* Placeholder Team Member Card 1 */}
                    <div className="text-center p-4 border rounded-lg shadow-sm">
                        <Users size={48} className="mx-auto mb-3 text-gray-500" />
                        <h3 className="font-semibold text-lg text-gray-800">Founder Name</h3>
                        <p className="text-sm text-gray-600">Role/Title</p>
                    </div>
                    {/* Placeholder Team Member Card 2 */}
                    <div className="text-center p-4 border rounded-lg shadow-sm">
                        <Users size={48} className="mx-auto mb-3 text-gray-500" />
                        <h3 className="font-semibold text-lg text-gray-800">Lead Developer</h3>
                        <p className="text-sm text-gray-600">Role/Title</p>
                    </div>
                    {/* Placeholder Team Member Card 3 */}
                    <div className="text-center p-4 border rounded-lg shadow-sm">
                        <Users size={48} className="mx-auto mb-3 text-gray-500" />
                        <h3 className="font-semibold text-lg text-gray-800">Product Manager</h3>
                        <p className="text-sm text-gray-600">Role/Title</p>
                    </div>
                </div>

                <p className="text-gray-700 leading-relaxed mt-6 text-lg">
                    We are constantly evolving and improving SIMS based on feedback from educators and administrators. Our team is committed to providing excellent support and ensuring that our system adapts to the changing needs of the educational landscape.
                </p>

                {/* Call to Action */}
                <div className="text-center mt-8 pt-6 border-t border-gray-200">
                    <p className="text-xl font-semibold text-gray-800 mb-4">Have Questions or Want to Learn More?</p>
                    <button
                        onClick={() => alert('Navigate to Contact Us page')} // Replace with actual navigation
                        className="inline-flex items-center px-6 py-3 bg-blue-600 text-white text-lg font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition ease-in-out duration-300"
                    >
                        <PhoneCall size={20} className="mr-2" />
                        Contact Us
                    </button>
                </div>

                <p className="text-gray-700 leading-relaxed mt-4 text-sm text-right">
                    Thank you for being a part of the SIMS community.
                </p>
        </div>
    );
};

export default AboutUs;