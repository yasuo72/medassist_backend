require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const passport = require('passport');
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const path = require('path');

// Passport Config
require('./config/passport')(passport);

// Connect to Database
connectDB();

const app = express();
const rateLimit = require('express-rate-limit');
const { rateLimit: rateLimitConfig } = require('./config/rate-limit');

// Rate limiting
const limiter = rateLimit({
  windowMs: rateLimitConfig.windowMs, // 15 minutes
  max: rateLimitConfig.maxRequests, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  trustProxy: 1 // Trust first proxy (Railway)
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// Apply rate limiting
app.use(limiter);

// Serve uploaded medical record files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Legacy path used by older mobile builds (double-slash /app/uploads/...)
app.use('/app/uploads', express.static(path.join(__dirname, 'uploads')));

// Express Session Middleware
// This is required for the Google OAuth flow
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'keyboard cat',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 // 24 hours
  }
};

if (process.env.NODE_ENV === 'production') {
  sessionConfig.store = new RedisStore({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
  });
}

app.use(session(sessionConfig));

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
app.use('/api/summary', require('./routes/summary'));

// Basic Route
app.get('/', (req, res) => {
  res.send('MedAssist+ Backend API is running...');
});

// Public emergency viewer route – serves the HTML shell; client-side JS will fetch details
app.get('/emergency/view/:emergencyId', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'emergency-view.html'));
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
