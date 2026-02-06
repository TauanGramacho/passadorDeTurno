import React, { useState, useEffect } from 'react';
import { Crown, Users, Settings, Search, User, Lock, Eye, EyeOff, Plus, Trash2, CheckCircle, AlertTriangle } from 'lucide-react';

import { api } from '../api/client';

const POSTOS = ["Feira de Santana", "Serrinha", "Alagoinhas", "Jacobina", "Juazeiro"];

// ============================================================
// COMPONENTES UTILITÁRIOS
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
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest`}>
    <span className={`w-2 h-2 rounded-full ${ativo ? 'bg-green-500' : 'bg-red-400'}`} />
    {ativo ? 'Ativo' : 'Desativado'}
  </span>
);

// ============================================================
// PAINEL ADMIN (COMPONENTE PRINCIPAL)
// ============================================================
const AdminScreen = ({ onBack, usuario }) => {
  const [abaNativa, setAbaNativa] = useState('usuarios');
  const [usuarios, setUsuarios] = useState([]);
  const [busca, setBusca] = useState('');
  const [modalCriar, setModalCriar] = useState(false);
  const [modalEditar, setModalEditar] = useState(null);
  const [modalSenha, setModalSenha] = useState(null);
  const [notificacao, setNotificacao] = useState(null);
  const [configuracoes, setConfiguracoes] = useState({ mrrObrigatorio: false, validacaoObrigatoria: false });
  const [carregando, setCarregando] = useState(true);

  const mostrarToast = (mensagem, tipo = 'success') => {
    setNotificacao({ mensagem, tipo });
    setTimeout(() => setNotificacao(null), 3000);
  };

  const carregarDados = async () => {
    try {
      const [usuariosRes, cfgRes] = await Promise.all([
        api.usuarios.listar(),
        api.configuracoes.obter()
      ]);
      setUsuarios(Array.isArray(usuariosRes) ? usuariosRes : []);
      setConfiguracoes(cfgRes || { mrrObrigatorio: false, validacaoObrigatoria: false });
    } catch {
      setUsuarios([]);
      mostrarToast('Erro ao carregar dados do servidor', 'error');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => { carregarDados(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const recargar = () => api.usuarios.listar().then((r) => setUsuarios(Array.isArray(r) ? r : [])).catch(() => setUsuarios([]));

  const filtrado = usuarios.filter(u =>
    u.matricula.toLowerCase().includes(busca.toLowerCase()) ||
    u.nome.toLowerCase().includes(busca.toLowerCase())
  );

  const salvarConfiguracoes = async () => {
    try {
      await api.configuracoes.salvar(configuracoes);
      mostrarToast('Configurações salvas');
    } catch (err) {
      mostrarToast(err.message || 'Erro ao salvar', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Toast notificacao={notificacao} />

      {/* Header Admin */}
      <header className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-yellow-400 rounded-xl p-2.5 shadow-lg">
              <Crown size={24} className="text-slate-800" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Painel de Administração</h1>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-widest">Gerenciamento do Sistema</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setAbaNativa('usuarios')} className={`px-4 py-2 rounded-lg font-semibold text-xs uppercase tracking-wider flex items-center gap-2 transition-all ${abaNativa === 'usuarios' ? 'bg-yellow-400 text-slate-800 shadow' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}>
              <Users size={14} /> Usuários
            </button>
            <button onClick={() => setAbaNativa('configuracoes')} className={`px-4 py-2 rounded-lg font-semibold text-xs uppercase tracking-wider flex items-center gap-2 transition-all ${abaNativa === 'configuracoes' ? 'bg-yellow-400 text-slate-800 shadow' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}>
              <Settings size={14} /> Regras
            </button>
            <button onClick={onBack} className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg font-semibold text-xs uppercase tracking-wider transition-all">
              ← Voltar
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {/* ABA USUÁRIOS */}
        {abaNativa === 'usuarios' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por matrícula ou nome..." className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none" />
              </div>
              <button onClick={() => setModalCriar(true)} className="px-5 py-3 bg-yellow-400 hover:bg-yellow-500 text-slate-800 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all">
                <Plus size={16} /> Novo Usuário
              </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Usuário</th>
                    <th className="px-4 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Papel</th>
                    <th className="px-4 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Posto</th>
                    <th className="px-4 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Visibilidade</th>
                    <th className="px-4 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                    <th className="px-4 py-3 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {carregando ? (
                    <tr><td colSpan="6" className="px-4 py-8 text-center text-slate-500">Carregando...</td></tr>
                  ) : (
                  filtrado.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-slate-800 uppercase tracking-tight">{u.matricula}</span>
                          <span className="text-xs text-slate-500">{u.nome}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3"><Badge tipo={u.papel} /></td>
                      <td className="px-4 py-3"><span className="text-xs font-semibold text-slate-600">{u.posto || 'Todos'}</span></td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${u.visibilidade === 'global' ? 'bg-green-100 text-green-700' : u.visibilidade === 'posto' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                          {u.visibilidade === 'global' ? 'Global' : u.visibilidade === 'posto' ? 'Posto' : 'Próprio'}
                        </span>
                      </td>
                      <td className="px-4 py-3"><StatusPill ativo={u.ativo} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setModalEditar(u)} className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors" title="Editar">
                            <Settings size={14} />
                          </button>
                          <button onClick={() => setModalSenha(u)} className="p-1.5 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-lg transition-colors" title="Redefinir senha">
                            <Lock size={14} />
                          </button>
                          {u.matricula !== 'admin' && (
                            <button onClick={() => { if (window.confirm(`Excluir ${u.nome}?`)) { api.usuarios.excluir(u.matricula).then(() => { recargar(); mostrarToast('Usuário excluído'); }).catch(() => mostrarToast('Erro ao excluir', 'error')); } }} className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors" title="Excluir">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ABA CONFIGURAÇÕES */}
        {abaNativa === 'configuracoes' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
            <h2 className="text-lg font-bold text-slate-800 border-b pb-3">Regras de Preenchimento</h2>
            
            <label className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer">
              <div className="flex-1">
                <p className="font-bold text-sm text-slate-800">MRR Obrigatório</p>
                <p className="text-xs text-slate-500 mt-1">Exigir preenchimento do campo "Lançamentos MRR"</p>
              </div>
              <input type="checkbox" checked={configuracoes.mrrObrigatorio} onChange={(e) => setConfiguracoes({ ...configuracoes, mrrObrigatorio: e.target.checked })} className="w-5 h-5 text-yellow-400 rounded focus:ring-2 focus:ring-yellow-400" />
            </label>

            <label className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer">
              <div className="flex-1">
                <p className="font-bold text-sm text-slate-800">Validação Obrigatória</p>
                <p className="text-xs text-slate-500 mt-1">Exigir que pelo menos DSES, CHI ou COMP estejam marcados</p>
              </div>
              <input type="checkbox" checked={configuracoes.validacaoObrigatoria} onChange={(e) => setConfiguracoes({ ...configuracoes, validacaoObrigatoria: e.target.checked })} className="w-5 h-5 text-yellow-400 rounded focus:ring-2 focus:ring-yellow-400" />
            </label>

            <button onClick={salvarConfiguracoes} className="w-full py-3 bg-yellow-400 hover:bg-yellow-500 text-slate-800 rounded-xl font-bold text-sm uppercase tracking-wider shadow-lg transition-all">
              Salvar Configurações
            </button>
          </div>
        )}
      </div>

      {/* MODAL CRIAR USUÁRIO */}
      {modalCriar && <ModalCriarUsuario onClose={() => { setModalCriar(false); recargar(); }} onSucesso={(msg) => { mostrarToast(msg); setModalCriar(false); recargar(); }} />}

      {/* MODAL EDITAR USUÁRIO */}
      {modalEditar && <ModalEditarUsuario usuario={modalEditar} onClose={() => { setModalEditar(null); recargar(); }} onSucesso={(msg) => { mostrarToast(msg); setModalEditar(null); recargar(); }} />}

      {/* MODAL REDEFINIR SENHA */}
      {modalSenha && <ModalRedefinirSenha usuario={modalSenha} onClose={() => setModalSenha(null)} onSucesso={(msg) => { mostrarToast(msg); setModalSenha(null); }} />}
    </div>
  );
};

// ============================================================
// MODAL CRIAR USUÁRIO
// ============================================================
const ModalCriarUsuario = ({ onClose, onSucesso }) => {
  const [dados, setDados] = useState({
    matricula: '',
    nome: '',
    senha: '',
    papel: 'controlador',
    posto: '',
    visibilidade: 'global',
    ativo: true
  });
  const [erro, setErro] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    if (!dados.matricula.trim() || !dados.nome.trim() || !dados.senha) {
      setErro('Matrícula, nome e senha são obrigatórios');
      return;
    }
    if (dados.senha.length < 6) {
      setErro('Senha deve ter pelo menos 6 caracteres');
      return;
    }
    const existente = await api.usuarios.porMatricula(dados.matricula);
    if (existente) {
      setErro('Matrícula já existe');
      return;
    }

    const novoUsuario = {
      id: `usr_${Date.now()}`,
      matricula: dados.matricula.trim().toLowerCase(),
      senha: btoa(dados.senha),
      nome: dados.nome.trim(),
      papel: dados.papel,
      ativo: dados.ativo,
      posto: dados.posto || null,
      visibilidade: dados.visibilidade,
      criadoEm: new Date().toISOString(),
      ultimoLogin: null
    };

    try {
      await api.usuarios.criar(novoUsuario);
      onSucesso('Usuário criado com sucesso');
    } catch (err) {
      setErro(err.message || 'Erro ao criar usuário');
    }
  };

  return (
    <div className="fixed inset-0 z-[300] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-yellow-400 to-orange-400 p-6 text-slate-800">
          <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
            <Plus size={20} /> Criar Novo Usuário
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Matrícula *</label>
            <input type="text" value={dados.matricula} onChange={(e) => {
              const valor = e.target.value.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Z0-9]/g, "");
              setDados({ ...dados, matricula: valor });
            }} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none" placeholder="Ex: B000000" />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Nome Completo *</label>
            <input type="text" value={dados.nome} onChange={(e) => {
              const valor = e.target.value.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Z\s]/g, "");
              setDados({ ...dados, nome: valor });
            }} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none" placeholder="Ex: JOAO SILVA" />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Senha *</label>
            <div className="relative">
              <input type={mostrarSenha ? 'text' : 'password'} value={dados.senha} onChange={(e) => setDados({ ...dados, senha: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none pr-12" placeholder="Mínimo 6 caracteres" />
              <button type="button" onClick={() => setMostrarSenha(!mostrarSenha)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Papel</label>
            <select value={dados.papel} onChange={(e) => setDados({ ...dados, papel: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none">
              <option value="controlador">Controlador</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Posto</label>
            <select value={dados.posto} onChange={(e) => setDados({ ...dados, posto: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none">
              <option value="">Todos os postos</option>
              {POSTOS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Visibilidade</label>
            <select value={dados.visibilidade} onChange={(e) => setDados({ ...dados, visibilidade: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none">
              <option value="global">Global (todas as passagens)</option>
              <option value="posto">Posto (apenas do seu posto)</option>
              <option value="proprio">Próprio (apenas as suas)</option>
            </select>
          </div>

          <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer">
            <input type="checkbox" checked={dados.ativo} onChange={(e) => setDados({ ...dados, ativo: e.target.checked })} className="w-4 h-4 text-yellow-400 rounded" />
            <span className="text-sm font-semibold text-slate-700">Conta ativa</span>
          </label>

          {erro && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-semibold">
              {erro}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-wider transition-all">
              Cancelar
            </button>
            <button type="submit" className="flex-1 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-slate-800 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg transition-all">
              Criar Usuário
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================
// MODAL EDITAR USUÁRIO
// ============================================================
const ModalEditarUsuario = ({ usuario, onClose, onSucesso }) => {
  const [dados, setDados] = useState({
    papel: usuario.papel,
    posto: usuario.posto || '',
    visibilidade: usuario.visibilidade,
    ativo: usuario.ativo
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.usuarios.atualizar(usuario.matricula, {
        papel: dados.papel,
        posto: dados.posto || null,
        visibilidade: dados.visibilidade,
        ativo: dados.ativo
      });
      onSucesso('Usuário atualizado');
    } catch (err) {
      onSucesso(err.message || 'Erro ao atualizar');
    }
  };

  return (
    <div className="fixed inset-0 z-[300] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
          <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
            <Settings size={20} /> Editar Usuário
          </h3>
          <p className="text-blue-100 text-xs mt-1">{usuario.nome}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Papel</label>
            <select value={dados.papel} onChange={(e) => setDados({ ...dados, papel: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none">
              <option value="controlador">Controlador</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Posto</label>
            <select value={dados.posto} onChange={(e) => setDados({ ...dados, posto: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none">
              <option value="">Todos os postos</option>
              {POSTOS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Visibilidade</label>
            <select value={dados.visibilidade} onChange={(e) => setDados({ ...dados, visibilidade: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none">
              <option value="global">Global (todas as passagens)</option>
              <option value="posto">Posto (apenas do seu posto)</option>
              <option value="proprio">Próprio (apenas as suas)</option>
            </select>
          </div>

          <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer">
            <input type="checkbox" checked={dados.ativo} onChange={(e) => setDados({ ...dados, ativo: e.target.checked })} className="w-4 h-4 text-blue-500 rounded" />
            <span className="text-sm font-semibold text-slate-700">Conta ativa</span>
          </label>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-wider transition-all">
              Cancelar
            </button>
            <button type="submit" className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg transition-all">
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================
// MODAL REDEFINIR SENHA
// ============================================================
const ModalRedefinirSenha = ({ usuario, onClose, onSucesso }) => {
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [erro, setErro] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    if (novaSenha.length < 6) {
      setErro('Senha deve ter pelo menos 6 caracteres');
      return;
    }
    if (novaSenha !== confirmar) {
      setErro('Senhas não coincidem');
      return;
    }
    try {
      await api.usuarios.atualizar(usuario.matricula, { senha: btoa(novaSenha) });
      onSucesso('Senha redefinida com sucesso');
    } catch (err) {
      setErro(err.message || 'Erro ao redefinir senha');
    }
  };

  return (
    <div className="fixed inset-0 z-[300] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white">
          <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
            <Lock size={20} /> Redefinir Senha
          </h3>
          <p className="text-orange-100 text-xs mt-1">{usuario.nome}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Nova Senha</label>
            <div className="relative">
              <input type={mostrarSenha ? 'text' : 'password'} value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none pr-12" placeholder="Mínimo 6 caracteres" />
              <button type="button" onClick={() => setMostrarSenha(!mostrarSenha)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Confirmar Senha</label>
            <input type={mostrarSenha ? 'text' : 'password'} value={confirmar} onChange={(e) => setConfirmar(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none" placeholder="Digite novamente" />
          </div>

          {erro && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-semibold">
              {erro}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-wider transition-all">
              Cancelar
            </button>
            <button type="submit" className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg transition-all">
              Redefinir Senha
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminScreen;
