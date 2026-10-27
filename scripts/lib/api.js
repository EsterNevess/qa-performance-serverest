// Funções que falam com a API do ServeRest.
// Concentrar as chamadas aqui é o mesmo princípio do Page Object:
// se a rota mudar, muda em um lugar só.

import http from 'k6/http';
import { check } from 'k6';
import { Trend } from 'k6/metrics';

import { BASE_URL, CABECALHO_JSON } from './config.js';

// Métricas próprias: separam o tempo de cada operação em vez de
// deixar tudo somado em http_req_duration.
export const tempoLogin = new Trend('tempo_login', true);
export const tempoListarProdutos = new Trend('tempo_listar_produtos', true);
export const tempoDetalheProduto = new Trend('tempo_detalhe_produto', true);

export function criarUsuario(sufixo) {
  const corpo = {
    nome: `Usuario Carga ${sufixo}`,
    email: `carga_${sufixo}@qa.com`,
    password: 'teste123',
    administrador: 'true',
  };
  const resposta = http.post(`${BASE_URL}/usuarios`, JSON.stringify(corpo), {
    headers: CABECALHO_JSON,
    tags: { nome: 'POST /usuarios' },
  });
  check(resposta, {
    'usuário criado (201)': (r) => r.status === 201,
  });
  return corpo;
}

export function logar(credenciais) {
  const corpo = {
    email: credenciais.email,
    password: credenciais.password,
  };
  const resposta = http.post(`${BASE_URL}/login`, JSON.stringify(corpo), {
    headers: CABECALHO_JSON,
    tags: { nome: 'POST /login' },
  });
  tempoLogin.add(resposta.timings.duration);
  check(resposta, {
    'login retorna 200': (r) => r.status === 200,
    'login devolve token': (r) => !!r.json('authorization'),
  });
  return resposta.json('authorization');
}

export function listarProdutos() {
  const resposta = http.get(`${BASE_URL}/produtos`, {
    tags: { nome: 'GET /produtos' },
  });
  tempoListarProdutos.add(resposta.timings.duration);
  check(resposta, {
    'listagem retorna 200': (r) => r.status === 200,
    'listagem traz o campo quantidade': (r) => r.json('quantidade') !== undefined,
  });
  return resposta.json('produtos') || [];
}

export function detalharProduto(id) {
  const resposta = http.get(`${BASE_URL}/produtos/${id}`, {
    tags: { nome: 'GET /produtos/{id}' },
  });
  tempoDetalheProduto.add(resposta.timings.duration);
  check(resposta, {
    'detalhe retorna 200': (r) => r.status === 200,
    'detalhe traz o nome do produto': (r) => !!r.json('nome'),
  });
  return resposta;
}
