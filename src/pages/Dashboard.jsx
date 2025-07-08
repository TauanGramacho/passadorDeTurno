import React from 'react';
import LocalizacaoSelector from '../components/LocalizacaoSelector';
import ObservacaoForm from '../components/ObservacaoForm';

function Dashboard() {
  return (
    <div style={{ padding: 40 }}>
      <h2>Dashboard - Passagem de Turno</h2>
      <LocalizacaoSelector />
      <hr />
      <ObservacaoForm />
    </div>
  );
}

export default Dashboard;
