import express from "express";
import { submitMessage } from "./consensus.controller";

const router = express.Router();

/**
 * @route POST /consensus/submit
 * @description Submit a consensus message to a Hedera topic
 * @access Public
 */
router.post("/submit", submitMessage);

export default router;
