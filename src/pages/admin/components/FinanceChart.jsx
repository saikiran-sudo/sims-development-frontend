import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { FaChartLine } from 'react-icons/fa';
import { feeAPI } from "../../../services/api";

function FinanceChart() {
  const [financeData, setFinanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFinanceData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch fee data
        const response = await feeAPI.getAllFees();
        const fees = response.data;

        // Process fee data for the last 12 months
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentYear = new Date().getFullYear();
        
        const monthlyData = months.map((month, index) => {
          // Filter fees for this month and year
          const monthFees = fees.filter(fee => {
            const feeDate = new Date(fee.createdAt || fee.date);
            return feeDate.getMonth() === index && feeDate.getFullYear() === currentYear;
          });

          // Calculate total income (paid fees)
          const income = monthFees
            .filter(fee => fee.status === 'paid')
            .reduce((sum, fee) => sum + (fee.amount || 0), 0);

          // Calculate total expenses (unpaid fees - simplified assumption)
          const expense = monthFees
            .filter(fee => fee.status === 'unpaid')
            .reduce((sum, fee) => sum + (fee.amount || 0), 0);

          return {
            name: month,
            income: Math.round(income),
            expense: Math.round(expense),
          };
        });

        setFinanceData(monthlyData);
      } catch (error) {
        console.error('Error fetching finance data:', error);
        setError('Failed to load finance data');
        // Set default data on error
        setFinanceData([
          { name: "Jan", income: 0, expense: 0 },
          { name: "Feb", income: 0, expense: 0 },
          { name: "Mar", income: 0, expense: 0 },
          { name: "Apr", income: 0, expense: 0 },
          { name: "May", income: 0, expense: 0 },
          { name: "Jun", income: 0, expense: 0 },
          { name: "Jul", income: 0, expense: 0 },
          { name: "Aug", income: 0, expense: 0 },
          { name: "Sep", income: 0, expense: 0 },
          { name: "Oct", income: 0, expense: 0 },
          { name: "Nov", income: 0, expense: 0 },
          { name: "Dec", income: 0, expense: 0 },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchFinanceData();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl w-full h-full p-6 shadow-md flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FaChartLine className="text-green-500" /> Financial Overview
          </h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl w-full h-full p-6 shadow-md flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FaChartLine className="text-green-500" /> Financial Overview
          </h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-red-600">
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl w-full h-full p-6 shadow-md flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FaChartLine className="text-green-500" /> Financial Overview
        </h1>
      </div>
      <ResponsiveContainer width="100%" height="90%">
        <LineChart
          width={500}
          height={300}
          data={financeData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis
            dataKey="name"
            axisLine={false}
            tick={{ fill: "#6b7280", fontSize: 12 }}
            tickLine={false}
            tickMargin={10}
          />
          <YAxis
            axisLine={false}
            tick={{ fill: "#6b7280", fontSize: 12 }}
            tickLine={false}
            tickMargin={20}
          />
          <Tooltip
            contentStyle={{ borderRadius: "8px", borderColor: "#e0e0e0", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}
            labelStyle={{ color: '#374151', fontWeight: 'bold' }}
            itemStyle={{ color: '#4b5563' }}
          />
          <Legend
            align="center"
            verticalAlign="top"
            wrapperStyle={{ paddingTop: "10px", paddingBottom: "20px", fontSize: 13 }}
            iconType="circle"
          />
          <Line
            type="monotone"
            dataKey="income"
            stroke="#10b981"
            strokeWidth={3}
            dot={{ r: 4 }}
            activeDot={{ r: 8 }}
          />
          <Line
            type="monotone"
            dataKey="expense"
            stroke="#ef4444"
            strokeWidth={3}
            dot={{ r: 4 }}
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default FinanceChart;