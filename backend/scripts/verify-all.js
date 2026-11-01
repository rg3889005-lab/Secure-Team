const mongoose = require('mongoose');

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/secure_team_workspace');
  const res = await mongoose.connection.collection('users').updateMany(
    {},
    { $set: { isEmailVerified: true, isActive: true } }
  );
  console.log('Successfully verified users. Modified count:', res.modifiedCount);
  await mongoose.disconnect();
}

run().catch(console.error);
