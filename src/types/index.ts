export type Role = 'class_teacher' | 'subject_teacher';

export interface SubjectInfo {
  id: string;
  name: string;
  code: string;
  classId: string;
  className: string;
}

export interface FacultyUser {
  id: string;
  facultyId: string;
  name: string;
  title: string;
  email: string;
  avatar: string;
  roles: Role[];
  activeRole: Role;
  classTeacherClassId?: string;
  classTeacherClassName?: string;
  subjects: SubjectInfo[];
  selectedSubjectId?: string;
}

export interface SubjectAttendanceDetail {
  subjectId: string;
  subjectName: string;
  teacherName: string;
  percentage: number;
  present: number;
  total: number;
}

export interface Student {
  id: string;
  rollNo: string;
  name: string;
  avatar: string;
  email: string;
  classId: string;
  className: string;
  overallAttendance: number;
  attendanceTrend: 'up' | 'down' | 'stable';
  isDefaulter: boolean;
  subjectsAttendance: SubjectAttendanceDetail[];
  consecutiveAbsences: number;
  overallGrade: string;
  avgScore: number;
  patternMismatchAlert?: string;
  notes?: string[];
}

export interface ClassBatch {
  id: string;
  name: string;
  semester: string;
  totalStudents: number;
  defaultersCount: number;
  avgAttendance: number;
}

export interface LiveSession {
  id: string;
  subjectId: string;
  subjectName: string;
  classId: string;
  className: string;
  room: string;
  facultyName: string;
  startTime: string;
  totalStudents: number;
  markedCount: number;
  status: 'active' | 'ended';
  remainingSeconds: number;
  currentPayload: {
    sessionId: string;
    slot: number;
    exp: number;
    signature: string;
  };
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  studentId: string;
  studentName: string;
  rollNo: string;
  avatar: string;
  timestamp: string;
  method: 'qr' | 'manual';
  status: 'present' | 'absent' | 'late';
}

export interface TimetableSlot {
  id: string;
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat';
  time: string;
  timeEnd: string;
  subjectId: string;
  subjectName: string;
  room: string;
  facultyName: string;
  type: 'Lecture' | 'Practical' | 'Tutorial';
  classId: string;
  className: string;
}

export interface Assignment {
  id: string;
  title: string;
  subjectId: string;
  subjectName: string;
  classId: string;
  className: string;
  dueDate: string;
  totalPoints: number;
  gradedCount: number;
  totalSubmissions: number;
  status: 'Due Soon' | 'Past Due' | 'Graded';
  description: string;
}

export interface StudentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  rollNo: string;
  avatar: string;
  submittedAt: string;
  status: 'Submitted' | 'Late' | 'Pending';
  score?: number;
  feedback?: string;
}

export interface CourseResource {
  id: string;
  title: string;
  moduleName: string;
  subjectId: string;
  type: 'pdf' | 'video' | 'presentation';
  size: string;
  uploadDate: string;
  isShared: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: string;
  attachment?: {
    name: string;
    size: string;
    type: string;
  };
  isMine: boolean;
}

export interface ChatThread {
  id: string;
  name: string;
  type: 'group' | 'direct';
  membersCount?: number;
  onlineCount?: number;
  lastMessage: string;
  lastTime: string;
  unreadCount: number;
  avatar?: string;
}

export interface TopicMastery {
  topicName: string;
  quiz1Score: number;
  assign1Score: number;
  midTermScore: number;
  overall: number;
  needsAttention?: boolean;
}

export interface RecentActivity {
  id: string;
  type: 'submission' | 'announcement' | 'attendance' | 'leave';
  title: string;
  subtitle: string;
  timestamp: string;
  badgeText: string;
  badgeType: 'success' | 'warning' | 'info' | 'purple';
  userAvatar?: string;
}

export interface OfflineAction {
  id: string;
  actionType: 'MARK_ATTENDANCE' | 'START_SESSION' | 'END_SESSION' | 'SUBMIT_GRADES' | 'POST_ANNOUNCEMENT';
  payload: any;
  timestamp: string;
  status: 'queued' | 'synced';
}
