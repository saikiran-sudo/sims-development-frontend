// AddDiary.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { FiPlus, FiTrash2, FiX } from 'react-icons/fi';
import { format } from 'date-fns';
import Select from 'react-select'; // For better dropdowns
import { classAPI } from '../../../services/api';
import axios from 'axios';
import { getAuthHeaders } from '../../../utils/axiosConfig'; // Keep getAuthHeaders for fetch

// Helper to create an empty homework entry block (without date)
const createEmptyHomeworkEntry = () => ({
    id: `temp-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    classSelected: '',
    sectionSelected: '',
    homeworkItems: [{ subject: '', homework: '' }],
});

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'; // Fallback for development

// Component for adding/editing Homework Diary entry
export const CreateEditHomeworkModal = ({ initialData, onClose, onSave, subjectOptions }) => {
    // State for the single date for all homework in this session
    const [selectedDate, setSelectedDate] = useState(initialData?.date || format(new Date(), 'yyyy-MM-dd'));

    // State to manage multiple homework entries within the modal (without date)
    const [homeworkEntriesInModal, setHomeworkEntriesInModal] = useState([]);
    const [sectionOptions, setSectionOptions] = useState([]);
    const [classSection, setClassSection] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [subjects,setSubjects] = useState([]);
    const [getClasses, setClasses] = useState([]);
    const [getdata,setData] = useState([]);


    useEffect(() => {
        const fetchClassOptions = async () => {
            const response = await classAPI.getAllClassesUnderMyAdmin();
            setClassSection(response.data || response);

            const uniqueSections = Array.from(
                new Map(
                    (response.data || response).map(cls => [
                        cls.section || cls.name || cls.label || cls.value,
                        cls
                    ])
                ).values()
            );
            const sectionOptions = uniqueSections.map(section => ({
                label: section.section || section.name || section.label || section.value,
                value: section.section || section.name || section.label || section.value
            }));
            setSectionOptions(sectionOptions);
        };
        fetchClassOptions();
    }, []);

    useState(() => {
        const fetchAssignedClasses = async () => {
            const res = await axios.get(`${API_BASE_URL}/api/subjects/under-my-admin`, {
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json',
                },
            });
            
            setData(res.data);
            const uniqueClasses = Array.from(
                new Map(
                    (res.data || res).map(cls => [
                        cls.className || cls.name || cls.label || cls.value,
                        cls
                    ])
                ).values()
            );
            const options = uniqueClasses.map(cls => ({
                label: cls.className || cls.name || cls.label || cls.value,
                value: cls.className || cls.name || cls.label || cls.value
            }));
            setClasses(options);

        }
        fetchAssignedClasses();
    }, []);

    useEffect(() => {
        if (selectedClass) {
            const sections = classSection.filter(cls => cls.class_name === selectedClass);
            setSectionOptions(sections.map(sec => ({
                label: sec.section || sec.name || sec.label || sec.value,
                value: sec.section || sec.name || sec.label || sec.value
            })));
            const subjects = getdata.filter(a => a.className === selectedClass);
            
            setSubjects(subjects.map(a=>({
                label: a.name,
                value: a.name
            })));
        }
    }, [selectedClass])

    // Initialize homeworkEntriesInModal based on initialData (for editing) or create a fresh one
    useEffect(() => {
        if (initialData) {
            // When editing, initialData is a single homework entry. Wrap it in an array.
            setHomeworkEntriesInModal([initialData]);
            // Set the date from the initialData
            setSelectedDate(initialData.date);
        } else {
            // For new entries, start with one empty homework entry block
            setHomeworkEntriesInModal([createEmptyHomeworkEntry()]);
            // Set date to today for new entries
            setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
        }
    }, [initialData]);

    const today = format(new Date(), 'yyyy-MM-dd');

    // const formattedSubjectOptions = subjectOptions.map(sub => ({ value: sub, label: sub }));


    // Handlers for modifying individual homework blocks (class/section only)
    const handleHomeworkEntryChange = (entryIndex, field, value) => {
        const newHomeworkEntries = [...homeworkEntriesInModal];
        newHomeworkEntries[entryIndex] = { ...newHomeworkEntries[entryIndex], [field]: value };
        setHomeworkEntriesInModal(newHomeworkEntries);
    };

    // Handlers for modifying homework items within a specific homework entry block
    const handleHomeworkItemChange = (entryIndex, homeworkItemIndex, field, value) => {
        const newHomeworkEntries = [...homeworkEntriesInModal];
        const newHomeworkItems = [...newHomeworkEntries[entryIndex].homeworkItems];
        newHomeworkItems[homeworkItemIndex] = { ...newHomeworkItems[homeworkItemIndex], [field]: value };
        newHomeworkEntries[entryIndex].homeworkItems = newHomeworkItems;
        setHomeworkEntriesInModal(newHomeworkEntries);
    };

    const addHomeworkItemToEntry = (entryIndex) => {
        const newHomeworkEntries = [...homeworkEntriesInModal];
        newHomeworkEntries[entryIndex].homeworkItems.push({ subject: '', homework: '' });
        setHomeworkEntriesInModal(newHomeworkEntries);
    };

    const removeHomeworkItemFromEntry = (entryIndex, homeworkItemIndex) => {
        const newHomeworkEntries = [...homeworkEntriesInModal];
        const newHomeworkItems = newHomeworkEntries[entryIndex].homeworkItems.filter((_, i) => i !== homeworkItemIndex);
        newHomeworkEntries[entryIndex].homeworkItems = newHomeworkItems.length > 0 ? newHomeworkItems : [{ subject: '', homework: '' }];
        setHomeworkEntriesInModal(newHomeworkEntries);
    };

    // Handler for adding a completely new homework entry block for another class/section
    const addAnotherHomeworkEntryBlock = () => {
        setHomeworkEntriesInModal(prev => [...prev, createEmptyHomeworkEntry()]);
    };

    // Handler for removing an entire homework entry block
    const removeHomeworkEntryBlock = (entryIndex) => {
        if (homeworkEntriesInModal.length === 1) {
            alert("You must have at least one homework entry.");
            return;
        }
        setHomeworkEntriesInModal(prev => prev.filter((_, i) => i !== entryIndex));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validate all homework entry blocks
        for (const entry of homeworkEntriesInModal) {
            if (!entry.classSelected) {
                alert("Please select a class for all homework entries.");
                return;
            }
            if (!entry.sectionSelected) {
                alert("Please select a section for all homework entries.");
                return;
            }
            const hasEmptyItems = entry.homeworkItems.some(item => !item.subject || !item.homework);
            if (hasEmptyItems) {
                alert("Please fill in all subject and homework details, or remove empty homework items for all entries.");
                return;
            }
        }

        // Add the single selectedDate to each homework entry before saving
        const homeworkToSave = homeworkEntriesInModal.map(entry => ({
            ...entry,
            date: selectedDate, // Assign the single selected date to all
        }));

        onSave(homeworkToSave);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl flex flex-col max-h-[95vh]">
                <div className="flex justify-between items-center border-b p-4 flex-shrink-0">
                    <h2 className="text-xl font-semibold text-gray-800">
                        {initialData ? 'Edit Homework Entries' : 'Add New Homework Entries'}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <FiX size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-grow">
                    {/* Single Date Selector for all homework */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date for all Homework</label>
                        <input
                            type="date"
                            name="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            min={today}
                            required
                        />
                    </div>

                    {homeworkEntriesInModal.map((entry, entryIndex) => (
                        <div key={entry.id} className="border border-blue-200 rounded-md p-4 bg-blue-50 shadow-sm relative">
                            {/* Remove Homework Entry Block button */}
                            {homeworkEntriesInModal.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeHomeworkEntryBlock(entryIndex)}
                                    className="absolute top-2 right-2 text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 transition"
                                    title="Remove this homework entry block"
                                >
                                    <FiTrash2 size={20} />
                                </button>
                            )}
                            <h3 className="text-lg font-bold text-blue-800 mb-4 pr-10">
                                Homework Entry {entryIndex + 1}
                                {initialData && entry.id === initialData.id && " (Editing this one)"}
                            </h3>

                            {/* Class, Section Inputs for THIS homework entry block */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Class</label>
                                    <Select
                                        options={getClasses}
                                        value={getClasses.find(opt => opt.value === entry.classSelected)}
                                        onChange={(selected) => {
                                            handleHomeworkEntryChange(entryIndex, 'classSelected', selected ? selected.value : '')
                                            setSelectedClass(selected ? selected.value : '');
                                        }}
                                        placeholder="Select Class..."
                                        className="basic-single"
                                        classNamePrefix="select"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Section</label>
                                    <Select
                                        options={sectionOptions}
                                        value={sectionOptions.find(opt => opt.value === entry.sectionSelected)}
                                        onChange={(selected) => handleHomeworkEntryChange(entryIndex, 'sectionSelected', selected ? selected.value : '')}
                                        placeholder="Select Section..."
                                        className="basic-single"
                                        classNamePrefix="select"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Homework Details per Subject for THIS homework entry block */}
                            <div className="border-t pt-4">
                                <h4 className="text-md font-semibold text-gray-700 mb-3">Homework Details per Subject</h4>
                                {entry.homeworkItems.map((item, homeworkItemIndex) => (
                                    <div key={homeworkItemIndex} className="flex flex-col sm:flex-row gap-3 mb-4 p-3 border border-gray-200 rounded-md bg-white shadow-sm">
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                                            <Select
                                                options={subjects}
                                                value={subjects.find(opt => opt.value === item.subject)}
                                                onChange={(selected) => handleHomeworkItemChange(entryIndex, homeworkItemIndex, 'subject', selected ? selected.value : '')}
                                                placeholder="Select subject..."
                                                className="basic-single"
                                                classNamePrefix="select"
                                                required
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Homework Details</label>
                                            <textarea
                                                value={item.homework}
                                                onChange={(e) => handleHomeworkItemChange(entryIndex, homeworkItemIndex, 'homework', e.target.value)}
                                                placeholder="e.g., Read pages 10-15 and answer questions 1-5."
                                                rows="2"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                required
                                            ></textarea>
                                        </div>
                                        {entry.homeworkItems.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeHomeworkItemFromEntry(entryIndex, homeworkItemIndex)}
                                                className="flex-shrink-0 self-end sm:self-start bg-red-100 text-red-600 hover:bg-red-200 px-2 py-1.5 rounded-md text-sm font-medium transition duration-200"
                                                title="Remove this homework item"
                                            >
                                                <FiTrash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                ))}

                                <button
                                    type="button"
                                    onClick={() => addHomeworkItemToEntry(entryIndex)}
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg flex items-center shadow-sm transition duration-300 ease-in-out mt-2"
                                >
                                    <FiPlus className="mr-2 text-xl" />
                                    Add Another Subject's Homework
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* Button to add another homework entry block */}
                    <button
                        type="button"
                        onClick={addAnotherHomeworkEntryBlock}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center shadow-md transition duration-300 ease-in-out mt-4 w-full justify-center"
                    >
                        <FiPlus className="mr-2 text-xl" /> Add Another Homework Entry
                    </button>

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
                            {initialData ? 'Update Homework' : 'Add Homework'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Component for adding/editing Personal Diary entry (remains unchanged)
export const CreateEditPersonalDiaryModal = ({ initialData, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        date: initialData?.date || format(new Date(), 'yyyy-MM-dd'),
        title: initialData?.title || '',
        content: initialData?.content || '',
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    const today = format(new Date(), 'yyyy-MM-dd');

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-xl flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center border-b p-4 flex-shrink-0">
                    <h2 className="text-xl font-semibold text-gray-800">
                        {initialData ? 'Edit Personal Note' : 'Add New Personal Note'}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <FiX size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-grow">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                        <input
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            min={today}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            placeholder="e.g., Meeting notes, To-do list"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                        <textarea
                            name="content"
                            value={formData.content}
                            onChange={handleInputChange}
                            placeholder="Write your personal notes here..."
                            rows="8"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            required
                        ></textarea>
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
                            {initialData ? 'Update Note' : 'Add Note'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};