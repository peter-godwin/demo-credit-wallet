import {Request, Response} from "express";
import userService from "../services/user.service";
import {HttpStatus, sendError, sendSuccess, sendValidationError} from "../utils/response.util";
import {validateCreateUser} from "../utils/validation.util";
import {CreateUserDTO} from "../models/user.model";

export class UserController {

    async createUser(req: Request, res: Response): Promise<void> {
        const errors = validateCreateUser(req.body);
        if (errors.length > 0) {
            sendValidationError(res, errors);
            return;
        }

        const dto: CreateUserDTO = {
            first_name: req.body.first_name,
            last_name: req.body.last_name,
            email: req.body.email,
            phone: req.body.phone,
            bvn: req.body.bvn,
        };

        try {
            const result = await userService.createUser(dto);
            sendSuccess(res, "Account created successfully", result, HttpStatus.CREATED);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Could not create account";

            if (message.includes("Karma blacklist")) {
                sendError(res, message, HttpStatus.FORBIDDEN);
                return;
            }
            if (message.includes("already exists")) {
                sendError(res, message, HttpStatus.CONFLICT);
                return;
            }

            sendError(res, message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getUser(req: Request, res: Response): Promise<void> {
        const {userId} = req.params;

        if (req.userId !== userId) {
            sendError(res, "Forbidden: you can only access your own profile", HttpStatus.FORBIDDEN);
            return;
        }

        try {
            const result = await userService.getUserById(userId);
            if (!result) {
                sendError(res, "User not found", HttpStatus.NOT_FOUND);
                return;
            }
            sendSuccess(res, "User retrieved successfully", result);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Could not retrieve user";
            sendError(res, message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}

export default new UserController();