import { pool } from '../config/db.js';

export const BookModel = {
  // Mengambil semua buku dengan nama penulis dan kategori (JOIN)
  async getAll() {
    const query = `
      SELECT b.*, a.name as author_name, c.name as category_name 
      FROM books b
      LEFT JOIN authors a ON b.author_id = a.id
      LEFT JOIN categories c ON b.category_id = c.id
    `;
    const result = await pool.query(query);
    return result.rows;
  },

  async create(data) {
    const { isbn, title, author_id, category_id, total_copies } = data;
    const query = `
      INSERT INTO books (isbn, title, author_id, category_id, total_copies, available_copies)
      VALUES ($1, $2, $3, $4, $5, $5) RETURNING *
    `;
    const result = await pool.query(query, [isbn, title, author_id, category_id, total_copies]);
    return result.rows[0];
  },

  async getTopBooks() {
    const query = `
      SELECT b.title, COUNT(l.id) AS total_borrowed
      FROM books b
      JOIN loans l ON b.id = l.book_id
      GROUP BY b.id, b.title
      ORDER BY total_borrowed DESC
      LIMIT 2
    `;
    const result = await pool.query(query);
    return result.rows;
  },

  async delete(id) {
    const query = 'DELETE FROM books WHERE id = $1';
    await pool.query(query, [id]);
    return { message: "Buku berhasil dihapus dari sistem." };
  }
};