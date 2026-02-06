import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, ArrowLeft, UserPlus, MapPin } from 'lucide-react';
import { api } from '../api/client';

const POSTOS = [
'Feira de Santana',
'Serrinha',
'Alagoinhas',
'Jacobina',
'Juazeiro'
];

// ============================================================
// COMPONENTES REUTILIZÁVEIS (usados em login E cadastro)
// ============================================================

/** Campo com ícone à esquerda + label flutuante no focus */
const CampoTexto = ({
icone: Icone,
label,
placeholder,
value,
onChange,
type = 'text',
erro,
extras // slot para botão à direita (ex: olho de senha)
}) => (
<div className="group">
{label && (
<label className="text-xs font-semibold text-gray-400 uppercase ml-1 mb-2 block transition-colors group-focus-within:text-green-600">
{label}
</label>
)}
<div className="relative flex items-center">
{Icone && (
<div className="absolute left-4 text-gray-300 pointer-events-none group-focus-within:text-green-500 transition-colors">
  <Icone size={18} />
</div>
)}
<input
type={type}
value={value}
onChange={onChange}
placeholder={placeholder}
className="w-full pl-12 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 focus:bg-white outline-none transition-all placeholder:text-gray-300 text-gray-600"
/>
{extras && <div className="absolute right-4">{extras}</div>}
</div>
{erro && (
<p className="text-[10px] text-red-500 mt-1.5 ml-1 font-medium">{erro}</p>
)}
</div>
);

/** Erro / aviso centralizado (igual ao original) */
const ErroBox = ({ mensagem }) =>
mensagem ? (
<div className="bg-orange-50 text-orange-700 p-3 rounded-lg text-xs text-center font-medium border border-orange-100">
{mensagem}
</div>
) : null;

/** Cabeçalho tricolor com SVG da Neoenergia embutido */
const CabecalhoTricolor = () => (
<div className="bg-gradient-to-r from-slate-700 via-green-600 to-orange-400 p-8 text-white text-center">

{/* Círculo branco contendo folhas.png */}
<div className="w-24 h-24 bg-white rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg overflow-hidden">
<img
src="/folhas.png"
alt="folhas"
className="w-full h-full object-contain"
/>
</div>

<h1 className="text-xl font-bold tracking-tight">Neoenergia Coelba</h1>

<p className="text-white/80 text-xs font-light mt-1 uppercase tracking-widest">
Passagem de Turno
</p>
</div>
);

/** Rodapé © — idêntico ao original */
const Rodape = () => (
<div className="pt-4 text-center border-t border-gray-50">
<p className="text-[10px] text-gray-400 font-medium uppercase tracking-tighter">
© 2026 Neoenergia
</p>
</div>
);

// ============================================================
// TELA DE LOGIN (visualmente idêntica ao original)
// ============================================================
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
      setErro('Usuário não encontrado');
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
    setErro(err.message || 'Erro ao conectar. Verifique se o servidor está rodando.');
  }
};

return (
<div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-200 to-orange-50 flex items-center justify-center p-4">
<div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100">
<CabecalhoTricolor />

<form onSubmit={handleLogin} className="p-10 space-y-5">
{/* Matrícula */}
<CampoTexto
icone={User}
label="Identificação"
placeholder="Matrícula"
value={matricula}
onChange={(e) => {
  const valor = e.target.value
    .toUpperCase()                // força maiúsculo
    .normalize("NFD")             // separa acentos
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/[^A-Z0-9]/g, "");   // permite só letras e números

  setMatricula(valor);
}}
/>
  {/* Senha com olho */}
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
        className="text-gray-300 hover:text-green-500 transition-colors"
      >
        {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    }
  />

  <ErroBox mensagem={erro} />

  {/* Botão de login */}
  <button
    type="submit"
    className="w-full bg-green-600 hover:bg-green-700 text-white py-3.5 rounded-xl font-semibold text-sm shadow-md shadow-green-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
  >
    <Lock size={16} /> Entrar
  </button>

  {/* Linha divisória */}
  <div className="relative py-4">
    <div className="absolute inset-0 flex items-center">
      <div className="w-full border-t border-gray-100" />
    </div>
    <div className="relative flex justify-center text-xs">
      <span className="bg-white px-3 text-gray-400 font-semibold uppercase tracking-widest">
        Ou
      </span>
    </div>
  </div>

  {/* Botão criar conta */}
  <button
    type="button"
    onClick={onCadastrar}
    className="w-full border-2 border-slate-200 hover:border-green-500 hover:bg-green-50/50 text-slate-700 hover:text-green-700 py-3.5 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
  >
    <UserPlus size={16} /> Novo Usuário
  </button>

  <Rodape />
