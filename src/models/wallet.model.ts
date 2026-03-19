export interface Wallet {
    id: string;
    user_id: string;
    account_number: string;
    balance: number;
    is_active: boolean;
    created_at?: Date;
    updated_at?: Date;
}

export interface CreateWalletDTO {
    user_id: string;
    account_number: string;
}

export interface FundWalletDTO {
    amount: number;
}

export interface TransferDTO {
    recipient_account_number: string;
    amount: number;
    description?: string;
}

export interface WithdrawDTO {
    amount: number;
    description?: string;
}