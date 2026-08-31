export interface ClassStudentRecord {
  id: string;
  studentId: string;
  rollNo: string;
  name: string;
  className: string;
  oeSubject: string;
  division: 'Div A' | 'Div B' | 'Div C';
  overallAttendance: number;
  isDefaulter: boolean;
  statusTag: 'Top Ranker' | 'Regular' | 'At Risk' | 'Critical Defaulter';
  contactEmail: string;
  phone: string;
  parentPhone: string;
  batch: 'B1' | 'B2' | 'B3';
  gpa: number;
  specialWaiver: boolean;
  lastActive: string;
}

// Extracted real student records from the institutional roster sheets
const rawRosterData = [
  { name: 'Aanushiya sitaraman', rollNo: 'T.24.01', oe: 'Financial Literacy' },
  { name: 'Akshay Acharya', rollNo: 'T.24.02', oe: 'Financial Literacy' },
  { name: 'Vaisnavi Acharya', rollNo: 'T.24.03', oe: 'Advertising & Brand Management' },
  { name: 'Sanskruti Adak', rollNo: 'T.24.04', oe: 'Advertising & Brand Management' },
  { name: 'Hemalatha Ramalingam Adidravida', rollNo: 'T.24.05', oe: 'Advertising & Brand Management' },
  { name: 'Ameen Hasan', rollNo: 'T.24.06', oe: 'Advertising & Brand Management' },
  { name: 'Ansari Aqsa', rollNo: 'T.24.07', oe: 'Advertising & Brand Management' },
  { name: 'Ansari Farhat Jahan Ashfaq Ahmed', rollNo: 'T.24.08', oe: 'Advertising & Brand Management' },
  { name: 'Ashwin Ramadas Apparambil', rollNo: 'T.24.09', oe: 'Financial Literacy' },
  { name: 'Riya arabatti', rollNo: 'T.24.10', oe: 'Advertising & Brand Management' },
  { name: 'Diksha Manohar Baisane', rollNo: 'T.24.11', oe: 'Advertising & Brand Management' },
  { name: 'Simran Meghnath Bhagat', rollNo: 'T.24.12', oe: 'Advertising & Brand Management' },
  { name: 'Rutuja bide', rollNo: 'T.24.13', oe: 'Advertising & Brand Management' },
  { name: 'Chaitanya Ramesh Bonvate', rollNo: 'T.24.14', oe: 'Advertising & Brand Management' },
  { name: 'Roshni Chavan', rollNo: 'T.24.15', oe: 'Advertising & Brand Management' },
  { name: 'Chemmangatvalappil Anjali Muralidharan', rollNo: 'T.24.16', oe: 'Advertising & Brand Management' },
  { name: 'Samit madhusudhan chilively', rollNo: 'T.24.17', oe: 'Advertising & Brand Management' },
  { name: 'CHOUDHARY KAPIL UMARAM', rollNo: 'T.24.18', oe: 'Advertising & Brand Management' },
  { name: 'Suhana Natharam Choudhary', rollNo: 'T.24.19', oe: 'Advertising & Brand Management' },
  { name: 'Ismail Deshmukh', rollNo: 'T.24.20', oe: 'Advertising & Brand Management' },
  { name: 'Dhriti Jagan Dindigala', rollNo: 'T.24.22', oe: 'Advertising & Brand Management' },
  { name: 'Sanskar Rajendra Gadhave', rollNo: 'T.24.23', oe: 'Advertising & Brand Management' },
  { name: 'Ganesh Arumugam', rollNo: 'T.24.24', oe: 'Financial Literacy' },
  { name: 'Gauri Eknath butte', rollNo: 'T.24.25', oe: 'Financial Literacy' },
  { name: 'Vedant Manoj Gavhane', rollNo: 'T.24.26', oe: 'Advertising & Brand Management' },
  { name: 'Pranay Navanath Gund', rollNo: 'T.24.28', oe: 'Advertising & Brand Management' },
  { name: 'Aditi Gupta', rollNo: 'T.24.29', oe: 'Advertising & Brand Management' },
  { name: 'Dhruv Hemant gupta', rollNo: 'T.24.30', oe: 'Advertising & Brand Management' },
  { name: 'Khushi Sahadev Gupta', rollNo: 'T.24.31', oe: 'Advertising & Brand Management' },
  { name: 'Samir gupta', rollNo: 'T.24.32', oe: 'Advertising & Brand Management' },
  { name: 'Mayanka Hande', rollNo: 'T.24.33', oe: 'Advertising & Brand Management' },
  { name: 'Chaitra Hastak', rollNo: 'T.24.34', oe: 'Advertising & Brand Management' },
  { name: 'Namrata Jadhav', rollNo: 'T.24.35', oe: 'Advertising & Brand Management' },
  { name: 'Sneha Arvind Jadhav', rollNo: 'T.24.36', oe: 'Advertising & Brand Management' },
  { name: 'Joshua Elisha', rollNo: 'T.24.37', oe: 'Financial Literacy' },
  { name: 'Shravya Prakash Kadam', rollNo: 'T.24.38', oe: 'Advertising & Brand Management' },
  { name: 'Pratik Kale', rollNo: 'T.24.39', oe: 'Advertising & Brand Management' },
  { name: 'Karankumar LOGANATHAN', rollNo: 'T.24.40', oe: 'Advertising & Brand Management' },
  { name: 'Pranita Karmakar', rollNo: 'T.24.41', oe: 'Advertising & Brand Management' },
  { name: 'Tanmay Sanjay Karne', rollNo: 'T.24.42', oe: 'Advertising & Brand Management' },
  { name: 'Shiva konar', rollNo: 'T.24.46', oe: 'Financial Literacy' },
  { name: 'Konar subbaiah arumugam', rollNo: 'T.24.47', oe: 'Financial Literacy' },
  { name: 'Vijayalaxmi', rollNo: 'T.24.48', oe: 'Advertising & Brand Management' },
  { name: 'Unnati Suresh Kotian', rollNo: 'T.24.49', oe: 'Advertising & Brand Management' },
  { name: 'Saziya Banu Labbai', rollNo: 'T.24.50', oe: 'Advertising & Brand Management' },
  { name: 'Aayushi Lala', rollNo: 'T.24.51', oe: 'Advertising & Brand Management' },
  { name: 'Varun Balaji Maddiboina', rollNo: 'T.24.52', oe: 'Advertising & Brand Management' },
  { name: 'Akash Manda', rollNo: 'T.24.53', oe: 'Advertising & Brand Management' },
  { name: 'Niraj Rajendra Mankame', rollNo: 'T.24.54', oe: 'Advertising & Brand Management' },
  { name: 'Poorvi Medh', rollNo: 'T.24.55', oe: 'Advertising & Brand Management' },
  { name: 'Megha Murugan', rollNo: 'T.24.56', oe: 'Financial Literacy' },
  { name: 'Mhaske Deepti Dattatray', rollNo: 'T.24.57', oe: 'Financial Literacy' },
  { name: 'Siddhant Balaji Mhatre', rollNo: 'T.24.58', oe: 'Advertising & Brand Management' },
  { name: 'Tanish Baliram Mhatre', rollNo: 'T.24.59', oe: 'Financial Literacy' },
  { name: 'Mirza Rahema Ashraf Ali', rollNo: 'T.24.60', oe: 'Advertising & Brand Management' },
  { name: 'Mohammed Kaif', rollNo: 'T.24.61', oe: 'Advertising & Brand Management' },
  { name: 'Priyanka popat Mulik', rollNo: 'T.24.62', oe: 'Financial Literacy' },
  { name: 'Nadar Aashish Ezra', rollNo: 'T.24.63', oe: 'Advertising & Brand Management' },
  { name: 'Joshua Hariram Nadar', rollNo: 'T.24.64', oe: 'Advertising & Brand Management' },
  { name: 'Nadar Sheba Jesica Enoch simon', rollNo: 'T.24.65', oe: 'Advertising & Brand Management' },
  { name: 'Niti Deepak Nakti', rollNo: 'T.24.66', oe: 'Advertising & Brand Management' },
  { name: 'Anusha Nandi', rollNo: 'T.24.67', oe: 'Advertising & Brand Management' },
  { name: 'Yash Nandi', rollNo: 'T.24.68', oe: 'Advertising & Brand Management' },
  { name: 'Nandini Sudhagar', rollNo: 'T.24.69', oe: 'Advertising & Brand Management' },
  { name: 'Ankit Jawaharlal Nishad', rollNo: 'T.24.70', oe: 'Advertising & Brand Management' },
  { name: 'Yash Ananda Pachupate', rollNo: 'T.24.71', oe: 'Financial Literacy' },
  { name: 'Siddhi Padyachi', rollNo: 'T.24.72', oe: 'Advertising & Brand Management' },
  { name: 'Kajal Pal', rollNo: 'T.24.73', oe: 'Advertising & Brand Management' },
  { name: 'Mahyur Pal', rollNo: 'T.24.74', oe: 'Advertising & Brand Management' },
  { name: 'Saiganesh Jayaram Pandeti', rollNo: 'T.24.75', oe: 'Advertising & Brand Management' },
  { name: 'Abhipreet Pandey', rollNo: 'T.24.76', oe: 'Financial Literacy' },
  { name: 'Arun ajay pandit', rollNo: 'T.24.78', oe: 'Advertising & Brand Management' },
  { name: 'Saad Sarkar', rollNo: 'T.24.79', oe: 'Advertising & Brand Management' },
  { name: 'Angad Ramchandra Paswan', rollNo: 'T.24.80', oe: 'Financial Literacy' },
  { name: 'Almas Patel', rollNo: 'T.24.81', oe: 'Advertising & Brand Management' },
  { name: 'Bhoomi Mukesh Patel', rollNo: 'T.24.82', oe: 'Financial Literacy' },
  { name: 'Sohail Patel', rollNo: 'T.24.83', oe: 'Financial Literacy' },
  { name: 'Aditya Patil', rollNo: 'T.24.84', oe: 'Advertising & Brand Management' },
  { name: 'Divya Patil', rollNo: 'T.24.85', oe: 'Advertising & Brand Management' },
  { name: 'Gaurav Prashant Patil', rollNo: 'T.24.86', oe: 'Advertising & Brand Management' },
  { name: 'Kavisha Patil', rollNo: 'T.24.88', oe: 'Advertising & Brand Management' },
  { name: 'Mayuresh Suhas Patil', rollNo: 'T.24.89', oe: 'Advertising & Brand Management' },
  { name: 'Meet Patil', rollNo: 'T.24.90', oe: 'Financial Literacy' },
  { name: 'Priyani Nitin Patil', rollNo: 'T.24.91', oe: 'Advertising & Brand Management' },
  { name: 'Sanika Balkrishna Patil', rollNo: 'T.24.92', oe: 'Advertising & Brand Management' },
  { name: 'Dhruv pawar', rollNo: 'T.24.93', oe: 'Financial Literacy' },
  { name: 'Radha Santosh Pawaskar', rollNo: 'T.24.94', oe: 'Advertising & Brand Management' },
  { name: 'Nikitha Govindan Pillai', rollNo: 'T.24.95', oe: 'Advertising & Brand Management' },
  { name: 'Daksh Shailesh Puthran', rollNo: 'T.24.96', oe: 'Advertising & Brand Management' },
  { name: 'Rajput Manpreet Singh', rollNo: 'T.24.97', oe: 'Advertising & Brand Management' },
  { name: 'Rohan Singh Rajput', rollNo: 'T.24.98', oe: 'Advertising & Brand Management' },
  { name: 'Rakesh Choudhary', rollNo: 'T.24.99', oe: 'Advertising & Brand Management' },
  { name: 'Rehana', rollNo: 'T.24.100', oe: 'Advertising & Brand Management' },
  { name: 'Om Ruikar', rollNo: 'T.24.101', oe: 'Financial Literacy' },
  { name: 'Amey Sakharkar', rollNo: 'T.24.103', oe: 'Advertising & Brand Management' },
  { name: 'Sandhiya singaravelu', rollNo: 'T.24.104', oe: 'Advertising & Brand Management' },
  { name: 'Santhiya Selvamurugan', rollNo: 'T.24.105', oe: 'Advertising & Brand Management' },
  { name: 'Ayesha Hanif Sayyed', rollNo: 'T.24.106', oe: 'Advertising & Brand Management' },
  { name: 'Selvakodi Padmarajeshwaran Subitha', rollNo: 'T.24.107', oe: 'Advertising & Brand Management' },
  { name: 'Afreen Shah', rollNo: 'T.24.108', oe: 'Financial Literacy' },
  { name: 'Shaikh Areena Abdul kadar', rollNo: 'T.24.109', oe: 'Advertising & Brand Management' },
  { name: 'Shaikh arfat ismail', rollNo: 'T.24.110', oe: 'Advertising & Brand Management' },
  { name: 'Shaikh Arshad ahmed', rollNo: 'T.24.111', oe: 'Advertising & Brand Management' },
  { name: 'Shaikh Ashfiya phone', rollNo: 'T.24.112', oe: 'Advertising & Brand Management' },
  { name: 'Jashim Shaikh', rollNo: 'T.24.113', oe: 'Advertising & Brand Management' },
  { name: 'Shaikh Armaan', rollNo: 'T.24.115', oe: 'Advertising & Brand Management' },
  { name: 'Shaikh Mohd Arham Abdul Rahim', rollNo: 'T.24.116', oe: 'Financial Literacy' },
  { name: 'Palak Shaikh', rollNo: 'T.24.117', oe: 'Advertising & Brand Management' },
  { name: 'Shaikh Zahid Ahmed', rollNo: 'T.24.118', oe: 'Advertising & Brand Management' },
  { name: 'Idhant Shetty', rollNo: 'T.24.119', oe: 'Advertising & Brand Management' },
  { name: 'Nidhi shetty', rollNo: 'T.24.120', oe: 'Advertising & Brand Management' },
  { name: 'Shuban shetty', rollNo: 'T.24.121', oe: 'Financial Literacy' },
  { name: 'Shridhar Thirunavakarasu', rollNo: 'T.24.122', oe: 'Advertising & Brand Management' },
  { name: 'Shubham Krishnachandra Shrivastav', rollNo: 'T.24.123', oe: 'Advertising & Brand Management' },
  { name: 'Om Kailash singh', rollNo: 'T.24.125', oe: 'Financial Literacy' },
  { name: 'Sahil surve', rollNo: 'T.24.126', oe: 'Advertising & Brand Management' },
  { name: 'Sakshi Suthar', rollNo: 'T.24.127', oe: 'Advertising & Brand Management' },
  { name: 'Suzaina Sabeer Ahmed', rollNo: 'T.24.128', oe: 'Advertising & Brand Management' },
  { name: 'Tahir tagala irfan', rollNo: 'T.24.129', oe: 'Advertising & Brand Management' },
  { name: 'Samwad Santosh Tamboli', rollNo: 'T.24.130', oe: 'Advertising & Brand Management' },
  { name: 'Tanvi Jadhav', rollNo: 'T.24.131', oe: 'Advertising & Brand Management' },
  { name: 'Thevar Ragubala Pattadurai', rollNo: 'T.24.134', oe: 'Financial Literacy' },
  { name: 'Pradeep Pramod Tiwari', rollNo: 'T.24.135', oe: 'Financial Literacy' },
  { name: 'Dhanashri Suresh Vanduskar', rollNo: 'T.24.137', oe: 'Advertising & Brand Management' },
  { name: 'Omkar Pushparaj walke', rollNo: 'T.24.138', oe: 'Financial Literacy' },
  { name: 'Anshika Yadav', rollNo: 'T.24.139', oe: 'Advertising & Brand Management' },
  { name: 'Navin Yadav', rollNo: 'T.24.140', oe: 'Financial Literacy' },
  { name: 'Yashashree Panchale', rollNo: 'T.24.141', oe: 'Advertising & Brand Management' },
  { name: 'Arya Sutar', rollNo: 'T.24.142', oe: 'Advertising & Brand Management' },
  { name: 'Chetan Rajan Lokhande', rollNo: 'T.24.143', oe: 'Financial Literacy' },
  { name: 'Varun Ramchandra Trimukhe', rollNo: 'T.24.144', oe: 'Financial Literacy' },
  { name: 'Annusha Yogeshwar', rollNo: 'T.24.145', oe: 'Advertising & Brand Management' },
  { name: 'Riya Ravindra Patil', rollNo: 'T.24.146', oe: 'Financial Literacy' },
  { name: 'Arudra Gamidl', rollNo: 'T.24.147', oe: 'Advertising & Brand Management' },
  { name: 'Tanish Kamlakar Patil', rollNo: 'ST.25.148', oe: 'Advertising & Brand Management' },
  { name: 'Sarthak Satish Gaikwad', rollNo: 'ST.25.149', oe: 'Financial Literacy' },
  { name: 'Ayesha Arshad Ahmad Adhikari', rollNo: 'ST.25.150', oe: 'Advertising & Brand Management' },
  { name: 'Shayan Faizal Ahmed', rollNo: 'ST.25.151', oe: 'Advertising & Brand Management' },
  { name: 'Shivam ShravanKumar Gupta', rollNo: 'ST.25.152', oe: 'Financial Literacy' },
  { name: 'Dipesh Pramod Patil', rollNo: 'ST.25.153', oe: 'Advertising & Brand Management' },
  { name: 'Siddiqa Abdur Rehman Shaikh', rollNo: 'ST.25.154', oe: 'Advertising & Brand Management' },
  { name: 'Anthony Joshua Michael Francis', rollNo: 'ST.25.155', oe: 'Financial Literacy' },
  { name: 'Ronit Hemchandra Jha', rollNo: 'ST.25.156', oe: 'Financial Literacy' }
];

