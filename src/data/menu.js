/*
 * Main and demo navigation arrays
 *
 * 'to' attribute points to the route name, not the path url
 */

export default {
  admin: [
    {
      name: "Dashboard",
      to: "dashboard",
      icon: "si si-speedometer",
    },
    {
      name: "Programs",
      to: "programs",
      icon: "si si-speedometer",
    },
    {
      name: "Classes",
      to: "classes",
      icon: "si si-speedometer",
    },
    {
      name: "Units",
      to: "units",
      icon: "si si-speedometer",
    },
    {
      name: "Lecturers",
      to: "users",
      icon: "si si-speedometer",
    },
    {
      name: "Students",
      to: "students",
      icon: "si si-speedometer",
    },
    {
      name: "Lecture Halls",
      to: "halls",
      icon: "si si-speedometer",
    },
    {
      name: "Timetable",
      to: "timetable",
      icon: "si si-calendar",
    },
    {
      name: "Attendance Logs",
      to: "attendance-logs",
      icon: "si si-speedometer",
    },
    {
      name: "Exam Logs",
      to: "exam-auth-logs",
      icon: "si si-speedometer",
    },
  ],
  lecturer: [
    { name: "Dashboard", to: "dashboard", icon: "si si-speedometer" },
    { name: "My Schedule", to: "lecturer-schedule", icon: "si si-calendar" },
    { name: "Units", to: "units", icon: "si si-lock" },
    {
      name: "Attendance Scanner",
      to: "lecturer-scanner",
      icon: "si si-camera",
    },
    { name: "Exam Auth", to: "lecturer-exam", icon: "si si-lock" },
    { name: "Reports", to: "reports", icon: "si si-lock" },
  ],
  student: [
    { name: "Dashboard", to: "dashboard", icon: "si si-speedometer" },
    {
      name: "Face Registration",
      to: "face-registration",
      icon: "si si-user-following",
    },
    { name: "My Timetable", to: "timetable", icon: "si si-calendar" },
    {
      name: "Attendance History",
      to: "my-attendance",
      icon: "si si-check",
    },
    { name: "Exam History", to: "exam-history", icon: "si si-check" },
  ],
};
