import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { Lock, User, Plus, X, Eye, EyeOff, LogOut, CheckCircle, XCircle, AlertTriangle, Trash2, Download, FileSpreadsheet, Filter, Shield, Users, Settings, ChevronDown, Search, Crown, UserCheck, UserX, RotateCcw, FileText, MapPin, Calendar, Clock } from 'lucide-react';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import AdminScreen from './AdminScreen';

// ============================================================
// 1. CONTEXTO GLOBAL DE AUTENTICAÇÃO
// ============================================================
const AuthContext = createContext(null);

const useAuth = () => useContext(AuthContext);

// ============================================================
// 2. BANCO DE DADOS IN-MEMORY (substitui localStorage para usuários)
// ============================================================
const DB = (() => {
  const getDb = () => {
    try {
      const raw = localStorage.getItem('coelba_db_v2');
      if (raw) return JSON.parse(raw);
    } catch {}
    // Seed inicial
    const seed = {
      usuarios: [
        {
          id: 'admin_master',
          matricula: 'admin',
          senha: btoa('admin123'), // base64 simples (não é seguro em produção, mas funciona para demo)
          nome: 'Administrador Master',
          papel: 'admin', // 'admin' | 'controlador'
          ativo: true,
          posto: null, // null = todos os postos
          visibilidade: 'global', // 'global' | 'posto' | 'proprio'
          criadoEm: new Date().toISOString(),
          ultimoLogin: null
        }
      ],
      passagens: [],
      configuracoes: {
        mrrObrigatorio: false,
        validacaoObrigatoria: false
      }
    };
    localStorage.setItem('coelba_db_v2', JSON.stringify(seed));
    return seed;
  };

  const save = (db) => localStorage.setItem('coelba_db_v2', JSON.stringify(db));

  return {
    get: getDb,
    save,
    getUsuarios: () => getDb().usuarios,
    getUsuario: (matricula) => getDb().usuarios.find(u => u.matricula.toLowerCase() === matricula.toLowerCase()),
    criarUsuario: (usuario) => {
      const db = getDb();
      db.usuarios.push(usuario);
      save(db);
      return usuario;
    },
    atualizarUsuario: (matricula, dados) => {
      const db = getDb();
      const idx = db.usuarios.findIndex(u => u.matricula.toLowerCase() === matricula.toLowerCase());
      if (idx !== -1) {
        db.usuarios[idx] = { ...db.usuarios[idx], ...dados };
        save(db);
        return db.usuarios[idx];
      }
      return null;
    },
    excluirUsuario: (matricula) => {
      const db = getDb();
      db.usuarios = db.usuarios.filter(u => u.matricula.toLowerCase() !== matricula.toLowerCase());
      save(db);
    },
    getPassagens: () => getDb().passagens,
    salvarPassagem: (p) => {
      const db = getDb();
      db.passagens.unshift(p);
      save(db);
    },
    getConfiguracoes: () => getDb().configuracoes,
    salvarConfiguracoes: (cfg) => {
      const db = getDb();
      db.configuracoes = { ...db.configuracoes, ...cfg };
      save(db);
    }
  };
})();

// ============================================================
// 3. CONSTANTES
// ============================================================
const POSTOS = ["Feira de Santana", "Serrinha", "Alagoinhas", "Jacobina", "Juazeiro"];
const LISTA_UTDS = ["ALAGOINHAS","ESPLANADA","PAULO AFONSO","RIBEIRA DO POMBAL","JACOBINA","JUAZEIRO","REMANSO","SENHOR DO BONFIM","CONCEICAO DO COITE","FEIRA DE SANTANA NORTE","FEIRA DE SANTANA SUL","SANTO AMARO","SERRINHA","CAMACARI","CANDEIAS","LAURO DE FREITAS","GRACA","ITAPOAN","PERIPERI","PIRAJA","PITUBA","AMARGOSA","IPIAU","SANTO ANTONIO DE JESUS","VALENCA","EUNAPOLIS","ILHEUS","ITABUNA","PORTO SEGURO","POSTO DA MATA","TEIXEIRA DE FREITAS","BRUMADO","GUANAMBI","ITAPETINGA","VITORIA DA CONQUISTA","IRECE","ITABERABA","JEQUIE","LIVRAMENTO DE NOSSA SENHORA","SEABRA","BARREIRAS","BOM JESUS DA LAPA","IBOTIRAMA","LUIS EDUARDO MAGALHAES","SANTA MARIA DA VITORIA"];

// ============================================================
// 4. COMPONENTES UTILITÁRIOS
// ============================================================
const Toast = ({ notificacao }) => {
  if (!notificacao) return null;
  return (
    <div className="fixed top-5 right-5 z-[500] animate-bounce">
      <div className={`px-6 py-4 rounded-2xl shadow-2xl border-l-8 flex items-center gap-3 bg-white ${notificacao.tipo === 'success' ? 'border-green-500 text-green-800' : notificacao.tipo === 'error' ? 'border-red-500 text-red-800' : 'border-blue-500 text-blue-800'}`}>
        {notificacao.tipo === 'success' ? <CheckCircle className="text-green-500" /> : notificacao.tipo === 'error' ? <AlertTriangle className="text-red-500" /> : <AlertTriangle className="text-blue-500" />}
        <span className="font-bold uppercase text-xs tracking-wider">{notificacao.mensagem}</span>
      </div>
    </div>
  );
};

const Badge = ({ tipo }) => {
  const styles = {
    admin: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    controlador: 'bg-blue-100 text-blue-700 border-blue-300'
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${styles[tipo]}`}>
      {tipo === 'admin' ? <Crown size={10} /> : <User size={10} />}
      {tipo}
    </span>
  );
};

const StatusPill = ({ ativo }) => (
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider`}>
    <span className={`w-2 h-2 rounded-full ${ativo ? 'bg-green-500' : 'bg-red-400'}`} />
    {ativo ? 'Ativo' : 'Desativado'}
  </span>
);
const PassagemTurnoApp = ({ usuario: usuarioProp, onLogout }) => {
  const authContext = useAuth();
  const usuarioContext = authContext?.usuario;
  const usuario = usuarioProp || usuarioContext;
  
  // Debug: verificar dados do usuário
  useEffect(() => {
    console.log('=== DEBUG PassagemTurnoApp ===');
    console.log('usuarioProp:', usuarioProp);
    console.log('usuarioContext:', usuarioContext);
    console.log('usuario final:', usuario);
    console.log('usuario.papel:', usuario?.papel);
    console.log('usuario.nome:', usuario?.nome);
    console.log('usuario.matricula:', usuario?.matricula);
    console.log('============================');
  }, [usuario, usuarioProp, usuarioContext]);
  const [activeView, setActiveView] = useState('form');
  const [passagens, setPassagens] = useState([]);
  const [detalhesPassagem, setDetalhesPassagem] = useState(null);
  const reportRef = useRef(null);
  const [filtroOperador, setFiltroOperador] = useState("");
  const [filtroUtd, setFiltroUtd] = useState('');
  const [filtroData, setFiltroData] = useState('');
  const [notificacao, setNotificacao] = useState(null);
  const [modalConfirm, setModalConfirm] = useState(null);
  const configuracoes = DB.getConfiguracoes();

  // Exportação individual do relatório em Excel
const exportarRelatorioExcel = (passagem) => {
  // Criar workbook
  const wb = XLSX.utils.book_new();
  
  // Aba 1: Informações Gerais
  const dadosGerais = [
    ['RELATÓRIO DE OPERAÇÃO'],
    [],
    ['Operador:', passagem.operador || ''],
    ['Posto:', passagem.posto || passagem.postoOperacional || ''],
    ['Data/Hora:', passagem.dataHora || ''],
    ['Turno:', passagem.turno || ''],
    [],
    ['VALIDAÇÕES'],
    ['Validação de Execução:', passagem.validacaoExec ? 'SIM' : 'NÃO'],
    ['DSES:', passagem.validacaoDSES ? 'SIM' : 'NÃO'],
    ['CHI:', passagem.validacaoCHI ? 'SIM' : 'NÃO'],
    ['COMP:', passagem.validacaoComp ? 'SIM' : 'NÃO'],
    ['Manobras Validado:', passagem.manobrasValidado ? 'SIM' : 'NÃO'],
    ['MRR Validado:', passagem.mrrValidado ? 'SIM' : 'NÃO'],
    [],
    ['UTDs ATENDIDAS'],
    [passagem.utdsString || (Array.isArray(passagem.utdsSelecionadas) ? passagem.utdsSelecionadas.join(', ') : '')]
  ];
  
  const wsGeral = XLSX.utils.aoa_to_sheet(dadosGerais);
  XLSX.utils.book_append_sheet(wb, wsGeral, "Informações Gerais");
  
  // Aba 2: Ocorrências
  if (passagem.ocorrenciasGerais && passagem.ocorrenciasGerais.length > 0) {
    const ocorrenciasData = [
      ['Prioridade', 'Tipo', 'Detalhe'],
      ...passagem.ocorrenciasGerais.map(oc => [oc.prioridade, oc.tipo, oc.detalhe])
    ];
    
    const wsOcorrencias = XLSX.utils.aoa_to_sheet(ocorrenciasData);
    XLSX.utils.book_append_sheet(wb, wsOcorrencias, "Ocorrências");
  }
  
  // Aba 3: Observações Técnicas
  const observacoes = [
    ['OBSERVAÇÕES TÉCNICAS'],
    [],
    ['DSES:', passagem.validacaoDSESTexto || 'Nenhuma'],
    [],
    ['CHI:', passagem.validacaoCHITexto || 'Nenhuma'],
    [],
    ['COMP:', passagem.validacaoCompTexto || 'Nenhuma']
  ];
  
  const wsObservacoes = XLSX.utils.aoa_to_sheet(observacoes);
  XLSX.utils.book_append_sheet(wb, wsObservacoes, "Observações Técnicas");
  
  // Aba 4: Manobras e MRR
  const manobrasMRR = [
    ['MANOBRAS PENDENTES'],
    [passagem.manobras || 'Nenhuma'],
    [],
    ['LANÇAMENTOS MRR'],
    [passagem.lancamentoMRR || 'Nenhum']
  ];
  
  const wsManobras = XLSX.utils.aoa_to_sheet(manobrasMRR);
  XLSX.utils.book_append_sheet(wb, wsManobras, "Manobras e MRR");
  
  // Salvar arquivo
  const nomeArquivo = `Relatorio_Operacao_${passagem.id || Date.now()}.xlsx`;
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  saveAs(new Blob([wbout], { type: 'application/octet-stream' }), nomeArquivo);
};


  // Exportar histórico para PDF
const gerarPDF = (lista) => {
  const doc = new jsPDF();
  
  // Título
  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.text("HISTÓRICO OPERACIONAL", 105, 20, { align: "center" });
  
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 105, 28, { align: "center" });
  doc.text(`Total de registros: ${lista.length}`, 105, 34, { align: "center" });
  
  // Preparar dados para a tabela
  const dadosTabela = lista.map(p => [
    p.dataHora || '',
    p.operador || '',
    p.posto || p.postoOperacional || '',
    p.turno || '',
    p.utdsString || (Array.isArray(p.utdsSelecionadas) ? p.utdsSelecionadas.join(', ') : ''),
    (p.ocorrenciasGerais || []).length + ' itens'
  ]);
  
  autoTable(doc, {
    startY: 40,
    head: [['Data/Hora', 'Operador', 'Posto', 'Turno', 'UTDs', 'Ocorrências']],
    body: dadosTabela,
    theme: 'grid',
    headStyles: { 
      fillColor: [22, 163, 74],
      fontSize: 8,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 7
    },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 35 },
      2: { cellWidth: 25 },
      3: { cellWidth: 15 },
      4: { cellWidth: 60 },
      5: { cellWidth: 20 }
    }
  });
  
  // Salvar
  doc.save(`Historico_Operacional_${new Date().getTime()}.pdf`);
};

