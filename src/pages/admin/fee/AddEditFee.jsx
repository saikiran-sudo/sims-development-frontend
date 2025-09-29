// AddEditFee.jsx
import React from 'react';
import { Plus, Edit, X } from 'lucide-react';
import Select from 'react-select';

const AddEditFee = ({
  showModal,
  isEditMode,
  formData,
  handleInputChange,
  handleSubmit,
  onClose,
  handleTermCheckboxChange,
  students = [],
  onStudentSelect = () => { }
}) => {
  if (!showModal) return null;

  // Calculate distributed amounts for display in Edit mode
  const totalFee = Number(formData.amount) || 0;
  const termAmount = totalFee > 0 ? Math.round(totalFee / 3) : 0;
  const term1DisplayAmount = formData.term1Amount || termAmount;
  const term2DisplayAmount = formData.term2Amount || termAmount;
  const term3DisplayAmount = formData.term3Amount || (totalFee - (term1DisplayAmount + term2DisplayAmount));

  // Get today's date in YYYY-MM-DD format for max attribute on date inputs
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 py-8"> {/* Added py-8 here */}
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm sm:max-w-2xl transform transition-all duration-300 scale-100 mx-auto max-h-[90vh] overflow-y-auto"> {/* Added max-h and overflow-y-auto */}
        <div className="p-4 sm:p-6">
          <div className="flex justify-between items-center border-b pb-3 mb-3 sm:pb-4 sm:mb-4">
            <h3 className="text-xl font-bold text-gray-900 flex items-center sm:text-2xl">
              {isEditMode ? (
                <>
                  <Edit size={20} className="inline mr-2 text-indigo-600 sm:mr-3" /> Edit Fee Record
                </>
              ) : (
                <>
                  <Plus size={20} className="inline mr-2 text-indigo-600 sm:mr-3" /> Add New Fee Record
                </>
              )}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition duration-200"
              title="Close"
            >
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {/* Student Dropdown */}
            {!isEditMode && (
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Student <span className="text-red-500">*</span></label>
                <Select
                  isDisabled={isEditMode}
                  options={students.map(s => ({ value: s._id, label: `${s.full_name} (${s.admission_number})` }))}
                  value={students.length > 0 && formData.studentId ? students.map(s => ({ value: s._id, label: `${s.full_name} (${s.admission_number})` })).find(opt => opt.value === formData.studentId) : null}
                  onChange={onStudentSelect}
                  placeholder="Select student..."
                  isClearable={!isEditMode}
                />
              </div>
            )}
            {/* Remove manual Student ID and Name inputs in add mode */}
            {isEditMode && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
                  <input
                    type="text"
                    name="studentId"
                    value={formData.studentId}
                    disabled
                    className="w-full border rounded-lg p-2.5 text-sm bg-gray-100 cursor-not-allowed border-gray-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Student Name</label>
                  <input
                    type="text"
                    name="studentName"
                    value={formData.studentName}
                    disabled
                    className="w-full border rounded-lg p-2.5 text-sm bg-gray-100 cursor-not-allowed border-gray-200"
                  />
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="class"
                  value={formData.class}
                  onChange={handleInputChange}
                  className={`w-full border rounded-lg p-2.5 text-sm focus:ring-indigo-500 focus:border-indigo-500 ${isEditMode ? 'bg-gray-100 cursor-not-allowed border-gray-200' : 'border-gray-300'}`}
                  required
                  placeholder="e.g., 10"
                  disabled={isEditMode} // Made read-only in edit mode
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Section <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="section"
                  value={formData.section}
                  onChange={handleInputChange}
                  className={`w-full border rounded-lg p-2.5 text-sm focus:ring-indigo-500 focus:border-indigo-500 ${isEditMode ? 'bg-gray-100 cursor-not-allowed border-gray-200' : 'border-gray-300'}`}
                  required
                  placeholder="e.g., A"
                  disabled={isEditMode} // Made read-only in edit mode
                />
              </div>
            </div>

            {/* Conditional rendering for Add vs Edit */}
            {!isEditMode ? (
              // Add Mode: Total Fee, and Due Dates (Payment Date removed)
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Fee (₹) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                    required
                    min="0"
                    placeholder="e.g., 15000"
                  />
                </div>
                <div className="col-span-full border-t pt-4 mt-4">
                  <h4 className="text-md font-semibold text-gray-800 mb-3">Due Dates (Optional)</h4> {/* Changed title to Due Dates */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4"> {/* Arranged side-by-side */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">1st Term Due Date</label> {/* Changed label */}
                      <input
                        type="date"
                        name="term1DueDate" // Keep the name as term1DueDate
                        value={formData.term1DueDate}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">2nd Term Due Date</label> {/* Changed label */}
                      <input
                        type="date"
                        name="term2DueDate" // Keep the name as term2DueDate
                        value={formData.term2DueDate}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">3rd Term Due Date</label> {/* Changed label */}
                      <input
                        type="date"
                        name="term3DueDate" // Keep the name as term3DueDate
                        value={formData.term3DueDate}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Edit Mode: Total Fee (Read-only), Term-wise Fee (Read-only, calculated) with checkboxes, Payment Date/Method/Due Date
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Fee (₹)</label>
                  <input
                    type="number"
                    name="amount"
                    value={totalFee}
                    className="w-full border rounded-lg p-2.5 text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-gray-100 cursor-not-allowed border-gray-200"
                    readOnly
                  />
                </div>
                <p className="block text-sm font-medium text-gray-700 mb-3">Manage Term Payments:</p>

                {/* Term 1 */}
                <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="term1Paid"
                        name="term1Paid"
                        checked={formData.term1Paid}
                        onChange={handleTermCheckboxChange}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        // Disable if already paid AND has a payment date
                        disabled={formData.term1Status === 'Paid' && formData.term1PaymentDate}
                      />
                      <label htmlFor="term1Paid" className="ml-2 text-sm font-medium text-gray-700">1st Term Fee:</label>
                    </div>
                    <span className="font-semibold text-gray-800">₹{term1DisplayAmount.toLocaleString()}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3"> {/* Changed to 3 columns for due date */}
                    <div>
                      <label htmlFor="term1PaymentDate" className="block text-xs font-medium text-gray-600 mb-1">Payment Date</label>
                      <input
                        type="date"
                        id="term1PaymentDate"
                        name="term1PaymentDate"
                        value={formData.term1PaymentDate}
                        onChange={handleInputChange}
                        max={today}
                        className={`w-full border rounded-lg p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500 ${!formData.term1Paid ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300'}`}
                        disabled={!formData.term1Paid}
                      />
                    </div>
                    <div>
                      <label htmlFor="term1PaymentMethod" className="block text-xs font-medium text-gray-600 mb-1">Payment Method</label>
                      <select
                        id="term1PaymentMethod"
                        name="term1PaymentMethod"
                        value={formData.term1PaymentMethod}
                        onChange={handleInputChange}
                        className={`w-full border rounded-lg p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500 ${!formData.term1Paid ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300'}`}
                        disabled={!formData.term1Paid}
                      >
                        <option value="">Select Method</option>
                        <option value="Cash">Cash</option>
                        <option value="Cheque">Cheque</option>
                        <option value="Online">Online</option>
                        <option value="Card">Card</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="term1DueDate" className="block text-xs font-medium text-gray-600 mb-1">Due Date</label>
                      <input
                        type="date"
                        id="term1DueDate"
                        name="term1DueDate"
                        value={formData.term1DueDate}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  {formData.term1Status === 'Paid' && (
                    <p className="mt-2 text-right text-green-600 text-sm font-semibold flex items-center justify-end">
                      PAID <span className="ml-1 text-xs">({formData.term1PaymentDate} via {formData.term1PaymentMethod || 'N/A'})</span>
                    </p>
                  )}
                </div>

                {/* Term 2 */}
                <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="term2Paid"
                        name="term2Paid"
                        checked={formData.term2Paid}
                        onChange={handleTermCheckboxChange}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        disabled={formData.term2Status === 'Paid' && formData.term2PaymentDate}
                      />
                      <label htmlFor="term2Paid" className="ml-2 text-sm font-medium text-gray-700">2nd Term Fee:</label>
                    </div>
                    <span className="font-semibold text-gray-800">₹{term2DisplayAmount.toLocaleString()}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label htmlFor="term2PaymentDate" className="block text-xs font-medium text-gray-600 mb-1">Payment Date</label>
                      <input
                        type="date"
                        id="term2PaymentDate"
                        name="term2PaymentDate"
                        value={formData.term2PaymentDate}
                        onChange={handleInputChange}
                        max={today}
                        className={`w-full border rounded-lg p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500 ${!formData.term2Paid ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300'}`}
                        disabled={!formData.term2Paid}
                      />
                    </div>
                    <div>
                      <label htmlFor="term2PaymentMethod" className="block text-xs font-medium text-gray-600 mb-1">Payment Method</label>
                      <select
                        id="term2PaymentMethod"
                        name="term2PaymentMethod"
                        value={formData.term2PaymentMethod}
                        onChange={handleInputChange}
                        className={`w-full border rounded-lg p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500 ${!formData.term2Paid ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300'}`}
                        disabled={!formData.term2Paid}
                      >
                        <option value="">Select Method</option>
                        <option value="Cash">Cash</option>
                        <option value="Cheque">Cheque</option>
                        <option value="Online">Online</option>
                        <option value="Card">Card</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="term2DueDate" className="block text-xs font-medium text-gray-600 mb-1">Due Date</label>
                      <input
                        type="date"
                        id="term2DueDate"
                        name="term2DueDate"
                        value={formData.term2DueDate}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  {formData.term2Status === 'Paid' && (
                    <p className="mt-2 text-right text-green-600 text-sm font-semibold flex items-center justify-end">
                      PAID <span className="ml-1 text-xs">({formData.term2PaymentDate} via {formData.term2PaymentMethod || 'N/A'})</span>
                    </p>
                  )}
                </div>

                {/* Term 3 */}
                <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="term3Paid"
                        name="term3Paid"
                        checked={formData.term3Paid}
                        onChange={handleTermCheckboxChange}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        disabled={formData.term3Status === 'Paid' && formData.term3PaymentDate}
                      />
                      <label htmlFor="term3Paid" className="ml-2 text-sm font-medium text-gray-700">3rd Term Fee:</label>
                    </div>
                    <span className="font-semibold text-gray-800">₹{term3DisplayAmount.toLocaleString()}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label htmlFor="term3PaymentDate" className="block text-xs font-medium text-gray-600 mb-1">Payment Date</label>
                      <input
                        type="date"
                        id="term3PaymentDate"
                        name="term3PaymentDate"
                        value={formData.term3PaymentDate}
                        onChange={handleInputChange}
                        max={today}
                        className={`w-full border rounded-lg p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500 ${!formData.term3Paid ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300'}`}
                        disabled={!formData.term3Paid}
                      />
                    </div>
                    <div>
                      <label htmlFor="term3PaymentMethod" className="block text-xs font-medium text-gray-600 mb-1">Payment Method</label>
                      <select
                        id="term3PaymentMethod"
                        name="term3PaymentMethod"
                        value={formData.term3PaymentMethod}
                        onChange={handleInputChange}
                        className={`w-full border rounded-lg p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500 ${!formData.term3Paid ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300'}`}
                        disabled={!formData.term3Paid}
                      >
                        <option value="">Select Method</option>
                        <option value="Cash">Cash</option>
                        <option value="Cheque">Cheque</option>
                        <option value="Online">Online</option>
                        <option value="Card">Card</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="term3DueDate" className="block text-xs font-medium text-gray-600 mb-1">Due Date</label>
                      <input
                        type="date"
                        id="term3DueDate"
                        name="term3DueDate"
                        value={formData.term3DueDate}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  {formData.term3Status === 'Paid' && (
                    <p className="mt-2 text-right text-green-600 text-sm font-semibold flex items-center justify-end">
                      PAID <span className="ml-1 text-xs">({formData.term3PaymentDate} via {formData.term3PaymentMethod || 'N/A'})</span>
                    </p>
                  )}
                </div>

              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4 border-t mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition duration-200 w-full sm:w-auto"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition duration-200 shadow-md w-full sm:w-auto"
              >
                {isEditMode ? 'Update Fee Record' : 'Save Fee Record'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddEditFee;