import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    role: { type: String, enum: ['user', 'admin', 'owner'], default: 'user' },
    isBanned: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

export const User = mongoose.model('User', UserSchema);
