export type TransactionType = "credit" | "debit";
export type TransactionCategory = "fund" | "transfer_in" | "transfer_out" | "withdrawal";
export type TransactionStatus = "pending" | "success" | "failed";

export interface Transaction {
    id: string;
    wallet_id: string;
    reference: string;
    type: TransactionType;
    category: TransactionCategory;
    amount: number;
    balance_before: number;
    balance_after: number;
    description?: string;
    counterpart_wallet_id?: string;
    status: TransactionStatus;
    created_at?: Date;
    updated_at?: Date;
}

export interface CreateTransactionDTO {
    wallet_id: string;
    reference: string;
    type: TransactionType;
    category: TransactionCategory;
    amount: number;
    balance_before: number;
    balance_after: number;
    description?: string;
    counterpart_wallet_id?: string;
    status?: TransactionStatus;
}