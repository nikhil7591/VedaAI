import { Schema, model, Document } from 'mongoose';

export interface ISchoolProfile extends Document {
  name: string;
  address: string;
  phone: string;
  email: string;
}

const SchoolProfileSchema = new Schema<ISchoolProfile>(
  {
    name: { type: String, required: true, default: 'Delhi Public School' },
    address: { type: String, required: true, default: 'Sector 4, Bokaro Steel City' },
    phone: { type: String, required: true, default: '+91 98765 43210' },
    email: { type: String, required: true, default: 'info@dpsbokaro.edu' },
  },
  { timestamps: true }
);

export const SchoolProfile = model<ISchoolProfile>('SchoolProfile', SchoolProfileSchema);
