require('dotenv').config();
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const  connectDB  = require('./config/db.js');
const seedAdmin=require('./scripts/seedAdmin.js');

//
const authRoutes = require('./Admin/routes/authRoutes.js');
const departmentRoutes = require('./Admin/routes/departmentRoutes.js');
const residencyRoutes = require('./Admin/routes/residencyRoutes.js');
const contractRoutes = require('./Admin/routes/contractRoutes.js');
const employeeRoutes=require('./Admin/routes/employeeRoutes.js')
const hrRoutes=require('./Admin/routes/hrRoutes.js')
const requestRoutes = require('./Admin/routes/requestRoutes.js');
const licenceRoute=require('.//Admin/routes/licenceRoutes.js')
const taskRoute=require('./Admin/routes/taskRoutes.js')
const branchRoute=require('./Admin/routes/branchRoutes.js')
const attendanceRoute=require('./Admin/routes/attendanceRoutes.js');
const setupAttendanceCron=require('./cron/attendanceCron.js');

const app = express();


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Middlewares
app.use(cookieParser());
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Test route
app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/residencies', residencyRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/admin',employeeRoutes)
app.use('/api/hr',hrRoutes)
app.use('/api/requests', requestRoutes);
app.use('/api/licence', licenceRoute);
app.use('/api/tasks' ,taskRoute)
app.use('/api/branch',branchRoute)
app.use('/api/attendance' ,attendanceRoute);


// DB + Server
const PORT = process.env.PORT || 4000;

(async () => {
  try {
    await connectDB();
setupAttendanceCron();
    // 👇 هنا هتعمل seedAdmin (لكن خليه يرجّع قيمة بدل ما يعمل process.exit)
    

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error(`❌ Error starting server: ${error.message}`);
    process.exit(1);
  }
})();