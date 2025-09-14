require('dotenv').config();
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const http = require('http');          //  مهم للسيرفر
const { Server } = require('socket.io'); //  socket.io

const connectDB = require('./config/db.js');
const seedAdmin = require('./scripts/seedAdmin.js');

const authRoutes = require('./Admin/routes/authRoutes.js');
const departmentRoutes = require('./Admin/routes/departmentRoutes.js');
const residencyRoutes = require('./Admin/routes/residencyRoutes.js');
const contractRoutes = require('./Admin/routes/contractRoutes.js');
const employeeRoutes = require('./Admin/routes/employeeRoutes.js');
const hrRoutes = require('./Admin/routes/hrRoutes.js');
const requestRoutes = require('./Admin/routes/requestRoutes.js');
const licenceRoute = require('./Admin/routes/licenceRoutes.js');
const taskRoute = require('./Admin/routes/taskRoutes.js');
const branchRoute = require('./Admin/routes/branchRoutes.js');
const attendanceRoute = require('./Admin/routes/attendanceRoutes.js');
const leaveRoute = require('./Admin/routes/leaveRoutes.js');
const meetingRouts = require('./Admin/routes/meetingRoute.js');

const setupAttendanceCron = require('./cron/attendanceCron.js');
const startTaskStatusCron = require('./cron/tasksCorn.js');

const app = express();
const server = http.createServer(app); // 

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", 
    credentials: true
  }
});

// نخزن ال sockets المرتبطة بالـ employees
const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("⚡ User connected:", socket.id);

  // تسجيل الموظف مع الـ socket
  socket.on("register", (employeeId) => {
    onlineUsers.set(employeeId, socket.id);
    console.log(`Employee ${employeeId} registered with socket ${socket.id}`);
  });

  socket.on("disconnect", () => {
    for (let [empId, sId] of onlineUsers.entries()) {
      if (sId === socket.id) {
        onlineUsers.delete(empId);
        console.log(`Employee ${empId} disconnected`);
      }
    }
  });
});

// نخلي io و onlineUsers متاحين لباقي الملفات
app.set("io", io);
app.set("onlineUsers", onlineUsers);

// Static files
app.use('/uploads/tasks', express.static(path.join(__dirname, 'Admin', 'uploads', 'tasks')));
app.use('/uploads/requests', express.static(path.join(__dirname, 'uploads/requests')));
app.use('/uploads/meetings', express.static(path.join(__dirname, 'uploads', 'meetings')));

// Middlewares
app.use(cookieParser());
app.use(helmet());
const corsOptions = {
  origin: "http://localhost:5173",
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/residencies', residencyRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/leaves', leaveRoute);
app.use('/api/hr', hrRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/licence', licenceRoute);
app.use('/api/tasks', taskRoute);
app.use('/api/branch', branchRoute);
app.use('/api/attendance', attendanceRoute);
app.use('/api/meeting', meetingRouts);

// DB + Server
const PORT = process.env.PORT || 4000;


(async () => {
  try {
    await connectDB();
    setupAttendanceCron();
    startTaskStatusCron();

    server.listen(PORT, () => { 
      console.log(` Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error(` Error starting server: ${error.message}`);
    process.exit(1);
  }
})();
