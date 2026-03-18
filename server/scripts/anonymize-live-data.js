const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { pool } = require('../db');

const HUBS = ['Barcelona', 'Dubai', 'Lisboa', 'Quioto', 'Vancouver'];

const AREAS = [
  'ARMAZEM ALFA',
  'ARMAZEM BRAVO',
  'ARMAZEM CHARLIE',
  'ARMAZEM DELTA',
  'DOCA NORTE 01',
  'DOCA NORTE 02',
  'DOCA SUL 01',
  'DOCA SUL 02',
  'PATIO LESTE',
  'PATIO OESTE',
  'ROTA EXPRESSA',
  'ROTA INTERMODAL',
  'CORREDOR FRIO',
  'CORREDOR SECO',
  'TORRE DE EXPEDICAO',
  'TORRE DE RECEBIMENTO',
  'AREA DE CROSS DOCKING',
  'AREA DE CONSOLIDACAO',
  'AREA DE TRIAGEM',
  'CENTRO DE INVENTARIO'
];

const USERS = [
  { id: 'usr_op1001', matricula: 'op1001', nome: 'ALANA MOREIRA CAMPOS', posto: 'Barcelona', visibilidade: 'global' },
  { id: 'usr_op1002', matricula: 'op1002', nome: 'BRUNO MATOS FERREIRA', posto: 'Dubai', visibilidade: 'posto' },
  { id: 'usr_op1003', matricula: 'op1003', nome: 'CLARA VIEIRA MORAES', posto: 'Lisboa', visibilidade: 'global' },
  { id: 'usr_op1004', matricula: 'op1004', nome: 'DANIEL REZENDE SOUZA', posto: 'Quioto', visibilidade: 'posto' },
  { id: 'usr_op1005', matricula: 'op1005', nome: 'ELISA NUNES BARROS', posto: 'Vancouver', visibilidade: 'proprio' },
  { id: 'usr_op1006', matricula: 'op1006', nome: 'FABIO CORREIA LIMA', posto: 'Barcelona', visibilidade: 'posto' },
  { id: 'usr_op1007', matricula: 'op1007', nome: 'GIOVANA MELO CARDOSO', posto: 'Dubai', visibilidade: 'proprio' },
  { id: 'usr_op1008', matricula: 'op1008', nome: 'HEITOR PINHEIRO ALVES', posto: 'Lisboa', visibilidade: 'global' },
  { id: 'usr_op1009', matricula: 'op1009', nome: 'ISADORA LEMOS PEREIRA', posto: 'Quioto', visibilidade: 'posto' },
  { id: 'usr_op1010', matricula: 'op1010', nome: 'JOAO TAVARES ROCHA', posto: 'Vancouver', visibilidade: 'proprio' }
];

const TURNOS = ['Manhã', 'Tarde', 'Pernoite'];

const toBase64 = (value) => Buffer.from(value, 'utf8').toString('base64');

const pickAreas = (index) => {
  const count = 2 + (index % 2);
  const items = [];

  for (let offset = 0; offset < count; offset += 1) {
    items.push(AREAS[(index * 2 + offset) % AREAS.length]);
  }

  return items;
};

const buildOcorrencias = (index, hub, areas) => {
  const base = [
    {
      prioridade: index % 3 === 0 ? 'Urgente' : 'Normal',
      tipo: `LOG-${String(100 + index).padStart(3, '0')}`,
      detalhe: `Ajuste operacional registrado para ${areas[0]} com alinhamento de equipe no hub ${hub}.`
    }
  ];

  if (index % 2 === 0) {
    base.push({
      prioridade: 'Normal',
      tipo: `ROT-${String(200 + index).padStart(3, '0')}`,
      detalhe: `Monitoramento de fluxo concluido para ${areas[areas.length - 1]} sem impacto critico no turno.`
    });
  }

  return base;
};

