const admin = require('firebase-admin');
const mongoose = require('mongoose');
const logger = require('./utils/logger');
require('dotenv').config();

const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin for Authentication
try {
  if (admin.apps.length === 0) {
    const serviceAccountPath = path.join(__dirname, 'service-account.json');
    let credential;
    
    if (fs.existsSync(serviceAccountPath)) {
      credential = admin.credential.cert(serviceAccountPath);
      logger.info('Firebase Admin initialized with service-account.json');
    } else {
      credential = admin.credential.applicationDefault();
      logger.info('Firebase Admin initialized with applicationDefault');
    }

    admin.initializeApp({ credential });
  }
} catch (error) {
  logger.error({ err: error.message }, 'Error initializing Firebase Admin');
}

// Initialize Mongoose for MongoDB API
const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  logger.error('CRITICAL: MONGODB_URI is not set in .env file. Database connection will fail.');
} else {
  mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 5000
  })
    .then(() => logger.info('Connected to Firestore MongoDB API.'))
    .catch(err => {
      logger.error({ err: err.message }, 'Error connecting to Firestore MongoDB API. Check your MONGODB_URI and network.');
    });
}

const db = {
  firestore: admin.apps.length ? admin.firestore() : null,
  mongoose: mongoose.connection
};

module.exports = db;
