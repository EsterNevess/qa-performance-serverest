// Teste de carga: simula o uso esperado em um dia normal.
// A pergunta aqui é "o sistema atende o volume previsto dentro do limite
// de tempo acordado?" — não é descobrir onde ele quebra (isso é o estresse).

import { sleep } from 'k6';

import { LIMITES } from './lib/config.js';
import { gerarRelatorios } from './lib/relatorio.js';
import { criarUsuario, logar, listarProdutos, detalharProduto } from './lib/api.js';

export const options = {
  stages: [
    { duration: '30s', target: 10 }, // sobe gradualmente até 10 usuários
    { duration: '1m', target: 10 },  // mantém o patamar (é aqui que se mede)
    { duration: '30s', target: 0 },  // desce e observa a recuperação
  ],
  thresholds: LIMITES,
};

export function setup() {
  return criarUsuario(`carga_${Date.now()}`);
}

export default function (credenciais) {
  logar(credenciais);

  const produtos = listarProdutos();
  if (produtos.length > 0) {
    // Escolhe um produto aleatório: sempre pedir o mesmo id favorece cache
    // e maquia o resultado.
    const sorteado = produtos[Math.floor(Math.random() * produtos.length)];
    detalharProduto(sorteado._id);
  }

  // Pausa entre as ações. Usuário real não dispara requisições em sequência
  // sem respirar; sem isso, o teste mede um cenário que não existe.
  sleep(Math.random() * 2 + 1);
}

export function handleSummary(dados) {
  return gerarRelatorios(dados, 'carga');
}
