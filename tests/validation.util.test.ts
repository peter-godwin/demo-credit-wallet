import {validateAmount, validateCreateUser, validateEmail, validatePhone} from "../src/utils/validation.util";

describe("Validation Utilities", () => {
    describe("validateEmail", () => {
        it("should accept valid email addresses", () => {
            expect(validateEmail("godwinapeter@gmail.com")).toBe(true);
            expect(validateEmail("godwinapeter@company.co.ng")).toBe(true);
        });

        it("should reject invalid email addresses", () => {
            expect(validateEmail("not-an-email")).toBe(false);
            expect(validateEmail("godwin@domain")).toBe(false);
            expect(validateEmail("@godwin.com")).toBe(false);
            expect(validateEmail("")).toBe(false);
        });
    });

    describe("validatePhone", () => {
        it("should accept valid  phone numbers", () => {
            expect(validatePhone("08012345678")).toBe(true);
            expect(validatePhone("07011223344")).toBe(true);
            expect(validatePhone("09098765432")).toBe(true);
            expect(validatePhone("+2348012345678")).toBe(true);
        });

        it("should reject invalid phone numbers", () => {
            expect(validatePhone("123456")).toBe(false);
            expect(validatePhone("08012")).toBe(false);
            expect(validatePhone("0601234567")).toBe(false);
            expect(validatePhone("")).toBe(false);
        });
    });

    describe("validateAmount", () => {
        it("should accept valid positive amounts", () => {
            expect(validateAmount(100)).toBe(true);
            expect(validateAmount("250.50")).toBe(true);
            expect(validateAmount(0.01)).toBe(true);
        });

        it("should reject zero, negative, or non-numeric values", () => {
            expect(validateAmount(0)).toBe(false);
            expect(validateAmount(-100)).toBe(false);
            expect(validateAmount("abc")).toBe(false);
            expect(validateAmount(null)).toBe(false);
            expect(validateAmount(undefined)).toBe(false);
            expect(validateAmount(Infinity)).toBe(false);
        });
    });

    describe("validateCreateUser", () => {
        const validBody = {
            first_name: "Godwin",
            last_name: "Peter",
            email: "godwinapeter@gmail.com",
            phone: "08098765432",
        };

        it("should return no errors for a valid payload", () => {
            expect(validateCreateUser(validBody)).toHaveLength(0);
        });

        it("should return an error for a missing first_name", () => {
            const errors = validateCreateUser({ ...validBody, first_name: "" });
            expect(errors.some((e) => e.field === "first_name")).toBe(true);
        });

        it("should return an error for an invalid email", () => {
            const errors = validateCreateUser({ ...validBody, email: "bad-email" });
            expect(errors.some((e) => e.field === "email")).toBe(true);
        });

        it("should return an error for an invalid phone number", () => {
            const errors = validateCreateUser({ ...validBody, phone: "12345" });
            expect(errors.some((e) => e.field === "phone")).toBe(true);
        });

        it("should return multiple errors when multiple fields are invalid", () => {
            const errors = validateCreateUser({
                first_name: "P",
                last_name: "",
                email: "not-valid",
                phone: "000",
            });
            expect(errors.length).toBeGreaterThanOrEqual(3);
        });
    });
});