import React from 'react';

const Login = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0090D1] to-[#34B233] flex items-center justify-center px-4">
      <div className="bg-white py-4 px-6 rounded-2xl shadow-lg w-full max-w-md">
        <a href="https://logospng.org" target="_blank" rel="noopener noreferrer">
          <img
            src='/assets/neoenergia.png'
            alt="Logo Neoenergia"
            className="h-29 mx-auto object-contain"
          />
        </a>
        <h2 className="text-xl font-semibold text-center text-[#00743F] mb-6">
          SPT - Sistema de Passagem de Turno
        </h2>
        <form className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Usuário"
            className="p-3 border border-[#0090D1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00743F]"
          />
          <input
            type="password"
            placeholder="Senha"
            className="p-3 border border-[#0090D1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00743F]"
          />
          <button
            type="submit"
            className="bg-[#FF7F00] text-white py-3 rounded-lg hover:bg-[#e67300] transition duration-200"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
