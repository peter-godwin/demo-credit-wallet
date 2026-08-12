export interface RegisterAuthDTO {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    password: string;
    bvn?: string;
}

export interface LoginAuthDTO {
    email: string;
    password: string;
}

export interface VerifyEmailDTO {
    email: string;
    code: string;
}

export interface ResendCodeDTO {
    email: string;
}

export interface SetTransactionPinDTO {
    pin: string;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

export interface RefreshTokenDTO {
    refreshToken: string;
}

export interface ForgotPasswordDTO {
    email: string;
}

export interface ResetPasswordDTO {
    email: string;
    code: string;
    newPassword: string;
}

export interface ChangePasswordDTO {
    currentPassword: string;
    newPassword: string;
}
