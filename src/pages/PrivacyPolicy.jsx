// src/pages/PrivacyPolicy.jsx
import React from 'react';
import { ShieldCheck, UserCheck, Mail, Link, AlertCircle, Info, Users, PhoneCall, ArrowLeft } from 'lucide-react'; // **FIXED: Added 'Users', 'PhoneCall', and 'ArrowLeft' to imports**

const PrivacyPolicy = () => {
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
            <div className="relative bg-gradient-to-r from-teal-700 to-teal-900 text-white p-8 rounded-lg shadow-xl mb-8 overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-pattern"></div> {/* Optional: Add a subtle pattern if you have one */}
                <div className="relative z-10 max-w-3xl mx-auto text-center">
                    <h1 className="text-3xl md:text-4xl font-extrabold mb-2 leading-tight">
                        Privacy Policy for SIMS
                    </h1>
                    <p className="text-md md:text-lg font-light opacity-90">
                        Your Trust, Our Priority: Understanding How We Protect Your Data.
                    </p>
                </div>
            </div>

            {/* Main Content */}
                <div className="text-sm text-gray-500 mb-6 text-center">
                    <AlertCircle size={16} className="inline-block mr-2" />
                    Last updated: <span className="font-semibold text-gray-700">Augest 8, 2025</span>
                </div>

                <p className="text-gray-700 leading-relaxed text-lg mb-6">
                    This Privacy Policy outlines how **Smart Institute Management System (SIMS)** ("we," "our," or "us") collects, uses, maintains, and discloses information gathered from users (each, a "User") of the SIMS platform, including our website, web applications, and services. We are deeply committed to protecting the privacy and security of your personal information.
                </p>

                <h2 className="text-2xl font-semibold text-gray-800 mb-3 mt-8 flex items-center">
                    <Info size={24} className="mr-3 text-blue-600 flex-shrink-0" />
                    1. Information We Collect
                </h2>
                <p className="text-gray-700 leading-relaxed mb-3">
                    To provide and continually enhance our services, we collect various types of information:
                </p>
                <ul className="list-inside text-gray-700 leading-relaxed mb-6 space-y-2">
                    <li className="flex items-start">
                        <span className="font-bold mr-2 text-blue-500">&bull;</span>
                        <p>
                            **Personal Identification Information:** Includes your name, email address, phone number, physical address, date of birth, and unique student/employee IDs. This data is essential for user authentication and identification within SIMS.
                        </p>
                    </li>
                    <li className="flex items-start">
                        <span className="font-bold mr-2 text-blue-500">&bull;</span>
                        <p>
                            **Academic and Operational Information:** Grades, attendance records, course history, assignments, class schedules, fee payment history, and other data directly related to your academic or administrative activities within the institute.
                        </p>
                    </li>
                    <li className="flex items-start">
                        <span className="font-bold mr-2 text-blue-500">&bull;</span>
                        <p>
                            **Technical and Usage Data:** Information about how you access and use SIMS, such as your IP address, browser type, operating system, device information, access times, and pages viewed. This helps us optimize performance and security.
                        </p>
                    </li>
                </ul>

                <h2 className="text-2xl font-semibold text-gray-800 mb-3 mt-8 flex items-center">
                    <ShieldCheck size={24} className="mr-3 text-green-600 flex-shrink-0" />
                    2. How We Use Your Information
                </h2>
                <p className="text-gray-700 leading-relaxed mb-3">
                    The information we collect is primarily used for the following purposes:
                </p>
                <ul className="list-inside text-gray-700 leading-relaxed mb-6 space-y-2">
                    <li className="flex items-start">
                        <span className="font-bold mr-2 text-green-500">&bull;</span>
                        <p>To **operate and provide** the full functionality of SIMS, including user authentication, personalized dashboards, and access to relevant modules (e.g., grades, attendance, schedules).</p>
                    </li>
                    <li className="flex items-start">
                        <span className="font-bold mr-2 text-green-500">&bull;</span>
                        <p>To **manage your account**, process transactions (like fee payments), and provide efficient customer and technical support.</p>
                    </li>
                    <li className="flex items-start">
                        <span className="font-bold mr-2 text-green-500">&bull;</span>
                        <p>To **improve and personalize** your experience within SIMS, ensuring relevant information and features are easily accessible.</p>
                    </li>
                    <li className="flex items-start">
                        <span className="font-bold mr-2 text-green-500">&bull;</span>
                        <p>To **communicate** with you effectively, including sending important announcements, security alerts, and service updates.</p>
                    </li>
                    <li className="flex items-start">
                        <span className="font-bold mr-2 text-green-500">&bull;</span>
                        <p>For **internal analytics and research**, helping us understand usage patterns and enhance system performance, features, and security.</p>
                    </li>
                </ul>

                <h2 className="text-2xl font-semibold text-gray-800 mb-3 mt-8 flex items-center">
                    <Users size={24} className="mr-3 text-red-600 flex-shrink-0" /> {/* **FIXED: This is where Users icon is used** */}
                    3. Disclosure of Your Information
                </h2>
                <p className="text-gray-700 leading-relaxed mb-3">
                    We only disclose your information under specific, limited circumstances:
                </p>
                <ul className="list-inside text-gray-700 leading-relaxed mb-6 space-y-2">
                    <li className="flex items-start">
                        <span className="font-bold mr-2 text-red-500">&bull;</span>
                        <p>
                            **With the Institute:** Your data is accessible to authorized personnel within your educational institution (e.g., administrators, teachers, relevant staff) for legitimate academic and administrative purposes directly related to your role or enrollment.
                        </p>
                    </li>
                    <li className="flex items-start">
                        <span className="font-bold mr-2 text-red-500">&bull;</span>
                        <p>
                            **Service Providers:** We may engage trusted third-party vendors to perform services on our behalf (e.g., cloud hosting, database management, email services). These providers are bound by strict confidentiality agreements and are only permitted to use your information as necessary to provide their services to us.
                        </p>
                    </li>
                    <li className="flex items-start">
                        <span className="font-bold mr-2 text-red-500">&bull;</span>
                        <p>
                            **Legal Requirements:** If required to do so by law or in response to valid requests by public authorities (e.g., a court order or government agency request).
                        </p>
                    </li>
                    <li className="flex items-start">
                        <span className="font-bold mr-2 text-red-500">&bull;</span>
                        <p>
                            **Business Transfers:** In the event of a merger, acquisition, or sale of assets involving SIMS, your information may be transferred as part of that transaction, subject to the new entity adhering to this Privacy Policy.
                        </p>
                    </li>
                </ul>

                <h2 className="text-2xl font-semibold text-gray-800 mb-3 mt-8 flex items-center">
                    <ShieldCheck size={24} className="mr-3 text-purple-600 flex-shrink-0" />
                    4. Data Security
                </h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                    We implement and maintain robust technical and organizational security measures designed to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include data encryption, firewalls, secure server configurations, access controls, and regular security audits.
                </p>

                <h2 className="text-2xl font-semibold text-gray-800 mb-3 mt-8 flex items-center">
                    <UserCheck size={24} className="mr-3 text-indigo-600 flex-shrink-0" />
                    5. Your Data Protection Rights
                </h2>
                <p className="text-gray-700 leading-relaxed mb-3">
                    Depending on applicable data protection laws and your jurisdiction, you may have the following rights regarding your personal data held by SIMS:
                </p>
                <ul className="list-inside text-gray-700 leading-relaxed mb-6 space-y-2">
                    <li className="flex items-start">
                        <span className="font-bold mr-2 text-indigo-500">&bull;</span>
                        <p>**The Right to Access:** You have the right to request copies of the personal data we hold about you.</p>
                    </li>
                    <li className="flex items-start">
                        <span className="font-bold mr-2 text-indigo-500">&bull;</span>
                        <p>**The Right to Rectification:** You have the right to request that we correct any information you believe is inaccurate or complete information you believe is incomplete.</p>
                    </li>
                    <li className="flex items-start">
                        <span className="font-bold mr-2 text-indigo-500">&bull;</span>
                        <p>**The Right to Erasure:** You have the right to request that we erase your personal data, under certain conditions and subject to legal obligations of your institute.</p>
                    </li>
                    <li className="flex items-start">
                        <span className="font-bold mr-2 text-indigo-500">&bull;</span>
                        <p>**The Right to Restrict Processing:** You have the right to request that we restrict the processing of your personal data, under certain conditions.</p>
                    </li>
                    <li className="flex items-start">
                        <span className="font-bold mr-2 text-indigo-500">&bull;</span>
                        <p>**The Right to Object to Processing:** You have the right to object to our processing of your personal data, under certain conditions.</p>
                    </li>
                    <li className="flex items-start">
                        <span className="font-bold mr-2 text-indigo-500">&bull;</span>
                        <p>**The Right to Data Portability:** You have the right to request that we transfer the data that we have collected to another organization, or directly to you, under certain conditions.</p>
                    </li>
                </ul>

                <h2 className="text-2xl font-semibold text-gray-800 mb-3 mt-8 flex items-center">
                    <AlertCircle size={24} className="mr-3 text-orange-600 flex-shrink-0" />
                    6. Changes to This Privacy Policy
                </h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                    We may update this Privacy Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will notify you of any significant changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes. Your continued use of SIMS after any modifications to this policy will constitute your acknowledgment of the modifications and your consent to abide and be bound by the modified Privacy Policy.
                </p>

                <h2 className="text-2xl font-semibold text-gray-800 mb-3 mt-8 flex items-center">
                    <PhoneCall size={24} className="mr-3 text-gray-600 flex-shrink-0" />
                    7. Contact Us
                </h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                    If you have any questions or concerns about this Privacy Policy or our data practices, please do not hesitate to contact us:
                </p>
                <ul className="list-inside text-gray-700 leading-relaxed mb-6 space-y-2">
                    <li className="flex items-center">
                        <Mail size={20} className="mr-3 text-gray-500" />
                        <span>By email: <a href="mailto:privacy@yourinstitute.com" className="text-blue-600 hover:underline">privacy@[yourinstitute.com]</a></span>
                    </li>
                    <li className="flex items-center">
                        <Link size={20} className="mr-3 text-gray-500" />
                        <span>By visiting this page on our website: <a href="[Your Website Contact Page URL]" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">[Your Website Contact Page URL]</a></span>
                    </li>
                    {/* Add postal address or phone number if applicable */}
                </ul>
        </div>
    );
};

export default PrivacyPolicy;