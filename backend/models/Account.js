import mongoose from "mongoose";

const accountSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  type: { type: String, enum: ["deposit", "withdraw"] },
  amount: Number,
  balance_after: Number,
  created_at: { type: Date, default: Date.now }
});

export default mongoose.model("Account", accountSchema);
