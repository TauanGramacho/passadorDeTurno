const express = require('express');
const router = express.Router();
const { pool } = require('../db');

router.get('/', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM configuracoes WHERE id = 1');
    if (r.rows.length === 0) {
      return res.json({ mrrObrigatorio: false, validacaoObrigatoria: false, cadastroAberto: true });
    }
    const row = r.rows[0];
    res.json({
      mrrObrigatorio: row.mrr_obrigatorio,
      validacaoObrigatoria: row.validacao_obrigatoria,
      cadastroAberto: row.cadastro_aberto
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.patch('/', async (req, res) => {
  try {
    const d = req.body;
    const updates = [];
    const values = [];
    let i = 1;
    if (d.mrrObrigatorio !== undefined) { updates.push(`mrr_obrigatorio = $${i++}`); values.push(d.mrrObrigatorio); }
    if (d.validacaoObrigatoria !== undefined) { updates.push(`validacao_obrigatoria = $${i++}`); values.push(d.validacaoObrigatoria); }
    if (d.cadastroAberto !== undefined) { updates.push(`cadastro_aberto = $${i++}`); values.push(d.cadastroAberto); }
    if (updates.length === 0) {
      const r = await pool.query('SELECT * FROM configuracoes WHERE id = 1');
      const row = r.rows[0];
      return res.json({
        mrrObrigatorio: row?.mrr_obrigatorio ?? false,
        validacaoObrigatoria: row?.validacao_obrigatoria ?? false,
        cadastroAberto: row?.cadastro_aberto ?? true
      });
    }
    const r = await pool.query(
      `UPDATE configuracoes SET ${updates.join(', ')} WHERE id = 1 RETURNING *`,
      values
    );
    const row = r.rows[0];
    res.json({
      mrrObrigatorio: row.mrr_obrigatorio,
      validacaoObrigatoria: row.validacao_obrigatoria,
      cadastroAberto: row.cadastro_aberto
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
