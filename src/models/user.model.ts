export interface User {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    bvn?: string;
    created_at?: Date;
    updated_at?: Date;
}

export interface CreateUserDTO {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    bvn?: string;
}