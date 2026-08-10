import { v4 as uuidv4 } from "uuid";
import db from "../../config/db";
import { FundWalletDTO, TransferDTO, Wallet, WithdrawDTO } from "./wallet.model";
import { Transaction } from "./transaction.model";
import { generateReference } from "../../utils/account.util";
import { comparePin } from "../../common/utils/security.util";

const roundCurrency = (amount: number): number => Math.round(amount * 100) / 100;

export class WalletService {
    async getWalletByUserId(userId: string): Promise<Wallet | null> {
        return db("wallets").where({ user_id: userId, is_active: true }).first() || null;
    }

    async getWalletByAccountNumber(accountNumber: string): Promise<Wallet | null> {
        return db("wallets").where({ account_number: accountNumber, is_active: true }).first() || null;
    }

    async fundWallet(userId: string, dto: FundWalletDTO): Promise<{ wallet: Wallet; transaction: Transaction }> {
        return db.transaction(async (trx) => {
            const wallet = await trx("wallets")
                .where({ user_id: userId, is_active: true })
                .forUpdate()
                .first();

            if (!wallet) throw new Error("Wallet not found or inactive");

            const amount = roundCurrency(dto.amount);
            const balanceBefore = roundCurrency(parseFloat(wallet.balance));
            const balanceAfter = roundCurrency(balanceBefore + amount);

            await trx("wallets")
                .where({ id: wallet.id })
                .update({ balance: balanceAfter, updated_at: new Date() });

            const txId = uuidv4();
            const reference = generateReference();

            await trx("transactions").insert({
                id: txId,
                wallet_id: wallet.id,
                reference,
                type: "credit",
                category: "fund",
                amount,
                balance_before: balanceBefore,
                balance_after: balanceAfter,
                description: "Wallet funding",
                status: "success",
            });

            const [updatedWallet] = await trx("wallets").where({ id: wallet.id });
            const [transaction] = await trx("transactions").where({ id: txId });

            return { wallet: updatedWallet, transaction };
        });
    }

    async transferFunds(senderUserId: string, dto: TransferDTO): Promise<{
        senderWallet: Wallet;
        transaction: Transaction;
    }> {
        const senderUser = await db("users").where({ id: senderUserId }).first();
        if (senderUser && senderUser.transaction_pin_hash) {
            if (!dto.pin) {
                throw new Error("Transaction PIN is required");
            }
            const isPinValid = await comparePin(dto.pin, senderUser.transaction_pin_hash);
            if (!isPinValid) {
                throw new Error("Invalid transaction PIN");
            }
        }

        return db.transaction(async (trx) => {
            // Find wallets first to determine sorted IDs for deterministic locking order
            const initialSenderWallet = await trx("wallets")
                .where({ user_id: senderUserId, is_active: true })
                .first();

            if (!initialSenderWallet) throw new Error("Sender wallet not found or inactive");

            const initialRecipientWallet = await trx("wallets")
                .where({ account_number: dto.recipient_account_number, is_active: true })
                .first();

            if (!initialRecipientWallet) {
                throw new Error("Recipient account not found");
            }

            if (initialSenderWallet.id === initialRecipientWallet.id) {
                throw new Error("Cannot transfer funds to your own wallet");
            }

            // Lock wallets in deterministic order by wallet ID to prevent deadlocks
            const sortedIds = [initialSenderWallet.id, initialRecipientWallet.id].sort();
            for (const id of sortedIds) {
                await trx("wallets").where({ id }).forUpdate().first();
            }

            // Re-read locked wallet records
            const [senderWallet] = await trx("wallets").where({ id: initialSenderWallet.id });
            const [recipientWallet] = await trx("wallets").where({ id: initialRecipientWallet.id });

            const amount = roundCurrency(dto.amount);
            const senderBalanceBefore = roundCurrency(parseFloat(senderWallet.balance));

            if (senderBalanceBefore < amount) {
                throw new Error("Insufficient funds");
            }

            const senderBalanceAfter = roundCurrency(senderBalanceBefore - amount);
            const recipientBalanceBefore = roundCurrency(parseFloat(recipientWallet.balance));
            const recipientBalanceAfter = roundCurrency(recipientBalanceBefore + amount);

            await trx("wallets")
                .where({ id: senderWallet.id })
                .update({ balance: senderBalanceAfter, updated_at: new Date() });

            await trx("wallets")
                .where({ id: recipientWallet.id })
                .update({ balance: recipientBalanceAfter, updated_at: new Date() });

            const reference = generateReference();
            const debitTxId = uuidv4();
            const creditTxId = uuidv4();
            const description = dto.description;

            await trx("transactions").insert({
                id: debitTxId,
                wallet_id: senderWallet.id,
                reference,
                type: "debit",
                category: "transfer_out",
                amount,
                balance_before: senderBalanceBefore,
                balance_after: senderBalanceAfter,
                description,
                counterpart_wallet_id: recipientWallet.id,
                status: "success",
            });

            await trx("transactions").insert({
                id: creditTxId,
                wallet_id: recipientWallet.id,
                reference: `${reference}-CR`,
                type: "credit",
                category: "transfer_in",
                amount,
                balance_before: recipientBalanceBefore,
                balance_after: recipientBalanceAfter,
                description,
                counterpart_wallet_id: senderWallet.id,
                status: "success",
            });

            const [updatedSenderWallet] = await trx("wallets").where({ id: senderWallet.id });
            const [debitTransaction] = await trx("transactions").where({ id: debitTxId });

            return { senderWallet: updatedSenderWallet, transaction: debitTransaction };
        });
    }

