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

    // ── ACADEMIC MANAGEMENT ──
    {
      name: "Academic Setup",
      heading: true,
    },
    {
      name: "Programs & Classes",
      icon: "fa fa-graduation-cap",
      subActivePaths: ["/programs", "/classes", "/units"],
      sub: [
        {
          name: "Programs",
          to: "programs",
          icon: "fa fa-award",
        },
        {
          name: "Classes",
          to: "classes",
          icon: "fa fa-layer-group",
        },
        {
          name: "Units",
          to: "units",
          icon: "fa fa-book",
        },
      ],
    },
    {
      name: "Infrastructure",
      icon: "fa fa-building-columns",
      subActivePaths: ["/halls", "/timetable"],
      sub: [
        {
          name: "Lecture Halls",
          to: "halls",
          icon: "fa fa-door-open",
        },
        {
          name: "Timetable",
          to: "timetable",
          icon: "fa fa-calendar-days",
        },
      ],
    },

    // ── IDENTITY & ACCESS ──
    {
      name: "IAM",
      heading: true,
    },
    {
      name: "User Management",
      icon: "fa fa-user-shield",
      subActivePaths: ["/users", "/students", "/lecturers"],
      sub: [
        {
          name: "All Users",
          to: "users",
          icon: "fa fa-users-gear",
        },
        {
          name: "Lecturers",
          to: "lecturers",
          icon: "fa fa-chalkboard-user",
        },
        {
          name: "Students",
          to: "students",
          icon: "fa fa-user-graduate",
        },
      ],
    },

    // ── MONITORING ──
    {
      name: "Monitoring",
      heading: true,
    },
    {
      name: "Logs Management",
      icon: "fa fa-clipboard-list",
      subActivePaths: ["/attendance-logs", "/exam-auth-logs"],
      sub: [
        {
          name: "Attendance Logs",
          to: "attendance-logs",
          icon: "fa fa-fingerprint",
        },
        {
          name: "Exam Logs",
          to: "exam-auth-logs",
          icon: "fa fa-shield-check",
        },
      ],
    },
  ],

  lecturer: [
    { name: "Dashboard", to: "dashboard", icon: "si si-speedometer" },
    { name: "My Schedule", to: "my-schedule", icon: "si si-calendar" }, // Changed route name
    { name: "My Units", to: "my-units", icon: "fa fa-book" }, // Changed route name
    {
      name: "Attendance Scanner",
      to: "attendance-scanner",
      icon: "si si-camera",
    },
    { name: "Exam Auth", to: "exam-auth", icon: "fa fa-user-check" },
    { name: "Reports", to: "reports", icon: "fa fa-chart-line" },
  ],

  student: [
    { name: "Dashboard", to: "dashboard", icon: "si si-speedometer" },
    {
      name: "Face Registration",
      to: "face-registration",
      icon: "si si-user-following",
    },
    { name: "My Timetable", to: "my-timetable", icon: "si si-calendar" },
    {
      name: "Attendance History",
      to: "my-attendance",
      icon: "fa fa-clock-rotate-left",
    },
    { name: "Exam History", to: "exam-history", icon: "fa fa-file-invoice" },
  ],
};
