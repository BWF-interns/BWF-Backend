const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const cors = require('cors');
const PORT = process.env.PORT || 5000;

const connectDB = require('./utils/configure');
const authRoutes = require('./auth/route');
const studentRoutes = require('./student/profile/routes');
const dashboardRoutes = require('./student/dashboard/routes');
const coursesRoutes = require('./courses/routes');
const noticeboardRoutes = require('./noticeboard/routes');

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// DB
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/api', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/noticeboard', noticeboardRoutes);



// Warden Routes
app.use('/api/warden', require('./warden/routes'));


// First route

app.get('/', (req, res) => res.send('BWF Server running...'));

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});