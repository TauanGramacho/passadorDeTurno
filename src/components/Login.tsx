import React, { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    if (email.trim() && senha.trim()) {
      console.log('Navegando...');
      navigate('/selecionar-local');
    } else {
      alert('E-mail ou senha inválidos!');
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <br />
        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={e => setSenha(e.target.value)}
        />
        <br />
        <button type="submit">Entrar</button>
      </form>
    </div>
  );
};

export default LoginPage;
