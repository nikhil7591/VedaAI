import { Request, Response } from 'express';
import { Student } from '../models/Student.model.ts';
import { Group } from '../models/Group.model.ts';

export class StudentController {
  static async create(req: Request, res: Response) {
    try {
      const { groupId } = req.params;
      const group = await Group.findById(groupId);
      if (!group) return res.status(404).json({ success: false, error: { message: 'Group not found' } });

      const student = new Student({ ...req.body, groupId });
      await student.save();
      res.status(201).json({ success: true, data: student });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  }

  static async listByGroup(req: Request, res: Response) {
    try {
      const { groupId } = req.params;
      const students = await Student.find({ groupId }).sort({ createdAt: -1 });
      res.status(200).json({ success: true, data: students });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!student) return res.status(404).json({ success: false, error: { message: 'Student not found' } });
      res.status(200).json({ success: true, data: student });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const student = await Student.findByIdAndDelete(req.params.id);
      if (!student) return res.status(404).json({ success: false, error: { message: 'Student not found' } });
      res.status(200).json({ success: true, data: { message: 'Student deleted' } });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { message: err.message } });
    }
  }
}
