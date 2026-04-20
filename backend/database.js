const admin = require('firebase-admin');
require('dotenv').config();

const isTest = process.env.NODE_ENV === 'test';

if (!isTest) {
    try {
        admin.initializeApp({
            credential: admin.credential.applicationDefault()
        });
        console.log('Connected to Firestore database.');
    } catch (error) {
        console.error('Error connecting to Firestore database:', error.message);
        console.error('Make sure GOOGLE_APPLICATION_CREDENTIALS is set.');
    }
} else {
    console.log('Test mode: skipping actual Firestore connection.');
}

const db = admin.apps.length ? admin.firestore() : null;

module.exports = db;