export const generateRealStudentsList = (): ClassStudentRecord[] => {
  return rawRosterData.map((item, idx) => {
    const i = idx + 1;
    const division: 'Div A' | 'Div B' | 'Div C' = i <= 48 ? 'Div A' : i <= 96 ? 'Div B' : 'Div C';
    const batch: 'B1' | 'B2' | 'B3' = i % 3 === 0 ? 'B1' : i % 3 === 1 ? 'B2' : 'B3';

    // Attendance calculation
    let attendance = 82;
    if (i % 5 === 0) {
      attendance = 54 + (i % 20); // Defaulter < 75%
    } else if (i % 3 === 0) {
      attendance = 90 + (i % 9); // Top ranker >= 90%
    } else {
      attendance = 76 + (i % 12); // Regular
    }

    const isDefaulter = attendance < 75;
    let statusTag: 'Top Ranker' | 'Regular' | 'At Risk' | 'Critical Defaulter' = 'Regular';
    if (attendance >= 90) statusTag = 'Top Ranker';
    else if (attendance >= 75) statusTag = 'Regular';
    else if (attendance >= 65) statusTag = 'At Risk';
    else statusTag = 'Critical Defaulter';

    const gpa = Number((3.1 + (attendance / 100) * 0.9).toFixed(2));
    const specialWaiver = i % 11 === 0;

    const emailPrefix = item.name.toLowerCase().replace(/[^a-z0-9]/g, '.').replace(/\.+/g, '.');

    return {
      id: `std_real_${i}`,
      studentId: item.rollNo,
      rollNo: item.rollNo,
      name: item.name,
      className: 'SYBSc IT',
      oeSubject: item.oe,
      division,
      overallAttendance: Number(attendance.toFixed(1)),
      isDefaulter,
      statusTag,
      contactEmail: `${emailPrefix}@campus.edu`,
      phone: `+91 98200 ${String(10000 + i).slice(1)}`,
      parentPhone: `+91 98110 ${String(10000 + i).slice(1)}`,
      batch,
      gpa,
      specialWaiver,
      lastActive: i % 2 === 0 ? '10 mins ago' : i % 3 === 0 ? 'Yesterday' : '2 hours ago'
    };
  });
};

export const initial150StudentsList = generateRealStudentsList();
