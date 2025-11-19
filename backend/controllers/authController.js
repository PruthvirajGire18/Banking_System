// controllers/authController.js
import User from "../models/User.js";
import crypto from "crypto";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: "All fields required" });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already registered" });

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await User.create({
      name,
      email,
      password: hashed,
      role: "customer" // signup creates customers only
    });

    // Optionally create an initial account record with balance 0 (not required but useful)
    // import Account model at top if you want this:
    // await Account.create({ userId: user._id, type: "deposit", amount: 0, balance_after: 0 });

    res.status(201).json({ message: "User registered", user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });

    // random 36-char token
    const token = crypto.randomBytes(18).toString("hex");

    res.json({
      token,
      user: { id: user._id, name: user.name, role: user.role, email: user.email }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