</form>
</div>
</div>
);
};

// ============================================================
// TELA DE CADASTRO
// ============================================================
const CadastroView = ({ onCadastroSucesso, onVoltar }) => {
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
    setErro('Preencha todos os campos obrigatórios.');
    return;
  }
  if (dados.senha.length < 6) {
    setErro('Senha deve ter pelo menos 6 caracteres.');
    return;
  }
  if (dados.senha !== dados.confirmarSenha) {
    setErro('As senhas não coincidem.');
    return;
  }
  try {
    const existente = await api.usuarios.porMatricula(dados.matricula);
    if (existente) {
      setErro('Matrícula já cadastrada. Escolha outra.');
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

// ── Tela de sucesso ──
if (sucesso) {
return (
<div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-200 to-orange-50 flex items-center justify-center p-4">
<div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100">
  <CabecalhoTricolor />
  <div className="p-10 text-center space-y-6">
    {/* Ícone de sucesso */}
    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto border-4 border-green-200">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    </div>

    <div>
      <h2 className="text-lg font-bold text-slate-800 mb-1">Cadastro Concluído!</h2>
      <p className="text-xs text-slate-500 leading-relaxed">
        Sua conta foi criada com sucesso. Você pode se autenticar agora com a matrícula{' '}
        <span className="font-black text-green-700">
          {dados.matricula.trim().toLowerCase()}
        </span>.
      </p>
    </div>

    {/* Info card */}
    <div className="bg-slate-50 rounded-xl border p-4 text-left space-y-2">
      <div className="flex justify-between text-xs">
        <span className="text-slate-400 font-semibold uppercase tracking-wider">Papel</span>
        <span className="font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Controlador</span>
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-slate-400 font-semibold uppercase tracking-wider">Posto</span>
        <span className="font-bold text-slate-700">{dados.posto}</span>
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-slate-400 font-semibold uppercase tracking-wider">Visibilidade</span>
        <span className="font-bold text-green-600">Todas as passagens</span>
      </div>
    </div>

    <p className="text-[9px] text-slate-400 leading-relaxed">
      Você pode visualizar todas as passagens de turno. Um administrador pode alterar suas permissões no Painel de Administração.
    </p>

    <button
      onClick={onVoltar}
      className="w-full bg-slate-800 hover:bg-slate-900 text-white py-3.5 rounded-xl font-semibold text-sm shadow-md shadow-slate-200 transition-all active:scale-[0.98]"
    >
      Ir para Login
    </button>

    <Rodape />
  </div>
</div>
</div>
);
}

// ── Formulário de cadastro ──
return (
<div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-200 to-orange-50 flex items-center justify-center p-4">
<div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100">
<CabecalhoTricolor />

<form onSubmit={handleCadastro} className="p-10 space-y-5">
  {/* Título + voltar */}
  <div className="flex items-center justify-between pb-3 border-b border-gray-100">
    <h2 className="text-sm font-black text-slate-700 uppercase tracking-tighter flex items-center gap-2">
      <UserPlus size={16} className="text-green-600" /> Criar Conta
    </h2>
    <button
      type="button"
      onClick={onVoltar}
      className="text-xs text-slate-400 hover:text-green-600 flex items-center gap-1 transition-colors font-semibold"
    >
      <ArrowLeft size={12} /> Voltar
    </button>
  </div>

  {/* Matrícula */}
<CampoTexto
icone={User}
label="Matrícula *"
placeholder="Ex: B000000"
value={dados.matricula}
onChange={(e) => {
const valor = e.target.value
  .toUpperCase() // força maiúsculo
  .normalize("NFD") // separa acentos
  .replace(/[\u0300-\u036f]/g, "") // remove acentos
  .replace(/[^A-Z0-9]/g, ""); // remove tudo que não for letra ou número

setDados({
  ...dados,
  matricula: valor
});
}}
/>

  {/* Nome */}
<CampoTexto
icone={User}
label="Nome Completo *"
placeholder="Ex: JOAO SILVA"
value={dados.nome}
onChange={(e) => {
const valor = e.target.value
  .toUpperCase() // força maiúsculo
  .normalize("NFD") // separa letras dos acentos
  .replace(/[\u0300-\u036f]/g, "") // remove acentos
  .replace(/[^A-Z\s]/g, ""); // remove números e caracteres especiais

setDados({
  ...dados,
  nome: valor
});
}}
/>

  {/* Senha */}
  <CampoTexto
    icone={Lock}
    label="Senha *"
    placeholder="Mínimo 6 caracteres"
    value={dados.senha}
    onChange={(e) => setDados({ ...dados, senha: e.target.value })}
    type={mostrarSenha ? 'text' : 'password'}
    extras={
      <button
        type="button"
        onClick={() => setMostrarSenha(!mostrarSenha)}
        className="text-gray-300 hover:text-green-500 transition-colors"
      >
        {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    }
  />

  {/* Confirmar senha */}
  <CampoTexto
    icone={Lock}
    label="Confirmar Senha *"
    placeholder="Repita sua senha"
    value={dados.confirmarSenha}
    onChange={(e) => setDados({ ...dados, confirmarSenha: e.target.value })}
    type={mostrarSenha ? 'text' : 'password'}
  />

  {/* Posto — select estilizado no mesmo padrão */}
  <div className="group">
    <label className="text-xs font-semibold text-gray-400 uppercase ml-1 mb-2 block transition-colors group-focus-within:text-green-600">
      Posto Operacional *
    </label>
    <div className="relative flex items-center">
      <div className="absolute left-4 text-gray-300 pointer-events-none group-focus-within:text-green-500 transition-colors">
        <MapPin size={18} />
      </div>
      <select
        value={dados.posto}
        onChange={(e) => setDados({ ...dados, posto: e.target.value })}
        className="w-full pl-12 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 focus:bg-white outline-none transition-all text-gray-600 appearance-none cursor-pointer"
      >
        <option value="" disabled>Selecione seu posto...</option>
        {POSTOS.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>
    </div>
  </div>

  <ErroBox mensagem={erro} />

  <button
    type="submit"
    className="w-full bg-green-600 hover:bg-green-700 text-white py-3.5 rounded-xl font-semibold text-sm shadow-md shadow-green-200 transition-all active:scale-[0.98] mt-2 flex items-center justify-center gap-2"
  >
    <UserPlus size={16} /> Criar Minha Conta
  </button>

  {/* Info discreta sobre papel padrão */}
  <p className="text-[9px] text-center text-slate-400 leading-relaxed">
    Contas criadas aqui são do tipo <span className="font-black text-blue-500">Controlador</span> com acesso a <span className="font-black text-green-600">todas as passagens</span>.
    Para obter acesso como Administrador, solicite ao responsável pelo sistema.
  </p>

  <Rodape />
</form>
</div>
</div>
);
};

// ============================================================
// EXPORT — componente raiz que rota entre Login e Cadastro
// Recebe { onLogin } exatamente como o original
// ============================================================
const LoginScreen = ({ onLogin }) => {
const [tela, setTela] = useState('login'); // 'login' | 'cadastro'

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