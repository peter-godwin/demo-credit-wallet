jest.mock("uuid", () => ({ v4: jest.fn().mockReturnValue("mock-uuid") }));

import userService from "../src/services/user.service";
import * as karmaService from "../src/services/karma.service";
import db from "../src/config/db";

jest.mock("../src/config/db", () => {
    const mock: any = jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        first: jest.fn(),
        forUpdate: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
    }));
    mock.transaction = jest.fn();
    return { __esModule: true, default: mock };
});

jest.mock("../src/services/karma.service");
jest.mock("../src/utils/account.util", () => ({
    generateAccountNumber: jest.fn().mockResolvedValue("2012345678"),
}));

const mockDb = db as jest.MockedFunction<any>;
const mockKarma = karmaService as jest.Mocked<typeof karmaService>;

describe("UserService", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("createUser", () => {
        const validDto = {
            first_name: "Peter",
            last_name: "Godwin",
            email: "godwinapeter@gmail.com",
            phone: "08012345678",
        };

        it("should create a user and wallet successfully", async () => {
            mockKarma.checkKarmaBlacklist.mockResolvedValue({ isBlacklisted: false });

            mockDb.mockReturnValue({
                where: jest.fn().mockReturnThis(),
                orWhere: jest.fn().mockReturnThis(),
                first: jest.fn().mockResolvedValue(null),
            });

            const createdUser = {
                id: "mock-uuid",
                ...validDto,
                is_blacklisted: false,
                created_at: new Date(),
            };
            const createdWallet = {
                id: "mock-uuid",
                user_id: "mock-uuid",
                account_number: "2012345678",
                balance: 0,
                is_active: true,
            };

            mockDb.transaction = jest.fn().mockImplementation(async (cb: any) => {
                let callCount = 0;

                const trx: any = jest.fn().mockImplementation(() => {
                    callCount++;
                    if (callCount === 1) {
                        return {
                            insert: jest.fn().mockResolvedValue([1]),
                            where: jest.fn().mockReturnValue([createdUser]),
                        };
                    }
                    if (callCount === 2) {
                        return {
                            insert: jest.fn().mockResolvedValue([1]),
                            where: jest.fn().mockReturnValue([createdUser]),
                        };
                    }
                    if (callCount === 3) {
                        return {
                            insert: jest.fn().mockResolvedValue([1]),
                            where: jest.fn().mockReturnValue([createdWallet]),
                        };
                    }
                    return {
                        insert: jest.fn().mockResolvedValue([1]),
                        where: jest.fn().mockReturnValue([createdWallet]),
                    };
                });

                return cb(trx);
            });

            const result = await userService.createUser(validDto);
            expect(mockKarma.checkKarmaBlacklist).toHaveBeenCalledTimes(2);
            expect(result).toBeDefined();
            expect(result.user).toEqual(createdUser);
            expect(result.wallet).toEqual(createdWallet);
        });

        it("should reject a blacklisted user by email", async () => {
            mockKarma.checkKarmaBlacklist
                .mockResolvedValueOnce({ isBlacklisted: true, reason: "Fraud" })
                .mockResolvedValueOnce({ isBlacklisted: false });

            await expect(userService.createUser(validDto)).rejects.toThrow("Karma blacklist");
        });

        it("should reject a blacklisted user by phone", async () => {
            mockKarma.checkKarmaBlacklist
                .mockResolvedValueOnce({ isBlacklisted: false })
                .mockResolvedValueOnce({ isBlacklisted: true, reason: "Fraud" });

            await expect(userService.createUser(validDto)).rejects.toThrow("Karma blacklist");
        });

        it("should reject if email already exists", async () => {
            mockKarma.checkKarmaBlacklist.mockResolvedValue({ isBlacklisted: false });

            mockDb.mockReturnValue({
                where: jest.fn().mockReturnThis(),
                orWhere: jest.fn().mockReturnThis(),
                first: jest.fn().mockResolvedValue({
                    id: "existing-user",
                    email: validDto.email,
                }),
            });

            await expect(userService.createUser(validDto)).rejects.toThrow("email already exists");
        });

        it("should reject if phone already exists", async () => {
            mockKarma.checkKarmaBlacklist.mockResolvedValue({ isBlacklisted: false });

            mockDb.mockReturnValue({
                where: jest.fn().mockReturnThis(),
                orWhere: jest.fn().mockReturnThis(),
                first: jest.fn().mockResolvedValue({
                    id: "existing-user",
                    phone: validDto.phone,
                }),
            });

            await expect(userService.createUser(validDto)).rejects.toThrow("already exists");
        });

        it("should throw if Karma API is unavailable", async () => {
            mockKarma.checkKarmaBlacklist.mockRejectedValue(
                new Error("Karma blacklist check failed Network Error")
            );

            await expect(userService.createUser(validDto)).rejects.toThrow(
                "Karma blacklist check failed"
            );
        });
    });

    describe("getUserById", () => {
        it("should return user and wallet when found", async () => {
            const mockUser = { id: "uuid-1", email: "godwinapeter@gmail.com" };
            const mockWallet = { id: "wallet-1", user_id: "uuid-1", balance: 500 };

            mockDb
                .mockReturnValueOnce({
                    where: jest.fn().mockReturnThis(),
                    first: jest.fn().mockResolvedValue(mockUser),
                })
                .mockReturnValueOnce({
                    where: jest.fn().mockReturnThis(),
                    first: jest.fn().mockResolvedValue(mockWallet),
                });

            const result = await userService.getUserById("uuid-1");
            expect(result).toEqual({ user: mockUser, wallet: mockWallet });
        });

        it("should return null when user does not exist", async () => {
            mockDb.mockReturnValue({
                where: jest.fn().mockReturnThis(),
                first: jest.fn().mockResolvedValue(null),
            });

            const result = await userService.getUserById("non-existent-id");
            expect(result).toBeNull();
        });
    });
});