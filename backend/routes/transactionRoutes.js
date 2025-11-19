import express from "express";
import { getTransactions, deposit, withdraw } from "../controllers/transactionController.js";

const router = express.Router();

router.get("/:id", getTransactions);
router.post("/deposit", deposit);
router.post("/withdraw", withdraw);

export default router;
