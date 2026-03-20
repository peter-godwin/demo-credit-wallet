import db from "../config/db";

export const generateAccountNumber = async (): Promise<string> => {
    let accountNumber: string;
    let isUnique = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 10;

    do {
        attempts++;
        if (attempts > MAX_ATTEMPTS) {
            throw new Error("Failed to generate a unique account number after maximum retries");
        }

        const number = Math.floor(1_000_000_000 + Math.random() * 9_000_000_000);
        accountNumber = number.toString();

        const existing = await db("wallets")
            .where({account_number: accountNumber})
            .first();

        if (!existing) isUnique = true;
    } while (!isUnique);

    return accountNumber;
};

export const generateReference = (): string => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `DC-${timestamp}-${random}`;
};