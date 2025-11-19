import Account from "../models/Account.js";

export const getTransactions = async (req, res) => {
  const { id } = req.params;
  const transactions = await Account.find({ userId: id }).sort({ created_at: -1 });
  res.json(transactions);
};

export const deposit = async (req, res) => {
  const { userId, amount } = req.body;

  const lastTxn = await Account.findOne({ userId }).sort({ _id: -1 });
  const balance = lastTxn ? lastTxn.balance_after : 0;

  const newBalance = balance + parseFloat(amount);

  await Account.create({
    userId,
    type: "deposit",
    amount,
    balance_after: newBalance
  });

  res.json({ message: "Deposit successful", balance: newBalance });
};

export const withdraw = async (req, res) => {
  const { userId, amount } = req.body;

  const lastTxn = await Account.findOne({ userId }).sort({ _id: -1 });
  const balance = lastTxn ? lastTxn.balance_after : 0;

  if (balance < amount) return res.status(400).json({ message: "Insufficient Funds" });

  const newBalance = balance - parseFloat(amount);

  await Account.create({
    userId,
    type: "withdraw",
    amount,
    balance_after: newBalance
  });

  res.json({ message: "Withdrawal successful", balance: newBalance });
};
