// Configuração compartilhada pelos cenários.
// A URL base vem de variável de ambiente para o mesmo script rodar
// local, em CI e, se um dia for autorizado, em um ambiente de homologação.

export const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Limites de aceitação. São o contrato do teste: se o sistema não cumprir,
// o k6 encerra com código diferente de zero e o CI falha.
export const LIMITES = {
  http_req_failed: ['rate<0.01'], // menos de 1% de requisições com erro
  http_req_duration: ['p(95)<800'], // 95% das respostas abaixo de 800 ms
  checks: ['rate>0.99'], // mais de 99% das verificações aprovadas
};

export const CABECALHO_JSON = { 'Content-Type': 'application/json' };
