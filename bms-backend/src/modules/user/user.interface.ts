export interface IUser {
    _id: string;
    email: string;
    name: string;
    phone?: number;
    role: 'admin' | 'user';
    activateUser?: boolean;
    createdAt: Date;
    updatedAt: Date;
}