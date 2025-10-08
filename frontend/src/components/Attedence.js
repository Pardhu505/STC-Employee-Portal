import React from "react";
import EAttendance from "./Attence1";
import ReportingManagerReport from "./Manger Attendence";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

// Redirect if token is missing
// if (!localStorage.getItem("token")) {
//   window.location.href = "/login";
// }

const Attendance = () => {
  return (
    <AuthProvider>
      <AttendanceContent />
    </AuthProvider>
  );
};

const AttendanceContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    // This case shouldn't happen if token exists, but just in case
    return <div>No user data found</div>;
  }

  // Update this if your user object does not have 'designation' by default
  const isManager = user.designation === "Reporting manager" || user.isManager;

  return (
    <div>
      {isManager ? <ReportingManagerReport /> : <EAttendance />}
    </div>
  );
};

export default Attendance;
