import React, { useState, useEffect, useMemo, createContext, useContext } from 'react';
import { useAuth, AuthProvider } from "@/contexts/AuthContext";

// Main component for displaying attendance
const EMPAttendance = () => {
  const { user, loading: authLoading } = useAuth();
  const [employeeDetails, setEmployeeDetails] = useState({ empCode: null, empName: null });
  const API_BASE_URL = 'http://localhost:8000/api/attendance-report';

  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewType, setViewType] = useState('month'); // 'day' or 'month'
  const [selectedDate, setSelectedDate] = useState(new Date());

 
useEffect(() => {
  if (user) {
    // The user object from login already contains the empCode.
    // We check for multiple possible casings to be safe.
    const code = user.empCode || user['Emp code'] || user.emp_code;
    if (code) {
      setEmployeeDetails({ empCode: code, empName: user.name });
    } else {
      setError("Employee code not found for this user.");
    }
  }
}, [user]);




  const fetchAttendanceData = async () => {
    if (authLoading || !employeeDetails.empCode) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    let url = `${API_BASE_URL}/user/${employeeDetails.empCode}`;

    if (viewType === 'day') {
      const dateString = selectedDate.toISOString().split('T')[0];
      url += `?view_type=day&date=${dateString}`;
    } else {
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth() + 1;
      url += `?view_type=month&year=${year}&month=${month}`;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setAttendanceData(data.dailyRecords || []);
    } catch (e) {
      console.error("Failed to fetch attendance data:", e);
      setError('Failed to load attendance data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceData();
  }, [employeeDetails.empCode, viewType, selectedDate]);

  const formatMinutesToHoursMinutes = (totalMinutes) => {
    if (totalMinutes < 0 || isNaN(totalMinutes)) return '00:00';
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.floor(totalMinutes % 60);
    const pad = (num) => num.toString().padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}`;
  };

  const calculateLateBy = (inTime) => {
    if (!inTime) return 0;
    const [inHours, inMinutes] = inTime.split(':').map(Number);
    const standardTimeInMinutes = 10 * 60;
    const checkInTimeInMinutes = inHours * 60 + inMinutes;
    const diffInMinutes = checkInTimeInMinutes - standardTimeInMinutes;
    return diffInMinutes > 0 ? diffInMinutes : 0;
  };

  // --- Daily Stats ---
  const dailyStats = useMemo(() => {
    if (viewType === 'month') return null;

    const dayData = attendanceData[0];
    const formattedDate = selectedDate.toLocaleDateString();
    let status = 'Not Recorded';
    let inTime = null;
    let outTime = null;
    let totalMinutes = 0;

    if (dayData) {
      if (dayData.status === 'P') status = 'Present';
      else if (dayData.status === 'A') status = 'Absent';
      else if (dayData.status === 'WO') status = 'Week Off';

      inTime = dayData.inTime || null;
      outTime = dayData.outTime || null;

      if (inTime && outTime) {
        const [inH, inM] = inTime.split(':').map(Number);
        const [outH, outM] = outTime.split(':').map(Number);

        const startTime = new Date(selectedDate);
        startTime.setHours(inH, inM, 0, 0);
        const endTime = new Date(selectedDate);
        endTime.setHours(outH, outM, 0, 0);

        totalMinutes = (endTime - startTime) / (1000 * 60);
      }
    }

    return {
      formattedDate,
      status,
      inTime,
      outTime,
      totalWorkingHours: formatMinutesToHoursMinutes(totalMinutes),
      lateBy: formatMinutesToHoursMinutes(calculateLateBy(inTime)),
    };
  }, [attendanceData, viewType, selectedDate]);

  // --- Monthly Stats ---
  const monthlyStats = useMemo(() => {
    if (viewType === 'day') return null;

    const totalDaysInMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate();
    let totalWorkingDays = 0;
    let totalWeekOffs = 0;
    let daysPresent = 0;
    let lateDays = 0;

    for (let day = 1; day <= totalDaysInMonth; day++) {
      const date = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
      if (date.getDay() !== 0) totalWorkingDays++;
      else totalWeekOffs++;
    }

    attendanceData.forEach(dayData => {
      if (dayData.status === 'P') daysPresent++;
      if (dayData.inTime && calculateLateBy(dayData.inTime) > 0) lateDays++;
    });

    const absentDays = totalWorkingDays - daysPresent;
    const selectedMonth = selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    return {
      daysPresent,
      absentDays,
      lateDays,
      totalDaysInMonth,
      selectedMonth,
      totalWorkingDays,
      totalWeekOffs,
    };
  }, [attendanceData, viewType, selectedDate]);

  const renderLoading = () => (
    <div className="flex justify-center items-center h-full">
      <div className="w-16 h-16 border-4 border-t-4 border-gray-200 border-t-indigo-500 rounded-full animate-spin"></div>
    </div>
  );

  const renderError = () => (
    <div className="p-4 text-center text-red-600 bg-red-100 border border-red-300 rounded-lg shadow-inner">
      <p>{error}</p>
    </div>
  );

  // --- Day-wise Report ---
  const renderDayReport = () => {
    const statusColorClass = {
      'Present': 'text-green-600',
      'Absent': 'text-red-600',
      'Week Off': 'text-blue-600',
      'Not Recorded': 'text-gray-500',
    }[dailyStats.status];

    return (
      <>
        <div className="overflow-x-auto">
          <h3 className="text-xl font-semibold mb-4 text-center">Day-wise Report for {dailyStats.formattedDate}</h3>
          <table className="min-w-full bg-white rounded-lg shadow-md overflow-hidden">
            <thead className="bg-sky-100">
              <tr>
                <th className="py-3 px-4 text-center font-bold text-gray-700 uppercase tracking-wider">Status</th>
                <th className="py-3 px-4 text-center font-bold text-gray-700 uppercase tracking-wider">In-Time</th>
                <th className="py-3 px-4 text-center font-bold text-gray-700 uppercase tracking-wider">Out-Time</th>
                <th className="py-3 px-4 text-center font-bold text-gray-700 uppercase tracking-wider">Late By</th>
                <th className="py-3 px-4 text-center font-bold text-gray-700 uppercase tracking-wider">Total Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className={`py-4 px-6 text-center font-medium ${statusColorClass}`}>{dailyStats.status}</td>
                <td className="py-4 px-6 text-center whitespace-nowrap">{dailyStats.inTime || 'N/A'}</td>
                <td className="py-4 px-6 text-center whitespace-nowrap">{dailyStats.outTime || 'N/A'}</td>
                <td className="py-4 px-6 text-center whitespace-nowrap text-red-500">{dailyStats.lateBy}</td>
                <td className="py-4 px-6 text-center whitespace-nowrap">{dailyStats.totalWorkingHours}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </>
    );
  };

  // --- Month-wise Report ---
  const renderMonthReport = () => {
    if (!monthlyStats) return null;
    return (
      <>
        <div className="overflow-x-auto">
          <h3 className="text-xl font-semibold mb-4 text-center">Month-wise Report for {monthlyStats.selectedMonth}</h3>
          <table className="min-w-full bg-white rounded-lg shadow-md overflow-hidden">
            <thead className="bg-sky-100">
              <tr>
                <th className="px-4 py-3 text-left font-bold text-gray-700 uppercase tracking-wider">Employee Code</th>
                <th className="px-4 py-3 text-center font-bold text-gray-700 uppercase tracking-wider">Present Days</th>
                <th className="px-4 py-3 text-center font-bold text-gray-700 uppercase tracking-wider">Absent Days</th>
                <th className="px-4 py-3 text-center font-bold text-gray-700 uppercase tracking-wider">Late Days</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="px-4 py-3 text-slate-600 font-mono">{employeeDetails.empCode || 'N/A'}</td>
                <td className="px-4 py-3 text-slate-600 font-bold text-center">{monthlyStats.daysPresent}</td>
                <td className="px-4 py-3 text-slate-600 font-bold text-center">{attendanceData.length === 0 ? '0' : monthlyStats.absentDays}</td>
                <td className="px-4 py-3 text-red-500 font-bold text-center">{monthlyStats.lateDays}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white p-6 md:p-10 rounded-3xl shadow-2xl">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">My Attendance Report</h2>

          {/* --- Summary Cards --- */}
          {viewType === 'day' && dailyStats ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 mb-6 justify-center">
              <div className="p-4 rounded-xl shadow-lg border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-700">Selected Date</h3>
                <p className="text-3xl font-bold text-[#225F8B] mt-2">{dailyStats.formattedDate}</p>
              </div>
              <div className="p-4 rounded-xl shadow-lg border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-700">Day Status</h3>
                <p className={`text-3xl font-bold mt-2 ${
                  {
                    'Present': 'text-green-600',
                    'Absent': 'text-red-600',
                    'Week Off': 'text-blue-600',
                    'Not Recorded': 'text-gray-500'
                  }[dailyStats.status]
                }`}>{dailyStats.status}</p>
              </div>
            </div>
          ) : viewType === 'month' && monthlyStats ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-xl shadow-lg border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-700">Selected Month</h3>
                <p className="text-3xl font-bold text-[#225F8B] mt-2">{monthlyStats.selectedMonth}</p>
              </div>
              <div className="p-4 rounded-xl shadow-lg border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-700">Total Working Days</h3>
                <p className="text-3xl font-bold text-[#225F8B] mt-2">{monthlyStats.totalWorkingDays}</p>
              </div>
              <div className="p-4 rounded-xl shadow-lg border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-700">Total Week Offs</h3>
                <p className="text-3xl font-bold text-[#225F8B] mt-2">{monthlyStats.totalWeekOffs}</p>
              </div>
            </div>
          ) : null}

          {/* --- Centered Buttons + Calendar --- */}
          <div className="flex flex-col sm:flex-row items-center justify-center mb-6 space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex space-x-2">
              <button
                onClick={() => setViewType('day')}
                className={`py-2 px-4 rounded-full transition-all duration-300 ease-in-out ${
                  viewType === 'day'
                    ? 'bg-gradient-to-r from-[#225F8B] to-[#225F8B]/80 text-white shadow-lg transform scale-105'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Day-wise
              </button>
              <button
                onClick={() => setViewType('month')}
                className={`py-2 px-4 rounded-full transition-all duration-300 ease-in-out ${
                  viewType === 'month'
                    ? 'bg-gradient-to-r from-[#225F8B] to-[#225F8B]/80 text-white shadow-lg transform scale-105'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Month-wise
              </button>
            </div>

            <div className="w-full sm:w-auto">
              {viewType === 'day' ? (
                <input
                  type="date"
                  value={selectedDate.toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                  className="p-2 border border-slate-300 rounded-full shadow-sm"
                />
              ) : (
                <input
                  type="month"
                  value={selectedDate.toISOString().substring(0, 7)}
                  onChange={(e) => setSelectedDate(new Date(e.target.value + '-01'))}
                  className="p-2 border border-slate-300 rounded-full shadow-sm"
                />
              )}
            </div>
          </div>

          {/* --- Report Table --- */}
          {authLoading || loading ? renderLoading() : error ? renderError() : (
            <>
              {viewType === 'day' ? renderDayReport() : renderMonthReport()}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Main App component
const EAttendance = () => (
  <AuthProvider>
    <EMPAttendance />
  </AuthProvider>
);

export default EAttendance;