const buildPayload = (row, index) => {
  const user = USERS[index % USERS.length];
  const hub = HUBS[index % HUBS.length];
  const areas = pickAreas(index);
  const ocorrenciasGerais = buildOcorrencias(index, hub, areas);

  return {
    rowId: row.id,
    operadorId: user.id,
    operador: user.nome,
    posto: hub,
    dataHora: row.data_hora || row.dados?.dataHora || '',
    data: row.data || row.dados?.data || '',
    dados: {
      operador: user.nome,
      operadorId: user.id,
      posto: hub,
      postoOperacional: hub,
      dataHora: row.data_hora || row.dados?.dataHora || '',
      data: row.data || row.dados?.data || '',
      turno: TURNOS[index % TURNOS.length],
      utdsString: areas.join(', '),
      utdsSelecionadas: areas,
      validacaoExec: true,
      validacaoDSES: true,
      validacaoDSESTexto: `Checklist de doca concluido para ${hub} com liberacao de recebimento.`,
      validacaoCHI: index % 4 !== 0,
      validacaoCHITexto: `Frota alinhada para atendimento das rotas vinculadas a ${areas[0]}.`,
      validacaoComp: true,
      validacaoCompTexto: `Carga consolidada e conferida para as areas ${areas.join(' / ')}.`,
      ocorrenciasGerais,
      ocorrenciaTipo: ocorrenciasGerais[0]?.tipo || '',
      ocorrenciaDetalhe: ocorrenciasGerais[0]?.detalhe || '',
      ocorrenciaPrioridade: ocorrenciasGerais[0]?.prioridade || 'Normal',
      manobras: index % 3 === 0
        ? `Reprogramar janela de expedicao para ${areas[0]} e revisar disponibilidade de doca secundaria.`
        : `Sequenciar liberacao de carga entre ${areas[0]} e ${areas[areas.length - 1]}.`,
      manobrasValidado: index % 2 === 0,
      lancamentoMRR: `Registro consolidado do turno com movimentacao entre ${areas[0]} e ${hub}.`,
      mrrValidado: true,
      gestaoSAGE: false
    }
  };
};

async function anonymize() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query(
      `UPDATE usuarios
       SET nome = $1,
           senha = $2,
           ativo = true,
           posto = NULL,
           visibilidade = 'global'
       WHERE matricula = 'admin'`,
      ['Administrador Logistico', toBase64('admin')]
    );

    await client.query(`DELETE FROM usuarios WHERE matricula <> 'admin'`);

    for (const user of USERS) {
      await client.query(
        `INSERT INTO usuarios (id, matricula, senha, nome, papel, ativo, posto, visibilidade, criado_em, ultimo_login)
         VALUES ($1, $2, $3, $4, 'controlador', true, $5, $6, NOW(), NULL)`,
        [user.id, user.matricula, toBase64('123456'), user.nome, user.posto, user.visibilidade]
      );
    }

    const result = await client.query(`SELECT id, operador_id, operador, posto, data_hora, data, dados FROM passagens ORDER BY id ASC`);

    for (let index = 0; index < result.rows.length; index += 1) {
      const row = result.rows[index];
      const payload = buildPayload(row, index);

      await client.query(
        `UPDATE passagens
         SET operador_id = $1,
             operador = $2,
             posto = $3,
             data_hora = $4,
             data = $5,
             dados = $6::jsonb
         WHERE id = $7`,
        [
          payload.operadorId,
          payload.operador,
          payload.posto,
          payload.dataHora,
          payload.data,
          JSON.stringify(payload.dados),
          payload.rowId
        ]
      );
    }

    await client.query('COMMIT');

    console.log(`Usuarios anonimizados: ${USERS.length + 1}`);
    console.log(`Passagens anonimizadas: ${result.rows.length}`);
    console.log('Login admin mantido com matricula "admin" e senha "admin".');
    console.log('Operadores genericos criados com senha padrao "123456".');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

anonymize().catch((error) => {
  console.error(error);
  process.exit(1);
});