// Exportar histórico para Excel
const gerarExcel = (lista) => {
  const wb = XLSX.utils.book_new();
  
  // Aba 1: Resumo do Histórico
  const dadosResumo = [
    ['HISTÓRICO OPERACIONAL'],
    [`Gerado em: ${new Date().toLocaleString('pt-BR')}`],
    [`Total de registros: ${lista.length}`],
    [],
    ['Data/Hora', 'Operador', 'Posto', 'Turno', 'UTDs', 'Ocorrências'],
    ...lista.map(p => [
      p.dataHora || '',
      p.operador || '',
      p.posto || p.postoOperacional || '',
      p.turno || '',
      p.utdsString || (Array.isArray(p.utdsSelecionadas) ? p.utdsSelecionadas.join(', ') : ''),
      (p.ocorrenciasGerais || []).length + ' itens'
    ])
  ];
  
  const wsResumo = XLSX.utils.aoa_to_sheet(dadosResumo);
  XLSX.utils.book_append_sheet(wb, wsResumo, "Histórico");
  
  // Aba 2: Detalhes Completos (todas as passagens com detalhes)
  const dadosDetalhes = [];
  
  lista.forEach((p, idx) => {
    if (idx > 0) dadosDetalhes.push([]); // linha em branco entre registros
    
    dadosDetalhes.push(['=== REGISTRO ' + (idx + 1) + ' ===']);
    dadosDetalhes.push(['Data/Hora:', p.dataHora || '']);
    dadosDetalhes.push(['Operador:', p.operador || '']);
    dadosDetalhes.push(['Posto:', p.posto || p.postoOperacional || '']);
    dadosDetalhes.push(['Turno:', p.turno || '']);
    dadosDetalhes.push(['UTDs:', p.utdsString || (Array.isArray(p.utdsSelecionadas) ? p.utdsSelecionadas.join(', ') : '')]);
    dadosDetalhes.push(['Validação Execução:', p.validacaoExec ? 'SIM' : 'NÃO']);
    dadosDetalhes.push(['DSES:', p.validacaoDSES ? 'SIM' : 'NÃO']);
    dadosDetalhes.push(['CHI:', p.validacaoCHI ? 'SIM' : 'NÃO']);
    dadosDetalhes.push(['COMP:', p.validacaoComp ? 'SIM' : 'NÃO']);
    dadosDetalhes.push(['Manobras:', p.manobras || 'Nenhuma']);
    dadosDetalhes.push(['MRR:', p.lancamentoMRR || 'Nenhum']);
    
    if (p.ocorrenciasGerais && p.ocorrenciasGerais.length > 0) {
      dadosDetalhes.push(['--- OCORRÊNCIAS ---']);
      p.ocorrenciasGerais.forEach((oc, i) => {
        dadosDetalhes.push([`${i + 1}. [${oc.prioridade}] ${oc.tipo}`, oc.detalhe]);
      });
    }
  });
  
  const wsDetalhes = XLSX.utils.aoa_to_sheet(dadosDetalhes);
  XLSX.utils.book_append_sheet(wb, wsDetalhes, "Detalhes Completos");
  
  // Salvar arquivo
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  saveAs(new Blob([wbout], { type: 'application/octet-stream' }), `Historico_Operacional_${new Date().getTime()}.xlsx`);
};

  const [formData, setFormData] = useState({
  operador: "",
    turno: 'Manhã', utdsSelecionadas: [], utdAtual: '', postoOperacional: '',
    data: new Date().toISOString().split('T')[0], validacaoExec: false,
    ocorrenciaTipo: '', ocorrenciaDetalhe: '', ocorrenciaPrioridade: 'Normal',
    ocorrenciasGerais: [], manobras: '', manobrasValidado: false,
    lancamentoMRR: '', mrrValidado: false,
    validacaoDSES: false, validacaoDSESTexto: '',
    validacaoCHI: false, validacaoCHITexto: '',
    validacaoComp: false, validacaoCompTexto: '',
    gestaoSAGE: false
  });

  useEffect(() => { setPassagens(DB.getPassagens()); }, []);

  const mostrarToast = (mensagem, tipo = 'success') => {
    setNotificacao({ mensagem, tipo });
    setTimeout(() => setNotificacao(null), 3000);
  };

  // Filtra passagens pela visibilidade do usuário
  const passagensVisíveis = passagens.filter(p => {
    if (usuario.papel === 'admin') return true; // admin vê tudo
    if (usuario.visibilidade === 'global') return true;
    if (usuario.visibilidade === 'posto') return p.posto === usuario.posto;
    return p.operadorId === usuario.id; // próprias
  });

  const adicionarUTD = () => {
    if (formData.utdAtual && !formData.utdsSelecionadas.includes(formData.utdAtual)) {
      setFormData({ ...formData, utdsSelecionadas: [...formData.utdsSelecionadas, formData.utdAtual], utdAtual: '' });
    }
  };

  const removerUTD = (utd) => setFormData({ ...formData, utdsSelecionadas: formData.utdsSelecionadas.filter(u => u !== utd) });

  const adicionarOcorrencia = () => {
    if (formData.ocorrenciaTipo.trim() && formData.ocorrenciaDetalhe.trim()) {
      setFormData({
        ...formData,
        ocorrenciasGerais: [...formData.ocorrenciasGerais, { tipo: formData.ocorrenciaTipo, detalhe: formData.ocorrenciaDetalhe, prioridade: formData.ocorrenciaPrioridade }],
        ocorrenciaTipo: '', ocorrenciaDetalhe: '', ocorrenciaPrioridade: 'Normal'
      });
      const textarea = document.getElementById('detalheInput');
      if (textarea) textarea.style.height = '48px';
      mostrarToast("Ocorrência adicionada");
    } else {
      mostrarToast("Preencha título e detalhe", "error");
    }
  };

  const salvar = () => {
    if (formData.utdsSelecionadas.length === 0 || !formData.postoOperacional) { mostrarToast("Preencha as UTDs e o Posto!", "error"); return; }
    if (configuracoes.mrrObrigatorio && !formData.mrrValidado) { mostrarToast("Validação MRR é obrigatória!", "error"); return; }
    if (configuracoes.validacaoObrigatoria && !formData.validacaoExec) { mostrarToast("Validação de Execução é obrigatória!", "error"); return; }

    const agora = new Date();
    const novaPassagem = {
      ...formData,
      id: Date.now(),
      operador: formData.operador,
      operadorId: usuario.id,
      posto: formData.postoOperacional,
      dataHora: `${formData.data.split('-').reverse().join('/')} ${agora.toLocaleTimeString('pt-BR')}`,
      utdsString: formData.utdsSelecionadas.join(', ')
    };
    DB.salvarPassagem(novaPassagem);
    setPassagens(DB.getPassagens());
    mostrarToast("Registro salvo com sucesso!");
    limparFormulario();
  };

  const limparFormulario = () => {
    setFormData({
      turno: 'Manhã', utdsSelecionadas: [], utdAtual: '', postoOperacional: '',
      data: new Date().toISOString().split('T')[0], validacaoExec: false,
      ocorrenciaTipo: '', ocorrenciaDetalhe: '', ocorrenciaPrioridade: 'Normal',
      ocorrenciasGerais: [], manobras: '', manobrasValidado: false,
      lancamentoMRR: '', mrrValidado: false,
      validacaoDSES: false, validacaoDSESTexto: '',
      validacaoCHI: false, validacaoCHITexto: '',
      validacaoComp: false, validacaoCompTexto: '',
      gestaoSAGE: false
    });
  };

  const autoExpand = (e) => { e.target.style.height = 'inherit'; e.target.style.height = `${e.target.scrollHeight}px`; };

  const StatusIcon = ({ checked }) => checked ? <CheckCircle size={18} className="text-green-500" strokeWidth={3} /> : <XCircle size={18} className="text-red-500" strokeWidth={3} />;
// Normaliza strings para comparação (remove acentos, caixa e espaços)
const norm = (s) =>
  (s ?? "")
    .toString()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "") // remove acentos
    .toLowerCase()
    .trim();

  // Exportação individual do relatório de operação (modal)
