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
      to: "dashboard",
      icon: "si si-speedometer",
    },
    {
      name: "Classes",
      to: "dashboard",
      icon: "si si-speedometer",
    },
    {
      name: "Units",
      to: "dashboard",
      icon: "si si-speedometer",
    },
    {
      name: "Lecturers",
      to: "dashboard",
      icon: "si si-speedometer",
    },
    {
      name: "Students",
      to: "dashboard",
      icon: "si si-speedometer",
    },
    {
      name: "Lecture Halls",
      to: "dashboard",
      icon: "si si-speedometer",
    },
    {
      name: "Timetable",
      to: "dashboard",
      icon: "si si-calendar",
    },
    {
      name: "Attendance Logs",
      to: "dashboard",
      icon: "si si-speedometer",
    },
    {
      name: "Exam Logs",
      to: "dashboard",
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
      to: "student-face-reg",
      icon: "si si-user-following",
    },
    { name: "My Timetable", to: "student-timetable", icon: "si si-calendar" },
    {
      name: "Attendance History",
      to: "student-attendance",
      icon: "si si-check",
    },
    { name: "Exam History", to: "student-exam", icon: "si si-check" },
  ],
};
