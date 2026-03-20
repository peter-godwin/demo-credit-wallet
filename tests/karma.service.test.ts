import axios from "axios";
import { checkKarmaBlacklist } from "../src/services/karma.service";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("KarmaService  checkKarmaBlacklist", () => {
    beforeEach(() => jest.clearAllMocks());

    it("should return isBlacklisted true when API returns 200 with data", async () => {
        mockedAxios.get.mockResolvedValue({
            status: 200,
            data: { data: { reason: "Loan default" } },
        });

        const result = await checkKarmaBlacklist("godwinapeter@gmail.com");
        expect(result.isBlacklisted).toBe(true);
        expect(result.reason).toBe("Loan default");
    });

    it("should return isBlacklisted false when API returns 404 user not found in blacklist", async () => {
        jest.spyOn(axios, "isAxiosError").mockReturnValue(true);
        mockedAxios.get.mockRejectedValue({
            isAxiosError: true,
            response: { status: 404, data: { message: "Not found" } },
        });

        const result = await checkKarmaBlacklist("godwinapeter@gmail.com");
        expect(result.isBlacklisted).toBe(false);
    });

    it("should throw an error when the Karma API returns a non 404 error", async () => {
        jest.spyOn(axios, "isAxiosError").mockReturnValue(true);
        mockedAxios.get.mockRejectedValue({
            isAxiosError: true,
            response: { status: 503, data: { message: "Service unavailable" } },
            message: "Request failed",
        });

        await expect(checkKarmaBlacklist("godwinapeter@gmail.com")).rejects.toThrow(
            "Karma blacklist check failed"
        );
    });

    it("should throw an error on a non Axios network failure", async () => {
        jest.spyOn(axios, "isAxiosError").mockReturnValue(false);
        mockedAxios.get.mockRejectedValue(new Error("Unexpected network error"));

        await expect(checkKarmaBlacklist("godwinapeter@gmail.com")).rejects.toThrow(
            "Karma blacklist check encountered an unexpected error"
        );
    });

    it("should return isBlacklisted false when API returns 200 but with no data payload", async () => {
        mockedAxios.get.mockResolvedValue({
            status: 200,
            data: { data: null },
        });

        const result = await checkKarmaBlacklist("godwinapeter@gmail.com");
        expect(result.isBlacklisted).toBe(false);
    });

    it("should return isBlacklisted false when API returns test mode mock response", async () => {
        mockedAxios.get.mockResolvedValue({
            status: 200,
            data: {
                "mock-response": "This is a mock response the app is in test mode.",
                data: { karma_identity: "godwinapeter@gmail.com" },
            },
        });

        const result = await checkKarmaBlacklist("godwinapeter@gmail.com");
        expect(result.isBlacklisted).toBe(false);
    });
});