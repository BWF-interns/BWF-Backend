const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const cors = require('cors');
const PORT = process.env.PORT || 5000;

const connectDB = require('./utils/configure');

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

// Auth Routes
app.use('/api', require('./auth/route'));

// Warden Routes
app.use('/api/warden', require('./warden/routes'));
app.use('/api/teacher', require('./teacher/routes'));

// Student Routes
app.use("/api/student", require("./student/routes"));

app.get('/', (req, res) => res.send('BWF Server running...'));

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});