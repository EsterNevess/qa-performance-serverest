// Teste de fumaça: 1 usuário virtual, poucas iterações.
// Não mede desempenho — responde "o ambiente está de pé e o fluxo funciona?".
// É o que roda no CI a cada push: rápido, barato e detecta quebra de contrato.

import { sleep } from 'k6';

import { LIMITES } from './lib/config.js';
import { gerarRelatorios } from './lib/relatorio.js';
import { criarUsuario, logar, listarProdutos, detalharProduto } from './lib/api.js';

export const options = {
  vus: 1,
  iterations: 5,
  thresholds: LIMITES,
};

export function setup() {
  // Cria o usuário uma única vez e repassa as credenciais para as iterações.
  return criarUsuario(`smoke_${Date.now()}`);
}

export default function (credenciais) {
  logar(credenciais);

  const produtos = listarProdutos();
  if (produtos.length > 0) {
    detalharProduto(produtos[0]._id);
  }

  sleep(1);
}

export function handleSummary(dados) {
  return gerarRelatorios(dados, 'smoke');
}
