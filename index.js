const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const app = express();
const cookieParser = require("cookie-parser");
const PORT = process.env.PORT || 5000;
const cors = require('cors');

const authRoutes = require('./auth/route');
const connectDB = require('./utils/configure');

// CORS configuration
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));

// Connect DB
connectDB();

// MIDDLEWARES
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Auth Routes
app.use('/api', authRoutes);
// Student Routes
app.use('/api/students', require('./student/routes'));

// First route
app.get('/', (req, res) => {
  res.send('Server started...');
});

// App listening
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});