const exportarRelatorioPDF = (passagem) => {
  const doc = new jsPDF();
  
  // Título
  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.text("RELATÓRIO DE OPERAÇÃO", 105, 20, { align: "center" });
  
  // Informações Gerais
  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  let y = 35;
  doc.text(`Operador: ${passagem.operador || ''}`, 15, y);
  y += 7;
  doc.text(`Posto: ${passagem.posto || passagem.postoOperacional || ''}`, 15, y);
  y += 7;
  doc.text(`Data/Hora: ${passagem.dataHora || ''}`, 15, y);
  y += 7;
  doc.text(`Turno: ${passagem.turno || ''}`, 15, y);
  y += 10;
  
  // Validações
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text("Validações", 15, y);
  y += 5;
  
  const validacoes = [
    ['Validação de Execução', passagem.validacaoExec ? 'SIM' : 'NÃO'],
    ['DSES', passagem.validacaoDSES ? 'SIM' : 'NÃO'],
    ['CHI', passagem.validacaoCHI ? 'SIM' : 'NÃO'],
    ['COMP', passagem.validacaoComp ? 'SIM' : 'NÃO'],
    ['Manobras', passagem.manobrasValidado ? 'SIM' : 'NÃO'],
    ['MRR', passagem.mrrValidado ? 'SIM' : 'NÃO']
  ];
  
  autoTable(doc, {
    startY: y,
    head: [['Item', 'Status']],
    body: validacoes,
    theme: 'grid',
    headStyles: { fillColor: [22, 163, 74] },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 40, halign: 'center', fontStyle: 'bold' }
    }
  });
  
  y = doc.lastAutoTable.finalY + 10;
  
  // UTDs
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text("UTDs Atendidas", 15, y);
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  const utdsText = doc.splitTextToSize(passagem.utdsString || (Array.isArray(passagem.utdsSelecionadas) ? passagem.utdsSelecionadas.join(', ') : 'Nenhuma'), 180);
  doc.text(utdsText, 15, y + 7);
  
  y += utdsText.length * 5 + 15;
  
  // Ocorrências
  if (passagem.ocorrenciasGerais && passagem.ocorrenciasGerais.length > 0) {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text("Ocorrências Gerais", 15, y);
    
    const ocorrenciasData = passagem.ocorrenciasGerais.map(oc => [
      oc.prioridade,
      oc.tipo,
      oc.detalhe
    ]);
    
    autoTable(doc, {
      startY: y + 5,
      head: [['Prioridade', 'Tipo', 'Detalhe']],
      body: ocorrenciasData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 40 },
        2: { cellWidth: 115 }
      }
    });
    
    y = doc.lastAutoTable.finalY + 10;
  }
  
  // Nova página se necessário
  if (y > 240) {
    doc.addPage();
    y = 20;
  }
  
  // Observações Técnicas
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text("Observações Técnicas", 15, y);
  y += 7;
  
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.text("DSES:", 15, y);
  doc.setFont(undefined, 'normal');
  const dsesText = doc.splitTextToSize(passagem.validacaoDSESTexto || 'Nenhuma', 180);
  doc.text(dsesText, 15, y + 5);
  y += dsesText.length * 5 + 10;
  
  doc.setFont(undefined, 'bold');
  doc.text("CHI:", 15, y);
  doc.setFont(undefined, 'normal');
  const chiText = doc.splitTextToSize(passagem.validacaoCHITexto || 'Nenhuma', 180);
  doc.text(chiText, 15, y + 5);
  y += chiText.length * 5 + 10;
  
  doc.setFont(undefined, 'bold');
  doc.text("COMP:", 15, y);
  doc.setFont(undefined, 'normal');
  const compText = doc.splitTextToSize(passagem.validacaoCompTexto || 'Nenhuma', 180);
  doc.text(compText, 15, y + 5);
  y += compText.length * 5 + 10;
  
  // Nova página se necessário
  if (y > 240) {
    doc.addPage();
    y = 20;
  }
  
  // Manobras
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text("Manobras Pendentes", 15, y);
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  const manobrasText = doc.splitTextToSize(passagem.manobras || 'Nenhuma', 180);
  doc.text(manobrasText, 15, y + 7);
  y += manobrasText.length * 5 + 15;
  
  // MRR
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text("Lançamentos MRR", 15, y);
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  const mrrText = doc.splitTextToSize(passagem.lancamentoMRR || 'Nenhum', 180);
  doc.text(mrrText, 15, y + 7);
  
  // Salvar
  const nomeArquivo = `Relatorio_Operacao_${passagem.id || Date.now()}.pdf`;
  doc.save(nomeArquivo);
};
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Toast notificacao={notificacao} />

      {/* Header */}
      <header className="bg-gradient-to-r from-green-600 to-green-500 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-5 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <div className="bg-white rounded-xl shadow-sm flex items-center justify-center overflow-hidden w-[140px] h-[50px]">
              <img src="/logo.png" alt="Neoenergia Coelba" className="w-full h-full object-contain scale-110" onError={(e) => { e.target.style.display='none'; }} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight">Passagem de Turno</h1>
              <p className="text-green-100 text-xs font-medium opacity-90 uppercase tracking-widest">Neoenergia Coelba</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setActiveView('form')} className={`px-4 py-2 rounded-lg font-semibold text-xs flex items-center gap-2 transition-all ${activeView === 'form' ? 'bg-yellow-400 text-green-900 shadow-lg scale-105' : 'bg-green-700 hover:bg-green-600'}`}><Plus size={16} /> Nova</button>
            <button onClick={() => setActiveView('history')} className={`px-4 py-2 rounded-lg font-semibold text-xs flex items-center gap-2 transition-all ${activeView === 'history' ? 'bg-yellow-400 text-green-900 shadow-lg scale-105' : 'bg-green-700 hover:bg-green-600'}`}><Eye size={16} /> Histórico</button>
            {usuario.papel === 'admin' && (
              <button onClick={() => setActiveView('admin')} className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-slate-800 rounded-lg font-black text-xs flex items-center gap-2 shadow-md tracking-wider uppercase">
                <Crown size={14} /> Admin
              </button>
            )}
            <button onClick={() => setModalConfirm({ tipo: 'sair' })} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold text-xs flex items-center gap-2 shadow-md">
              <LogOut size={16} /> <span className="hidden sm:inline">{usuario.nome}</span><span className="sm:hidden">Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Admin Panel Route */}
      {activeView === 'admin' && usuario.papel === 'admin' && (
        <AdminScreen onBack={() => setActiveView('form')} usuario={usuario} />
      )}

      {/* Form / History */}
      {activeView !== 'admin' && (
        <main className="max-w-7xl mx-auto px-4 py-8">
          {activeView === 'form' ? (
            <div className="bg-white rounded-xl shadow-xl p-6 md:p-8 border-t-8 border-green-600">
  <div className="flex justify-between items-center mb-6 pb-3 border-b-4 border-yellow-400">
    <h2 className="text-xl font-bold text-green-900 uppercase">Informações Gerais</h2>
  </div>

  {/* === GRID 1: OPERADOR / TURNO / UTD === */}
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">

    {/* OPERADOR (AGORA ITEM INDEPENDENTE) */}
    <div>
      {/* Operador */}
      <label className="block text-sm font-bold text-green-900 mb-2 uppercase">Operador</label>
      <select
  value={formData.operador}
  onChange={(e) => setFormData({ ...formData, operador: e.target.value })}
  className="w-full px-4 py-3 border-2 border-green-200 rounded-lg outline-none focus:border-green-500 font-bold"
>
  <option value="">Selecione o operador...</option>

  <option>JULIANA GOMES COELHO BORGES</option>
  <option>KALIANE SANTOS DA SILVA</option>
  <option>KAREN REGINA BRAGA COSTA</option>
  <option>LAIS GUEDES SOUTO</option>
  <option>LAMARTINE FREITAS DOS SANTOS CONCEICAO</option>
  <option>LUCAS ALVES PEREIRA</option>
  <option>LUCAS SOUZA ROSAS</option>
  <option>LUCIANO BISPO CONCEICAO</option>
  <option>LUCIANO MANOEL DE ALELUIA FILHO</option>
  <option>LUIS ANTONIO FERREIRA SANTOS SILVA</option>
  <option>LUIS CARLOS JESUS DE OLIVEIRA</option>
  <option>LUIS CARLOS VIEIRA ALMEIDA</option>
  <option>LUIS EDUARDO MOURA GONCALVES</option>
  <option>LUIS FELIPE DOS SANTOS DE SANTA RITA</option>
  <option>LUIZ FELIPE DE CARVALHO GOMES</option>
  <option>MARCELO FIGUEIRA FRANCO ARAUJO</option>
  <option>MARCOS AURELIO DOS SANTOS CERQUEIRA</option>
  <option>MARLEY SANTANA DOS SANTOS</option>
  <option>MICHAEL GONCALVES DA SILVA</option>
  <option>NAIELLE BERTOLDO MACIEL</option>
  <option>OMAR BONI FUEZI TEIXEIRA</option>
  <option>OSVALDO JORGE DE OLIVEIRA JUNIOR</option>
  <option>OTAVIO PINHO DE OLIVEIRA</option>
  <option>PAULO ALBERTO FARIAS BORGHI</option>
  <option>PAULO CESAR SANTOS DOS ANJOS</option>
  <option>PEDRO FERREIRA DE MACEDO NETO</option>
  <option>PEDRO VICTOR MOTA VIANA</option>
  <option>RAFAEL ALMEIDA BRAGA</option>
  <option>RAFAEL ANDRADE DE ALMEIDA</option>
  <option>RAFAEL CAETANO DOS SANTOS</option>
  <option>RAILTON CONCEICAO</option>
  <option>RAYMUNDO DIAS DE FREITAS NETO</option>
  <option>RODRIGO ALVES BENTIVOGLIO</option>
  <option>RODRIGO OLIVEIRA DOS SANTOS</option>
  <option>RUAN LUIS CABRAL GONZAGA</option>
  <option>SAULO BOMFIM DE SOUZA REIS</option>
  <option>SILAS CABRAL CERQUEIRA SANTOS</option>
  <option>THIAGO NEVES MACEDO</option>
  <option>THIAGO TRABUCO SAMPAIO</option>
  <option>THOMAS EMILIO PEREIRA REGO</option>
  <option>VAGNER DOS SANTOS OLIVEIRA</option>
  <option>VANESSA PIRES LOPO OGANDO</option>
  <option>VICTOR LUIZ COSTA DE ARAUJO SANTOS</option>
  <option>VICTORIA LOPES CARVALHO</option>
  <option>VINICIUS GABRIEL MOTA VIEIRA</option>
  <option>WELBER CAMPELO DA SILVA</option>
  <option>WENDEL FERREIRA SOUZA</option>
  <option>WILBER SILVA SANTOS</option>
  <option>YURI LIMA SILVA</option>

</select>
    </div>

    {/* TURNO (AGORA ITEM INDEPENDENTE) */}
    <div>
      <label className="block text-sm font-bold text-green-900 mb-2 uppercase">Turno</label>
      <select
        value={formData.turno}
        onChange={(e) => setFormData({ ...formData, turno: e.target.value })}
        className="w-full px-4 py-3 border-2 border-green-200 rounded-lg outline-none focus:border-green-500 font-bold"
      >
        <option>Manhã</option>
        <option>Tarde</option>
        <option>Pernoite</option>
      </select>
    </div>

    {/* ADICIONAR UTD (PERMANECE NA TERCEIRA COLUNA NO DESKTOP) */}
    <div>
      <label className="block text-sm font-bold text-green-900 mb-2 uppercase">Adicionar UTD *</label>
      <div className="flex gap-2">
        <select
          value={formData.utdAtual}
          onChange={(e) => setFormData({ ...formData, utdAtual: e.target.value })}
          className="flex-1 px-4 py-3 border-2 border-green-200 rounded-lg outline-none focus:border-green-500 font-bold"
        >
          <option value="">Selecione a UTD...</option>
          {LISTA_UTDS.map((utd) => (
            <option key={utd} value={utd}>{utd}</option>
          ))}
        </select>
        <button
          onClick={adicionarUTD}
          className="px-5 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <Plus size={20} />
        </button>
      </div>
    </div>
  </div>

  {formData.utdsSelecionadas.length > 0 && (
    <div className="mb-6 p-4 bg-green-50 rounded-lg border-2 border-green-200 flex flex-wrap gap-2">
      {formData.utdsSelecionadas.map((utd) => (
        <span
          key={utd}
          className="inline-flex items-center gap-2 px-3 py-1 bg-green-600 text-white rounded-full text-sm font-bold shadow-sm"
        >
          {utd}
          <X
            size={16}
            className="cursor-pointer hover:text-yellow-300"
            onClick={() => removerUTD(utd)}
          />
        </span>
      ))}
    </div>
  )}

  {/* === GRID 2: POSTO / DATA / VALIDAÇÃO === */}
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
    <div>
      <label className="block text-sm font-bold text-green-900 mb-2 uppercase">Posto Operacional *</label>
      <select
        value={formData.postoOperacional}
        onChange={(e) => setFormData({ ...formData, postoOperacional: e.target.value })}
        className="w-full px-4 py-3 border-2 border-green-200 rounded-lg font-bold outline-none focus:border-green-500"
      >
        <option value="">Selecione...</option>
        {POSTOS.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>
    </div>

    <div>
      <label className="block text-sm font-bold text-green-900 mb-2 uppercase">Data</label>
      <input
        type="date"
        value={formData.data}
        onChange={(e) => setFormData({ ...formData, data: e.target.value })}
        className="w-full px-4 py-3 border-2 border-green-200 rounded-lg font-bold outline-none focus:border-green-500"
      />
    </div>

    <div className="flex items-end">
      <label className="flex items-center gap-2 px-4 py-3 bg-green-50 rounded-lg cursor-pointer w-full border-2 border-green-200 hover:bg-green-100 h-[52px]">
        <input
          type="checkbox"
          checked={formData.validacaoExec}
          onChange={(e) => setFormData({ ...formData, validacaoExec: e.target.checked })}
          className="w-6 h-6 accent-green-600"
        />
        <span className="font-bold text-green-900 uppercase text-xs">
          Validação de Execução {configuracoes.validacaoObrigatoria && <span className="text-red-500">*</span>}
        </span>
      </label>
    </div>
  </div>

              <h3 className="font-black text-green-900 uppercase text-sm mb-4 tracking-tighter">Validações Técnicas</h3>
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                {[
                  { label: 'DSES', check: 'validacaoDSES', text: 'validacaoDSESTexto' },
                  { label: 'CHI', check: 'validacaoCHI', text: 'validacaoCHITexto' },
                  { label: 'COMP', check: 'validacaoComp', text: 'validacaoCompTexto' }
                ].map(item => (
                  <div key={item.label} className="bg-slate-50 p-4 rounded-xl border-2 border-slate-300 hover:border-green-300 transition-all">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-black text-xs text-green-700 uppercase tracking-tighter">{item.label}</span>
                      <input type="checkbox" checked={formData[item.check]} onChange={(e) => setFormData({ ...formData, [item.check]: e.target.checked })} className="w-6 h-6 accent-green-600 cursor-pointer" />
                    </div>
                    <textarea placeholder={`Observações do ${item.label}...`} value={formData[item.text]} onChange={(e) => setFormData({ ...formData, [item.text]: e.target.value })} className="w-full p-2 text-xs border rounded-lg h-24 resize-none focus:border-green-500 outline-none" />
                  </div>
                ))}
              </div>

              <div className="mb-8 p-6 bg-slate-50 rounded-xl border-2 border-slate-200">
                <h3 className="font-black text-green-900 uppercase text-sm mb-4 tracking-tighter">Registro de Ocorrências Gerais</h3>
                <div className="grid md:grid-cols-4 gap-4 mb-4 items-end">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">OC</label>
                    <input type="text" placeholder="Nº OC" value={formData.ocorrenciaTipo} onChange={(e) => setFormData({ ...formData, ocorrenciaTipo: e.target.value })} className="px-4 py-3 border-2 border-slate-200 rounded-lg outline-none focus:border-green-500 font-bold text-sm" />
                  </div>
                  <div className="md:col-span-2 flex flex-col gap-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Detalhamento</label>
                    <textarea id="detalheInput" rows="1" placeholder="Descreva a ocorrência..." value={formData.ocorrenciaDetalhe} onInput={autoExpand} onChange={(e) => setFormData({ ...formData, ocorrenciaDetalhe: e.target.value })} className="px-4 py-3 border-2 border-slate-200 rounded-lg outline-none focus:border-green-500 text-sm overflow-hidden min-h-[48px] resize-none leading-relaxed" />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 flex flex-col gap-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Prioridade</label>
                      <select value={formData.ocorrenciaPrioridade} onChange={(e) => setFormData({ ...formData, ocorrenciaPrioridade: e.target.value })} className={`w-full px-2 py-3 border-2 rounded-lg font-black text-xs uppercase outline-none h-[48px] ${formData.ocorrenciaPrioridade === 'Urgente' ? 'border-red-500 text-red-600 bg-red-50' : 'border-blue-500 text-blue-600 bg-blue-50'}`}>
                        <option value="Normal">Normal</option>
                        <option value="Urgente">Urgente</option>
                      </select>
                    </div>
                    <button onClick={adicionarOcorrencia} className="bg-green-600 text-white px-4 rounded-lg hover:bg-green-700 shadow-md active:scale-95 h-[48px] mt-auto"><Plus /></button>
                  </div>
                </div>
                <div className="bg-white rounded-lg border overflow-hidden">
                  <table className="w-full table-fixed text-left text-sm">
                    <thead className="bg-slate-100 text-slate-500 uppercase text-[10px] font-black tracking-widest">
                      <tr>
                        <th className="px-4 py-2 w-28">Prioridade</th>
                        <th className="px-4 py-2 w-40">Tipo</th>
                        <th className="px-4 py-2">Detalhe</th>
                        <th className="px-4 py-2 w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {formData.ocorrenciasGerais.length === 0 && (
                        <tr><td colSpan="4" className="px-4 py-4 text-center text-slate-400 italic">Nenhuma ocorrência na lista</td></tr>
                      )}
                      {formData.ocorrenciasGerais.map((oc, i) => (
                        <tr key={i} className="hover:bg-green-50">
                          <td className="px-4 py-3 align-top"><span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${oc.prioridade === 'Urgente' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>{oc.prioridade}</span></td>
                          <td className="px-4 py-3 font-bold text-green-700 uppercase text-xs break-words align-top tracking-tighter">{oc.tipo}</td>
                          <td className="px-4 py-3 text-slate-600 text-xs break-words whitespace-pre-wrap leading-relaxed align-top">{oc.detalhe}</td>
                          <td className="px-4 py-3 text-right align-top"><Trash2 size={16} className="text-red-400 cursor-pointer hover:text-red-600 ml-auto" onClick={() => setFormData({ ...formData, ocorrenciasGerais: formData.ocorrenciasGerais.filter((_, idx) => idx !== i) })} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="bg-slate-50 p-4 rounded-xl border-2 border-slate-300 hover:border-blue-300 transition-all">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-black text-xs text-blue-700 uppercase tracking-tighter">Manobras Pendentes</span>
                    <input type="checkbox" checked={formData.manobrasValidado} onChange={(e) => setFormData({ ...formData, manobrasValidado: e.target.checked })} className="w-6 h-6 accent-blue-600 cursor-pointer" />
                  </div>
                  <textarea placeholder="Liste as manobras..." value={formData.manobras} onChange={(e) => setFormData({ ...formData, manobras: e.target.value })} className="w-full p-3 text-xs border rounded-lg h-32 resize-none focus:border-blue-500 outline-none bg-white shadow-inner" />
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border-2 border-slate-300 hover:border-green-300 transition-all">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-black text-xs text-green-700 uppercase tracking-tighter">
                      Lançamento MRR {configuracoes.mrrObrigatorio && <span className="text-red-500">* Obrigatório</span>}
                    </span>
                    <input type="checkbox" checked={formData.mrrValidado} onChange={(e) => setFormData({ ...formData, mrrValidado: e.target.checked })} className="w-6 h-6 accent-green-600 cursor-pointer" />
                  </div>
                  <textarea placeholder="Informe detalhes do MRR..." value={formData.lancamentoMRR} onChange={(e) => setFormData({ ...formData, lancamentoMRR: e.target.value })} className="w-full p-3 text-xs border rounded-lg h-32 resize-none focus:border-green-500 outline-none bg-white shadow-inner" />
                </div>
              </div>

              <div className="flex gap-4 justify-center mt-8">
                <button onClick={salvar} className="px-8 py-3.5 bg-green-600 text-white rounded-xl hover:bg-green-700 font-bold text-lg shadow-lg flex items-center gap-3 active:scale-95 transition-all"><CheckCircle size={22} /> Salvar Passagem</button>
                <button onClick={() => setModalConfirm({ tipo: 'limpar' })} className="px-6 py-3.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 font-bold text-lg shadow-md active:scale-95 transition-all">Limpar</button>
              </div>
            </div>
          ) : (
            /* HISTÓRICO */
            <div className="bg-white rounded-xl shadow-xl p-6 md:p-8">
              <div className="flex justify-between items-center mb-6 pb-3 border-b-4 border-yellow-400">
                <h2 className="text-xl font-bold text-green-900 uppercase">Histórico Operacional</h2>
        {/* Barra de ações do histórico — versão responsiva e compacta */}
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">

  {/* BOTÕES DE EXPORTAÇÃO */}
  <div className="flex items-center gap-2">

    <button
      onClick={() => gerarPDF(passagensVisíveis)}
      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] uppercase tracking-wider font-bold shadow-md"
    >
      <FileText size={12} className="inline-block mr-1" />
      Exportar PDF
    </button>

    <button
      onClick={() => gerarExcel(passagensVisíveis)}
      className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-[10px] uppercase tracking-wider font-bold shadow-md"
    >
      <FileSpreadsheet size={12} className="inline-block mr-1" />
      Exportar Excel
    </button>

  </div>

  {/* TEXTO DE VISÃO (agora alinhado à direita e próximo dos botões) */}
  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider bg-slate-100 px-3 py-1 rounded-full self-end sm:self-center">
    {usuario.visibilidade === 'global'
      ? 'Visão Global'
      : usuario.visibilidade === 'posto'
        ? `Posto: ${usuario.posto}`
        : 'Só Suas'}
  </span>

</div>
              </div>

              {/* === BARRA DE FILTROS DO HISTÓRICO === */}
<div className="grid md:grid-cols-3 gap-4 mb-6 bg-slate-50 p-4 rounded-xl border">

  {/* COLUNA 1 — OPERADOR (texto digitável) */}
  <div className="flex flex-col gap-1">
    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Operador</label>
    <input
      type="text"
      placeholder="Ex: LUCAS..."
      value={filtroOperador}
      onChange={(e) => setFiltroOperador(e.target.value)}
      className="px-4 py-2 rounded-lg border focus:border-green-500 font-bold text-sm"
    />
  </div>

  {/* COLUNA 2 — UTD (texto digitável) */}
  <div className="flex flex-col gap-1">
    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Buscar UTD</label>
    <input
      type="text"
      placeholder="Ex: ESPLANADA..."
      value={filtroUtd}
      onChange={(e) => setFiltroUtd(e.target.value)}
      className="px-4 py-2 rounded-lg border focus:border-green-500 font-bold text-sm"
    />
  </div>

  {/* COLUNA 3 — DATA + LIMPAR (lado a lado em telas médias) */}
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Data</label>
      <input
        type="date"
        value={filtroData}
        onChange={(e) => setFiltroData(e.target.value)}
        className="px-4 py-2 rounded-lg border focus:border-green-500 font-bold text-sm"
      />
    </div>

    <button
      onClick={() => { setFiltroData(''); setFiltroUtd(''); setFiltroOperador(''); }}
      className="w-full bg-slate-200 text-slate-600 font-bold py-2 rounded-lg hover:bg-slate-300 text-xs uppercase tracking-widest"
      style={{ alignSelf: 'end' }}
    >
      Limpar Filtros
    </button>
  </div>

</div>


              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full">
                  <thead className="bg-green-600 text-white">
                    <tr>
                      <th className="px-5 py-3 text-left uppercase text-[10px] font-black tracking-widest">Data/Hora</th>
                      <th className="px-5 py-3 text-left uppercase text-[10px] font-black tracking-widest">Operador</th>
                      <th className="px-5 py-3 text-left uppercase text-[10px] font-black tracking-widest">UTDs</th>
                      <th className="px-5 py-3 text-left uppercase text-[10px] font-black tracking-widest">OC</th>
                      <th className="px-5 py-3 text-center uppercase text-[10px] font-black tracking-widest">Relatório</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {passagensVisíveis
  .filter(p => {
    // Normalizador: remove acentos e baixa caixa (defina a função 'norm' no componente)
    const oper = norm(p.operador);
    const fOper = norm(filtroOperador);

    // UTDs podem vir em p.utdsString (string) ou p.utdsSelecionadas (array)
    const utdsString = p.utdsString || (Array.isArray(p.utdsSelecionadas) ? p.utdsSelecionadas.join(', ') : '');
    const utdsNorm = norm(utdsString);
    const fUtd = norm(filtroUtd);

    // Data: compatível com passagens antigas (sem 'data')
    const okData = !filtroData || (p.data?.includes(filtroData) || p.dataHora?.includes(filtroData));

    // Operador e UTD com busca parcial, sem acentos e case-insensitive
    const okOper = !filtroOperador || oper.includes(fOper);
    const okUtd  = !filtroUtd || utdsNorm.includes(fUtd);

    return okOper && okUtd && okData;
  })
  .map(p => (
    <tr key={p.id} className="border-b hover:bg-green-50 transition-colors">
      <td className="px-5 py-3.5 text-sm font-bold">{p.dataHora}</td>
      <td className="px-5 py-3.5 text-xs text-slate-500 font-bold">{p.operador}</td>
      <td className="px-5 py-3.5 font-bold text-green-800 text-xs uppercase tracking-tighter">
        <div className="max-w-xs overflow-hidden text-ellipsis whitespace-nowrap" title={p.utdsString}>
          {p.utdsString || (Array.isArray(p.utdsSelecionadas) ? p.utdsSelecionadas.join(', ') : '')}
        </div>
      </td>
      <td className="px-5 py-3.5 text-xs">
        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-black uppercase tracking-tighter">
          {(p.ocorrenciasGerais || []).length} itens
        </span>
      </td>
      <td className="px-5 py-3.5 text-center">
        <button
          onClick={() => setDetalhesPassagem(p)}
          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-md"
        >
          Visualizar
        </button>
      </td>
    </tr>
  ))}

                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      )}

      {/* MODAL DETALHES */}
      {detalhesPassagem && (
  <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 z-[200]">
    <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden flex flex-col">

      {/* ÁREA SCROLL DO RELATÓRIO */}
      <div ref={reportRef} className="flex flex-col overflow-y-auto bg-white p-6 md:p-8 max-h-[80vh]">

        {/* HEADER DO RELATÓRIO */}
        <div className="bg-green-700 text-white p-5 rounded-2xl flex justify-between items-center border-b-8 border-yellow-400 mb-6">
          <div className="flex items-center gap-3">
            <div>
              <h3 className="text-xl font-black uppercase tracking-tighter leading-none">Relatório de Operação</h3>
              <p className="text-xs text-green-100 font-bold mt-1 uppercase tracking-widest">
                {detalhesPassagem.dataHora} — POSTO: {detalhesPassagem.posto}
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-[10px] font-black text-green-200 uppercase tracking-widest">Operador</p>
            <p className="font-black text-base uppercase tracking-tighter">{detalhesPassagem.operador}</p>
          </div>
        </div>

        {/* BLOCOS DE VALIDAÇÕES */}
        <div className="space-y-5">

          {/* ÍCONES DSES / CHI / COMP / MANOBRAS / MRR */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: 'DSES', val: detalhesPassagem.validacaoDSES },
              { label: 'CHI', val: detalhesPassagem.validacaoCHI },
              { label: 'COMP', val: detalhesPassagem.validacaoComp },
              { label: 'Manobras', val: detalhesPassagem.manobrasValidado },
              { label: 'MRR', val: detalhesPassagem.mrrValidado }
            ].map(item => (
              <div key={item.label} className="bg-slate-50 p-3 rounded-2xl border text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{item.label}</p>
                <div className="flex justify-center"><StatusIcon checked={item.val} /></div>
              </div>
            ))}
          </div>

          {/* UTDs */}
          <div className="bg-slate-50 p-4 rounded-2xl border">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">UTDs Atendidas</h4>
            <p className="text-xs font-black text-green-800 uppercase tracking-tighter leading-relaxed">
              {detalhesPassagem.utdsString}
            </p>
          </div>

          {/* OCORRÊNCIAS */}
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="bg-slate-100 px-4 py-2 font-black text-[10px] text-slate-500 uppercase tracking-widest border-b">
              Lista Detalhada de Ocorrências
            </div>
            <table className="w-full text-left text-xs">
              <tbody className="divide-y">
                {(detalhesPassagem.ocorrenciasGerais || []).map((oc, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-4 py-3 w-1/4">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`w-fit px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                            oc.prioridade === 'Urgente'
                              ? 'bg-red-100 text-red-600'
                              : 'bg-blue-100 text-blue-600'
                          }`}
                        >
                          {oc.prioridade}
                        </span>
                        <span className="font-black text-green-700 uppercase tracking-tighter">{oc.tipo}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-slate-600 leading-relaxed italic border-l break-words">
                      {oc.detalhe}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* MANOBRAS & MRR */}
          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <h4 className="text-xs font-black text-slate-800 border-l-4 border-blue-400 pl-3 uppercase tracking-widest mb-2">
                Manobras Pendentes
              </h4>
              <div className="bg-slate-50 p-4 rounded-2xl border min-h-[80px] text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">
                {detalhesPassagem.manobras || "Nenhuma registrada."}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-black text-slate-800 border-l-4 border-orange-400 pl-3 uppercase tracking-widest mb-2">
                Lançamentos MRR
              </h4>
              <div className="bg-slate-50 p-4 rounded-2xl border min-h-[80px] text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">
                {detalhesPassagem.lancamentoMRR || "Nenhum registrado."}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* RODAPÉ DO MODAL COM BOTÕES */}
      <div className="p-4 bg-slate-50 border-t flex gap-3 justify-end items-center">

        {/* Exportar PDF Individual */}
<button
  onClick={() => exportarRelatorioPDF(detalhesPassagem)}
  className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-md flex items-center gap-2"
>
  <FileText size={14} className="text-white" />
  Exportar PDF
</button>

{/* Exportar Excel Individual */}
<button
  onClick={() => exportarRelatorioExcel(detalhesPassagem)}
  className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-md flex items-center gap-2"
>
  <FileSpreadsheet size={14} className="text-white" />
  Exportar Excel
</button>

        {/* Fechar */}
        <button
          onClick={() => setDetalhesPassagem(null)}
          className="px-6 py-2.5 bg-slate-800 text-white rounded-xl font-bold text-xs uppercase tracking-widest"
        >
          Fechar
        </button>
      </div>

    </div>
  </div>
)}

      {/* MODAL CONFIRMAÇÃO */}
      {modalConfirm && (
        <div className="fixed inset-0 z-[400] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center">
            <h3 className="text-xl font-black uppercase mb-4 tracking-tighter">{modalConfirm.tipo === 'sair' ? 'Sair do Sistema?' : 'Limpar Formulário?'}</h3>
            <div className="flex gap-3">
              <button onClick={() => setModalConfirm(null)} className="flex-1 py-3 bg-slate-100 font-bold rounded-xl uppercase text-xs tracking-widest">Não</button>
              <button onClick={() => { if (modalConfirm.tipo === 'sair') onLogout(); else limparFormulario(); setModalConfirm(null); }} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl uppercase text-xs tracking-widest shadow-lg">Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


// ============================================================
// 9. APP ROOT — Exporta apenas o PassagemTurnoApp
// ============================================================

// Este componente será usado pelo arquivo de login separado
export { PassagemTurnoApp };

// Exportação padrão para uso standalone (desenvolvimento)
const App = ({ usuario: usuarioProp, onLogout: onLogoutProp }) => {
  // Se receber props (vindo do login externo), usa elas
  if (usuarioProp) {
    return (
      <AuthContext.Provider value={{ usuario: usuarioProp }}>
        <PassagemTurnoApp usuario={usuarioProp} onLogout={onLogoutProp || (() => {})} />
      </AuthContext.Provider>
    );
  }
  
  // Caso contrário, usa admin para desenvolvimento
  const usuarioAdmin = DB.getUsuario('admin') || {
    id: 'admin_master',
    matricula: 'admin',
    nome: 'Administrador Master',
    papel: 'admin',
    ativo: true,
    posto: null,
    visibilidade: 'global'
  };

  return (
    <AuthContext.Provider value={{ usuario: usuarioAdmin }}>
      <PassagemTurnoApp usuario={usuarioAdmin} onLogout={() => window.location.reload()} />
    </AuthContext.Provider>
  );
};

export default App;