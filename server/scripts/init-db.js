const { pool } = require('../db');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const run = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id TEXT PRIMARY KEY,
        matricula TEXT UNIQUE NOT NULL,
        senha TEXT NOT NULL,
        nome TEXT NOT NULL,
        papel TEXT NOT NULL DEFAULT 'controlador',
        ativo BOOLEAN NOT NULL DEFAULT true,
        posto TEXT,
        visibilidade TEXT NOT NULL DEFAULT 'global',
        criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        ultimo_login TIMESTAMPTZ
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS passagens (
        id BIGSERIAL PRIMARY KEY,
        operador_id TEXT,
        operador TEXT,
        posto TEXT,
        data_hora TEXT,
        data TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        dados JSONB NOT NULL DEFAULT '{}'
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS configuracoes (
        id INTEGER PRIMARY KEY DEFAULT 1,
        mrr_obrigatorio BOOLEAN NOT NULL DEFAULT false,
        validacao_obrigatoria BOOLEAN NOT NULL DEFAULT false,
        cadastro_aberto BOOLEAN NOT NULL DEFAULT true,
        CONSTRAINT single_row CHECK (id = 1)
      );
    `);
    await client.query(`
      INSERT INTO configuracoes (id, mrr_obrigatorio, validacao_obrigatoria, cadastro_aberto)
      VALUES (1, false, false, true)
      ON CONFLICT (id) DO NOTHING;
    `);
    const senhaBase64 = Buffer.from('admin').toString('base64');
    const adminExists = await client.query(
      "SELECT 1 FROM usuarios WHERE matricula = $1",
      ['admin']
    );
    if (adminExists.rows.length === 0) {
      await client.query(
        `INSERT INTO usuarios (id, matricula, senha, nome, papel, ativo, posto, visibilidade, criado_em)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        ['admin_master', 'admin', senhaBase64, 'Administrador Master', 'admin', true, null, 'global', new Date().toISOString()]
      );
      console.log('Usuário admin criado (matrícula: admin, senha: admin)');
    } else {
      await client.query('UPDATE usuarios SET senha = $1 WHERE matricula = $2', [senhaBase64, 'admin']);
      console.log('Senha do admin atualizada para: admin');
    }
    console.log('Banco inicializado.');
  } finally {
    client.release();
    await pool.end();
  }
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
