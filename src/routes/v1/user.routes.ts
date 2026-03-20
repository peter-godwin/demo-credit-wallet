import {Router} from "express";
import userController from "../../controllers/user.controller";
import {authenticate} from "../../middlewares/auth.middleware";

const router = Router();

router.post("/", userController.createUser.bind(userController));

router.get("/:userId", authenticate, userController.getUser.bind(userController));

export default router;