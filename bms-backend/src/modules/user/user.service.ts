import { IUser } from "./user.interface";
import { UserModel } from "./user.model";

// Create User
export const createUser = async (user: IUser): Promise<IUser> => {
    const newUser = new UserModel(user);
    return await newUser.save();
};

// Get All Users
export const getAllUsers = async (): Promise<IUser[]> => {
    return await UserModel.find();
};

// Get Single User
export const getUserById = async (id: string): Promise<IUser | null> => {
    return await UserModel.findById(id);
};

// Get User by Email
export const getUserByEmail = async (email: string): Promise<IUser | null> => {
    return await UserModel.findOne({ email });
}   

// activate User
export const activateUser = async (
    id: string,
    updateData: Partial<IUser>
): Promise<IUser | null> => {
    const updatedUser = await UserModel.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
    );

    if (!updatedUser) {
        throw new Error("User not found");
    }

    return updatedUser;
};