# Verificação visual — TechManager

final result: passed

## Evidências e normalização

- Referência visual aprovada: `design/approved.png`, 1486 × 1058 pixels.
- Implementação final: `design/board-1366-final.jpg`; navegador com viewport CSS 1366 × 768, deviceScaleFactor 1. A superfície de captura do navegador entrega 1280 × 720 pixels, usando escala 1280/1366 para mostrar toda a largura.
- Comparação conjunta final: `design/comparison-final.png`, 2560 × 752. Referência reduzida proporcionalmente para 1280 pixels de largura e recortada nos primeiros 720 pixels de altura; implementação completa de 1280 × 720 ao lado. As etiquetas ocupam 32 pixels acima das imagens.
- Comparação ampliada dos cartões: `design/comparison-focused.png`, 1800 × 700. Recortes correspondentes foram colocados juntos e ampliados na mesma escala para conferir fonte, espaçamento, cores e controles.
- Estado comparado: quadro claro de aluno, com chamados novos, em atendimento e resolvidos, ranking, indicador de dois atendimentos e cabeçalho de três métricas. Clientes, nomes, quantidades, tempos e pontos são dados reais de uma sessão local e diferem dos exemplos do mockup. Não se trata de uma comparação pixel a pixel de conteúdo idêntico.
- Produção confirmada separadamente em `design/production-board.jpg`, 1280 × 720: dois alunos, um chamado resolvido em dupla e pausa sincronizada.

## Histórico de correções

1. Comparação inicial em `design/comparison-before.png`, apoiada em `design/board-1366-before.jpg`: resultado bloqueado por P2 de legibilidade. Títulos, descrições e badges dos cartões estavam pequenos em relação à hierarquia da referência, e os contadores do ranking estavam comprimidos. Foram ajustados títulos para 15 px, descrições para 13 px, badges para 11 px, nomes do ranking para 13 px, contadores para 10 px e regra de pontuação para 14 px.
2. A mesma revisão identificou P2 de contraste no botão coral e nos metadados. O botão passou de `#ff5359` para `#d93444` (contraste de texto branco aproximadamente 4,64:1); os cinzas de texto, badges vermelhos e rodapés foram escurecidos. Hover coral `#c5283a`.
3. Nova captura no mesmo viewport e estado funcional: `design/board-1366-final.jpg`. Comparações conjunta e ampliada foram regeneradas após os ajustes e abertas para inspeção. Títulos e textos se distinguem; badges permanecem legíveis; controles persistentes não ficam fora da tela. Nenhum P0/P1/P2 visual pendente foi identificado nesse escopo.

## Superfícies conferidas

| Superfície | Resultado observado |
|---|---|
| Fontes e tipografia | Inter local, pesos 400/500/600/700, títulos escuros, hierarquia coerente e descrições com quebra controlada. Conteúdo de cartões mais longo pode ser truncado no quadro e é apresentado no atendimento. A captura reduzida não serve para avaliar antialiasing em escala nativa. |
| Espaçamento e composição | Navegação lateral, três colunas e ranking à direita preservados. Cabeçalho contém somente online, tempo restante e próximo chamado. Proporções ajustadas ao Chromebook, sem rolagem horizontal ou ocultação dos controles em 1366 × 768. Colunas e ranking rolam internamente quando necessário. |
| Cores e tokens | Azul `#0668ff`, coral acessível, superfícies claras e semântica azul/coral/verde das colunas. Badges separam dificuldade e prioridade; status também usa texto e ícone. |
| Imagens e ícones | Retratos locais do HelpDeskSimulator e ícones Phosphor; não foram usados avatares de iniciais ou desenhos CSS como substitutos. As fotografias são uma adaptação intencional à biblioteca existente, enquanto o mock usa personagens ilustrados. Desktop e ícones originais do OSLab preservados. |
| Texto e conteúdo | Rótulos da navegação, colunas, ranking e ações seguem o conceito aprovado. Código restrito a lobby/opções do professor; sem nome ou marca no topo do quadro. Não há instruções internas de implementação no fluxo de atendimento. |

## Interações e estados verificados

- Criação, configuração, início, pausa, retomada e encerramento pelo professor; entrada de alunos sem conta externa.
- Assumir, continuar, alternar dois PCs, recolher chat, conversar com cliente, confirmação e conclusão com resumo.
- Convite, aceite e mensagem de ajuda; ranking individual e em dupla; empates compartilham colocação.
- Instalação de Firefox, arquivos e editor de texto, Netflix, Spotify e restauração de sessão pela interface.
- Desktop, ferramentas e janelas do OSLab; ausência de atividades, trilhas e mascote no ambiente do atendimento.
- Carregamento/preparação, vazio, pausa, expirados no Histórico, fim e reconexão.
- Console da checagem pública: registros de erro identificados pertenciam a uma extensão `chrome-extension://`; nenhum erro da aplicação foi observado no percurso testado.

## Limites e polimento posterior

- A referência possui altura maior que a tela de Chromebook: compara-se sua região superior normalizada e a adaptação funcional para 1366 × 768, sem alegar reprodução literal em todos os tamanhos.
- P3 opcional: produzir uma coleção de avatares ilustrados uniforme, se o professor preferir substituir as fotografias herdadas. Não impede o uso em aula.
- Não foi realizada auditoria completa de acessibilidade, leitores de tela ou dispositivos móveis. A aprovação visual cobre o desktop solicitado e os percursos registrados.

## Checklist concluído

- [x] Abrir referência e captura juntas, com comparação ampliada.
- [x] Corrigir P2 de tipografia, densidade e contraste.
- [x] Recapturar e comparar após as correções.
- [x] Verificar o quadro e o Windows em 1366 × 768.
- [x] Confirmar o fluxo principal no site publicado.
