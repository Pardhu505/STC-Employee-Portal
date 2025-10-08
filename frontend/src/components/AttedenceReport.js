import { useState, useEffect, useCallback, useMemo } from 'react';

// Helper function to parse time strings like "10:40" into minutes
const parseTime = (timeStr) => {
  if (!timeStr || !timeStr.includes(':')) {
    return 0;
  }
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// Helper function to format minutes back into HH:MM string
const formatMinutesToTime = (totalMinutes) => {
  if (totalMinutes < 0) return '00:00';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const pad = (num) => num.toString().padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}`;
};

// Parse CSV Data
const parseCsvData = (csvData) => {
  const lines = csvData.split('\n');
  const allEmployees = {};
  const dates = [];
  
  // Find header row
  const headerLineIndex = lines.findIndex(line => line.includes('Days,'));
  if (headerLineIndex !== -1) {
    const headerCells = lines[headerLineIndex].split(',');
    for (let i = 0; i < headerCells.length; i++) {
      if (headerCells[i].match(/\d+/)) {
        dates.push({ day: headerCells[i].match(/\d+/)[0], index: i });
      }
    }
  }

  // Month & Year
  const monthYearLine = lines.find(line => line.includes('To'));
  let month = new Date().getMonth() + 1;
  let year = new Date().getFullYear();
  if (monthYearLine) {
    const monthYearMatch = monthYearLine.match(/(\w{3})\s+\d{1,2}\s+(\d{4})/);
    if (monthYearMatch) {
      const monthMap = { 'Jan': '01','Feb': '02','Mar': '03','Apr': '04','May': '05','Jun': '06','Jul': '07','Aug': '08','Sep': '09','Oct': '10','Nov': '11','Dec': '12'};
      month = monthMap[monthYearMatch[1]] || month;
      year = monthYearMatch[2] || year;
    }
  }

  // Employees
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('Emp. Code:')) {
      const empInfoLine = lines[i].split(',');
      const statusLine = lines[i + 1]?.split(',');
      const inTimeLine = lines[i + 2]?.split(',');
      const outTimeLine = lines[i + 3]?.split(',');
      const totalTimeLine = lines[i + 4]?.split(',');

      if (!statusLine || !inTimeLine || !outTimeLine || !totalTimeLine) continue;

      const empCode = empInfoLine[3]?.trim() || '-';
      const nameLabelIndex = empInfoLine.findIndex(cell => cell.trim() === 'Emp. Name:');
      let empName = '-';
      if (nameLabelIndex !== -1) {
        empName = empInfoLine[nameLabelIndex + 5]?.trim() || '-';
      }

      const dailyRecords = [];
      dates.forEach(({ day, index }) => {
        const recordDate = new Date(Number(year), Number(month) - 1, Number(day), 0, 0, 0);
        const status = statusLine[index]?.trim() || '-';
        const inTimeStr = inTimeLine[index]?.trim() || '-';
        const outTimeStr = outTimeLine[index]?.trim() || '-';

        let lateBy = '00:00';
        const inMinutes = parseTime(inTimeStr);
        if (inMinutes > 600 && status === 'P') { // >10AM
          lateBy = formatMinutesToTime(inMinutes - 600);
        }

        let totalWorkingHours = '-';
        if (inTimeStr !== '-' && outTimeStr !== '-') {
          const inMin = parseTime(inTimeStr);
          const outMin = parseTime(outTimeStr);
          totalWorkingHours = formatMinutesToTime(outMin - inMin);
        }

        dailyRecords.push({
          date: recordDate.toISOString(),
          status,
          inTime: inTimeStr,
          outTime: outTimeStr,
          lateBy,
          totalWorkingHours,
        });
      });

      allEmployees[empCode] = { empCode, empName, dailyRecords };
    }
  }
  return allEmployees;
};

const AttendanceReport = () => {
  const [reportType, setReportType] = useState('month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [employeeData, setEmployeeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadedFileContent, setUploadedFileContent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Checkbox states
  const [checkedNames, setCheckedNames] = useState({});
  const [checkedCodes, setCheckedCodes] = useState({});
  // Dropdown toggle
  const [showNameDropdown, setShowNameDropdown] = useState(false);
  const [showCodeDropdown, setShowCodeDropdown] = useState(false);
  // Initialize employeeData when file uploaded
  useEffect(() => {
    if (uploadedFileContent) {
      try {
        const data = parseCsvData(uploadedFileContent);
        setEmployeeData(data);
      } catch (error) {
        console.error("Failed to parse data:", error);
        setEmployeeData({});
      }
    }
  }, [uploadedFileContent]);

  // Initialize checkboxes when employeeData is available
  useEffect(() => {
    if (employeeData) {
      const initialNames = {};
      const initialCodes = {};
      Object.values(employeeData).forEach(emp => {
        initialNames[emp.empName] = true;
        initialCodes[emp.empCode] = true;
      });
      setCheckedNames(initialNames);
      setCheckedCodes(initialCodes);
    }
  }, [employeeData]);

  // Toggle individual checks
  const toggleNameCheck = (empName) => {
    setCheckedNames(prev => ({ ...prev, [empName]: !prev[empName] }));
  };

  const toggleCodeCheck = (empCode) => {
    setCheckedCodes(prev => ({ ...prev, [empCode]: !prev[empCode] }));
  };

  // Select All / Clear All helpers for names and codes
  const setAllNamesChecked = (checked) => {
    const newState = {};
    allEmployeesList.forEach(emp => {
      newState[emp.empName] = checked;
    });
    setCheckedNames(newState);
  };

  const setAllCodesChecked = (checked) => {
    const newState = {};
    allEmployeesList.forEach(emp => {
      newState[emp.empCode] = checked;
    });
    setCheckedCodes(newState);
  };

  // Save to DB
  const handleSaveToDB = useCallback(async () => {
    if (!employeeData) return;
    setLoading(true);

    const employeesList = Object.values(employeeData);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/attendance-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(employeesList),
      });

      if (!response.ok) {
        throw new Error('Failed to save data to the database.');
      }

      const result = await response.json();
      alert(result.message || 'Saved successfully');
    } catch (error) {
      console.error('Error saving data:', error);
      alert('Failed to save data.');
    } finally {
      setLoading(false);
    }
  }, [employeeData]);

  const allEmployeesList = useMemo(() => {
    if (!employeeData) return [];
    return Object.values(employeeData);
  }, [employeeData]);

  // Filtering logic (applies search + checkbox filters + day/month computations)
  const getFilteredData = useCallback(() => {
    if (!employeeData) return { employees: [], summary: {}, hasData: false };

    let employeeList = Object.values(employeeData);
    const lowerCaseQuery = searchQuery.toLowerCase();

    // Filter by search query
    if (searchQuery) {
      employeeList = employeeList.filter(emp =>
        emp.empName.toLowerCase().includes(lowerCaseQuery) ||
        emp.empCode.toLowerCase().includes(lowerCaseQuery)
      );
    }

    // Apply checkbox filters (include only employees checked in both lists)
    employeeList = employeeList.filter(emp => checkedNames[emp.empName] && checkedCodes[emp.empCode]);

    // Day-wise
    if (reportType === 'day') {
      const day = selectedDate.getDate();
      const month = selectedDate.getMonth();
      const year = selectedDate.getFullYear();

      const employees = employeeList.map(emp => {
        const dayRecord = emp.dailyRecords.find(record => {
          const recordDate = new Date(record.date);
          return recordDate.getDate() === day &&
                 recordDate.getMonth() === month &&
                 recordDate.getFullYear() === year;
        });

        let statusText = '-';
        let statusColor = 'text-gray-500';

        if (dayRecord) {
          if (dayRecord.status === 'P' && dayRecord.lateBy !== '00:00') {
            statusText = 'Present (Late)';
            statusColor = 'text-orange-500';
          } else if (dayRecord.status === 'P') {
            statusText = 'Present';
            statusColor = 'text-green-500';
          } else if (dayRecord.status === 'A') {
            statusText = 'Absent';
            statusColor = 'text-red-500';
          } else if (dayRecord.status === 'WO' || dayRecord.status === 'S') {
            statusText = 'Week Off';
            statusColor = 'text-gray-500';
          }
        }

        return {
          empName: emp.empName,
          empCode: emp.empCode,
          statusText,
          statusColor,
          inTime: dayRecord?.inTime || '-',
          outTime: dayRecord?.outTime || '-',
          lateBy: dayRecord?.lateBy || '-',
          totalWorkingHours: dayRecord?.totalWorkingHours || '-',
        };
      });

      const hasDataForSelectedDay = employees.some(emp => emp.statusText !== '-');

      return {
        employees: hasDataForSelectedDay ? employees : [],
        summary: {
          totalEmployees: hasDataForSelectedDay ? employees.length : '-',
          selectedDate: selectedDate.toDateString(),
          isWeekOff: selectedDate.getDay() === 0,
        }
      };
    }

    // Month-wise
    if (reportType === 'month') {
      const selectedMonth = selectedDate.getMonth();
      const selectedYear = selectedDate.getFullYear();

      const employeesWithData = employeeList.filter(emp =>
        emp.dailyRecords.some(record => {
          const recordDate = new Date(record.date);
          return recordDate.getMonth() === selectedMonth && recordDate.getFullYear() === selectedYear;
        })
      );

      const employees = employeesWithData.map(emp => {
        let presentCount = 0;
        let absentCount = 0;
        let lateCount = 0;

        emp.dailyRecords
          .filter(record => {
            const recordDate = new Date(record.date);
            return recordDate.getMonth() === selectedMonth && recordDate.getFullYear() === selectedYear;
          })
          .forEach(record => {
            if (record.status === 'P') presentCount++;
            if (record.status === 'A') absentCount++;
            if (record.lateBy !== '00:00' && record.status === 'P') lateCount++;
          });

        return {
          empName: emp.empName,
          empCode: emp.empCode,
          presentDays: presentCount,
          absentDays: absentCount,
          lateDays: lateCount,
        };
      });

      // total working days (Mon-Sat)
      let totalWorkingDays = 0;
      const totalDaysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
      for (let day = 1; day <= totalDaysInMonth; day++) {
        const date = new Date(selectedYear, selectedMonth, day);
        if (date.getDay() !== 0) totalWorkingDays++;
      }

      let totalWeekOffs = 0;
      for (let day = 1; day <= totalDaysInMonth; day++) {
        const date = new Date(selectedYear, selectedMonth, day);
        if (date.getDay() === 0) totalWeekOffs++;
      }

      return {
        employees,
        summary: {
          totalEmployees: employees.length > 0 ? employees.length : '-',
          selectedMonth: selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' }),
          totalWorkingDays,
          totalWeekOffs,
        }
      };
    }

    return { employees: [], summary: {} };
  }, [employeeData, reportType, selectedDate, searchQuery, checkedNames, checkedCodes]);

  const filteredData = getFilteredData();
  const employeesToDisplay = filteredData.employees;
  const summaryData = filteredData.summary;
  const showTable = filteredData.employees.length > 0;
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-48">
          <div className="text-lg text-slate-600">Parsing file...</div>
        </div>
      );
    }

    if (!uploadedFileContent) return null;

    // Day-wise table
    if (reportType === 'day') {
      return (
        <div className="p-6 rounded-xl overflow-x-auto">
          <table className="w-full table-auto text-left">
            <thead>
              <tr className="bg-sky-100">
                <th className="px-4 py-3 font-semibold text-slate-700 rounded-tl-lg">
                  Emp Name
                  {/* Names dropdown with Select All */}
                  <div className="inline-block relative ml-2">
                    <button
                      type="button"
                      onClick={() => setShowNameDropdown(prev => !prev)}
                      className="px-2 py-1 border rounded-lg border-[#225F8B]/80 "
                    >
                      ↴
                    </button>
                    {showNameDropdown && (
                      <div className="absolute z-10 mt-1 left-0 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto w-56">
                        <label className="flex items-center px-3 py-1 font-semibold border-b">
                          <input
                            type="checkbox"
                            checked={allEmployeesList.length > 0 && allEmployeesList.every(emp => checkedNames[emp.empName])}
                            onChange={(e) => setAllNamesChecked(e.target.checked)}
                            className="mr-2"
                          />
                          Select All
                        </label>
                        {allEmployeesList.map((emp) => (
                          <label key={emp.empName} className="flex items-center px-3 py-1">
                            <input
                              type="checkbox"
                              checked={!!checkedNames[emp.empName]}
                              onChange={() => toggleNameCheck(emp.empName)}
                              className="mr-2"
                            />
                            {emp.empName}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </th>

                <th className="px-4 py-3 font-semibold text-slate-700">
                  Emp Code
                  {/* Codes dropdown with Select All */}
                  <div className="inline-block relative ml-2">
                    <button
                      type="button"
                      onClick={() => setShowCodeDropdown(prev => !prev)}
                      className="px-2 py-1 border rounded-lg border-[#225F8B]/80 "
                    >
                      ↴
                    </button>
                    {showCodeDropdown && (
                      <div className="absolute z-10 mt-1 left-0 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto w-40">
                        <label className="flex items-center px-3 py-1 font-semibold border-b">
                          <input
                            type="checkbox"
                            checked={allEmployeesList.length > 0 && allEmployeesList.every(emp => checkedCodes[emp.empCode])}
                            onChange={(e) => setAllCodesChecked(e.target.checked)}
                            className="mr-2"
                          />
                          Select All
                        </label>
                        {allEmployeesList.map((emp) => (
                          <label key={emp.empCode} className="flex items-center px-3 py-1">
                            <input
                              type="checkbox"
                              checked={!!checkedCodes[emp.empCode]}
                              onChange={() => toggleCodeCheck(emp.empCode)}
                              className="mr-2"
                            />
                            {emp.empCode}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </th>

                <th className="px-4 py-3 font-semibold text-slate-700 text-center">Status</th>
                <th className="px-4 py-3 font-semibold text-slate-700 text-center">In Time</th>
                <th className="px-4 py-3 font-semibold text-slate-700 text-center">Out Time</th>
                <th className="px-4 py-3 font-semibold text-slate-700 text-center">Late By</th>
                <th className="px-4 py-3 font-semibold text-slate-700 text-center rounded-tr-lg">Total Working Hours</th>
              </tr>
            </thead>
            <tbody>
              {employeesToDisplay.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-4 text-slate-600">
                    No data available. Please select employees or check the selected period.
                  </td>
                </tr>
              ) : (
                employeesToDisplay.map((employee, index) => (
                  <tr key={index} className="border-b border-slate-200 last:border-b-0 hover:bg-slate-50 transition-colors duration-150">
                    <td className="px-4 py-3 font-medium text-slate-900">{employee.empName}</td>
                    <td className="px-4 py-3 text-slate-600 font-mono">{employee.empCode}</td>
                    <td className="px-4 py-3 font-bold text-center">
                      {employee.statusText === 'Present (Late)' ? (
                        <>
                          <span className="text-green-500">Present</span>
                          <span className="text-orange-500"> (Late)</span>
                        </>
                      ) : (
                        <span className={employee.statusColor}>
                          {employee.statusText}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-bold text-center">{employee.inTime}</td>
                    <td className="px-4 py-3 text-slate-600 font-bold text-center">{employee.outTime}</td>
                    <td className="px-4 py-3 text-red-500 font-bold text-center">{employee.lateBy}</td>
                    <td className="px-4 py-3 text-slate-600 font-bold text-center">{employee.totalWorkingHours}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      );
    }

    // Month-wise
    if (reportType === 'month') {
      return (
        <div className="p-6 rounded-xl overflow-x-auto">
          <table className="w-full table-auto text-left">
            <thead>
              <tr className="bg-sky-100">
                <th className="px-4 py-3 font-semibold text-slate-700 rounded-tl-lg">
                  Emp Name
                  {/* Names dropdown (month header) */}
                  <div className="inline-block relative ml-2">
                    <button
                      type="button"
                      onClick={() => setShowNameDropdown(prev => !prev)}
                      className="px-2 py-1 border rounded-lg border-[#225F8B]/80 "
                    >
                        ↴
                    </button>
                    {showNameDropdown && (
                      <div className="absolute z-10 mt-1 left-0 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto w-56">
                        <label className="flex items-center px-3 py-1 font-semibold border-b">
                          <input
                            type="checkbox"
                            checked={allEmployeesList.length > 0 && allEmployeesList.every(emp => checkedNames[emp.empName])}
                            onChange={(e) => setAllNamesChecked(e.target.checked)}
                            className="mr-2"
                          />
                          Select All
                        </label>
                        {allEmployeesList.map((emp) => (
                          <label key={emp.empName} className="flex items-center px-3 py-1">
                            <input
                              type="checkbox"
                              checked={!!checkedNames[emp.empName]}
                              onChange={() => toggleNameCheck(emp.empName)}
                              className="mr-2"
                            />
                            {emp.empName}
                          </label>
                        ))}
                      </div>
                    )}
                </div>
                </th>
                <th className="px-4 py-3 font-semibold text-slate-700">
                  Emp Code
                  {/* Codes dropdown (month header) */}
                  <div className="inline-block relative ml-2">
                    <button
                      type="button"
                      onClick={() => setShowCodeDropdown(prev => !prev)}
                      className="px-2 py-1 border rounded-lg border-[#225F8B]/80 "
                    >
                        ↴
                    </button>
                    {showCodeDropdown && (
                      <div className="absolute z-10 mt-1 left-0 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto w-40">
                        <label className="flex items-center px-3 py-1 font-semibold border-b">
                          <input
                            type="checkbox"
                            checked={allEmployeesList.length > 0 && allEmployeesList.every(emp => checkedCodes[emp.empCode])}
                            onChange={(e) => setAllCodesChecked(e.target.checked)}
                            className="mr-2"
                          />
                          Select All
                        </label>
                        {allEmployeesList.map((emp) => (
                          <label key={emp.empCode} className="flex items-center px-3 py-1">
                            <input
                              type="checkbox"
                              checked={!!checkedCodes[emp.empCode]}
                              onChange={() => toggleCodeCheck(emp.empCode)}
                              className="mr-2"
                            />
                            {emp.empCode}
                          </label>
                        ))}
                      </div>
                    )}
                </div>
                </th>

                <th className="px-4 py-3 font-semibold text-slate-700 text-center">Present Days</th>
                <th className="px-4 py-3 font-semibold text-slate-700 text-center">Absent Days</th>
                <th className="px-4 py-3 font-semibold text-slate-700 text-center rounded-tr-lg">Late Days</th>
              </tr>
            </thead>
            <tbody>
              {employeesToDisplay.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-4 text-slate-600">
                    No data available. Please select employees or check the selected period.
                  </td>
                </tr>
              ) : (
                employeesToDisplay.map((employee, index) => (
                  <tr key={index} className="border-b border-slate-200 last:border-b-0 hover:bg-slate-50 transition-colors duration-150">
                    <td className="px-4 py-3 font-medium text-slate-900">{employee.empName}</td>
                    <td className="px-4 py-3 text-slate-600 font-mono">{employee.empCode}</td>
                    <td className="px-4 py-3 text-slate-600 font-bold text-center">{employee.presentDays}</td>
                    <td className="px-4 py-3 text-slate-600 font-bold text-center">{employee.absentDays}</td>
                    <td className="px-4 py-3 text-red-500 font-bold text-center">{employee.lateDays}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center p-4 font-sans">
      <div className="w-full mx-auto">
        <h1 className="text-3xl font-bold text-center text-slate-800 mb-8">
          Employee Attendance Report
        </h1>

        <div className="flex flex-col items-center justify-center p-8 rounded-xl">
          <p className="text-xl text-slate-700 mb-4">
            Please upload a CSV file to view the attendance report.
          </p>
          <label htmlFor="file-upload" className="cursor-pointer bg-gradient-to-r from-[#225F8B] to-[#225F8B]/80 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition-colors duration-200">
            Choose File
          </label>
          <input id="file-upload" type="file" accept=".csv" onChange={(e) => {
            // reset dropdowns when new file selected
            setShowNameDropdown(false);
            setShowCodeDropdown(false);
            // read file
            const file = e.target.files[0];
            if (file) {
              setLoading(true);
              const reader = new FileReader();
              reader.onload = (ev) => {
                setUploadedFileContent(ev.target.result);
                setLoading(false);
              };
              reader.readAsText(file);
            }
          }} className="hidden" />
        </div>

        {uploadedFileContent && (
          <>
            {/* Save to DB */}
            <div className="flex justify-center mb-5">
              <button
                onClick={handleSaveToDB}
                disabled={loading}
                className="py-2 px-6 rounded-lg font-semibold transition-colors bg-gradient-to-r from-[#225F8B] to-[#225F8B]/80 text-white"
              >
                {loading ? 'Saving...' : 'Save Report to Database'}
              </button>
            </div>

            {/* Cards */}
            {reportType === 'month' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="p-4 rounded-xl shadow-lg border border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-700">Total Employees</h3>
                  <p className="text-3xl font-bold text-[#225F8B] mt-2">{summaryData?.totalEmployees}</p>
                </div>
                <div className="p-4 rounded-xl shadow-lg border border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-700">Selected Month</h3>
                  <p className="text-3xl font-bold text-[#225F8B] mt-2">{summaryData?.selectedMonth}</p>
                </div>
                <div className="p-4 rounded-xl shadow-lg border border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-700">Total Working Days</h3>
                  <p className="text-3xl font-bold text-[#225F8B] mt-2">{summaryData?.totalWorkingDays}</p>
                </div>
                <div className="p-4 rounded-xl shadow-lg border border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-700">Total Week Offs</h3>
                  <p className="text-3xl font-bold text-[#225F8B] mt-2">{summaryData?.totalWeekOffs}</p>
                </div>
              </div>
            )}

            {reportType === 'day' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-xl shadow-lg border border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-700">Total Employees</h3>
                  <p className="text-3xl font-bold text-[#225F8B] mt-2">{summaryData?.totalEmployees}</p>
                </div>
                <div className="p-4 rounded-xl shadow-lg border border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-700">Selected Date</h3>
                  <p className="text-3xl font-bold text-[#225F8B] mt-2">{summaryData?.selectedDate}</p>
                </div>
                <div className="p-4 rounded-xl shadow-lg border border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-700">Day Status</h3>
                  <p className={`text-3xl font-bold mt-2 ${summaryData?.isWeekOff ? 'text-red-500' : 'text-[#225F8B]'}`}>
                    {summaryData?.isWeekOff ? 'Week Off' : 'Working Day'}
                  </p>
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 space-y-4 md:space-y-0">
              <div className="flex flex-wrap items-center justify-center md:justify-start space-x-2">
                <button
                  onClick={() => setReportType('day')}
                  className={`py-2 px-4 rounded-lg font-semibold transition-colors ${reportType === 'day' ? 'bg-gradient-to-r from-[#225F8B] to-[#225F8B]/80 text-white shadow-md' : 'hover:bg-blue-50 hover:border-[#225F8B]/50 text-gray-700'}`}
                >
                  Day-wise
                </button>
                <button
                  onClick={() => setReportType('month')}
                  className={`py-2 px-4 rounded-lg font-semibold transition-colors ${reportType === 'month' ? 'bg-gradient-to-r from-[#225F8B] to-[#225F8B]/80 text-white shadow-md' : 'hover:bg-blue-50 hover:border-[#225F8B]/50 text-gray-700'}`}
                >
                  Month-wise
                </button>

                {reportType === 'day' && (
                  <input
                    type="date"
                    value={selectedDate.toISOString().substring(0,10)}
                    onChange={(e) => setSelectedDate(new Date(e.target.value))}
                    className="p-2 border border-slate-300 rounded-lg shadow-sm"
                  />
                )}

                {reportType === 'month' && (
                  <input
                    type="month"
                    value={selectedDate.toISOString().substring(0,7)}
                    onChange={(e) => setSelectedDate(new Date(e.target.value + '-01'))}
                    className="p-2 border border-slate-300 rounded-lg shadow-sm"
                  />
                )}
              </div>

              <div className="flex justify-center ">
                <div className="relative ">
                  <input
                    type="text"
                    placeholder="Search by name or code..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="p-2 pl-10 border border-slate-300 rounded-lg shadow-sm"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {renderContent()}
          </>
        )}
      </div>
    </div>
  );
};

export default AttendanceReport;
