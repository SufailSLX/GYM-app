const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'owner'], default: 'user' },
  isSubscribed: { type: Boolean, default: false },
  subscriptionValidTill: { type: Date },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "Member" }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", UserSchema);
