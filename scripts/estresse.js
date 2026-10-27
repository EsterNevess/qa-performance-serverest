// Teste de estresse: sobe a carga além do esperado para encontrar o ponto
// de ruptura. Aqui falhar faz parte — o objetivo é descobrir ONDE quebra,
// com qual erro e se o sistema se recupera quando a carga cai.
//
// Por isso os limites são mais frouxos que os do teste de carga: aplicar o
// mesmo contrato faria o teste falhar por definição, sem informar nada.

import { sleep } from 'k6';

import { criarUsuario, logar, listarProdutos, detalharProduto } from './lib/api.js';

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '30s', target: 50 },
    { duration: '30s', target: 100 },
    { duration: '30s', target: 0 }, // janela de recuperação
  ],
  thresholds: {
    // Mais tolerante de propósito: queremos o diagnóstico, não o veredito.
    http_req_failed: ['rate<0.15'],
    http_req_duration: ['p(95)<5000'],
  },
};

export function setup() {
  return criarUsuario(`estresse_${Date.now()}`);
}

export default function (credenciais) {
  logar(credenciais);

  const produtos = listarProdutos();
  if (produtos.length > 0) {
    const sorteado = produtos[Math.floor(Math.random() * produtos.length)];
    detalharProduto(sorteado._id);
  }

  sleep(1);
}
