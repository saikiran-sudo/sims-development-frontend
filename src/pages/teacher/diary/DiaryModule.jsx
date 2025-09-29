// DiaryModule.jsx
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { FiPlus, FiEdit, FiTrash2 } from 'react-icons/fi';
import { format, parseISO } from 'date-fns';
import axios from 'axios';
import { CreateEditHomeworkModal, CreateEditPersonalDiaryModal } from './AddDiary';

// Access API_BASE_URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'; // Fallback for development

const DiaryModule = () => {
    const tabs = ["Home Work Diary", "Personal Diary"];
    const [activeTab, setActiveTab] = useState(tabs[0]);
    const userprofileval = JSON.parse(localStorage.getItem('userprofile'));

    const currentTeacherId = userprofileval.user_id;

    // --- State for Home Work Diary ---
    const [homeworkEntries, setHomeworkEntries] = useState([]);
    const [showHomeworkModal, setShowHomeworkModal] = useState(false);
    const [editingHomework, setEditingHomework] = useState(null);

    // --- State for Personal Diary ---
    const [personalNotes, setPersonalNotes] = useState([]);
    const [showPersonalDiaryModal, setShowPersonalDiaryModal] = useState(false);
    const [editingPersonalNote, setEditingPersonalNote] = useState(null);
    const [totalSubjects, setTotalSubjects] = useState([])


    // const subjectOptions = [
    //     'Math', 'Science', 'English', 'History', 'Geography', 'Biology',
    //     'Chemistry', 'Physics', 'Computer Science', 'Art', 'Music', 'Drama',
    // ];

    // --- Fetch data on mount ---
    useEffect(() => {
        const token = JSON.parse(localStorage.getItem('authToken'));

        
        axios.get(`${API_BASE_URL}/api/subjects/under-my-admin`, {
            params: { teacherId: currentTeacherId },
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => setTotalSubjects(res.data))
            .catch(err => console.error('Error fetching subjects:', err));
        
        // Fetch homework entries
        axios.get(`${API_BASE_URL}/api/diary/homework`, {
            params: { teacherId: currentTeacherId },
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => setHomeworkEntries(res.data))
            .catch(err => console.error('Error fetching homework:', err));
        // Fetch personal notes
        axios.get(`${API_BASE_URL}/api/diary/personal`, {
            params: { teacherId: currentTeacherId },
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => setPersonalNotes(res.data))
            .catch(err => console.error('Error fetching personal notes:', err));
    }, [currentTeacherId]);

    
    const subjectOptions = totalSubjects.map(t => t.name);



    // --- Home Work Diary Handlers ---
    const handleAddEditHomework = (entry = null) => {
        setEditingHomework(entry);
        setShowHomeworkModal(true);
    };

    const handleSaveHomework = async (assignmentsFromModal) => {
        const token = JSON.parse(localStorage.getItem('authToken'));
        try {
            let updatedHomeworkEntries = [...homeworkEntries];
            const newEntriesToAdd = [];
            for (const assignment of assignmentsFromModal) {
                if (editingHomework && assignment._id === editingHomework._id) {
                    // Update
                    const res = await axios.put(`${API_BASE_URL}/api/diary/homework/${editingHomework._id}`, {
                        ...assignment,
                        teacherId: currentTeacherId
                    }, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    updatedHomeworkEntries = updatedHomeworkEntries.map(entry =>
                        entry._id === editingHomework._id ? res.data : entry
                    );
                } else {
                    // Add
                    const res = await axios.post(`${API_BASE_URL}/api/diary/homework`, {
                        ...assignment,
                        teacherId: currentTeacherId
                    }, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    newEntriesToAdd.push(res.data);
                }
            }
            setHomeworkEntries([...updatedHomeworkEntries, ...newEntriesToAdd]);
        } catch (err) {
            console.error('Error saving homework:', err);
        }
        setShowHomeworkModal(false);
        setEditingHomework(null);
    };

    const handleDeleteHomework = async (id) => {
        const token = JSON.parse(localStorage.getItem('authToken'));
        if (window.confirm("Are you sure you want to delete this homework entry?")) {
            try {
                await axios.delete(`${API_BASE_URL}/api/diary/homework/${id}`, {
                    data: { teacherId: currentTeacherId },
                    headers: { Authorization: `Bearer ${token}` }
                });
                setHomeworkEntries(prev => prev.filter(e => e._id !== id));
            } catch (err) {
                console.error('Error deleting homework:', err);
            }
        }
    };

    const filteredHomeworkEntries = useMemo(() => {
        return homeworkEntries
            .filter(entry => entry.teacherId === currentTeacherId)
            .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
    }, [homeworkEntries, currentTeacherId]);

    // Group homework entries by date
    const groupedHomeworkEntries = useMemo(() => {
        const groups = {};
        filteredHomeworkEntries.forEach(entry => {
            if (!groups[entry.date]) {
                groups[entry.date] = [];
            }
            groups[entry.date].push(entry);
        });
        // Sort dates in descending order for display
        return Object.entries(groups).sort(([dateA], [dateB]) => parseISO(dateB).getTime() - parseISO(dateA).getTime());
    }, [filteredHomeworkEntries]);

    // --- Personal Diary Handlers ---
    const handleAddEditPersonalNote = (note = null) => {
        setEditingPersonalNote(note);
        setShowPersonalDiaryModal(true);
    };

    const handleSavePersonalNote = async (data) => {
        const token = JSON.parse(localStorage.getItem('authToken'));
        try {
            if (editingPersonalNote && editingPersonalNote._id) {
                // Update
                const res = await axios.put(`${API_BASE_URL}/api/diary/personal/${editingPersonalNote._id}`, {
                    ...data,
                    teacherId: currentTeacherId
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setPersonalNotes(prev => prev.map(n => (n._id === editingPersonalNote._id ? res.data : n)));
            } else {
                // Add
                const res = await axios.post(`${API_BASE_URL}/api/diary/personal`, {
                    ...data,
                    teacherId: currentTeacherId
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setPersonalNotes(prev => [...prev, res.data]);
            }
        } catch (err) {
            console.error('Error saving personal note:', err);
        }
        setShowPersonalDiaryModal(false);
        setEditingPersonalNote(null);
    };

    const handleDeletePersonalNote = async (id) => {
        const token = JSON.parse(localStorage.getItem('authToken'));
        if (window.confirm("Are you sure you want to delete this personal note?")) {
            try {
                await axios.delete(`${API_BASE_URL}/api/diary/personal/${id}`, {
                    data: { teacherId: currentTeacherId },
                    headers: { Authorization: `Bearer ${token}` }
                });
                setPersonalNotes(prev => prev.filter(n => n._id !== id));
            } catch (err) {
                console.error('Error deleting personal note:', err);
            }
        }
    };

    const filteredPersonalNotes = useMemo(() => {
        return personalNotes
            .filter(note => note.teacherId === currentTeacherId)
            .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
    }, [personalNotes, currentTeacherId]);

    return (
        <div className="px-0 sm:px-2 md:px-4 lg:p-6 flex flex-col gap-2 sm:gap-4 lg:gap-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">My Diary</h1>
                {activeTab === "Home Work Diary" && (
                    <button
                        onClick={() => handleAddEditHomework(null)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center shadow-md transition duration-300 ease-in-out transform hover:scale-105"
                    >
                        <FiPlus className="mr-2 text-xl" />
                        Add Homework
                    </button>
                )}
                {activeTab === "Personal Diary" && (
                    <button
                        onClick={() => handleAddEditPersonalNote(null)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center shadow-md transition duration-300 ease-in-out transform hover:scale-105"
                    >
                        <FiPlus className="mr-2 text-xl" />
                        Add Personal Note
                    </button>
                )}
            </div>

            {/* Navigation Tabs */}
            <div className="flex flex-wrap gap-1 border-b border-gray-200 mb-6 sticky top-0 bg-gray-50 z-10 p-1 -mx-6 w-[calc(100%+3rem)]">
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 font-medium rounded-t-lg transition duration-200 ease-in-out text-sm md:text-base
                            ${activeTab === tab
                                ? 'text-blue-600 border-b-2 border-blue-600 bg-white shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Tab Content Area */}
            {activeTab === "Home Work Diary" && (
                <>
                    {console.log('homework tab val ', Object.keys(groupedHomeworkEntries).length)}
                    {Object.keys(groupedHomeworkEntries).length === 0 ? (
                        <div className="text-center text-gray-500 py-10">No homework assignments found. Click "Add Homework" to add one!</div>
                    ) : (
                        <div className="space-y-6">
                            {groupedHomeworkEntries.map(([date, entriesForDate]) => (
                                <div key={date} className="">
                                    <h3 className="text-xl font-bold text-blue-800 mb-4 pb-2 border-b border-blue-300">
                                        Homework for: {format(parseISO(date), 'MMM dd, yyyy')}
                                    </h3>
                                    <div className="space-y-4"> {/* Space between homework entries for the same date */}
                                        {entriesForDate.map(entry => (
                                            <div key={entry._id} className="border border-gray-200 rounded-md p-4 bg-white flex flex-col">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-base font-semibold text-gray-700">
                                                            {entry.classSelected} (Section: {entry.sectionSelected})
                                                        </h4>
                                                    </div>
                                                    <div className="flex-shrink-0 flex space-x-2">
                                                        <button
                                                            onClick={() => handleAddEditHomework(entry)}
                                                            className="bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1 rounded-md text-sm font-medium transition duration-200 flex items-center"
                                                        >
                                                            <FiEdit className="mr-1" /> Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteHomework(entry._id)}
                                                            className="bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1 rounded-md text-sm font-medium transition duration-200 flex items-center"
                                                        >
                                                            <FiTrash2 className="mr-1" /> Delete
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="space-y-2 text-sm text-gray-700 mt-2">
                                                    {entry.homeworkItems.map((item, idx) => (
                                                        <div key={idx} className="bg-gray-50 p-3 rounded-md border border-gray-100 shadow-sm">
                                                            <p><span className="font-semibold">{item.subject}:</span> {item.homework}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {activeTab === "Personal Diary" && (
                <>
                    {filteredPersonalNotes.length === 0 ? (
                        <div className="text-center text-gray-500 py-10">No personal notes found. Click "Add Personal Note" to add one!</div>
                    ) : (
                        <div className="space-y-4">
                            {filteredPersonalNotes.map(note => (
                                <div key={note._id} className="border border-gray-200 rounded-md p-4 bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                                    <div className="flex-1 min-w-0 mb-2 sm:mb-0">
                                        <p className="text-xs text-gray-500">{format(parseISO(note.date), 'MMM dd, yyyy')}</p>
                                        <h3 className="text-lg font-semibold text-gray-800 truncate">{note.title}</h3>
                                        <p className="text-gray-700 text-sm break-words">{note.content}</p>
                                    </div>
                                    <div className="flex-shrink-0 flex space-x-2">
                                        <button
                                            onClick={() => handleAddEditPersonalNote(note)}
                                            className="bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1 rounded-md text-sm font-medium transition duration-200 flex items-center"
                                        >
                                            <FiEdit className="mr-1" /> Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeletePersonalNote(note._id)}
                                            className="bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1 rounded-md text-sm font-medium transition duration-200 flex items-center"
                                        >
                                            <FiTrash2 className="mr-1" /> Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Modals */}
            {showHomeworkModal && (
                <CreateEditHomeworkModal
                    initialData={editingHomework}
                    onClose={() => { setShowHomeworkModal(false); setEditingHomework(null); }}
                    onSave={handleSaveHomework}
                    subjectOptions={subjectOptions}
                />
            )}

            {showPersonalDiaryModal && (
                <CreateEditPersonalDiaryModal
                    initialData={editingPersonalNote}
                    onClose={() => { setShowPersonalDiaryModal(false); setEditingPersonalNote(null); }}
                    onSave={handleSavePersonalNote}
                />
            )}
        </div>
    );
};

export default DiaryModule;