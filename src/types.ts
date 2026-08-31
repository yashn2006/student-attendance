export type FacultyAccountRole = 'class_teacher' | 'normal_professor';
export type Role = 'class_teacher' | 'subject_teacher';

export interface Subject {
  id: string;
  name: string;
  code: string;
  className: string;
  totalStudents: number;
}

export type SubjectInfo = Subject;

export interface UserProfile {
  id: string;
  name: string;
  title: string;
  email: string;
  avatar: string;
  department: string;
  facultyId: string;
  accountType: FacultyAccountRole;
  isClassTeacher: boolean;
  classTeacherClassId?: string;
  classTeacherClassName?: string;
  subjects: Subject[];
  roles?: Role[];
  activeRole?: Role;
  selectedSubjectId?: string;
}

export type FacultyUser = UserProfile;

export type SessionStateStatus = 'Not Started' | 'In Session' | 'Ended';

export interface LecturePreset {
  id: string;
  subjectName: string;
  code: string;
  type: 'Lecture' | 'Practical' | 'Tutorial' | 'Seminar';
  defaultRoom: string;
  facultyName: string;
  colorBg: string;
  colorText: string;
  colorBorder: string;
}

export interface TimetableSlot {
  id: string;
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
  time: string;
  timeEnd: string;
  subjectId: string;
  subjectName: string;
  room: string;
  facultyName: string;
  type: 'Lecture' | 'Practical' | 'Tutorial';
  classId: string;
  className: string;
  sessionStatus?: SessionStateStatus;
  activeQrToken?: string;
  activeOtpCode?: string;
  startedAt?: string;
  presentCount?: number;
}

export interface Student {
  id: string;
  rollNo: string;
  name: string;
  className: string;
  avatar: string;
  overallAttendance: number; // percentage
  subjectAttendance: Record<string, number>;
  isDefaulter: boolean;
  statusTag: 'Excellent' | 'Regular' | 'At Risk' | 'Critical Defaulter';
  contactEmail: string;
  parentPhone: string;
  lastPresentTime?: string;
}

export interface StudentSubmission {
  id: string;
  studentId: string;
  studentName: string;
  rollNo: string;
  avatar: string;
  assignmentId: string;
  submittedAt: string;
  status: 'Submitted' | 'Late' | 'Pending';
  score?: number;
  feedback?: string;
}

export interface Assignment {
  id: string;
  title: string;
  subjectId: string;
  subjectName: string;
  classId?: string;
  className?: string;
  totalSubmissions: number;
  gradedCount: number;
  dueDate: string;
  totalPoints: number;
  description: string;
  status: 'Active' | 'Graded' | 'Closed' | 'Due Soon';
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
  url?: string;
}

export interface TopicMastery {
  topicName: string;
  quiz1Score: number;
  assign1Score: number;
  midTermScore: number;
  overall: number;
  needsAttention?: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: string;
  isMine: boolean;
  attachment?: {
    name: string;
    size?: string;
    type: string;
  };
}

export interface ChatThread {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  lastTime: string;
  type: 'department' | 'class_teacher' | 'direct' | 'group';
  membersCount?: number;
  onlineCount?: number;
  unreadCount?: number;
}

export interface CommandPaletteItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'Navigation' | 'Students' | 'Live Session' | 'Quick Actions' | 'AI Tools';
  iconName: string;
  action: () => void;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'urgent' | 'warning' | 'info' | 'success';
  read: boolean;
  actionLabel?: string;
  actionTab?: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface LabExercise {
  title: string;
  description: string;
  difficulty: 'Basic' | 'Intermediate' | 'Advanced';
}

export interface AILectureAnalysisResult {
  executiveSummary: string;
  learningOutcomes: string[];
  quizQuestions: QuizQuestion[];
  labExercises: LabExercise[];
  misconceptionWarnings: string[];
  recommendedRemediation: string;
  analyzedAt: string;
  sourceType: string;
}

export interface OfflineAction {
  id: string;
  actionType: string;
  payload: any;
  timestamp: string;
  status: 'queued' | 'synced' | 'failed';
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
  status: 'active' | 'ended' | 'idle';
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
  method: 'qr' | 'otp' | 'manual';
  status: 'present' | 'late' | 'absent';
}

export interface RecentActivity {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  timestamp: string;
  badgeText: string;
  badgeType: string;
  userAvatar?: string;
}
