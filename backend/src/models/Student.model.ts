import { Schema, model, Document, Types } from 'mongoose';

export interface IStudent extends Document {
  groupId: Types.ObjectId;
  name: string;
  rollNo: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema = new Schema<IStudent>(
  {
    groupId: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
    name: { type: String, required: true, trim: true },
    rollNo: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
  },
  { timestamps: true }
);

export const Student = model<IStudent>('Student', StudentSchema);
