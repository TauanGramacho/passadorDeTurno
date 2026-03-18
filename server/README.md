# Backend - Sistema Passagem de Turno (PostgreSQL)

## Pré-requisitos

- Node.js 18+
- PostgreSQL 14+

## Configuração

1. Crie um banco no PostgreSQL, por exemplo:
   ```bash
   createdb sistema_turno
   ```

2. Copie o arquivo de ambiente:
   ```bash
   cp .env.example .env
   ```

3. Edite `.env` com a URL do banco:
   ```
   PORT=3001
   DATABASE_URL=postgresql://usuario:senha@localhost:5432/sistema_turno
   ```

4. Instale as dependências e inicialize as tabelas:
   ```bash
   npm install
   npm run init-db
   ```

5. Inicie o servidor:
   ```bash
   npm start
   ```

O servidor sobe em `http://localhost:3001`. O frontend (React) usa proxy para essa porta em desenvolvimento.

## Endpoints

- `GET/POST /api/usuarios` – listar / criar usuário
- `GET/PATCH/DELETE /api/usuarios/por-matricula/:matricula`
- `GET/POST /api/passagens` – listar / criar passagem
- `GET/PATCH /api/configuracoes` – obter / atualizar configurações
