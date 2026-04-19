import { pool } from '../config/db.js';

export const ReportModel = {
  async getTopBooks(limit = 2) {
    const query = `
      SELECT b.id, b.title, COUNT(l.id) AS total_borrows
      FROM loans l
      JOIN books b ON l.book_id = b.id
      GROUP BY b.id, b.title
      ORDER BY total_borrows DESC
      LIMIT $1
    `;
    const result = await pool.query(query, [limit]);
    return result.rows.map(row => ({
      id: row.id,
      title: row.title,
      total_borrows: Number(row.total_borrows)
    }));
  }
};
