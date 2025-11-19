import express from "express";
import { getAllCustomers, getUserTransactions } from "../controllers/bankerController.js";

const router = express.Router();

router.get("/customers", getAllCustomers);
router.get("/transactions/:id", getUserTransactions);

export default router;
