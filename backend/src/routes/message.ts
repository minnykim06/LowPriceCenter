import express from "express";
import MessageController from "src/controllers/message";
import { authenticateUser } from "src/validators/authUserMiddleware";

const router = express.Router();

router.get("/", authenticateUser, MessageController.getConversationsByUser);
router.post("/", authenticateUser, MessageController.createConversation);

export default router;
