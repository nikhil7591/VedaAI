import { Request, Response } from 'express';
import { Group } from '../models/Group.model.ts';
import { Student } from '../models/Student.model.ts';
import { Assignment } from '../models/Assignment.model.ts';

export class GroupController {
  static async create(req: Request, res: Response) {
    try {
      const group = new Group(req.body);
      await group.save();
      res.status(201).json({ success: true, data: group });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  }

  static async list(req: Request, res: Response) {
    try {
      const groups = await Group.find().sort({ createdAt: -1 });
      
      // We also need to compute students and papers count for each group to match frontend expectations
      // We can use Promise.all to fetch counts for each
      const data = await Promise.all(groups.map(async (g) => {
        const studentsCount = await Student.countDocuments({ groupId: g._id });
        const papersCount = await Assignment.countDocuments({ groupId: g._id });
        return {
          ...g.toJSON(),
          students: studentsCount,
          papers: papersCount
        };
      }));

      res.status(200).json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const group = await Group.findById(req.params.id);
      if (!group) return res.status(404).json({ success: false, error: { message: 'Group not found' } });
      res.status(200).json({ success: true, data: group });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const group = await Group.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!group) return res.status(404).json({ success: false, error: { message: 'Group not found' } });
      res.status(200).json({ success: true, data: group });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const group = await Group.findByIdAndDelete(req.params.id);
      if (!group) return res.status(404).json({ success: false, error: { message: 'Group not found' } });
      
      // Cascade delete students
      await Student.deleteMany({ groupId: group._id });
      
      res.status(200).json({ success: true, data: { message: 'Group deleted' } });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  }
}
