import axios from "axios";
import dotenv from "dotenv";
import {HttpStatus} from "../utils/response.util";

dotenv.config();

const ADJUTOR_BASE_URL = process.env.ADJUTOR_BASE_URL;
const ADJUTOR_API_KEY = process.env.ADJUTOR_API_KEY;

export interface KarmaCheckResult {
    isBlacklisted: boolean;
    reason?: string;
}


export const checkKarmaBlacklist = async (identity: string): Promise<KarmaCheckResult> => {
    if (!ADJUTOR_API_KEY) {
        console.warn(`ADJUTOR_API_KEY is not set"${identity}"`);
        return {isBlacklisted: false};
    }

    try {
        console.log(`Checking identity: ${identity}`);

        const response = await axios.get(`${ADJUTOR_BASE_URL}/verification/karma/${identity}`, {
            headers: {
                Authorization: `Bearer ${ADJUTOR_API_KEY}`, "Content-Type": "application/json",
            }, timeout: 10_000,
        });

        console.log(`Response status: ${response.status}`);
        console.log(`Response data:`, JSON.stringify(response.data));

        if (response.data?.["mock-response"]) {
            console.warn("App is in test mode.");
            return {isBlacklisted: false};
        }

        if (response.status === HttpStatus.OK && response.data?.data) {
            return {
                isBlacklisted: true, reason: response.data.data?.reason || "User is on the Karma blacklist",
            };
        }

        return {isBlacklisted: false};
    } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
            console.log(`Error status: ${error.response?.status}`);
            console.log(`Error data:`, JSON.stringify(error.response?.data));

            if (error.response?.status === HttpStatus.NOT_FOUND) {
                return {isBlacklisted: false};
            }

            if (error.response?.status === HttpStatus.UNAUTHORIZED) {
                console.error("Invalid or expired API key");
                throw new Error("blacklist check failed Invalid API key");
            }

            throw new Error(`Karma blacklist check failed: ${error.response?.data?.message || error.message}`);
        }

        throw new Error("Karma blacklist check encountered an unexpected error");
    }
};