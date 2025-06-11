const User = require('../models/User');
const AlertEvent = require('../models/AlertEvent');

// Initialize Twilio Client if credentials are available
// Validate that account SID starts with AC and phone number present
const hasValidTwilioCreds =
  process.env.TWILIO_ACCOUNT_SID?.startsWith('AC') &&
  process.env.TWILIO_AUTH_TOKEN &&
  process.env.TWILIO_PHONE_NUMBER;

const twilioClient = hasValidTwilioCreds
  ? require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

if (!hasValidTwilioCreds) {
  console.log('Twilio not configured or invalid credentials (SID must start with "AC"). SMS alerts will be simulated.');
}

// In a real application, you would use a service like Twilio to send SMS/calls.
// const twilio = require('twilio');
// const client = new twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// @desc    Trigger a crash detection alert
// @route   POST /api/alert/crash
// @access  Private
exports.triggerCrashAlert = async (req, res) => {
  const { location } = req.body; // Expects { latitude, longitude }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Log the alert event to the database
    const newAlertEvent = new AlertEvent({
      user: user.id,
      location: location ? { latitude: location.latitude, longitude: location.longitude } : {},
    });
    await newAlertEvent.save();

    const contacts = user.emergencyContacts;
    if (!contacts || contacts.length === 0) {
      return res.status(400).json({ msg: 'No emergency contacts found for this user.' });
    }

    const locationString = location
      ? `Last known location: https://www.google.com/maps?q=${location.latitude},${location.longitude}`
      : 'Location not available.';

    // If Twilio is configured, send real SMS alerts
    if (twilioClient && process.env.TWILIO_PHONE_NUMBER) {
      console.log('Twilio client configured. Sending real SMS alerts...');
      for (const contact of contacts) {
        const alertMessage = `Emergency Alert: A crash has been detected for ${user.name}. Please check on them immediately. ${locationString}`;
        try {
          const message = await twilioClient.messages.create({
            body: alertMessage,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: contact.phone, // Assumes phone numbers are in E.164 format
          });
          console.log(`  - SMS sent to ${contact.name} at ${contact.phone}. SID: ${message.sid}`);
        } catch (smsError) {
          console.error(`  - Failed to send SMS to ${contact.name} at ${contact.phone}. Error:`, smsError.message);
        }
      }
    } else {
      // Fallback to console logging if Twilio is not configured
      console.warn('Twilio credentials not found. Logging alerts to console instead.');
      console.log(`CRASH DETECTED for user: ${user.name} (${user.email})`);
      console.log(locationString);
      console.log('Alerting emergency contacts (simulation):');
      contacts.forEach(contact => {
        const alertMessage = `Emergency Alert: A crash has been detected for ${user.name}. Please check on them immediately. ${locationString}`;
        console.log(`  - Simulating alert to ${contact.name} at ${contact.phone}: "${alertMessage}"`);
      });
    }

    res.json({ msg: 'Emergency alerts triggered successfully and event logged.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};
