import { IEntry } from "./IEntry";
import { IRecord } from "./IRecord";
import { IUser } from "./IUser";
import mongoose from "mongoose";

declare global {
  namespace Express {
    interface User extends IUser {
      _id: mongoose.Types.ObjectId | undefined
    }
    interface Request {
      user?: User;
      entry?: IEntry;
      record?: IRecord;
    }
  }
}

export { };