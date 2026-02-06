require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const usuarios = require('./routes/usuarios');
const passagens = require('./routes/passagens');
const configuracoes = require('./routes/configuracoes');

const app = express();
const PORT = process.env.PORT || 3001;

// Evita erro "Request Header Fields Too Large" (HTTP 431)
const MAX_HEADER_SIZE = 65536;

app.use(cors());
app.use(express.json());

app.use('/api/usuarios', usuarios);
app.use('/api/passagens', passagens);
app.use('/api/configuracoes', configuracoes);

const { pool } = require('./db');

app.get('/api/health', async (req, res) => {
  try {
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ ok: false, error: 'DATABASE_URL não configurada. Crie o arquivo .env na pasta server.' });
    }
    await pool.query('SELECT 1');
    res.json({ ok: true, database: 'conectado' });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'Falha ao conectar no banco: ' + e.message });
  }
});

const server = http.createServer({ maxHeaderSize: MAX_HEADER_SIZE }, app);
server.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
