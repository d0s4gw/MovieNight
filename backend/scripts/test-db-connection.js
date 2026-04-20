const mongoose = require('mongoose');
require('dotenv').config();

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  console.error('MONGODB_URI is not set in .env file.');
  process.exit(1);
}

async function test() {
  try {
    console.log('Connecting to MovieNight Firestore MongoDB API...');
    await mongoose.connect(mongoUri);
    console.log('Connected successfully!');

    // Define a temporary schema for testing
    const TestSchema = new mongoose.Schema({ name: String, timestamp: Date });
    const TestModel = mongoose.model('ConnectionTest', TestSchema);

    console.log('Attempting to write a test document...');
    const doc = new TestModel({ name: 'MovieNight Diagnostic', timestamp: new Date() });
    await doc.save();
    console.log('Write successful! Doc ID:', doc._id);

    console.log('Attempting to read the test document...');
    const found = await TestModel.findById(doc._id);
    console.log('Read successful! Found:', found.name);

    console.log('Cleaning up...');
    await TestModel.deleteOne({ _id: doc._id });
    console.log('Cleanup successful!');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Connection Test Failed:');
    console.error(error);
    process.exit(1);
  }
}

test();
