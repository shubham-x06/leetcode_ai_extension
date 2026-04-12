const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const UserSchema = new mongoose.Schema({
  preferences: {
    targetDifficulty: { type: String, default: 'Mixed' },
    dailyGoalCount: { type: Number, default: 1 },
    preferredLanguage: { type: String, default: 'Python' },
    theme: { type: String, default: 'light' }
  }
}, { strict: false });

const User = mongoose.model('User', UserSchema);

async function testUpdate() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected');

  const user = await User.findOne({ leetcodeUsername: { $ne: null } });
  if (!user) {
    console.log('No user found');
    process.exit(0);
  }

  console.log('Current Prefs:', user.preferences);

  const updates = { 'preferences.dailyGoalCount': 5 };
  await User.findByIdAndUpdate(user._id, { $set: updates }, { new: true, runValidators: true });

  const updatedUser = await User.findById(user._id);
  console.log('Updated Prefs:', updatedUser.preferences);

  process.exit(0);
}

testUpdate().catch(console.error);
