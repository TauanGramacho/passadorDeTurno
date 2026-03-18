import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, ArrowLeft, UserPlus, MapPin } from 'lucide-react';
import { api } from '../api/client';
import { BRAND, POSTOS_OPERACIONAIS } from '../constants';
import BrandLogo from './BrandLogo';

const CampoTexto = ({
  icone: Icone,
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  erro,
  extras
}) => (
  <div className="group">
    {label && (
      <label className="text-xs font-semibold text-stone-400 uppercase ml-1 mb-2 block transition-colors group-focus-within:text-amber-600">
        {label}
      </label>
    )}
    <div className="relative flex items-center">
      {Icone && (
        <div className="absolute left-4 text-stone-300 pointer-events-none group-focus-within:text-amber-500 transition-colors">
          <Icone size={18} />
        </div>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full pl-12 pr-4 py-3 bg-stone-50/80 border border-stone-200 rounded-xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 focus:bg-white outline-none transition-all placeholder:text-stone-300 text-stone-700"
      />
      {extras && <div className="absolute right-4">{extras}</div>}
    </div>
    {erro && (
      <p className="text-[10px] text-red-500 mt-1.5 ml-1 font-medium">{erro}</p>
    )}
  </div>
);

const ErroBox = ({ mensagem }) =>
  mensagem ? (
    <div className="bg-amber-50 text-amber-800 p-3 rounded-lg text-xs text-center font-medium border border-amber-200">
      {mensagem}
    </div>
  ) : null;

const CabecalhoAtlas = () => (
  <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-stone-800 to-amber-700 p-7 text-white text-center">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.14),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(255,255,255,0.10),_transparent_26%)]" />
    <div className="relative flex flex-col items-center gap-4">
      <div className="rounded-[1.7rem] border border-white/10 bg-white/10 px-4 py-3 shadow-xl backdrop-blur-sm">
        <BrandLogo tone="dark" size="md" showWordmark={false} />
      </div>

      <div>
        <h1 className="text-xl font-bold tracking-tight">{BRAND.companyName}</h1>
        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.34em] text-amber-100/85">
          {BRAND.pageTitle}
        </p>
      </div>

      <p className="max-w-xs text-[10px] leading-relaxed text-stone-200/76">
        Registros de turno, hubs e areas operacionais em um fluxo mais claro e profissional.
      </p>
    </div>
  </div>
);

const Rodape = () => (
  <div className="pt-4 text-center border-t border-stone-100">
    <p className="text-[10px] text-stone-400 font-medium uppercase tracking-tighter">
      @ 2026 {BRAND.appName}
    </p>
  </div>
);

const LoginView = ({ onLogin, onCadastrar }) => {
  const [matricula, setMatricula] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro('');
    try {
      const usuario = await api.usuarios.porMatricula(matricula);
      if (!usuario) {
        setErro('Usuario nao encontrado');
        return;
      }
      if (!usuario.ativo) {
        setErro('Conta desativada. Contate o administrador.');
        return;
      }
      try {
        if (atob(usuario.senha) !== senha) {
          setErro('Senha incorreta');
          return;
        }
      } catch {
        setErro('Senha incorreta');
        return;
      }
      await api.usuarios.atualizar(matricula, { ultimoLogin: new Date().toISOString() });
      onLogin({ ...usuario, ultimoLogin: new Date().toISOString() });
    } catch (err) {
      setErro(err.message || 'Erro ao conectar. Verifique se o servidor esta rodando.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-100 via-white to-amber-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md overflow-hidden rounded-[1.75rem] border border-stone-200 bg-white shadow-xl shadow-stone-300/40">
        <CabecalhoAtlas />

        <form onSubmit={handleLogin} className="p-10 space-y-5">
          <CampoTexto
            icone={User}
            label="Identificacao"
            placeholder="Matricula"
            value={matricula}
            onChange={(e) => {
              const valor = e.target.value
                .toUpperCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^A-Z0-9]/g, '');

              setMatricula(valor);
            }}
          />

          <CampoTexto
            icone={Lock}
            placeholder="Insira sua senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            type={mostrarSenha ? 'text' : 'password'}
            extras={
              <button
                type="button"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                className="text-stone-300 hover:text-amber-500 transition-colors"
              >
                {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
          />

          <ErroBox mensagem={erro} />

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 py-3.5 text-sm font-semibold text-white shadow-md shadow-slate-300 transition-all active:scale-[0.98] hover:bg-stone-900"
          >
            <Lock size={16} /> Entrar
          </button>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-100" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-stone-400 font-semibold uppercase tracking-widest">
                Ou
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onCadastrar}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-stone-200 py-3.5 text-sm font-semibold text-stone-700 transition-all active:scale-[0.98] hover:border-amber-500 hover:bg-amber-50/70 hover:text-amber-700"
          >
            <UserPlus size={16} /> Novo Usuario
          </button>

          <Rodape />
        </form>
      </div>
    </div>
  );
};

const CadastroView = ({ onVoltar }) => {
  const [dados, setDados] = useState({
    matricula: '',
    nome: '',
    senha: '',
    confirmarSenha: '',
    posto: ''
  });
  const [erro, setErro] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  const handleCadastro = async (e) => {
    e.preventDefault();
    setErro('');
    if (!dados.matricula.trim() || !dados.nome.trim() || !dados.senha || !dados.confirmarSenha || !dados.posto) {
      setErro('Preencha todos os campos obrigatorios.');
      return;
    }
    if (dados.senha.length < 6) {
      setErro('Senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (dados.senha !== dados.confirmarSenha) {
      setErro('As senhas nao coincidem.');
      return;
    }

    try {
      const existente = await api.usuarios.porMatricula(dados.matricula);
      if (existente) {
        setErro('Matricula ja cadastrada. Escolha outra.');
        return;
      }
      const novoUsuario = {
        id: `usr_${Date.now()}`,
        matricula: dados.matricula.trim().toLowerCase(),
        senha: btoa(dados.senha),
        nome: dados.nome.trim(),
        papel: 'controlador',
        ativo: true,
        posto: dados.posto,
        visibilidade: 'global',
        criadoEm: new Date().toISOString(),
        ultimoLogin: null
      };
      await api.usuarios.criar(novoUsuario);
      setSucesso(true);
    } catch (err) {
      setErro(err.message || 'Erro ao cadastrar. Tente novamente.');
    }
  };

  if (sucesso) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-100 via-white to-amber-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md overflow-hidden rounded-[1.75rem] border border-stone-200 bg-white shadow-xl shadow-stone-300/40">
          <CabecalhoAtlas />
          <div className="p-10 text-center space-y-6">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-4 border-amber-200 bg-amber-50">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-800 mb-1">Cadastro Concluido!</h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Sua conta foi criada com sucesso. Voce pode se autenticar agora com a matricula{' '}
                <span className="font-black text-amber-700">
                  {dados.matricula.trim().toLowerCase()}
                </span>.
              </p>
            </div>

            <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 text-left space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-semibold uppercase tracking-wider">Papel</span>
                <span className="rounded-full bg-slate-900 px-2 py-0.5 font-black text-amber-300">Controlador</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-semibold uppercase tracking-wider">Hub</span>
                <span className="font-bold text-slate-700">{dados.posto}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-semibold uppercase tracking-wider">Visibilidade</span>
                <span className="font-bold text-amber-700">Todos os registros</span>
              </div>
            </div>

            <p className="text-[9px] text-slate-400 leading-relaxed">
              Voce pode visualizar todas as passagens de turno. Um administrador pode alterar suas permissoes no painel de administracao.
            </p>

            <button
              onClick={onVoltar}
              className="w-full rounded-xl bg-slate-950 py-3.5 text-sm font-semibold text-white shadow-md shadow-slate-300 transition-all active:scale-[0.98] hover:bg-stone-900"
            >
              Ir para Login
            </button>

            <Rodape />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-100 via-white to-amber-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md overflow-hidden rounded-[1.75rem] border border-stone-200 bg-white shadow-xl shadow-stone-300/40">
        <CabecalhoAtlas />

        <form onSubmit={handleCadastro} className="p-10 space-y-5">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h2 className="text-sm font-black text-slate-700 uppercase tracking-tighter flex items-center gap-2">
              <UserPlus size={16} className="text-amber-600" /> Criar Conta
            </h2>
            <button
              type="button"
              onClick={onVoltar}
              className="flex items-center gap-1 text-xs font-semibold text-slate-400 transition-colors hover:text-amber-600"
            >
              <ArrowLeft size={12} /> Voltar
            </button>
          </div>

          <CampoTexto
            icone={User}
            label="Matricula *"
            placeholder="Ex: OP1001"
            value={dados.matricula}
            onChange={(e) => {
              const valor = e.target.value
                .toUpperCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^A-Z0-9]/g, '');

              setDados({
                ...dados,
                matricula: valor
              });
            }}
          />

          <CampoTexto
            icone={User}
            label="Nome Completo *"
            placeholder="Ex: ANA COSTA"
            value={dados.nome}
            onChange={(e) => {
              const valor = e.target.value
                .toUpperCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^A-Z\s]/g, '');

              setDados({
                ...dados,
                nome: valor
              });
            }}
          />

          <CampoTexto
            icone={Lock}
            label="Senha *"
            placeholder="Minimo 6 caracteres"
            value={dados.senha}
            onChange={(e) => setDados({ ...dados, senha: e.target.value })}
            type={mostrarSenha ? 'text' : 'password'}
            extras={
              <button
                type="button"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                className="text-stone-300 hover:text-amber-500 transition-colors"
              >
                {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
          />

          <CampoTexto
            icone={Lock}
            label="Confirmar Senha *"
            placeholder="Repita sua senha"
            value={dados.confirmarSenha}
            onChange={(e) => setDados({ ...dados, confirmarSenha: e.target.value })}
            type={mostrarSenha ? 'text' : 'password'}
          />

          <div className="group">
            <label className="text-xs font-semibold text-stone-400 uppercase ml-1 mb-2 block transition-colors group-focus-within:text-amber-600">
              Hub Logistico *
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-4 text-stone-300 pointer-events-none group-focus-within:text-amber-500 transition-colors">
                <MapPin size={18} />
              </div>
              <select
                value={dados.posto}
                onChange={(e) => setDados({ ...dados, posto: e.target.value })}
                className="w-full appearance-none cursor-pointer rounded-xl border border-stone-200 bg-stone-50/80 py-3 pl-12 pr-4 text-stone-700 transition-all outline-none focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10"
              >
                <option value="" disabled>Selecione seu hub...</option>
                {POSTOS_OPERACIONAIS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <ErroBox mensagem={erro} />

          <button
            type="submit"
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 py-3.5 text-sm font-semibold text-white shadow-md shadow-slate-300 transition-all active:scale-[0.98] hover:bg-stone-900"
          >
            <UserPlus size={16} /> Criar Minha Conta
          </button>

          <p className="text-[9px] text-center text-slate-400 leading-relaxed">
            Contas criadas aqui sao do tipo <span className="font-black text-slate-700">Controlador</span> com acesso a <span className="font-black text-amber-700">todos os registros</span>.
            Para obter acesso como administrador, solicite ao responsavel pelo sistema.
          </p>

          <Rodape />
        </form>
      </div>
    </div>
  );
};

const LoginScreen = ({ onLogin }) => {
  const [tela, setTela] = useState('login');

  if (tela === 'cadastro') {
    return (
      <CadastroView
        onCadastroSucesso={() => setTela('login')}
        onVoltar={() => setTela('login')}
      />
    );
  }

  return (
    <LoginView
      onLogin={onLogin}
      onCadastrar={() => setTela('cadastro')}
    />
  );
};

export default LoginScreen;
