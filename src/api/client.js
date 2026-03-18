const BASE = process.env.REACT_APP_API_URL || '';

async function request(path, options = {}) {
  const { returnNullOn404, ...fetchOptions } = options;
  const url = `${BASE}${path}`;
  const res = await fetch(url, {
    ...fetchOptions,
    headers: { 'Content-Type': 'application/json', ...fetchOptions.headers }
  });
  if (res.status === 204) return null;
  if (res.status === 404 && returnNullOn404) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText || 'Erro na requisição');
  return data;
}

export const api = {
  usuarios: {
    listar: () => request('/api/usuarios'),
    porMatricula: (matricula) =>
      request(`/api/usuarios/por-matricula/${encodeURIComponent(matricula)}`, { returnNullOn404: true }),
    criar: (usuario) => request('/api/usuarios', { method: 'POST', body: JSON.stringify(usuario) }),
    atualizar: (matricula, dados) =>
      request(`/api/usuarios/por-matricula/${encodeURIComponent(matricula)}`, {
        method: 'PATCH',
        body: JSON.stringify(dados)
      }),
    excluir: (matricula) =>
      request(`/api/usuarios/por-matricula/${encodeURIComponent(matricula)}`, { method: 'DELETE' })
  },
  passagens: {
    listar: () => request('/api/passagens'),
    criar: (passagem) => request('/api/passagens', { method: 'POST', body: JSON.stringify(passagem) })
  },
  configuracoes: {
    obter: () => request('/api/configuracoes'),
    salvar: (dados) => request('/api/configuracoes', { method: 'PATCH', body: JSON.stringify(dados) })
  }
};

export default api;
