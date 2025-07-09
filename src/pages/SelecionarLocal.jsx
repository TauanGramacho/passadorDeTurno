import React, { useState } from 'react';
import { estruturaLocal } from '../data/localidades';

function SelecionarLocal() {
  const [superintendencia, setSuperintendencia] = useState('');
  const [regiao, setRegiao] = useState('');
  const [utd, setUtd] = useState('');

  const regioes = superintendencia ? Object.keys(estruturaLocal[superintendencia]) : [];
  const utds = superintendencia && regiao ? estruturaLocal[superintendencia][regiao] : [];

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5] p-4">
      <div className="bg-white shadow-md rounded-lg p-8 max-w-xl w-full">
        <h1 className="mb-4 text-center font-bold text-lg">Você está na página Selecionar Local</h1>

        <h2 className="text-2xl font-bold mb-6 text-center text-[#009639]">
          Selecione a Localização
        </h2>

        {/* Superintendência */}
        <div className="mb-4">
          <label className="block mb-1 font-semibold text-[#0076BF]">Superintendência</label>
          <select
            className="w-full border border-gray-300 p-2 rounded"
            value={superintendencia}
            onChange={e => {
              setSuperintendencia(e.target.value);
              setRegiao('');
              setUtd('');
            }}
          >
            <option value="">Selecione...</option>
            {Object.keys(estruturaLocal).map(sup => (
              <option key={sup} value={sup}>{sup}</option>
            ))}
          </select>
        </div>

        {/* Região */}
        {regioes.length > 0 && (
          <div className="mb-4">
            <label className="block mb-1 font-semibold text-[#0076BF]">Região</label>
            <select
              className="w-full border border-gray-300 p-2 rounded"
              value={regiao}
              onChange={e => {
                setRegiao(e.target.value);
                setUtd('');
              }}
            >
              <option value="">Selecione...</option>
              {regioes.map(reg => (
                <option key={reg} value={reg}>{reg}</option>
              ))}
            </select>
          </div>
        )}

        {/* UTD */}
        {utds.length > 0 && (
          <div className="mb-6">
            <label className="block mb-1 font-semibold text-[#0076BF]">UTD</label>
            <select
              className="w-full border border-gray-300 p-2 rounded"
              value={utd}
              onChange={e => setUtd(e.target.value)}
            >
              <option value="">Selecione...</option>
              {utds.map(utd => (
                <option key={utd} value={utd}>{utd}</option>
              ))}
            </select>
          </div>
        )}

        {utd && (
          <div className="text-center text-green-700 font-semibold">
            ✅ UTD Selecionada: {utd}
          </div>
        )}
      </div>
    </div>
  );
}

export default SelecionarLocal;
