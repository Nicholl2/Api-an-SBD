import { pool } from '../config/db.js';

export const LoanModel = {
  async createLoan(book_id, member_id, due_date) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const bookCheck = await client.query('SELECT available_copies FROM books WHERE id = $1', [book_id]);
      if (bookCheck.rows[0].available_copies <= 0) {
        throw new Error('Buku sedang tidak tersedia (stok habis).');
      }
      await client.query('UPDATE books SET available_copies = available_copies - 1 WHERE id = $1', [book_id]);
      const loanQuery = `
        INSERT INTO loans (book_id, member_id, due_date) 
        VALUES ($1, $2, $3) RETURNING *
      `;
      const result = await client.query(loanQuery, [book_id, member_id, due_date]);
      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async getAllLoans() {
    const query = `
      SELECT l.*, b.title as book_title, m.full_name as member_name 
      FROM loans l
      JOIN books b ON l.book_id = b.id
      JOIN members m ON l.member_id = m.id
    `;
    const result = await pool.query(query);
    return result.rows;
  },

  // CHALLENGE 2: Logic Pengembalian Buku (Transaction)
  async returnLoan(loan_id) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Update status loan dan return_date
      const updateLoan = await client.query(
        "UPDATE loans SET status = 'RETURNED', return_date = CURRENT_DATE WHERE id = $1 AND status = 'BORROWED' RETURNING book_id",
        [loan_id]
      );

      if (updateLoan.rows.length === 0) {
        throw new Error('Peminjaman tidak ditemukan atau sudah dikembalikan.');
      }

      const book_id = updateLoan.rows[0].book_id;

      // 2. Tambah stok available_copies di tabel books (+1)
      await client.query(
        'UPDATE books SET available_copies = available_copies + 1 WHERE id = $1',
        [book_id]
      );

      await client.query('COMMIT');
      return { message: "Buku berhasil dikembalikan!" };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
};