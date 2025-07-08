import React from 'react';
import './Login.css';

const Login = () => {
  return (
    <div className="login-container">
      <form className="login-form">
        <h2>Bem-vindo</h2>
        <input type="text" placeholder="Usuário" />
        <input type="password" placeholder="Senha" />
        <button type="submit">Entrar</button>
      </form>
    </div>
  );
};

export default Login;
