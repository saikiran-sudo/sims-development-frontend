import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Select from 'react-select'; // For better dropdowns
import { getAuthHeaders } from '../../../utils/axiosConfig'; // Keep getAuthHeaders for fetch

const DaysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const Periods = Array.from({ length: 10 }, (_, i) => `Period ${i + 1}`);

const CreateRegularScheduleModal = ({ initialData, onClose, onSave, teacherRegularSchedules }) => {
  const [formData, setFormData] = useState({
    weekDay: initialData?.dayOfWeek || DaysOfWeek[0],
    period: initialData?.period || Periods[0],
    subjectSlots: initialData ? [{
      subject: initialData.subject,
      startTime: initialData.startTime,
      endTime: initialData.endTime,
      period: initialData.period,
    }] : [],
  });

  const [newSubject, setNewSubject] = useState('');
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');
  const [subjects, setSubjects] = useState([]);

  const [errors, setErrors] = useState({});
  const [newSlotErrors, setNewSlotErrors] = useState({});
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'; // Fallback for development


  useEffect(() => {
    const fetchSubjects = async () => {
      const res = await axios.get(`${API_BASE_URL}/api/subjects/under-my-admin`, {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
      });
      setSubjects(res.data.map(a => ({ label: a.name, value: a.name })))
    }
    fetchSubjects();
  }, [])

  useEffect(() => {
    if (initialData) {
      setFormData({
        weekDay: initialData.dayOfWeek,
        period: initialData.period,
        subjectSlots: [{
          subject: initialData.subject,
          startTime: initialData.startTime,
          endTime: initialData.endTime,
          period: initialData.period,
        }],
      });
    } else {
      setFormData({
        weekDay: DaysOfWeek[0],
        period: Periods[0],
        subjectSlots: [],
      });
    }
    setNewSubject('');
    setNewStartTime('');
    setNewEndTime('');
    setErrors({});
    setNewSlotErrors({});
  }, [initialData, teacherRegularSchedules]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateNewSlotInputs = () => {
    let currentErrors = {};
    if (!newSubject.trim()) currentErrors.newSubject = 'Subject cannot be empty.';
    if (!newStartTime) currentErrors.newStartTime = 'Start time is required.';
    if (!newEndTime) currentErrors.newEndTime = 'End time is required.';

    if (newStartTime && newEndTime) {
      const start = new Date(`1970/01/01T${newStartTime}`);
      const end = new Date(`1970/01/01T${newEndTime}`);
      if (end <= start) {
        currentErrors.newEndTime = 'End time must be after start time.';
      }
    }
    setNewSlotErrors(currentErrors);
    return Object.keys(currentErrors).length === 0;
  };

  const handleAddSubjectSlot = () => {
    if (validateNewSlotInputs()) {
      setFormData(prev => ({
        ...prev,
        subjectSlots: [
          ...prev.subjectSlots,
          {
            subject: newSubject,
            startTime: newStartTime,
            endTime: newEndTime,
            period: prev.period,
          }
        ]
      }));
      setNewSubject('');
      setNewStartTime('');
      setNewEndTime('');
      setNewSlotErrors({});
      setErrors(prev => ({ ...prev, subjectSlots: '' }));
    }
  };

  const handleRemoveSubjectSlot = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      subjectSlots: prev.subjectSlots.filter((_, index) => index !== indexToRemove)
    }));
  };

  const validateForm = () => {
    let newErrors = {};
    if (!formData.weekDay) newErrors.weekDay = 'Week Day is required.';
    if (!formData.period) newErrors.period = 'Period is required.';
    if (formData.subjectSlots.length === 0) newErrors.subjectSlots = 'At least one subject slot is required.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };

  const allottedPeriods = (teacherRegularSchedules || [])
    .filter(schedule => schedule.dayOfWeek === formData.weekDay && schedule._id !== initialData?._id)
    .map(schedule => schedule.period);

  const availablePeriods = Periods.filter(period => !allottedPeriods.includes(period));

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4 font-sans animate-fade-in">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl p-8 relative transform scale-95 animate-scale-in flex flex-col max-h-[95vh]">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-6 text-center">
          {initialData ? 'Edit Regular Schedule' : 'Create New Regular Schedule'}
        </h2>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 text-3xl"
        >
          &times;
        </button>

        <div className="flex-1 overflow-y-auto pr-4">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Week Day
              </label>
              <select
                name="weekDay"
                value={formData.weekDay}
                onChange={handleChange}
                className={`mt-1 block w-full px-4 py-2 border rounded-md ${errors.weekDay ? 'border-red-500' : 'border-gray-300'}`}
              >
                {DaysOfWeek.map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
              {errors.weekDay && <p className="mt-1 text-sm font-bold text-red-600">{errors.weekDay}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Period
              </label>
              <select
                name="period"
                value={formData.period}
                onChange={handleChange}
                className={`mt-1 block w-full px-4 py-2 border rounded-md ${errors.period ? 'border-red-500' : 'border-gray-300'}`}
              >
                {
                  availablePeriods.map((period, index) => (
                    <option key={index} value={period}>{period}</option>
                  ))
                }
              </select>
              {errors.period && <p className="mt-1 text-sm font-bold text-red-600">{errors.period}</p>}
            </div>

            {formData.subjectSlots.length > 0 && (
              <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
                <h3 className="text-md font-semibold mb-3">Scheduled Subjects:</h3>
                <ul className="space-y-2">
                  {formData.subjectSlots.map((slot, index) => (
                    <li key={index} className="flex justify-between items-center bg-white p-3 rounded-md">
                      <span>{slot.period} - <strong>{slot.subject}</strong> ({slot.startTime} - {slot.endTime})</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubjectSlot(index)}
                        className="text-red-500 text-xl"
                      >
                        &times;
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {errors.subjectSlots && <p className="mt-1 text-sm font-bold text-red-600">{errors.subjectSlots}</p>}

            <div className="border-t pt-5 mt-5 border-gray-200">
              <h3 className="text-lg font-semibold mb-4">Add New Subject Slot</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Subject
                  </label>
                  <Select
                    options={subjects}
                    onChange={(e) => {
                      setNewSubject(e.value);
                    }}
                    className="basic-single bg-red"
                    classNamePrefix="select"
                    required
                  />
                  {newSlotErrors.newSubject && <p className="mt-1 text-sm font-bold text-red-600">{newSlotErrors.newSubject}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={newStartTime}
                    onChange={(e) => {
                      setNewStartTime(e.target.value);
                      if (newSlotErrors.newStartTime) setNewSlotErrors(prev => ({ ...prev, newStartTime: '' }));
                    }}
                    className={`mt-1 block w-full px-4 py-2 border rounded-md ${newSlotErrors.newStartTime ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {newSlotErrors.newStartTime && <p className="mt-1 text-sm font-bold text-red-600">{newSlotErrors.newStartTime}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={newEndTime}
                    onChange={(e) => {
                      setNewEndTime(e.target.value);
                      if (newSlotErrors.newEndTime) setNewSlotErrors(prev => ({ ...prev, newEndTime: '' }));
                    }}
                    className={`mt-1 block w-full px-4 py-2 border rounded-md ${newSlotErrors.newEndTime ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {newSlotErrors.newEndTime && <p className="mt-1 text-sm font-bold text-red-600">{newSlotErrors.newEndTime}</p>}
                </div>

                <div className="col-span-full md:col-span-1 flex justify-end md:justify-start">
                  <button
                    type="button"
                    onClick={handleAddSubjectSlot}
                    className="px-6 py-2 bg-green-500 text-white rounded-md"
                  >
                    Add Subject Slot
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="px-6 py-2 bg-blue-600 text-white rounded-md"
          >
            {initialData ? 'Update Schedule' : 'Create Schedule'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateRegularScheduleModal;