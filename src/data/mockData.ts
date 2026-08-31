import {
  UserProfile,
  Student,
  TimetableSlot,
  Assignment,
  StudentSubmission,
  CourseResource,
  ChatThread,
  ChatMessage,
  TopicMastery,
  RecentActivity,
  LiveSession,
  AttendanceRecord
} from '../types';

export const classTeacherProfile: UserProfile = {
  id: 'fac_101',
  facultyId: 'FAC-2024-MS',
  name: 'Dr. Minal Sarode',
  title: 'Senior Associate Professor & SYBSc IT Class Teacher',
  email: 'minal.sarode@university.edu',
  avatar: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150"><rect width="100%" height="100%" fill="%231A1025" rx="32"/><rect x="8" y="8" width="134" height="134" fill="none" stroke="%238B5CF6" stroke-width="4" rx="26"/><text x="50%" y="46%" dominant-baseline="middle" text-anchor="middle" fill="%23A3E635" font-family="sans-serif" font-weight="900" font-size="46">MS</text><text x="50%" y="74%" dominant-baseline="middle" text-anchor="middle" fill="%23FFFFFF" font-family="sans-serif" font-weight="800" font-size="8" letter-spacing="0.5">DR. MINAL SARODE</text></svg>',
  department: 'Department of Computer Science',
  accountType: 'class_teacher',
  isClassTeacher: true,
  classTeacherClassId: 'class_sybsc_it',
  classTeacherClassName: 'SYBSc IT',
  roles: ['class_teacher', 'subject_teacher'],
  activeRole: 'class_teacher',
  selectedSubjectId: 'subj_ds',
  subjects: [
    { id: 'subj_ds', name: 'Data Structures & Algorithms', code: 'IT401', className: 'SYBSc IT - Div A', totalStudents: 64 },
    { id: 'subj_os', name: 'Operating Systems Architecture', code: 'IT402', className: 'SYBSc IT - Div A', totalStudents: 64 },
    { id: 'subj_dbms', name: 'Advanced Database Systems', code: 'IT403', className: 'SYBSc IT - Div B', totalStudents: 58 },
    { id: 'subj_cn', name: 'Computer Networks & Security', code: 'IT404', className: 'SYBSc IT - Div B', totalStudents: 60 },
    { id: 'subj_web', name: 'Modern Web Engineering', code: 'IT405', className: 'SYBSc IT - Div A', totalStudents: 55 },
    { id: 'subj_fl', name: 'Financial Literacy (OE)', code: 'OE101', className: 'SYBSc IT - Div C', totalStudents: 50 },
    { id: 'subj_abm', name: 'Advertising & Brand Management (OE)', code: 'OE102', className: 'SYBSc IT - Div C', totalStudents: 100 }
  ]
};

export const mockFacultyUser = classTeacherProfile;

export const normalProfessorProfile: UserProfile = {
  id: 'fac_202',
  facultyId: 'FAC-2024-MS',
  name: 'Dr. Minal Sarode',
  title: 'Assistant Professor & Lab Coordinator',
  email: 'minal.sarode@university.edu',
  avatar: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150"><rect width="100%" height="100%" fill="%231A1025" rx="32"/><rect x="8" y="8" width="134" height="134" fill="none" stroke="%238B5CF6" stroke-width="4" rx="26"/><text x="50%" y="46%" dominant-baseline="middle" text-anchor="middle" fill="%23A3E635" font-family="sans-serif" font-weight="900" font-size="46">MS</text><text x="50%" y="74%" dominant-baseline="middle" text-anchor="middle" fill="%23FFFFFF" font-family="sans-serif" font-weight="800" font-size="8" letter-spacing="0.5">DR. MINAL SARODE</text></svg>',
  department: 'Department of Computer Science',
  accountType: 'normal_professor',
  isClassTeacher: false,
  roles: ['subject_teacher'],
  activeRole: 'subject_teacher',
  selectedSubjectId: 'subj_cn',
  subjects: [
    { id: 'subj_cn', name: 'Computer Networks & Security', code: 'IT404', className: 'SYBSc IT - Div A', totalStudents: 64 },
    { id: 'subj_web', name: 'Modern Web Engineering', code: 'IT405', className: 'SYBSc IT - Div B', totalStudents: 55 }
  ]
};

export const mockStudents: Student[] = [
  {
    id: 'std_001',
    rollNo: 'T.24.01',
    name: 'Aanushiya sitaraman',
    avatar: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100%" height="100%" fill="%231A1025"/><text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" fill="%23A3E635" font-family="sans-serif" font-weight="800" font-size="32">AS</text></svg>',
    className: 'SYBSc IT',
    overallAttendance: 88.5,
    subjectAttendance: { subj_ds: 85, subj_os: 90, subj_dbms: 89, subj_cn: 88 },
    isDefaulter: false,
    statusTag: 'Regular',
    contactEmail: 'aanushiya.sitaraman@university.edu',
    parentPhone: '+91 98201 44102',
    lastPresentTime: '10:02 AM today'
  },
  {
    id: 'std_002',
    rollNo: 'T.24.02',
    name: 'Akshay Acharya',
    avatar: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100%" height="100%" fill="%231A1025"/><text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" fill="%23A3E635" font-family="sans-serif" font-weight="800" font-size="32">AA</text></svg>',
    className: 'SYBSc IT',
    overallAttendance: 94.0,
    subjectAttendance: { subj_ds: 95, subj_os: 92, subj_dbms: 95, subj_cn: 94 },
    isDefaulter: false,
    statusTag: 'Excellent',
    contactEmail: 'akshay.acharya@university.edu',
    parentPhone: '+91 98203 11982',
    lastPresentTime: '10:02 AM today'
  },
  {
    id: 'std_003',
    rollNo: 'T.24.03',
    name: 'Vaisnavi Acharya',
    avatar: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100%" height="100%" fill="%231A1025"/><text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" fill="%23A3E635" font-family="sans-serif" font-weight="800" font-size="32">VA</text></svg>',
    className: 'SYBSc IT',
    overallAttendance: 76.2,
    subjectAttendance: { subj_ds: 78, subj_os: 75, subj_dbms: 75, subj_cn: 76 },
    isDefaulter: false,
    statusTag: 'Regular',
    contactEmail: 'vaisnavi.acharya@university.edu',
    parentPhone: '+91 98112 00921',
    lastPresentTime: 'Yesterday'
  },
  {
    id: 'std_004',
    rollNo: 'T.24.04',
    name: 'Sanskruti Adak',
    avatar: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100%" height="100%" fill="%231A1025"/><text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" fill="%23A3E635" font-family="sans-serif" font-weight="800" font-size="32">SA</text></svg>',
    className: 'SYBSc IT',
    overallAttendance: 71.0,
    subjectAttendance: { subj_ds: 70, subj_os: 72, subj_dbms: 71, subj_cn: 71 },
    isDefaulter: true,
    statusTag: 'At Risk',
    contactEmail: 'sanskruti.adak@university.edu',
    parentPhone: '+91 98700 33211',
    lastPresentTime: '3 days ago'
  },
  {
    id: 'std_005',
    rollNo: 'T.24.05',
    name: 'Hemalatha Ramalingam Adidravida',
    avatar: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100%" height="100%" fill="%231A1025"/><text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" fill="%23A3E635" font-family="sans-serif" font-weight="800" font-size="32">HA</text></svg>',
    className: 'SYBSc IT',
    overallAttendance: 89.5,
    subjectAttendance: { subj_ds: 90, subj_os: 88, subj_dbms: 90, subj_cn: 90 },
    isDefaulter: false,
    statusTag: 'Regular',
    contactEmail: 'hemalatha.adidravida@university.edu',
    parentPhone: '+91 98331 44552',
    lastPresentTime: '10:01 AM today'
  },
  {
    id: 'std_006',
    rollNo: 'T.24.06',
    name: 'Ameen Hasan',
    avatar: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100%" height="100%" fill="%231A1025"/><text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" fill="%23A3E635" font-family="sans-serif" font-weight="800" font-size="32">AH</text></svg>',
    className: 'SYBSc IT',
    overallAttendance: 85.0,
    subjectAttendance: { subj_ds: 85, subj_os: 85, subj_dbms: 85, subj_cn: 85 },
    isDefaulter: false,
    statusTag: 'Regular',
    contactEmail: 'ameen.hasan@university.edu',
    parentPhone: '+91 98110 55432',
    lastPresentTime: '10:03 AM today'
  }
];

export const mockTimetable: TimetableSlot[] = [
  // --- MONDAY ---
  {
    id: 'ts_mon_1',
    day: 'Mon',
    time: '10:00 AM',
    timeEnd: '11:00 AM',
    subjectId: 'subj_ds',
    subjectName: 'Data Structures & Algorithms',
    room: 'Room 402',
    facultyName: 'Dr. Minal Sarode',
    type: 'Lecture',
    classId: 'class_sybsc_it',
    className: 'SYBSc IT - Div A',
    sessionStatus: 'In Session',
    presentCount: 58,
    activeOtpCode: '84921'
  },
  {
    id: 'ts_mon_2',
    day: 'Mon',
    time: '11:15 AM',
    timeEnd: '12:15 PM',
    subjectId: 'subj_os',
    subjectName: 'Operating Systems Architecture',
    room: 'Lab 2',
    facultyName: 'Dr. Minal Sarode',
    type: 'Practical',
    classId: 'class_sybsc_it',
    className: 'SYBSc IT - Div A',
    sessionStatus: 'Not Started',
    presentCount: 0
  },
  {
    id: 'ts_mon_3',
    day: 'Mon',
    time: '01:00 PM',
    timeEnd: '02:00 PM',
    subjectId: 'subj_dbms',
    subjectName: 'Advanced Database Systems',
    room: 'Room 402',
    facultyName: 'Dr. Minal Sarode',
    type: 'Lecture',
    classId: 'class_sybsc_it',
    className: 'SYBSc IT - Div B',
    sessionStatus: 'Not Started',
    presentCount: 0
  },
  {
    id: 'ts_mon_4',
    day: 'Mon',
    time: '02:15 PM',
    timeEnd: '03:15 PM',
    subjectId: 'subj_cn',
    subjectName: 'Computer Networks & Security',
    room: 'Lab 1',
    facultyName: 'Dr. Minal Sarode',
    type: 'Lecture',
    classId: 'class_sybsc_it',
    className: 'SYBSc IT - Div B',
    sessionStatus: 'Not Started',
    presentCount: 0
  },

  // --- TUESDAY ---
  {
    id: 'ts_tue_1',
    day: 'Tue',
    time: '10:00 AM',
    timeEnd: '11:00 AM',
    subjectId: 'subj_web',
    subjectName: 'Modern Web Engineering',
    room: 'Lab 3',
    facultyName: 'Dr. Minal Sarode',
    type: 'Practical',
    classId: 'class_sybsc_it',
    className: 'SYBSc IT - Div A',
    sessionStatus: 'Not Started',
    presentCount: 0
  },
  {
    id: 'ts_tue_2',
    day: 'Tue',
    time: '11:15 AM',
    timeEnd: '12:15 PM',
    subjectId: 'subj_fl',
    subjectName: 'Financial Literacy (OE)',
    room: 'Seminar Hall B',
    facultyName: 'Dr. Minal Sarode',
    type: 'Lecture',
    classId: 'class_sybsc_it',
    className: 'SYBSc IT - Div C',
    sessionStatus: 'Not Started',
    presentCount: 0
  },
  {
    id: 'ts_tue_3',
    day: 'Tue',
    time: '01:00 PM',
    timeEnd: '02:00 PM',
    subjectId: 'subj_abm',
    subjectName: 'Advertising & Brand Management (OE)',
    room: 'Auditorium 1',
    facultyName: 'Dr. Minal Sarode',
    type: 'Lecture',
    classId: 'class_sybsc_it',
    className: 'SYBSc IT - Div C',
    sessionStatus: 'Not Started',
    presentCount: 0
  },

  // --- WEDNESDAY ---
  {
    id: 'ts_wed_1',
    day: 'Wed',
    time: '10:00 AM',
    timeEnd: '11:00 AM',
    subjectId: 'subj_ds',
    subjectName: 'Data Structures & Algorithms',
    room: 'Room 402',
    facultyName: 'Dr. Minal Sarode',
    type: 'Lecture',
    classId: 'class_sybsc_it',
    className: 'SYBSc IT - Div A',
    sessionStatus: 'Not Started',
    presentCount: 0
  },
  {
    id: 'ts_wed_2',
    day: 'Wed',
    time: '11:15 AM',
    timeEnd: '12:15 PM',
    subjectId: 'subj_os',
    subjectName: 'Operating Systems Architecture',
    room: 'Lab 2',
    facultyName: 'Dr. Minal Sarode',
    type: 'Practical',
    classId: 'class_sybsc_it',
    className: 'SYBSc IT - Div A',
    sessionStatus: 'Not Started',
    presentCount: 0
  },

  // --- THURSDAY ---
  {
    id: 'ts_thu_1',
    day: 'Thu',
    time: '10:00 AM',
    timeEnd: '11:00 AM',
    subjectId: 'subj_dbms',
    subjectName: 'Advanced Database Systems',
    room: 'Room 402',
    facultyName: 'Dr. Minal Sarode',
    type: 'Lecture',
    classId: 'class_sybsc_it',
    className: 'SYBSc IT - Div B',
    sessionStatus: 'Not Started',
    presentCount: 0
  },
  {
    id: 'ts_thu_2',
    day: 'Thu',
    time: '11:15 AM',
    timeEnd: '12:15 PM',
    subjectId: 'subj_cn',
    subjectName: 'Computer Networks & Security',
    room: 'Lab 1',
    facultyName: 'Dr. Minal Sarode',
    type: 'Lecture',
    classId: 'class_sybsc_it',
    className: 'SYBSc IT - Div B',
    sessionStatus: 'Not Started',
    presentCount: 0
  },

  // --- FRIDAY ---
  {
    id: 'ts_fri_1',
    day: 'Fri',
    time: '10:00 AM',
    timeEnd: '11:00 AM',
    subjectId: 'subj_web',
    subjectName: 'Modern Web Engineering',
    room: 'Lab 3',
    facultyName: 'Dr. Minal Sarode',
    type: 'Practical',
    classId: 'class_sybsc_it',
    className: 'SYBSc IT - Div A',
    sessionStatus: 'Not Started',
    presentCount: 0
  },
  {
    id: 'ts_fri_2',
    day: 'Fri',
    time: '01:00 PM',
    timeEnd: '02:00 PM',
    subjectId: 'subj_fl',
    subjectName: 'Financial Literacy (OE)',
    room: 'Seminar Hall B',
    facultyName: 'Dr. Minal Sarode',
    type: 'Lecture',
    classId: 'class_sybsc_it',
    className: 'SYBSc IT - Div C',
    sessionStatus: 'Not Started',
    presentCount: 0
  },
  {
    id: 'ts_sat_1',
    day: 'Sat',
    time: '10:00 AM',
    timeEnd: '11:30 AM',
    subjectId: 'subj_abm',
    subjectName: 'Advertising & Brand Management (OE)',
    room: 'Auditorium 1',
    facultyName: 'Dr. Minal Sarode',
    type: 'Lecture',
    classId: 'class_sybsc_it',
    className: 'SYBSc IT - Div C',
    sessionStatus: 'Not Started',
    presentCount: 0
  }
];

export const mockAssignments: Assignment[] = [
  {
    id: 'assign_1',
    title: 'Data Structures Lab 1: Red-Black Trees',
    subjectId: 'subj_ds',
    subjectName: 'Data Structures',
    classId: 'class_sybsc_it',
    className: 'SYBSc IT',
    totalSubmissions: 64,
    gradedCount: 45,
    dueDate: 'Oct 12, 11:59 PM',
    totalPoints: 100,
    description: 'Implementation of balance rotations and insertion complexity profiling.',
    status: 'Active'
  },
  {
    id: 'assign_2',
    title: 'OS Process Synchronization Challenge',
    subjectId: 'subj_os',
    subjectName: 'Operating Systems',
    classId: 'class_sybsc_it',
    className: 'SYBSc IT',
    totalSubmissions: 64,
    gradedCount: 60,
    dueDate: 'Oct 08, 11:59 PM',
    totalPoints: 50,
    description: 'POSIX semaphores and Producer-Consumer thread safety analysis.',
    status: 'Graded'
  }
];

export const mockSubmissions: StudentSubmission[] = [
  {
    id: 'sub_101',
    studentId: 'std_002',
    studentName: 'Diya Patel',
    rollNo: 'IT002',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    assignmentId: 'assign_1',
    submittedAt: 'Today, 09:12 AM',
    status: 'Submitted',
    score: 95,
    feedback: 'Flawless tree rotation logic and clean memory allocation.'
  },
  {
    id: 'sub_102',
    studentId: 'std_001',
    studentName: 'Aarav Sharma',
    rollNo: 'IT001',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80',
    assignmentId: 'assign_1',
    submittedAt: 'Yesterday, 11:45 PM',
    status: 'Late',
    score: 68,
    feedback: 'Missing tree deletion edge cases. Needs re-testing.'
  }
];

export const mockCourseResources: CourseResource[] = [
  {
    id: 'res_1',
    title: 'Unit1_DataStructures_BalancedTrees.pdf',
    moduleName: 'Module 1: Introduction',
    subjectId: 'subj_ds',
    type: 'pdf',
    size: '3.8 MB',
    uploadDate: '2 hours ago',
    isShared: true
  },
  {
    id: 'res_2',
    title: 'Lecture2_OperatingSystems_Paging.mp4',
    moduleName: 'Module 2: Core Concepts',
    subjectId: 'subj_os',
    type: 'video',
    size: '85 MB',
    uploadDate: 'Yesterday',
    isShared: true
  }
];

export const mockChatThreads: ChatThread[] = [
  {
    id: 'thread_1',
    name: 'SYBSc IT - Class Group',
    avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=120&auto=format&fit=crop&q=80',
    lastMessage: 'Dr. Minal Sarode: QR Session for Data Structures is active in Lab 4.',
    lastTime: '09:01 AM',
    type: 'class_teacher',
    membersCount: 64,
    onlineCount: 42
  },
  {
    id: 'thread_2',
    name: 'IT Faculty Council',
    avatar: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=120&auto=format&fit=crop&q=80',
    lastMessage: 'HOD: Midterm examination schedules are published.',
    lastTime: 'Yesterday',
    type: 'department',
    membersCount: 18,
    onlineCount: 8
  }
];

export const mockChatMessages: ChatMessage[] = [
  {
    id: 'msg_1',
    senderId: 'fac_101',
    senderName: 'Dr. Minal Sarode',
    senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    text: 'Good morning everyone. Please note that today\'s Data Structures session is conducted in Lab 4 with live QR verification.',
    timestamp: '09:00 AM',
    isMine: true
  }
];

export const mockTopicMastery: TopicMastery[] = [
  { topicName: 'Binary Trees & Rotations', quiz1Score: 88, assign1Score: 92, midTermScore: 85, overall: 88 },
  { topicName: 'Memory Allocation & Paging', quiz1Score: 72, assign1Score: 78, midTermScore: 70, overall: 73 },
  { topicName: 'Concurrency Control', quiz1Score: 40, assign1Score: 35, midTermScore: 30, overall: 35, needsAttention: true }
];

export const mockRecentActivities: RecentActivity[] = [
  {
    id: 'act_1',
    type: 'submission',
    title: 'Alex Johnson submitted Data Structures Lab 1',
    subtitle: 'Red-Black Trees Implementation',
    timestamp: '10m ago',
    badgeText: 'SUBMITTED',
    badgeType: 'success',
    userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80'
  },
  {
    id: 'act_2',
    type: 'submission',
    title: 'Aarav Sharma submitted late assignment',
    subtitle: 'OS Process Synchronization',
    timestamp: '2h ago',
    badgeText: 'LATE SUBMISSION',
    badgeType: 'warning',
    userAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80'
  }
];

export const initialActiveLiveSession: LiveSession = {
  id: 'sess_99201',
  subjectId: 'subj_ds',
  subjectName: 'Data Structures & Algorithms',
  classId: 'class_sybsc_it',
  className: 'SYBSc IT - Div A',
  room: 'Lab 4',
  facultyName: 'Dr. Minal Sarode',
  startTime: '09:00 AM',
  totalStudents: 64,
  markedCount: 48,
  status: 'active',
  remainingSeconds: 299,
  currentPayload: {
    sessionId: 'sess_99201',
    slot: 12,
    exp: Date.now() + 4000,
    signature: 'hmac_7a9f82b01e'
  }
};

export const initialAttendanceRecords: AttendanceRecord[] = [
  { id: 'ar_1', sessionId: 'sess_99201', studentId: 'std_002', studentName: 'Diya Patel', rollNo: 'IT002', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80', timestamp: '09:02 AM', method: 'qr', status: 'present' },
  { id: 'ar_2', sessionId: 'sess_99201', studentId: 'std_005', studentName: 'Alex Johnson', rollNo: 'IT005', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80', timestamp: '09:01 AM', method: 'qr', status: 'present' },
  { id: 'ar_3', sessionId: 'sess_99201', studentId: 'std_006', studentName: 'Sarah P.', rollNo: 'IT006', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80', timestamp: '09:00 AM', method: 'otp', status: 'present' }
];
