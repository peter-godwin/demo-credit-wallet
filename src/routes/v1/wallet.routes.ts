import {Router} from "express";
import walletController from "../../controllers/wallet.controller";
import {authenticate} from "../../middlewares/auth.middleware";

const router = Router();

router.use(authenticate);

router.get("/me", walletController.getWallet.bind(walletController));
router.post("/fund", walletController.fundWallet.bind(walletController));
router.post("/transfer", walletController.transferFunds.bind(walletController));
router.post("/withdraw", walletController.withdrawFunds.bind(walletController));
router.get("/transactions", walletController.getTransactions.bind(walletController));

export default router;