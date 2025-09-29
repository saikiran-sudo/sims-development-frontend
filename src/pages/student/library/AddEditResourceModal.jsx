import React, { useState, useRef, useCallback, useEffect } from 'react'; // Added useEffect
import { UploadCloud, X, FileText, Image, Video, Link } from 'lucide-react';
import Select from 'react-select';

const AddEditResourceModal = ({ initialData, onClose, onSave, classOptions }) => {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    subject: initialData?.subject || '',
    topic: initialData?.topic || '',
    classes: initialData?.classes || [],
    description: initialData?.description || '',
    type: initialData?.type || '',
    url: initialData?.url || '', // This will be used for 'link' type or simulated file name
  });

  // State for uploaded files, initialized based on initialData
  const [uploadedFiles, setUploadedFiles] = useState(() => {
    if (initialData && initialData.url && initialData.type !== 'link') {
      // Simulate a File object for pre-existing uploaded files
      // In a real app, you might fetch actual file metadata or just display the name.
      return [{ name: initialData.url, size: 0, type: 'application/octet-stream' }]; // dummy size and type
    }
    return [];
  });

  const fileInputRef = useRef(null);

  // Use an effect to update uploadedFiles if initialData.url changes for file types
  // This handles cases where the modal is reused without full unmount/mount or initialData changes.
  useEffect(() => {
    if (initialData && initialData.url && initialData.type !== 'link') {
      // Check if the current uploadedFiles already contains this initial file
      const isAlreadyPresent = uploadedFiles.some(file => file.name === initialData.url);
      if (!isAlreadyPresent) {
        setUploadedFiles([{ name: initialData.url, size: 0, type: 'application/octet-stream' }]);
      }
    } else if (initialData && initialData.type === 'link') {
      // If the type is link, clear uploaded files
      setUploadedFiles([]);
    } else {
      // If no initialData or no URL for file type, clear uploaded files
      setUploadedFiles([]);
    }
    // Ensure form data URL is consistent with initialData on mount/update
    setFormData(prev => ({
      ...prev,
      url: initialData?.url || '',
      type: initialData?.type || '',
      title: initialData?.title || '',
      subject: initialData?.subject || '',
      topic: initialData?.topic || '',
      classes: initialData?.classes || [],
      description: initialData?.description || '',
    }));
  }, [initialData]); // Depend on initialData to re-run when it changes

  const subjectOptions = [
    'Math', 'Science', 'English', 'History', 'Geography', 'Biology',
    'Chemistry', 'Physics', 'Computer Science', 'Art', 'Music', 'Drama',
  ].map(subject => ({ value: subject, label: subject }));


  const typeOptions = [
    { value: 'pdf', label: 'PDF Document' },
    { value: 'image', label: 'Image' },
    { value: 'video', label: 'Video' },
    { value: 'link', label: 'External Link' }
  ];

  const classSelectOptions = classOptions.map(cls => ({
    value: cls,
    label: cls
  }));

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    if (files.length > 0) {
      // For simplicity, we'll just take the first file for URL field if not a link
      setUploadedFiles(files);
      if (formData.type !== 'link') {
        setFormData(prev => ({ ...prev, url: files[0].name })); // Use file name as simulated URL
      }
    }
  };

  const handleDrop = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    const files = Array.from(event.dataTransfer.files);
    if (files.length > 0) {
      setUploadedFiles(files);
      if (formData.type !== 'link') {
        setFormData(prev => ({ ...prev, url: files[0].name }));
      }
    }
  }, [formData.type]);

  const handleDragOver = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleRemoveFile = (fileName) => {
    setUploadedFiles(prev => prev.filter(file => file.name !== fileName));
    // Clear URL if the removed file was the one populating it
    if (formData.url === fileName) {
      setFormData(prev => ({ ...prev, url: '' }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const resourceToSave = { ...formData };
    if (formData.type !== 'link' && uploadedFiles.length > 0) {
      resourceToSave.url = uploadedFiles[0].name;
    } else if (formData.type !== 'link' && uploadedFiles.length === 0) {
        // If type is file-based but no file is selected, clear URL
        resourceToSave.url = '';
    }
    onSave(resourceToSave);
  };

  const getFileTypeIcon = (type) => {
    switch (type) {
      case 'pdf': return <FileText size={20} className="text-red-500" />;
      case 'image': return <Image size={20} className="text-blue-500" />;
      case 'video': return <Video size={20} className="text-green-500" />;
      case 'link': return <Link size={20} className="text-purple-500" />;
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center border-b p-4 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-800">
            {initialData ? 'Edit Resource' : 'Add New Resource'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-grow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., Understanding Photosynthesis"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <Select
                options={subjectOptions}
                value={subjectOptions.find(opt => opt.value === formData.subject)}
                onChange={(selected) => setFormData({ ...formData, subject: selected.value })}
                placeholder="Select subject..."
                className="basic-single"
                classNamePrefix="select"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
            <input
              type="text"
              name="topic"
              value={formData.topic}
              onChange={handleInputChange}
              placeholder="e.g., Cell Structure, Equations"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Useful to Classes</label>
            <Select
              isMulti
              options={classSelectOptions}
              value={classSelectOptions.filter(opt => formData.classes.includes(opt.value))}
              onChange={(selected) => setFormData({
                ...formData,
                classes: selected.map(opt => opt.value)
              })}
              placeholder="Select classes..."
              className="basic-multi-select"
              classNamePrefix="select"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Briefly describe the resource content."
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="border-t pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resource Type</label>
                <Select
                  options={typeOptions}
                  value={typeOptions.find(opt => opt.value === formData.type)}
                  onChange={(selected) => {
                    setFormData({ ...formData, type: selected.value, url: '' }); // Clear URL when type changes
                    setUploadedFiles([]); // Clear uploaded files when type changes
                  }}
                  placeholder="Select Type"
                  className="basic-single"
                  classNamePrefix="select"
                />
              </div>

              {/* Conditional rendering based on resource type */}
              {formData.type === 'link' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">External URL</label>
                  <div className="relative">
                    <input
                      type="text"
                      name="url"
                      value={formData.url}
                      onChange={handleInputChange}
                      placeholder="e.g., https://wikipedia.org/wiki/World_War_II"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  </div>
                </div>
              ) : (formData.type && formData.type !== 'link') ? (
                <div className="col-span-full">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Upload Files</label>
                  <p className="text-xs text-gray-500 mb-3">Max file size: 10MB | Max files: 10 | Supported formats: PDF, DOCX, JPG, PNG, ZIP</p>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current.click()}
                    className="mb-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg flex items-center shadow-sm transition duration-300 ease-in-out"
                  >
                    <UploadCloud className="mr-2 text-xl" />
                    Add Files
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    multiple
                    accept={
                      formData.type === 'pdf' ? '.pdf' :
                      formData.type === 'image' ? '.jpg,.jpeg,.png,.gif' :
                      formData.type === 'video' ? '.mp4,.mov,.avi,.mkv' :
                      '*/*'
                    }
                  />

                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onClick={() => fileInputRef.current.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 transition duration-200 ease-in-out"
                  >
                    <UploadCloud className="mx-auto text-gray-400 mb-3" size={48} />
                    <p className="text-gray-600 mb-1">Drag and drop files here, or click to browse</p>
                    <p className="text-sm text-gray-500">Supports multiple files</p>
                  </div>

                  {uploadedFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-medium text-gray-700">Selected Files:</p>
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-100 p-2 rounded-md">
                          <span className="text-sm text-gray-800 flex items-center">
                            {getFileTypeIcon(formData.type)}
                            <span className="ml-2">{file.name}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(file.name)}
                            className="text-gray-500 hover:text-red-600 ml-2"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="col-span-full text-sm text-gray-500 flex items-center justify-center p-4 border rounded-md bg-gray-50">
                  Please select a Resource Type to proceed with file upload or URL input.
                </div>
              )}
            </div>

            <div className="text-xs text-gray-500 mt-4 col-span-full">
              <p>* For PDFs, Images, Videos: Upload the file using the section above.</p>
              <p>* For External Links: Enter the full URL (e.g., 'https://example.com/resource')</p>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              {initialData ? 'Update Resource' : 'Add Resource'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditResourceModal;