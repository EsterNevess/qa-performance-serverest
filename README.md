# Testes de performance com k6 — ServeRest

[![Teste de fumaça (k6)](https://github.com/EsterNevess/qa-performance-serverest/actions/workflows/ci.yml/badge.svg)](https://github.com/EsterNevess/qa-performance-serverest/actions/workflows/ci.yml)

Testes de carga, fumaça e estresse sobre a API REST do
[ServeRest](https://github.com/ServeRest/ServeRest), com limites de aceitação explícitos e
execução automática no CI.

Complementa os meus projetos de
[automação funcional](https://github.com/EsterNevess/qa-automation-serverest) e
[BDD](https://github.com/EsterNevess/qa-bdd-saucedemo): lá a pergunta é *"está correto?"*;
aqui é *"aguenta, e em quanto tempo responde?"*.

## Uma decisão antes de qualquer código

**Os testes rodam contra uma instância local do ServeRest, nunca contra `serverest.dev`.**

Disparar carga contra um serviço público de terceiros — mesmo gratuito, mesmo feito para estudo —
consome recurso de quem mantém e atrapalha outras pessoas. Um teste de estresse de 100 usuários
simultâneos num ambiente alheio não é teste: é abuso.

Subir o ServeRest localmente custa um comando e torna o resultado reproduzível, porque o ambiente
passa a ser conhecido. Essa é a razão de a URL base vir de variável de ambiente.

## Os três cenários

| Script | Pergunta que responde | Perfil de carga |
|---|---|---|
| `smoke.js` | o ambiente está de pé e o fluxo funciona? | 1 usuário, 5 iterações |
| `carga.js` | atende o volume esperado dentro do tempo acordado? | sobe a 10 usuários, mantém 1 min, desce |
| `estresse.js` | onde quebra, com qual erro, e se recupera? | 20 → 50 → 100 usuários |

Os três exercitam o mesmo fluxo de usuário: **login → listar produtos → abrir um produto**.

Os limites do estresse são propositalmente mais frouxos que os da carga. Aplicar o mesmo contrato
faria o teste falhar por definição, sem informar nada — no estresse, falhar faz parte.

## Resultados medidos

Ambiente: ServeRest 3.2.2 local, Windows 11, execução de 28/10/2026.

| | Carga (10 VUs) | Estresse (até 100 VUs) |
|---|---|---|
| Requisições | 1.339 | 14.902 |
| Vazão | 11,1 req/s | 123,4 req/s |
| Falhas | **0,00%** | **0,00%** |
| Tempo mediano | 3,43 ms | 5,12 ms |
| p(95) | 6,11 ms | 36,47 ms |
| Pior caso | 444 ms | 276 ms |

### O que esses números não contam

**Não encontrei o ponto de ruptura.** Com 100 usuários simultâneos a API local não apresentou uma
única falha, e o p(95) subiu de 6 ms para 36 ms — crescimento esperado, longe do limite de 5 s.

Isso não significa "a aplicação aguenta tudo". Significa que **o teste não chegou ao limite dela**, e
há uma explicação provável: num teste local, o gerador de carga e a aplicação dividem a mesma
máquina. A partir de certo ponto, quem satura primeiro é o próprio k6, não a API.

Para achar o ponto de ruptura de verdade seria preciso gerar carga de outra máquina, e monitorar CPU,
memória e banco do lado do servidor — métricas que o k6 não enxerga. É a limitação honesta deste
resultado, e seria o próximo passo.

## Métricas próprias

Além das métricas padrão do k6, cada operação tem a sua:

- `tempo_login`
- `tempo_listar_produtos`
- `tempo_detalhe_produto`

Sem isso, tudo fica somado em `http_req_duration` e um endpoint lento se esconde atrás da média dos
rápidos. No teste de estresse, por exemplo, dá para ver que a listagem foi a operação que mais
sofreu com o aumento de carga — p(95) de 46 ms, contra 34 ms do detalhe.

## Limites de aceitação

```js
http_req_failed:   ['rate<0.01']   // menos de 1% de erro
http_req_duration: ['p(95)<800']   // 95% das respostas abaixo de 800 ms
checks:            ['rate>0.99']   // mais de 99% das verificações aprovadas
```

Não são números decorativos: quando um limite é estourado, o k6 encerra com código diferente de zero
e o CI falha. É o que transforma o teste de performance em porta de qualidade, e não em relatório
que ninguém lê.

Usei p(95) e não média de propósito. Média esconde o usuário que esperou dez segundos; percentil, não.

## Como rodar

**1. Suba o ServeRest local**

```bash
npm install -g serverest
serverest --port 3000 --nodoc
```

**2. Em outro terminal, rode o cenário**

```bash
k6 run scripts/smoke.js
k6 run scripts/carga.js
k6 run scripts/estresse.js
```

Para apontar para outro ambiente:

```bash
k6 run scripts/carga.js -e BASE_URL=http://meu-ambiente:3000
```

## Estrutura

```
scripts/
  lib/config.js   URL base e limites de aceitação
  lib/api.js      chamadas à API e métricas próprias
  smoke.js        fumaça
  carga.js        carga
  estresse.js     estresse
.github/          sobe o ServeRest e roda a fumaça a cada push
```

O `lib/api.js` cumpre o mesmo papel do Page Object na automação de interface: concentra as chamadas
num lugar só, para que mudança de rota não se espalhe pelos cenários.

No CI roda apenas a **fumaça**. Carga e estresse levam dois minutos cada e competem por CPU com o
runner — o resultado sairia distorcido e a porta de qualidade ficaria pior, não melhor.