    async withdrawFunds(userId: string, dto: WithdrawDTO): Promise<{ wallet: Wallet; transaction: Transaction }> {
        const user = await db("users").where({ id: userId }).first();
        if (user && user.transaction_pin_hash) {
            if (!dto.pin) {
                throw new Error("Transaction PIN is required");
            }
            const isPinValid = await comparePin(dto.pin, user.transaction_pin_hash);
            if (!isPinValid) {
                throw new Error("Invalid transaction PIN");
            }
        }

        return db.transaction(async (trx) => {
            const wallet = await trx("wallets")
                .where({ user_id: userId, is_active: true })
                .forUpdate()
                .first();

            if (!wallet) throw new Error("Wallet not found or inactive");

            const amount = roundCurrency(dto.amount);
            const balanceBefore = roundCurrency(parseFloat(wallet.balance));

            if (balanceBefore < amount) {
                throw new Error("Insufficient funds");
            }

            const balanceAfter = roundCurrency(balanceBefore - amount);

            await trx("wallets")
                .where({ id: wallet.id })
                .update({ balance: balanceAfter, updated_at: new Date() });

            const txId = uuidv4();
            const reference = generateReference();

            await trx("transactions").insert({
                id: txId,
                wallet_id: wallet.id,
                reference,
                type: "debit",
                category: "withdrawal",
                amount,
                balance_before: balanceBefore,
                balance_after: balanceAfter,
                description: dto.description,
                status: "success",
            });

            const [updatedWallet] = await trx("wallets").where({ id: wallet.id });
            const [transaction] = await trx("transactions").where({ id: txId });

            return { wallet: updatedWallet, transaction };
        });
    }

    async getTransactionHistory(userId: string, page = 1, limit = 20): Promise<{
        transactions: Transaction[];
        total: number;
    }> {
        const wallet = await this.getWalletByUserId(userId);
        if (!wallet) throw new Error("Wallet not found");

        const offset = (page - 1) * limit;

        const [transactions, countResult] = await Promise.all([
            db("transactions")
                .where({ wallet_id: wallet.id })
                .orderBy("created_at", "desc")
                .limit(limit)
                .offset(offset),
            db("transactions").where({ wallet_id: wallet.id }).count("id as count").first(),
        ]);

        return {
            transactions,
            total: Number(countResult?.count || 0),
        };
    }
}

export const walletService = new WalletService();
export default walletService;
