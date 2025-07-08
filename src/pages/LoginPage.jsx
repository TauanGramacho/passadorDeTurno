import React from 'react';

const Login = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-indigo-800 flex items-center justify-center px-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">Bem-vindo</h2>
        <form className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Usuário"
            className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="password"
            placeholder="Senha"
            className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition duration-200"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
