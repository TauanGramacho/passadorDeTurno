import React, { useState } from 'react';
import LoginScreen from './components/LoginScreen.jsx';
import { PassagemTurnoApp } from './components/PassagemTurnoForm.jsx';
import { createContext } from 'react';

// Context de autenticação (já existe no PassagemTurnoForm, mas precisamos replicar aqui)
const AuthContext = createContext(null);

const App = () => {
  const [usuarioLogado, setUsuarioLogado] = useState(null);

  const handleLogin = (usuario) => {
    console.log('=== LOGIN REALIZADO ===');
    console.log('Usuário recebido do LoginScreen:', usuario);
    console.log('Nome:', usuario.nome);
    console.log('Matrícula:', usuario.matricula);
    console.log('Papel:', usuario.papel);
    console.log('======================');
    setUsuarioLogado(usuario);
  };

  const handleLogout = () => {
    console.log('=== LOGOUT ===');
    setUsuarioLogado(null);
  };

  // Se não há usuário logado, mostra tela de login
  if (!usuarioLogado) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  // Se há usuário logado, mostra o sistema
  return (
    <AuthContext.Provider value={{ usuario: usuarioLogado }}>
      <PassagemTurnoApp 
        usuario={usuarioLogado} 
        onLogout={handleLogout} 
      />
    </AuthContext.Provider>
  );
};

export default App;
