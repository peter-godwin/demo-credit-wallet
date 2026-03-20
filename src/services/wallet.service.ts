import {v4 as uuidv4} from "uuid";
import db from "../config/db";
import {FundWalletDTO, TransferDTO, Wallet, WithdrawDTO} from "../models/wallet.model";
import {Transaction} from "../models/transaction.model";
import {generateReference} from "../utils/account.util";

export class WalletService {

    async getWalletByUserId(userId: string): Promise<Wallet | null> {
        return db("wallets").where({user_id: userId, is_active: true}).first() || null;
    }


    async getWalletByAccountNumber(accountNumber: string): Promise<Wallet | null> {
        return db("wallets").where({account_number: accountNumber, is_active: true}).first() || null;
    }


    async fundWallet(userId: string, dto: FundWalletDTO): Promise<{ wallet: Wallet; transaction: Transaction }> {
        return db.transaction(async (trx) => {
            const wallet = await trx("wallets")
                .where({user_id: userId, is_active: true})
                .forUpdate()
                .first();

            if (!wallet) throw new Error("Wallet not found or inactive");

            const balanceBefore = parseFloat(wallet.balance);
            const balanceAfter = balanceBefore + dto.amount;

            await trx("wallets")
                .where({id: wallet.id})
                .update({balance: balanceAfter, updated_at: new Date()});

            const txId = uuidv4();
            const reference = generateReference();

            await trx("transactions").insert({
                id: txId,
                wallet_id: wallet.id,
                reference,
                type: "credit",
                category: "fund",
                amount: dto.amount,
                balance_before: balanceBefore,
                balance_after: balanceAfter,
                description: "Wallet funding",
                status: "success",
            });

            const [updatedWallet] = await trx("wallets").where({id: wallet.id});
            const [transaction] = await trx("transactions").where({id: txId});

            return {wallet: updatedWallet, transaction};
        });
    }

    async transferFunds(senderUserId: string, dto: TransferDTO): Promise<{
        senderWallet: Wallet; transaction: Transaction
    }> {
        return db.transaction(async (trx) => {
            const senderWallet = await trx("wallets")
                .where({user_id: senderUserId, is_active: true})
                .forUpdate()
                .first();

            if (!senderWallet) throw new Error("Sender wallet not found or inactive");

            const recipientWallet = await trx("wallets")
                .where({account_number: dto.recipient_account_number, is_active: true})
                .forUpdate()
                .first();

            if (!recipientWallet) {
                throw new Error("Recipient account not found");
            }

            if (senderWallet.id === recipientWallet.id) {
                throw new Error("Cannot transfer funds to your own wallet");
            }

            const senderBalanceBefore = parseFloat(senderWallet.balance);

            if (senderBalanceBefore < dto.amount) {
                throw new Error("Insufficient funds");
            }

            const senderBalanceAfter = senderBalanceBefore - dto.amount;
            const recipientBalanceBefore = parseFloat(recipientWallet.balance);
            const recipientBalanceAfter = recipientBalanceBefore + dto.amount;

            await trx("wallets")
                .where({id: senderWallet.id})
                .update({balance: senderBalanceAfter, updated_at: new Date()});

            await trx("wallets")
                .where({id: recipientWallet.id})
                .update({balance: recipientBalanceAfter, updated_at: new Date()});

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
                amount: dto.amount,
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
                amount: dto.amount,
                balance_before: recipientBalanceBefore,
                balance_after: recipientBalanceAfter,
                description,
                counterpart_wallet_id: senderWallet.id,
                status: "success",
            });

            const [updatedSenderWallet] = await trx("wallets").where({id: senderWallet.id});
            const [debitTransaction] = await trx("transactions").where({id: debitTxId});

            return {senderWallet: updatedSenderWallet, transaction: debitTransaction};
        });
    }

    async withdrawFunds(userId: string, dto: WithdrawDTO): Promise<{ wallet: Wallet; transaction: Transaction }> {
        return db.transaction(async (trx) => {
            const wallet = await trx("wallets")
                .where({user_id: userId, is_active: true})
                .forUpdate()
                .first();

            if (!wallet) throw new Error("Wallet not found or inactive");

            const balanceBefore = parseFloat(wallet.balance);

            if (balanceBefore < dto.amount) {
                throw new Error("Insufficient funds");
            }

            const balanceAfter = balanceBefore - dto.amount;

            await trx("wallets")
                .where({id: wallet.id})
                .update({balance: balanceAfter, updated_at: new Date()});

            const txId = uuidv4();
            const reference = generateReference();

            await trx("transactions").insert({
                id: txId,
                wallet_id: wallet.id,
                reference,
                type: "debit",
                category: "withdrawal",
                amount: dto.amount,
                balance_before: balanceBefore,
                balance_after: balanceAfter,
                description: dto.description,
                status: "success",
            });

            const [updatedWallet] = await trx("wallets").where({id: wallet.id});
            const [transaction] = await trx("transactions").where({id: txId});

            return {wallet: updatedWallet, transaction};
        });
    }

    async getTransactionHistory(userId: string, page = 1, limit = 20): Promise<{
        transactions: Transaction[]; total: number
    }> {
        const wallet = await this.getWalletByUserId(userId);
        if (!wallet) throw new Error("Wallet not found");

        const offset = (page - 1) * limit;

        const [transactions, countResult] = await Promise.all([db("transactions")
            .where({wallet_id: wallet.id})
            .orderBy("created_at", "desc")
            .limit(limit)
            .offset(offset), db("transactions").where({wallet_id: wallet.id}).count("id as count").first(),]);

        return {
            transactions, total: Number(countResult?.count || 0),
        };
    }
}

export default new WalletService();