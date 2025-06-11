require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const passport = require('passport');
const session = require('express-session');

// Passport Config
require('./config/passport')(passport);

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Express Session Middleware
// This is required for the Google OAuth flow
app.use(
  session({
    secret: 'keyboard cat', // TODO: Move to .env
    resave: false,
    saveUninitialized: false,
  })
);

// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

// Define Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/records', require('./routes/medicalRecords'));
app.use('/api/family', require('./routes/family'));
app.use('/api/emergency', require('./routes/emergency'));
app.use('/api/user', require('./routes/user'));
app.use('/api/alert', require('./routes/alert'));
app.use('/api/qr', require('./routes/qr'));

// Basic Route
app.get('/', (req, res) => {
  res.send('MedAssist+ Backend API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
