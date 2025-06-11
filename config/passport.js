const GoogleStrategy = require('passport-google-oauth20').Strategy;
const mongoose = require('mongoose');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');

module.exports = function (passport) {
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: '/api/auth/google/callback',
        },
        async (accessToken, refreshToken, profile, done) => {
          const newUser = {
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
          };

          try {
            let user = await User.findOne({ googleId: profile.id });

            if (user) {
              done(null, user);
            } else {
              // If user does not exist, check if the email is already in use
              user = await User.findOne({ email: newUser.email });
              if (user) {
                  // If email exists, link the Google ID to the existing account
                  user.googleId = newUser.googleId;
                  await user.save();
                  done(null, user);
              } else {
                  // Otherwise, create a new user
                  newUser.emergencyId = uuidv4(); // Assign a unique emergency ID
                  user = await User.create(newUser);
                  done(null, user);
              }
            }
          } catch (err) {
            console.error(err);
            done(err, null);
          }
        }
      )
    );
  } else {
    console.log('Google OAuth not configured (GOOGLE_CLIENT_ID missing). Skipping GoogleStrategy.');
  }

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => done(err, user));
  });
};
