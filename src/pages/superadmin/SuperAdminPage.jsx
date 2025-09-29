// superadmin/SuperAdminPage.jsx
import React, { useState, useEffect } from 'react';
// import { LogOut } from 'lucide-react'; // No longer needed directly here
import AddAdmin from './AddAdmin';
import AdminList from './AdminList';
import axios from 'axios';

// Access API_BASE_URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; // Fallback for development

const SuperAdminPage = () => {
  // State for the list of admins - central state management
  const [admins, setAdmins] = useState([]);

  // Utility function: Calculate renewal date based on plan type
  const calculateRenewalDate = (planType) => {
    const today = new Date(); // This is the 'renewed date' if called at the time of renewal
    const renewalDate = new Date(today);

    if (planType === 'monthly') {
      renewalDate.setDate(renewalDate.getDate() + 30); // Add 30 days for monthly
    } else {
      renewalDate.setFullYear(renewalDate.getFullYear() + 1); // Add one year for yearly
    }

    return renewalDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  };

  // Utility function: Check if a plan is expired
  const isPlanExpired = (renewalDate) => {
    const today = new Date();
    const renewal = new Date(renewalDate);
    // Set both dates to start of day for accurate comparison
    today.setHours(0, 0, 0, 0);
    renewal.setHours(0, 0, 0, 0);
    return renewal.getTime() < today.getTime();
  };

  // Utility function: Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Fetch admins from backend on mount
  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/admins/`);
        setAdmins(response.data);
      } catch (error) {
        console.error('Failed to fetch admins:', error);
      }
    };
    fetchAdmins();
  }, []);


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">


      <div className="max-w-8xl mx-auto p-4 md:p-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Super Admin Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage all school admin accounts</p>
          </div>
        </div>

        {/* Add New Admin Section */}
        <AddAdmin
          admins={admins} // Pass admins to check for duplicates
          setAdmins={setAdmins}
          calculateRenewalDate={calculateRenewalDate}
        />

        {/* Admin List Section */}
        <AdminList
          admins={admins} // Pass admins to display
          setAdmins={setAdmins} // Pass setAdmins for updates (delete, edit)
          calculateRenewalDate={calculateRenewalDate} // For plan renewal in edit mode
          isPlanExpired={isPlanExpired} // For displaying expired status
          formatDate={formatDate} // For consistent date formatting
        />
      </div>
    </div>
  );
};

export default SuperAdminPage;