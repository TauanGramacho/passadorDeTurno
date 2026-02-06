const express = require('express');
const router = express.Router();
const { pool } = require('../db');

const toUsuario = (row) => ({
  id: row.id,
  matricula: row.matricula,
  senha: row.senha,
  nome: row.nome,
  papel: row.papel,
  ativo: row.ativo,
  posto: row.posto,
  visibilidade: row.visibilidade,
  criadoEm: row.criado_em,
  ultimoLogin: row.ultimo_login
});

router.get('/', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM usuarios ORDER BY nome');
    res.json(r.rows.map(toUsuario));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/por-matricula/:matricula', async (req, res) => {
  try {
    const r = await pool.query(
      'SELECT * FROM usuarios WHERE LOWER(matricula) = LOWER($1)',
      [req.params.matricula]
    );
    if (r.rows.length === 0) return res.status(404).json(null);
    res.json(toUsuario(r.rows[0]));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const u = req.body;
    const senha = u.senha || Buffer.from('', 'utf8').toString('base64');
    await pool.query(
      `INSERT INTO usuarios (id, matricula, senha, nome, papel, ativo, posto, visibilidade, criado_em)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        u.id || `usr_${Date.now()}`,
        (u.matricula || '').trim().toLowerCase(),
        senha,
        u.nome || '',
        u.papel || 'controlador',
        u.ativo !== false,
        u.posto || null,
        u.visibilidade || 'global',
        u.criadoEm || new Date().toISOString()
      ]
    );
    const r = await pool.query('SELECT * FROM usuarios WHERE LOWER(matricula) = LOWER($1)', [u.matricula]);
    res.status(201).json(toUsuario(r.rows[0]));
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Matrícula já existe' });
    res.status(500).json({ error: e.message });
  }
});

router.patch('/por-matricula/:matricula', async (req, res) => {
  try {
    const d = req.body;
    const updates = [];
    const values = [];
    let i = 1;
    if (d.senha !== undefined) { updates.push(`senha = $${i++}`); values.push(d.senha); }
    if (d.nome !== undefined) { updates.push(`nome = $${i++}`); values.push(d.nome); }
    if (d.papel !== undefined) { updates.push(`papel = $${i++}`); values.push(d.papel); }
    if (d.ativo !== undefined) { updates.push(`ativo = $${i++}`); values.push(d.ativo); }
    if (d.posto !== undefined) { updates.push(`posto = $${i++}`); values.push(d.posto); }
    if (d.visibilidade !== undefined) { updates.push(`visibilidade = $${i++}`); values.push(d.visibilidade); }
    if (d.ultimoLogin !== undefined) { updates.push(`ultimo_login = $${i++}`); values.push(d.ultimoLogin); }
    if (updates.length === 0) {
      const r = await pool.query('SELECT * FROM usuarios WHERE LOWER(matricula) = LOWER($1)', [req.params.matricula]);
      if (r.rows.length === 0) return res.status(404).json(null);
      return res.json(toUsuario(r.rows[0]));
    }
    values.push(req.params.matricula);
    const r = await pool.query(
      `UPDATE usuarios SET ${updates.join(', ')} WHERE LOWER(matricula) = LOWER($${i}) RETURNING *`,
      values
    );
    if (r.rows.length === 0) return res.status(404).json(null);
    res.json(toUsuario(r.rows[0]));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/por-matricula/:matricula', async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM usuarios WHERE LOWER(matricula) = LOWER($1) RETURNING id', [req.params.matricula]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
