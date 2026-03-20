import {v4 as uuidv4} from "uuid";
import db from "../config/db";
import {CreateUserDTO, User} from "../models/user.model";
import {Wallet} from "../models/wallet.model";
import {generateAccountNumber} from "../utils/account.util";
import {checkKarmaBlacklist} from "./karma.service";

export class UserService {

    async createUser(dto: CreateUserDTO): Promise<{ user: User; wallet: Wallet }> {
        const [emailCheck, phoneCheck] = await Promise.all([checkKarmaBlacklist(dto.email), checkKarmaBlacklist(dto.phone),


        ]);
        console.log("Email:", emailCheck), console.log("Phone:", phoneCheck)

        if (emailCheck.isBlacklisted || phoneCheck.isBlacklisted) {
            throw new Error("User onboarding denied identity found on the Karma blacklist");
        }

        const existingUser = await db("users")
            .where({email: dto.email})
            .orWhere({phone: dto.phone})
            .first();

        if (existingUser) {
            const conflict = existingUser.email === dto.email ? "email" : "phone number";
            throw new Error(`A user with this ${conflict} already exists`);
        }

        return db.transaction(async (trx) => {
            const userId = uuidv4();
            const walletId = uuidv4();
            const accountNumber = await generateAccountNumber();

            const [user] = await trx("users")
                .insert({
                    id: userId,
                    first_name: dto.first_name.trim(),
                    last_name: dto.last_name.trim(),
                    email: dto.email.toLowerCase().trim(),
                    phone: dto.phone.trim(),
                    bvn: dto.bvn,
                })
                .then(() => trx("users").where({id: userId}));

            const [wallet] = await trx("wallets")
                .insert({
                    id: walletId, user_id: userId, account_number: accountNumber, balance: 0.0, is_active: true,
                })
                .then(() => trx("wallets").where({id: walletId}));

            return {user, wallet};
        });
    }

    async getUserById(userId: string): Promise<{ user: User; wallet: Wallet } | null> {
        const user = await db("users").where({id: userId}).first();
        if (!user) return null;

        const wallet = await db("wallets").where({user_id: userId}).first();
        return {user, wallet};
    }


    async getUserByEmail(email: string): Promise<User | null> {
        return db("users").where({email: email.toLowerCase()}).first() || null;
    }
}

export default new UserService();