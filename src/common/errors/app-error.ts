import { HttpStatus } from "../utils/response.util";

export class AppError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;

    constructor(message: string, statusCode: number = HttpStatus.BAD_REQUEST, isOperational: boolean = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Object.setPrototypeOf(this, new.target.prototype);
        Error.captureStackTrace(this, this.constructor);
    }
}

export class NotFoundError extends AppError {
    constructor(message: string = "Resource not found") {
        super(message, HttpStatus.NOT_FOUND);
    }
}

export class BadRequestError extends AppError {
    constructor(message: string) {
        super(message, HttpStatus.BAD_REQUEST);
    }
}

export class UnauthorizedError extends AppError {
    constructor(message: string = "Unauthorized access") {
        super(message, HttpStatus.UNAUTHORIZED);
    }
}

export class ConflictError extends AppError {
    constructor(message: string) {
        super(message, HttpStatus.CONFLICT);
    }
}
