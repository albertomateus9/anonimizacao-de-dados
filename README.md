# Anonimização de Dados

Apresentação educativa da turma de Ciência de Dados para a Mostra Científica da EETEPA Vilhena Alves, baseada nos slides enviados pela equipe. O projeto usa apenas HTML, CSS e JavaScript e pode ser publicado diretamente no GitHub Pages.

## Como abrir

Abra `index.html` no navegador. A apresentação funciona sem instalação ou build.

## Apresentar na mostra (monitor 1920x1080)

Em telas a partir de 1600 px de largura, cada seção vira um slide do tamanho da tela. Tecle `P` (ou o botão **Apresentar**) para entrar em tela cheia; use `←` `→` ou `PageUp` `PageDown` para trocar de slide. No modo apresentação, `↑` e `↓` também trocam de slide. O contador no canto inferior direito mostra o slide atual.

## Pitch deck

A pasta `pitch/` traz o pitch deck do projeto em versão web, publicado em `/pitch/`. Tecle `P` para tela cheia e use as setas `←` `→` (ou `PageUp` `PageDown`, espaço) para passar os slides; no celular, deslize para os lados. O botão **PDF** baixa a mesma apresentação em PDF.

## Gamificação

O visitante ganha XP e conquistas ao explorar cada slide:

- **Laboratório de grupos**: escolha o local e a idade publicados e tente chegar a k ≥ 2 preservando o máximo de detalhe.
- **Detetive**: use a pista de um jornal fictício para achar a linha certa numa tabela sem nomes; na segunda rodada, a faixa etária sai da tabela.
- **Caça aos identificadores**, **pergunta rápida da LGPD**, **painel do ECA Digital**, **jogo de ligar vazamentos a golpes** e **desafio de mascaramento**.
- **Desafio relâmpago**: oito perguntas com tempo, bônus por sequência e placar local por apelido (as teclas 1, 2 e 3 respondem).

Progresso, preferências e placar ficam só no `localStorage` do navegador usado na mostra; nada é enviado para fora. Ao final de cada visita, toque em **Novo visitante** (no último slide ou no painel de conquistas) para zerar o progresso. O som vem desligado; o botão ♪ liga os efeitos.

O layout usa margens fluidas e continua legível de 320 px a 2560 px. Sem JavaScript, as tabelas, listas e textos originais continuam visíveis.

## Escopo dos exemplos

As tabelas contêm dados fictícios. Mascaramento, generalização e adição de ruído são exemplos didáticos de transformação; aplicar uma delas não basta para concluir que uma base foi anonimizada. A possibilidade de reidentificação deve ser avaliada no contexto do tratamento e dos dados disponíveis.

O cenário sobre o ECA Digital é totalmente sintético: combina duas faixas etárias, dois setores inventados e três oficinas. Não contém dados de estudantes reais nem mede a conformidade jurídica de produtos ou serviços. O limiar de três registros é apenas uma escolha didática para visualizar a supressão de grupos pequenos, não uma exigência legal nem uma garantia de anonimização.

## Fontes

- [Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018)](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
- [ANPD: perguntas e respostas sobre o RIPD](https://www.gov.br/anpd/pt-br/canais_atendimento/agente-de-tratamento/relatorio-de-impacto-a-protecao-de-dados-pessoais-ripd)
- [Ministério da Gestão: boas práticas em anonimização](https://www.gov.br/gestao/pt-br/acesso-a-informacao/privacidade-e-protecao-de-dados/lgpd-no-mgi-1/anonimizacao)
- [ECA Digital: Lei nº 15.211/2025](https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2025/lei/l15211.htm)
- [ANPD: informações sobre o ECA Digital](https://www.gov.br/anpd/pt-br/assuntos/eca-digital)

Os textos e exemplos foram adaptados para esta apresentação.
