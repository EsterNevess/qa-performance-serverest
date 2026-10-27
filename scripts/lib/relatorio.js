// Geração dos relatórios ao fim da execução.
//
// O k6 chama `handleSummary` quando o teste termina e entrega os dados
// agregados. O que se devolve é um objeto {caminho: conteúdo}, e o k6 grava
// cada arquivo. É assim que se produz saída em mais de um formato numa
// execução só, sem rodar o teste duas vezes.

import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';

export function gerarRelatorios(dados, nomeDoCenario) {
  return {
    // Continua imprimindo o resumo no terminal, para quem roda local.
    stdout: textSummary(dados, { indent: ' ', enableColors: true }),

    // Relatório visual, com gráficos e os limites de aceitação.
    [`relatorios/${nomeDoCenario}.html`]: htmlReport(dados),

    // Dados crus, para comparar execuções ao longo do tempo ou alimentar
    // outra ferramenta. Relatório bonito não substitui o dado.
    [`relatorios/${nomeDoCenario}.json`]: JSON.stringify(dados, null, 2),
  };
}
