import { Request, Response } from 'express';
import { SchoolProfile } from '../models/SchoolProfile.model.ts';

export class SchoolProfileController {
  static async getProfile(req: Request, res: Response) {
    try {
      let profile = await SchoolProfile.findOne();
      if (!profile) {
        // Create default profile if none exists
        profile = new SchoolProfile();
        await profile.save();
      }
      res.status(200).json({ success: true, data: profile });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  }

  static async updateProfile(req: Request, res: Response) {
    try {
      let profile = await SchoolProfile.findOne();
      if (!profile) {
        profile = new SchoolProfile(req.body);
        await profile.save();
      } else {
        profile = await SchoolProfile.findByIdAndUpdate(profile._id, req.body, { new: true });
      }
      res.status(200).json({ success: true, data: profile });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  }
}
