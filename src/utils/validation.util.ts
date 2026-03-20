export interface ValidationError {
    field: string;
    message: string;
}

export const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^(\+?234|0)[789][01]\d{8}$/;
    return phoneRegex.test(phone);
};

export const validateAmount = (amount: unknown): boolean => {
    const num = Number(amount);
    return !isNaN(num) && num > 0 && Number.isFinite(num);
};

export const validateCreateUser = (body: Record<string, unknown>): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (!body.first_name || typeof body.first_name !== "string" || body.first_name.trim().length < 2) {
        errors.push({field: "first_name", message: "First name must be at least 2 characters"});
    }

    if (!body.last_name || typeof body.last_name !== "string" || body.last_name.trim().length < 2) {
        errors.push({field: "last_name", message: "Last name must be at least 2 characters"});
    }

    if (!body.email || !validateEmail(body.email as string)) {
        errors.push({field: "email", message: "A valid email address is required"});
    }

    if (!body.phone || !validatePhone(body.phone as string)) {
        errors.push({field: "phone", message: "A valid phone number is required"});
    }

    if (body.bvn && !/^\d{11}$/.test(body.bvn as string)) {
        errors.push({field: "bvn", message: "BVN must be 11 digits"});
    }
    return errors;
};