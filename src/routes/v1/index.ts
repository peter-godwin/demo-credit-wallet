import { Router } from "express";
import userRoutes from "./user.routes";
import walletRoutes from "./wallet.routes";
import { authRoutes } from "../../modules/auth";
import { idempotencyHandler } from "../../common/middlewares/idempotency.middleware";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/wallets", idempotencyHandler(), walletRoutes);

export default router;