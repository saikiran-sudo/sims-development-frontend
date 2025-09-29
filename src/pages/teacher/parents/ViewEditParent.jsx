import React, { useState, useEffect } from 'react';

function ViewEditParent({ data, editable = false, onClose, onUpdate, existingParents = [] }) {
  const [formData, setFormData] = useState({
    ...data,
    childrenIds: [], // Changed from childrenCount to childrenIds, initialized as an empty array
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (data) {
      setFormData({
        ...data,
        // If data.children is an array of student objects, extract user_ids for editing
        childrenIds: Array.isArray(data.children)
          ? data.children.map(child => child.user_id)
          : data.childrenIds || [],
        password: data.password || '',
      });
    }
  }, [data]);

  const validateForm = () => {
    const newErrors = {};
    const { parentId, name, email, phone, childrenIds, password } = formData;
    const trimmedParentId = parentId?.trim();
    const trimmedName = name?.trim();
    const trimmedEmail = email?.trim().toLowerCase();
    const trimmedPhone = phone?.trim();

    if (!trimmedParentId) newErrors.parentId = 'Parent ID is required';
    if (!trimmedName) newErrors.name = 'Name is required';

    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (trimmedEmail && !gmailRegex.test(trimmedEmail)) {
      newErrors.email = 'Only Gmail addresses are allowed';
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (trimmedPhone && !phoneRegex.test(trimmedPhone)) {
      newErrors.phone = 'Phone number must be exactly 10 digits';
    }

    // Basic validation for childrenIds (ensure it's an array and not just empty strings if entered)
    if (editable && !Array.isArray(childrenIds)) {
      newErrors.childrenIds = 'Children IDs must be a comma-separated list of IDs';
    } else if (editable && childrenIds.some(id => id.trim() === '')) {
      newErrors.childrenIds = 'Children IDs cannot be empty strings';
    }


    // Check for duplicates only if parentId is being created or if email/phone are being changed
    // Filter existing parents to exclude the current parent being edited
    if (existingParents) {
        existingParents
            .filter((p) => p.parentId !== data.parentId)
            .forEach((p) => {
                if (p.parentId?.toLowerCase() === trimmedParentId?.toLowerCase()) {
                    newErrors.parentId = 'Duplicate Parent ID found';
                }
                if (trimmedEmail && p.email?.toLowerCase() === trimmedEmail) {
                    newErrors.email = 'Duplicate Gmail ID found';
                }
                if (trimmedPhone && p.phone === trimmedPhone) {
                    newErrors.phone = 'Duplicate phone number found';
                }
            });
    }


    // Password validation (only in editable mode)
    // if (editable && (!password || password.length < 6)) {
    //   newErrors.password = 'Password must be at least 6 characters';
    // }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleChildrenIdsChange = (e) => {
    const { value } = e.target;
    // Split the comma-separated string into an array, trim each ID, and filter out empty strings
    const idsArray = value.split(',').map(id => id.trim()).filter(id => id !== '');
    setFormData((prev) => ({ ...prev, childrenIds: idsArray }));
    setErrors((prev) => ({ ...prev, childrenIds: '' }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setFormData((prev) => ({ ...prev, image: URL.createObjectURL(file) }));
    }
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const updatedData = {
      ...formData,
      // Trim string fields
      parentId: formData.parentId?.trim(),
      name: formData.name?.trim(),
      email: formData.email?.trim().toLowerCase(), // Store email in lowercase
      phone: formData.phone?.trim(),
      childrenIds: Array.isArray(formData.childrenIds) ? formData.childrenIds : [], // Ensure it's an array
      address: formData.address?.trim() || '', // Handle optional address
    };

    onUpdate(updatedData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[90%] md:w-[450px] max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">
          {editable ? 'Edit Parent Details' : 'Parent Details'}
        </h2>

        <div className="flex flex-col gap-3">
          {/* Parent ID field (always rendered) */}
          <div>
            <input
              name="parentId"
              value={formData.parentId}
              onChange={handleChange}
              disabled={!editable || (editable && data.parentId)}
              placeholder="Parent ID *"
              className={`p-2 border rounded w-full ${
                errors.parentId ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.parentId && (
              <p className="text-red-500 text-sm mt-1">{errors.parentId}</p>
            )}
          </div>

          {/* Password Field (only in editable mode) */}
          {editable && (
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Password *"
                className={`p-2 border rounded w-full ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-600"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
            </div>
          )}

          {/* Other fields (name, email, phone, address) */}
          {['name', 'email', 'phone', 'address'].map((field) => (
            <div key={field}>
              <input
                name={field}
                value={formData[field]}
                onChange={handleChange}
                disabled={!editable}
                placeholder={
                  `${field.charAt(0).toUpperCase() + field.slice(1)} ${
                    ['name'].includes(field) ? '*' : ''
                  }`
                }
                className={`p-2 border rounded w-full ${
                  errors[field] ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors[field] && (
                <p className="text-red-500 text-sm mt-1">{errors[field]}</p>
              )}
            </div>
          ))}

          {/* Children IDs field */}
          <div>
            {editable ? (
              <>
                <input
                  name="childrenIds"
                  value={Array.isArray(formData.childrenIds) ? formData.childrenIds.join(', ') : ''}
                  onChange={handleChildrenIdsChange}
                  placeholder="Children IDs (comma-separated)"
                  className={`p-2 border rounded w-full ${errors.childrenIds ? 'border-red-500' : 'border-gray-300'}`}
                  disabled={true}
                />
                {errors.childrenIds && (
                  <p className="text-red-500 text-sm mt-1">{errors.childrenIds}</p>
                )}
                {/* Show current children as user_id (name) for clarity */}
                {Array.isArray(data.children) && data.children.length > 0 && (
                  <div className="mt-2 text-xs text-gray-600">
                    <span>Current Children: </span>
                    {data.children.map(child => (
                      <span key={child.user_id} className="inline-block mr-2 bg-gray-100 px-2 py-1 rounded">
                        {child.user_id}{child.name ? ` (${child.name})` : ''}
                      </span>
                    ))}
                  </div>
                )}
              </>
            ) : (
              // View mode: show children as user_id (name)
              <div className="text-sm text-gray-700">
                {Array.isArray(data.children) && data.children.length > 0
                  ? data.children.map(child => (
                      <span key={child.user_id} className="inline-block mr-2 bg-gray-100 px-2 py-1 rounded">
                        {child.user_id}{child.name ? ` (${child.name})` : ''}
                      </span>
                    ))
                  : <span className="text-gray-400">No children linked</span>}
              </div>
            )}
          </div>


          {/* Image Upload */}
          {editable && (
            <div>
              <label className="block text-sm font-medium mb-1">Upload Image</label>
              <div
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file && file.type.startsWith('image/')) {
                    setFormData((prev) => ({
                      ...prev,
                      image: URL.createObjectURL(file),
                    }));
                  }
                }}
                onDragOver={(e) => e.preventDefault()}
                className="flex items-center justify-center p-4 border-2 border-dashed border-gray-400 rounded cursor-pointer bg-gray-50 hover:bg-gray-100 text-center"
                onClick={() => document.getElementById('fileInputEdit').click()}
              >
                {formData.image ? (
                  <img
                    src={formData.image}
                    alt="Preview"
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <p className="text-gray-600 text-sm">Drag & drop or click to upload</p>
                )}
              </div>
              <input
                id="fileInputEdit"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </div>
          )}

          {!editable && formData.image && (
            <img
              src={formData.image}
              alt="Parent"
              className="w-24 h-24 rounded-full object-cover mx-auto mt-3"
            />
          )}
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">Close</button>
          {editable && (
            <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded">
              Save
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ViewEditParent;