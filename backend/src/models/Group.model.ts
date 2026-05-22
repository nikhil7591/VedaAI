import { Schema, model, Document, Types } from 'mongoose';

export interface IGroup extends Document {
  name: string;
  subject: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

const GroupSchema = new Schema<IGroup>(
  {
    name: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    color: { type: String, default: '#3B82F6' },
  },
  { timestamps: true }
);

export const Group = model<IGroup>('Group', GroupSchema);
