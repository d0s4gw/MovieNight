const admin = require('firebase-admin');
const mongoose = require('mongoose');
const logger = require('./utils/logger');
require('dotenv').config();

// Initialize Firebase Admin for Authentication
try {
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault()
    });
    logger.info('Firebase Admin initialized.');
  }
} catch (error) {
  logger.error({ err: error }, 'Error initializing Firebase Admin');
}

// Initialize Mongoose for MongoDB API
const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  logger.error('MONGODB_URI is not set in .env file.');
} else {
  mongoose.connect(mongoUri)
    .then(() => logger.info('Connected to Firestore MongoDB API.'))
    .catch(err => logger.error({ err }, 'Error connecting to Firestore MongoDB API'));
}

const db = {
  firestore: admin.apps.length ? admin.firestore() : null,
  mongoose: mongoose.connection
};

module.exports = db;
