import {Request, Response} from "express";
import walletService from "../services/wallet.service";
import {HttpStatus, sendError, sendSuccess} from "../utils/response.util";
import {validateAmount} from "../utils/validation.util";

export class WalletController {

    async getWallet(req: Request, res: Response): Promise<void> {
        try {
            const wallet = await walletService.getWalletByUserId(req.userId!);
            if (!wallet) {
                sendError(res, "Wallet not found", HttpStatus.NOT_FOUND);
                return;
            }
            sendSuccess(res, "Wallet retrieved successfully", wallet);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Could not retrieve wallet";
            sendError(res, message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async fundWallet(req: Request, res: Response): Promise<void> {
        const {amount} = req.body;

        if (!validateAmount(amount)) {
            sendError(res, "Amount must be a positive number", HttpStatus.UNPROCESSABLE);
            return;
        }

        try {
            const result = await walletService.fundWallet(req.userId!, {
                amount: parseFloat(amount),
            });
            sendSuccess(res, "Wallet funded successfully", result);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Could not fund wallet";
            sendError(res, message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async transferFunds(req: Request, res: Response): Promise<void> {
        const {recipient_account_number, amount, description} = req.body;

        if (!recipient_account_number || typeof recipient_account_number !== "string") {
            sendError(res, "recipient_account_number is required", HttpStatus.UNPROCESSABLE);
            return;
        }

        if (!validateAmount(amount)) {
            sendError(res, "Amount must be a positive number", HttpStatus.UNPROCESSABLE);
            return;
        }

        try {
            const result = await walletService.transferFunds(req.userId!, {
                recipient_account_number, amount: parseFloat(amount), description,
            });
            sendSuccess(res, "Transfer successful", result);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Transfer failed";

            if (message.includes("Insufficient funds") || message.includes("Recipient account not found") || message.includes("own wallet")) {
                sendError(res, message, HttpStatus.BAD_REQUEST);
                return;
            }

            sendError(res, message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async withdrawFunds(req: Request, res: Response): Promise<void> {
        const {amount, description} = req.body;

        if (!validateAmount(amount)) {
            sendError(res, "Amount must be a positive number", HttpStatus.UNPROCESSABLE);
            return;
        }

        try {
            const result = await walletService.withdrawFunds(req.userId!, {
                amount: parseFloat(amount), description,
            });
            sendSuccess(res, "Withdrawal successful", result);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Withdrawal failed";

            if (message.includes("Insufficient funds")) {
                sendError(res, message, HttpStatus.BAD_REQUEST);
                return;
            }

            sendError(res, message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getTransactions(req: Request, res: Response): Promise<void> {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        if (page < 1 || limit < 1 || limit > 100) {
            sendError(res, "Invalid pagination parameters", HttpStatus.UNPROCESSABLE);
            return;
        }

        try {
            const result = await walletService.getTransactionHistory(req.userId!, page, limit);
            sendSuccess(res, "Transactions retrieved successfully", {
                ...result, page, limit, pages: Math.ceil(result.total / limit),
            });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Could not retrieve transactions";
            sendError(res, message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}

export default new WalletController();