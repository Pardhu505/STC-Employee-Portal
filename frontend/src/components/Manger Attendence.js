import React, { useState, useEffect, useMemo, createContext, useContext } from "react";
import { fetchUserProfile, fetchManagerTeam, fetchManagerAttendanceReport } from "@/api"; // Import fetchUserProfile and fetchManagerTeam
import { useAuth, AuthProvider } from "@/contexts/AuthContext";


// ---------- HELPERS ----------
const getCode = (r) => r?.empCode || r?.["Emp code"] || r?.code || "";
const getName = (r) => r?.empName || r?.Name || r?.["Emp Name"] || "";

// ---------- MANAGER REPORT ----------
const ReportingManagerReport = () => {
  const { user, loading: authLoading } = useAuth();
  const [managerDetails, setManagerDetails] = useState({ managerName: null, managerId: null, team: [] });
  const [reportType, setReportType] = useState("month");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // ---------- LOAD MANAGER DETAILS FROM API ----------
  useEffect(() => {
    const loadManagerDetails = async () => {
      if (!user?.email || authLoading) return;

      setLoading(true);
      setError(null);

      try {
        // Use the fetchUserProfile function to get manager details
        const employee = await fetchUserProfile(user.email);

        if (!employee) {
          throw new Error("Manager not found for this email");
        }

        // Use the detailed profile from the API call
        const managerId = getCode(employee); // Extracts empCode
        const managerName = employee.name; // Extracts name

        // Use the new fetchManagerTeam function from api.js
        const teamResponse = await fetchManagerTeam(managerId);

        if (!teamResponse?.team) {
          throw new Error(`Team data not found for manager ID: ${managerId}`);
        }

        setManagerDetails({
          managerName,
          managerId,
          team: teamResponse.team
        });

        setError(null);
      } catch (err) {
        console.error("Failed to load manager details:", err);
        setError(err.message || "Failed to load manager details");
        setManagerDetails({ managerName: null, managerId: null, team: [] });
      } finally {
        setLoading(false);
      }
    };

    loadManagerDetails();
  }, [user?.email, authLoading]);

  // ---------- FETCH ATTENDANCE DATA ---------- (unchanged)
  // ---------- FETCH ATTENDANCE DATA ----------
  useEffect(() => {
    if (!managerDetails.managerId || authLoading) return;

    const controller = new AbortController();
    const signal = controller.signal;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const teamEmpCodes = managerDetails.team.map(emp => getCode(emp)).filter(Boolean);
        const params = {
            managerId: managerDetails.managerId,
            teamEmpCodes: teamEmpCodes, // Pass the list of employee codes
            reportType,
            date: selectedDate,
            signal,
          };
  
          // Use the new fetch-based API function
        const data = await fetchManagerAttendanceReport(params);
        

        if (!data?.teamRecords || !Array.isArray(data.teamRecords)) {
          setAttendanceData([]);
          setLoading(false);
          return;
        }

        const raw = data.teamRecords;
        const merged = managerDetails.team.map((emp) => {
          const empData = raw.find((r) => getCode(r) === getCode(emp));
          return {
            ...emp,
            empCode: getCode(emp),
            empName: emp.Name,
            P: empData?.P ?? 0,
            A: empData?.A ?? 0,
            L: empData?.L ?? 0,
            status: empData?.status ?? "-",
            inTime: empData?.inTime ?? "-",
            outTime: empData?.outTime ?? "-",
            lateBy: empData?.lateBy ?? "00:00",
            total: empData?.totalWorkingHours ?? "-",
          };
        });

        setAttendanceData(merged);
      } catch (e) {
        if (e.name !== "AbortError") {
          console.error("⚠️ Fetch failed:", e);
          setError("Failed to load attendance data. Check console logs.");
          setAttendanceData([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    return () => controller.abort();
  }, [managerDetails.managerId, managerDetails.team, reportType, selectedDate, authLoading]);

  // ---------- CALCULATIONS ---------- (unchanged)
  const calcLateBy = (inTime) => {
    if (!inTime) return 0;
    const [h, m] = inTime.split(":").map(Number);
    return Math.max(0, h * 60 + m - 600);
  };

  const calcWorkMins = (inTime, outTime) => {
    if (!inTime || !outTime) return 0;
    const [ih, im] = inTime.split(":").map(Number);
    const [oh, om] = outTime.split(":").map(Number);
    return oh * 60 + om - (ih * 60 + im);
  };

  const fmt = (mins) => {
    if (!mins || mins < 0) return "00:00";
    const h = String(Math.floor(mins / 60)).padStart(2, "0");
    const m = String(mins % 60).padStart(2, "0");
    return `${h}:${m}`;
  };

  // ---------- FILTERED DATA ---------- (unchanged)
  const filteredData = useMemo(() => {
    let data = attendanceData.map((e) => ({
      empCode: getCode(e),
      empName: getName(e),
      status: e.status,
      inTime: e.inTime || "-",
      outTime: e.outTime || "-",
      lateBy: fmt(calcLateBy(e.inTime)),
      total: fmt(calcWorkMins(e.inTime, e.outTime)),
      P: Number(e.P ?? 0),
      A: Number(e.A ?? 0),
      L: Number(e.L ?? 0),
    }));

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter(
        (e) => e.empName.toLowerCase().includes(q) || e.empCode.toLowerCase().includes(q)
      );
    }

    return data;
  }, [attendanceData, searchQuery]);

  const summaryData =
    reportType === "day"
      ? { 
          totalEmployees: filteredData.length, 
          selectedDate: selectedDate.toDateString(), 
          isWeekOff: selectedDate.getDay() === 0 
        }
      : (() => {
          const year = selectedDate.getFullYear();
          const month = selectedDate.getMonth();
          const totalDays = new Date(year, month + 1, 0).getDate();

          // Count number of Sundays
          let sundays = 0;
          for (let d = 1; d <= totalDays; d++) {
            const day = new Date(year, month, d).getDay();
            if (day === 0) sundays++;
          }

          return {
            totalEmployees: filteredData.length,
            selectedMonth: selectedDate.toLocaleString("default", { month: "long", year: "numeric" }),
            totalWorkingDays: totalDays - sundays,
            totalWeekOffs: sundays,
          };
        })();

  // ---------- RENDER ---------- (unchanged)
  return (
    <div className="min-h-screen bg-white flex flex-col items-center p-4 font-sans">
      <div className="w-full mx-auto">
        <h1 className="text-3xl font-bold text-center text-slate-800 mb-8">Team Attendance Report</h1>

        {loading ? (
          <p className="text-center">Loading...</p>
        ) : error ? (
          <p className="text-red-600 text-center">{error}</p>
        ) : (
          <>
            {/* Summary Cards */}
            {reportType === "month" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="p-4 rounded-xl shadow-lg border border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-700">Total Employees</h3>
                  <p className="text-3xl font-bold text-[#225F8B] mt-2">{summaryData.totalEmployees}</p>
                </div>
                <div className="p-4 rounded-xl shadow-lg border border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-700">Selected Month</h3>
                  <p className="text-3xl font-bold text-[#225F8B] mt-2">{summaryData.selectedMonth}</p>
                </div>
                <div className="p-4 rounded-xl shadow-lg border border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-700">Total Working Days</h3>
                  <p className="text-3xl font-bold text-[#225F8B] mt-2">{summaryData.totalWorkingDays}</p>
                </div>
                <div className="p-4 rounded-xl shadow-lg border border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-700">Total Week Offs</h3>
                  <p className="text-3xl font-bold text-[#225F8B] mt-2">{summaryData.totalWeekOffs}</p>
                </div>
              </div>
            )}

            {reportType === "day" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-xl shadow-lg border border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-700">Total Employees</h3>
                  <p className="text-3xl font-bold text-[#225F8B] mt-2">{summaryData.totalEmployees}</p>
                </div>
                <div className="p-4 rounded-xl shadow-lg border border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-700">Selected Date</h3>
                  <p className="text-3xl font-bold text-[#225F8B] mt-2">{summaryData.selectedDate}</p>
                </div>
                <div className="p-4 rounded-xl shadow-lg border border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-700">Day Status</h3>
                  <p className={`text-3xl font-bold mt-2 ${summaryData.isWeekOff ? "text-red-500" : "text-[#225F8B]"}`}>
                    {summaryData.isWeekOff ? "Week Off" : "Working Day"}
                  </p>
                </div>
              </div>
            )}

            {/* Controls & Search */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 space-y-4 md:space-y-0">
              <div className="flex flex-wrap items-center justify-center md:justify-start space-x-2">
                <button onClick={() => setReportType("day")} className={`py-2 px-4 rounded-lg font-semibold transition-colors ${reportType === "day" ? "bg-gradient-to-r from-[#225F8B] to-[#225F8B]/80 text-white shadow-md" : "hover:bg-blue-50 hover:border-[#225F8B]/50 text-gray-700"}`}>
                  Day-wise
                </button>
                <button onClick={() => setReportType("month")} className={`py-2 px-4 rounded-lg font-semibold transition-colors ${reportType === "month" ? "bg-gradient-to-r from-[#225F8B] to-[#225F8B]/80 text-white shadow-md" : "hover:bg-blue-50 hover:border-[#225F8B]/50 text-gray-700"}`}>
                  Month-wise
                </button>

                {reportType === "day" && (
                  <input type="date" value={selectedDate.toISOString().substring(0, 10)} onChange={(e) => setSelectedDate(new Date(e.target.value))} className="p-2 border border-slate-300 rounded-lg shadow-sm" />
                )}
                {reportType === "month" && (
                  <input type="month" value={selectedDate.toISOString().substring(0, 7)} onChange={(e) => setSelectedDate(new Date(e.target.value + "-01"))} className="p-2 border border-slate-300 rounded-lg shadow-sm" />
                )}
              </div>

              <div className="flex justify-center">
                <div className="relative">
                  <input type="text" placeholder="Search by name or code..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="p-2 pl-10 border border-slate-300 rounded-lg shadow-sm" />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* TABLES */}
            <div className="p-6 rounded-xl overflow-x-auto">
              <table className="w-full table-auto text-left">
                <thead>
                  <tr className="bg-sky-100">
                    <th className="px-4 py-3 font-semibold text-slate-700 rounded-tl-lg">Emp Name</th>
                    <th className="px-4 py-3 font-semibold text-slate-700">Emp Code</th>
                    {reportType === "day" ? (
                      <>
                        <th className="px-4 py-3 font-semibold text-slate-700 text-center">Status</th>
                        <th className="px-4 py-3 font-semibold text-slate-700 text-center">In Time</th>
                        <th className="px-4 py-3 font-semibold text-slate-700 text-center">Out Time</th>
                        <th className="px-4 py-3 font-semibold text-slate-700 text-center">Late By</th>
                        <th className="px-4 py-3 font-semibold text-slate-700 text-center rounded-tr-lg">Total Working Hours</th>
                      </>
                    ) : (
                      <>
                        <th className="px-4 py-3 font-semibold text-slate-700 text-center">Present</th>
                        <th className="px-4 py-3 font-semibold text-slate-700 text-center">Absent</th>
                        <th className="px-4 py-3 font-semibold text-slate-700 text-center rounded-tr-lg">Late</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((e, i) => (
                    <tr key={i} className="border-b border-slate-200 last:border-b-0 hover:bg-slate-50 transition-colors duration-150">
                      <td className="px-4 py-3 font-medium text-slate-900">{e.empName}</td>
                      <td className="px-4 py-3 text-slate-600 font-mono">{e.empCode}</td>
                      {reportType === "day" ? (
                        <>
                          <td className="px-4 py-3 text-center">{e.status}</td>
                          <td className="px-4 py-3 text-slate-600 font-bold text-center">{e.inTime}</td>
                          <td className="px-4 py-3 text-slate-600 font-bold text-center">{e.outTime}</td>
                          <td className="px-4 py-3 text-red-500 font-bold text-center">{e.lateBy}</td>
                          <td className="px-4 py-3 text-slate-600 font-bold text-center">{e.total}</td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 text-slate-600 font-bold text-center">{e.P}</td>
                          <td className="px-4 py-3 text-slate-600 font-bold text-center">{e.A}</td>
                          <td className="px-4 py-3 text-red-500 font-bold text-center">{e.L}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const ManagerReport = () => (
  <AuthProvider>
    <ReportingManagerReport />
  </AuthProvider>
);

export default ManagerReport;
