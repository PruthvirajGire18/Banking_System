import User from "../models/User.js";
import Account from "../models/Account.js";

export const getAllCustomers = async (req, res) => {
  const customers = await User.find({ role: "customer" }, ["name", "email"]);
  res.json(customers);
};

export const getUserTransactions = async (req, res) => {
  const { id } = req.params;
  const transactions = await Account.find({ userId: id }).sort({ created_at: -1 });
  res.json(transactions);
};
