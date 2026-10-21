# Publicação e verificação — 21/10/2026

## Endereços ativos

- Aplicação: https://fernandobalbino.github.io/TechManager/
- Repositório: https://github.com/FernandoBalbino/TechManager
- Backend independente: https://techmanager-realtime.onrender.com
- Render: workspace My Workspace (`tea-dbb4o9jncjis73dffr30`), serviço `srv-dbchq4hkjs5s73eg3a6g`, plano Free, região Virgínia.

GitHub Pages usa GitHub Actions e HTTPS obrigatório. A variável do repositório `VITE_REALTIME_URL` aponta para o backend acima. O backend permite a origem `https://fernandobalbino.github.io`, usa a porta do ambiente e não entrega os recursos do Windows.

Build e publicação de código confirmados no [run 39676635144](https://github.com/FernandoBalbino/TechManager/actions/runs/39676635144), commit `94de909551b8039ffbe5cb0d18b00d017b75404e`: ambos os jobs concluídos com sucesso, em 21/10/2026 às 21:11 UTC. As alterações posteriores a esse commit são documentação e evidências.

Backend confirmado `live` no deploy `dep-dbchq51kjs5s73eg3bf0`, commit `2da744ab5169afc79a206d10010d8b1aede51722`. Commits seguintes mudam frontend/CI/cache/documentação e usam `[skip render]`, preservando o processo do backend. Logs registram `TechManager realtime ready`; a checagem final de `/health` retornou `ok: true`.

## Validação local e CI

- 59 testes principais aprovados: motor de partidas, 50 validadores com estado inicial/solução/snapshot, isolamento e transporte com um professor e 15 alunos em loopback.
- 4 testes de empacotamento do runtime estático aprovados depois do build. Total: **63 testes** na verificação de CI.
- Relógio controlado para intervalos de 60 segundos e prazos de 5/8/12 minutos; sem esperas prolongadas nem carga no Render.
- Disputa pelo mesmo chamado com um vencedor, limites de dois chamados próprios e uma ajuda, convite e participação, pontuação, privacidade, conclusão duplicada, pausa, reconexão, encerramento e exportação/restauração.
- 50 cenários iniciados no navegador, com objetivos inicialmente pendentes: `design/boot-50.json`.
- Percursos reais de interface: instalador do Firefox, criação/movimentação de arquivos e atalhos, Anotações.txt, perfil e player da Netflix, Spotify, troca de dois PCs sem misturar estado, dupla com pontos para ambos e restauração após reiniciar o Node local.
- Revisão visual e limites: `design-qa.md`.

## Checagem pública breve

Somente um professor e dois alunos de teste, na sala descartável A1519B. Não houve teste público de carga.

1. Professor preparou os recursos e criou a sala; os dois alunos entraram pelo código.
2. Início liberou exatamente dois chamados e contador para a próxima chegada em 60 segundos.
3. Aluna assumiu o chamado 1001 e abriu o Windows/Spotify preparado localmente.
4. Convidou o segundo aluno, que aceitou e enviou mensagem privada antes da conclusão.
5. A tarefa foi executada pelo Windows; confirmação do cliente e resumo liberaram a conclusão.
6. Quadro marcou resolvido em dupla; ranking apresentou **2 pontos para cada aluno**, mesma colocação, com contadores de dupla e ajuda.
7. Pausa congelou relógio/prazo e desabilitou atribuição. Encerramento confirmado; alunos desconectados e professor voltou ao lobby. Tempo ativo da partida: aproximadamente 49 segundos.

Evidência: `design/production-board.jpg`. Console inspecionado: somente erros de uma extensão do navegador identificados pela URL `chrome-extension://`; nenhum erro da aplicação observado nesse percurso. Reentrada no lobby voltou a disponibilizar o botão após a reconexão.

## Banda observada e limites da medição

- Teste de transporte com 15 alunos: **417.607 bytes de payload recebidos**, inteiramente em loopback. Não é uma medição de tráfego faturável.
- Checagem pública: **22.052 bytes recebidos e 1.008 enviados** em frames WebSocket observados nas três abas, total **23.060 bytes de payload**. Não inclui handshake, TLS, cabeçalhos nem outros acessos. Registro em `smoke-traffic.json`, sem tokens ou mensagens.
- O pacote de preparação possui **384 recursos, 25.784.641 bytes (24,59 MiB)**, manifesto `caff641c1ef9`. Veio do GitHub Pages e ficou em cache compartilhado entre as abas do mesmo perfil. A segunda preparação reutilizou esse cache; não houve uma cópia completa adicional entregue pelo Render.
- A captura HTTP do professor começou durante a preparação e registrou somente 2.997 bytes posteriores; portanto **não é uma medição completa do download**. O tamanho do pacote é o somatório dos arquivos do manifesto, não tráfego faturado observado.
- Métricas do Render foram consultadas antes e depois. Inicialmente não havia pontos; depois apareceu apenas o bucket de 21:00 UTC, anterior ao percurso público de aproximadamente 21:19–21:21 UTC, com `0.0002670288` na unidade `mb` da API. Esse bucket **não permite medir o consumo da checagem**. Não foi tratado como total ou saldo.
- O escopo foi limitado à checagem acima e ao pacote estático de aproximadamente 25 MB, dentro do orçamento planejado de até 50 MB adicionais. Não foi possível comprovar um total faturável completo antes/depois; por isso toda validação de carga permaneceu local. Não foram executadas sessões prolongadas, monitores de keep-alive ou cargas contra o Render.
- **2 GB é teto absoluto, não meta.** Não foi confirmada a franquia mensal da conta e não se afirma controle sobre tráfego de outros serviços.

## Uso e manutenção

Abra o site, selecione **Sou professor**, informe nome e crie uma sala. Compartilhe o código; em cada Chromebook, use **Preparar** antes do início. Ajuste duração/prazos e inicie pelas opções do professor.

O Render Free pode adormecer: aguarde a conexão no primeiro acesso. Salas ficam em memória e podem desaparecer em reinícios/deploys. Exporte a sessão e use a restauração do professor quando necessário; o PC de cada aluno fica somente no navegador correspondente. Não limpe os dados do site durante a aula.

Os repositórios originais OSLab/HelpDeskSimulator e os serviços já usados nas aulas não foram alterados. A correção técnica local e o ranking têm finalidade didática, sem garantia antifraude.
