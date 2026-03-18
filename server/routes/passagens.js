const express = require('express');
const router = express.Router();
const { pool } = require('../db');

function toPassagem(row) {
  const d = row.dados || {};
  return {
    id: row.id,
    operadorId: row.operador_id,
    operador: row.operador || d.operador,
    posto: row.posto || d.posto || d.postoOperacional,
    postoOperacional: row.posto || d.postoOperacional,
    dataHora: row.data_hora || d.dataHora,
    data: row.data || d.data,
    turno: d.turno,
    utdsString: d.utdsString,
    utdsSelecionadas: d.utdsSelecionadas,
    validacaoExec: d.validacaoExec,
    validacaoDSES: d.validacaoDSES,
    validacaoDSESTexto: d.validacaoDSESTexto,
    validacaoCHI: d.validacaoCHI,
    validacaoCHITexto: d.validacaoCHITexto,
    validacaoComp: d.validacaoComp,
    validacaoCompTexto: d.validacaoCompTexto,
    ocorrenciasGerais: d.ocorrenciasGerais || [],
    manobras: d.manobras,
    manobrasValidado: d.manobrasValidado,
    lancamentoMRR: d.lancamentoMRR,
    mrrValidado: d.mrrValidado,
    gestaoSAGE: d.gestaoSAGE,
    ...d
  };
}

router.get('/', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM passagens ORDER BY id DESC');
    res.json(r.rows.map(toPassagem));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const p = req.body;
    const dados = {
      turno: p.turno,
      utdsString: p.utdsString,
      utdsSelecionadas: p.utdsSelecionadas,
      validacaoExec: p.validacaoExec,
      validacaoDSES: p.validacaoDSES,
      validacaoDSESTexto: p.validacaoDSESTexto,
      validacaoCHI: p.validacaoCHI,
      validacaoCHITexto: p.validacaoCHITexto,
      validacaoComp: p.validacaoComp,
      validacaoCompTexto: p.validacaoCompTexto,
      ocorrenciasGerais: p.ocorrenciasGerais || [],
      manobras: p.manobras,
      manobrasValidado: p.manobrasValidado,
      lancamentoMRR: p.lancamentoMRR,
      mrrValidado: p.mrrValidado,
      gestaoSAGE: p.gestaoSAGE,
      ...p
    };
    const r = await pool.query(
      `INSERT INTO passagens (operador_id, operador, posto, data_hora, data, dados)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        p.operadorId || null,
        p.operador || null,
        p.posto || p.postoOperacional || null,
        p.dataHora || null,
        p.data || null,
        JSON.stringify(dados)
      ]
    );
    const row = r.rows[0];
    res.status(201).json(toPassagem(row));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
