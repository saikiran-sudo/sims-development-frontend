import React, { useState } from 'react';
import { User, Mail, Phone, Lock, Calendar, MapPin, Edit2, Save, Camera, XCircle } from 'lucide-react';
import { useProfile } from './ProfileContext'; // Adjust the import path as necessary

const ProfileModule = () => {
  const { profileData, setProfileData } = useProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [localImage, setLocalImage] = useState(profileData.profileImage);

  // No need for handleInputChange if fields are readOnly.
  // The profileData will be updated only when the parent provides new data or
  // explicitly by the handleSave function for the image.

  const handleSave = () => {
    setIsEditing(false);
    // Only update profileImage in profileData upon saving
    setProfileData(prev => ({ ...prev, profileImage: localImage }));
    console.log('Saved profile:', profileData);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setLocalImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleImageRemove = () => setLocalImage('/avatar.png');

  return (
    <div className="px-0 sm:px-2 md:px-4 lg:p-6 flex flex-col gap-2 sm:gap-4 lg:gap-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-200">
          <h1 className="text-3xl font-extrabold text-gray-900">Profile Settings</h1>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white border rounded-xl p-8 text-center shadow-sm">
              <div className="relative mx-auto w-36 h-36 mb-6">
                <img
                  src={localImage}
                  alt="Profile"
                  className="w-full h-full rounded-full object-cover border-4 border-blue-200"
                />
                {isEditing && (
                  <>
                    <label htmlFor="profile-image-upload" className="absolute bottom-0 right-0 bg-blue-700 text-white p-2 rounded-full cursor-pointer">
                      {localImage === '/avatar.png' ? <Camera size={18} /> : <Edit2 size={18} />}
                      <input
                        id="profile-image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                    {localImage !== '/avatar.png' && (
                      <button onClick={handleImageRemove} className="absolute bottom-0 left-0 bg-red-600 text-white p-2 rounded-full">
                        <XCircle size={18} />
                      </button>
                    )}
                  </>
                )}
              </div>
              <h2 className="text-2xl font-bold">{profileData.name}</h2>
              <p className="text-blue-700 bg-blue-100 px-4 py-1.5 rounded-full text-sm font-semibold">{profileData.role}</p>
              {/* Edit/Save buttons moved here */}
              {/* <div className="flex justify-center items-center gap-4 mt-4">
                {isEditing ? (
                  <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-700 text-white hover:bg-blue-800 transition">
                    <Save size={18} /> Save Changes
                  </button>
                ) : (
                  <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 transition">
                    <Edit2 size={18} /> Edit Profile
                  </button>
                )}
              </div> */}
            </div>
          </div>

          {/* Form Area */}
          <div className="lg:col-span-2">
            <div className="bg-white border rounded-xl p-8 shadow-sm">
              <h3 className="text-xl font-semibold mb-6 border-b pb-3">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-sm mb-2">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={profileData.name}
                    className="w-full border px-4 py-2.5 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                    readOnly // Always read-only as per new requirement
                  />
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm mb-2">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={profileData.email}
                    className="w-full border px-4 py-2.5 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                    readOnly // Always read-only as per new requirement
                  />
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="phone" className="block text-sm mb-2">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={profileData.phone}
                    className="w-full border px-4 py-2.5 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                    readOnly // Always read-only as per new requirement
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm mb-2">Assigned Role</label>
                  <p className="bg-gray-50 px-4 py-2.5 border rounded-lg flex items-center gap-2">
                    <Lock size={18} /> {profileData.role}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default ProfileModule;