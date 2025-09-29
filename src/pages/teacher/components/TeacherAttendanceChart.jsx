import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react'; // Icon for attendance

// Default data in case no data is provided
const defaultData = [
    {
      name: 'No Data',
      present: 0,
      absent: 0,
    }
];

function TeacherAttendanceChart({ data = [] }) {
    const currentMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toLocaleString('default', { month: 'long' });
    
    // Use provided data or default data
    const chartData = data.length > 0 ? data : defaultData;
    
    // Calculate attendance percentage from the data
    const totalPresent = chartData.reduce((sum, item) => sum + (item.present || 0), 0);
    const totalAbsent = chartData.reduce((sum, item) => sum + (item.absent || 0), 0);
    const totalRecords = totalPresent + totalAbsent;
    const attendancePercentage = totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 0;

    return (
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <TrendingUp size={24} className="text-green-600" /> Student Attendance
                </h2>
                <span className="text-lg font-semibold text-green-700 bg-green-50 px-3 py-1 rounded-full">{attendancePercentage}%</span>
            </div>
            <p className="text-sm text-gray-600 mb-4">Last 4 Weeks</p>
            <div className="flex-grow w-full h-full"> {/* Ensure responsive container fills parent */}
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={chartData}
                        margin={{
                            top: 10,
                            right: 30,
                            left: 0,
                            bottom: 0,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} className="text-xs text-gray-600" />
                        <YAxis axisLine={false} tickLine={false} className="text-xs text-gray-600" />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}
                            labelStyle={{ fontWeight: 'bold', color: '#333' }}
                            itemStyle={{ color: '#555' }}
                        />
                        <Area type="monotone" dataKey="present" stroke="#82ca9d" fillOpacity={1} fill="url(#colorPresent)" name="Present" />
                        <Area type="monotone" dataKey="absent" stroke="#ff7300" fillOpacity={1} fill="url(#colorAbsent)" name="Absent" />
                        <defs>
                            <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorAbsent" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ff7300" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#ff7300" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

export default TeacherAttendanceChart;
