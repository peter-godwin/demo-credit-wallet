import {Response} from "express";

export enum HttpStatus {
    OK = 200,
    CREATED = 201,
    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    FORBIDDEN = 403,
    NOT_FOUND = 404,
    CONFLICT = 409,
    UNPROCESSABLE = 422,
    INTERNAL_SERVER_ERROR = 500,
}

export interface ValidationError {
    field: string;
    message: string;
}

export interface ApiResponse<T = unknown> {
    success: boolean;
    message: string;
    data?: T;
    errors?: ValidationError[];
    error?: string;
}

export const sendSuccess = <T>(res: Response, message: string, data?: T, statusCode: HttpStatus = HttpStatus.OK): Response => {
    const response: ApiResponse<T> = {success: true, message, data};
    return res.status(statusCode).json(response);
};

export const sendError = (res: Response, message: string, statusCode: HttpStatus = HttpStatus.BAD_REQUEST, error?: string): Response => {
    const response: ApiResponse = {
        success: false, message, ...(error && {error}),
    };
    return res.status(statusCode).json(response);
};

export const sendValidationError = (res: Response, errors: ValidationError[]): Response => {
    const response: ApiResponse = {
        success: false, message: "Validation failed", errors,
    };
    return res.status(HttpStatus.UNPROCESSABLE).json(response);
};