import { ReportModel } from '../models/reportModel.js';

export const ReportController = {
  async getTopBooks(req, res) {
    try {
      const topBooks = await ReportModel.getTopBooks(2);
      res.json({ data: topBooks });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};
