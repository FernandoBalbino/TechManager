(function techManagerCases(global) {
  'use strict';
  const O = global.OSLab, fs = O.fileSystem;
  // These credentials belong only to fictional, in-browser training accounts.
  const credentials = { salt: '746563686d616e616765722d64656d6f21', hash: 'a4b1e7e14c7a4626f871c6eabe5a77e30be637d2fcc26203ebe4d7bb82970895', algorithm: 'PBKDF2-SHA256', iterations: 120000 };
  function digital(id) {
    const state = { version: 1, accounts: {}, sessions: {}, messages: {}, codes: {}, drafts: {}, browsers: {}, progress: { completed: {}, active: null }, serial: 0 };
    for (const service of ['google', 'outlook', 'yahoo', 'netflix', 'spotify', 'discord']) {
      const email = 'cliente.teste@' + ({ outlook: 'outlook.com', yahoo: 'yahoo.com' }[service] || 'gmail.com');
      state.accounts[service] = { email, profile: { name: 'Cliente', surname: 'Teste', day: 1, month: 1, year: 2000, region: 'Brasil' }, credentials, data: {} };
    }
    state.accounts.netflix.data = { plan: 'Padrão', payment: 'demonstration', profile: 'Visitante', entered: false };
    state.accounts.discord.data = { displayName: 'Cliente' };
    state.messages.google = [{ id: 'meeting', from: 'Coordenação', to: 'cliente.teste@gmail.com', subject: 'Reunião de amanhã', body: 'Nossa reunião será amanhã às 9 horas. Leve seu planejamento. Obrigada!', read: false }, { id: 'welcome', from: 'Escola', to: 'cliente.teste@gmail.com', subject: 'Bem-vindo', body: 'Bem-vindo ao nosso ambiente.', read: false }];
    for (const service of ['outlook', 'yahoo']) state.messages[service] = [{ id: service + '-welcome', from: 'Secretaria', to: state.accounts[service].email, subject: 'Bem-vindo à escola', body: 'Esta é sua caixa de entrada simulada.', read: false }];
    const already = { 'gmail-message': 'google', 'netflix-rename': 'netflix', 'netflix-watch': 'netflix', 'spotify-favorite': 'spotify', 'spotify-open': 'spotify', 'discord-name': 'discord' }[id];
    if (already) state.sessions[already] = state.accounts[already].email;
    if (id === 'spotify-open') state.accounts.spotify.data.favorites = ['song-1'];
    O.digitalLife.restoreSnapshot(state);
    const service = id.startsWith('gmail') ? 'gmail' : id.split('-')[0];
    if (['gmail', 'outlook', 'yahoo', 'netflix', 'spotify', 'drive', 'discord'].includes(service)) {
      const r = O.shell.openApp('google');
      O.browserApp.navigate(r, service + '.oslab.local/' + (already ? (service === 'gmail' ? 'inbox' : service === 'netflix' ? 'profiles' : 'home') : 'login'));
    }
  }
  function seed(id) {
    const file = (key, name, parent = fs.roots.documents, extra = {}) => fs.create({ id: 'tech-' + key, kind: 'file', name, parentId: parent, mime: 'text/plain', content: 'Material de trabalho da escola.', ...extra });
    const folder = (key, name, parent = fs.roots.documents) => fs.create({ id: 'tech-' + key, kind: 'folder', name, parentId: parent });
    const open = url => { const r = O.shell.openApp('google'); O.browserApp.navigate(r, url); return r; };
    switch (id) {
      case 'rename-folder': { const f = folder('folder', 'Nova pasta'); file('plan', 'Plano.txt', f.id); break; }
      case 'restore-folder': { const f = folder('folder', 'Materiais da Turma'); file('plan', 'Plano.txt', f.id); fs.delete(f.id); break; }
      case 'volume25': O.shell.setVolume(85, false); break;
      case 'copy-two': file('agenda', 'Agenda.pdf'); file('notice', 'Comunicado.pdf'); break;
      case 'organize-downloads': file('project', 'Projeto.docx', fs.roots.downloads); file('poster', 'Cartaz.png', fs.roots.downloads); file('old', 'Instalador antigo.tmp', fs.roots.downloads); break;
      case 'trash-clean': for (const [key, name] of [['report','Relatório importante.pdf'],['cache','Cache.tmp'],['video','Vídeo teste.mp4']]) fs.delete(file(key,name).id); break;
      case 'folder-shortcut': file('agenda', 'Pauta.txt'); break;
      case 'frozen-app': { open('hardware.oslab.local'); const r = O.shell.openApp('texteditor', {frozen:true}); O.processManager.updateProcess(r.pid, { status: 'Não respondendo', cpu: 42, memory: 550 }); r.frozen = true; r.element.classList.add('is-frozen'); break; }
      case 'wifi-auto': case 'airplane': case 'guest-auto': {
        O.network.restoreSnapshot({ wifiEnabled: true, airplaneMode: id === 'airplane', connectedSsid: id === 'airplane' ? null : id === 'guest-auto' ? 'Escola_Visitantes' : 'Escola_Alunos', availableNetworks: [{ ssid:'Escola_Alunos', secure:true, password:'Alunos2026!', signal:95, band:'5 GHz', security:'WPA2-Personal', channel:36 }, { ssid:'Escola_Visitantes', secure:false, password:'', signal:70, band:'2.4 GHz', security:'Aberta', channel:6 }], knownNetworks: { Escola_Alunos: { password:'Alunos2026!', autoConnect:false, metered:false, profile:'public' }, Escola_Visitantes: { password:'', autoConnect:true, metered:false, profile:'public' } } }); break;
      }
      case 'remove-favorite': { const r = open('google.com'); r.browserState.favorites = [{url:'antigo.escola.local',title:'Site antigo'},{url:'hardware.oslab.local',title:'Guia de hardware'}]; O.browserApp.render(r); break; }
      case 'history': open('componentes.oslab.local'); open('google.com'); break;
      case 'cancel-download': O.software.startDownload('appjavafx'); open('appjavafx.local'); break;
      case 'pdf': open('google.com'); break;
      default: digital(id);
    }
    O.shell.refreshDesktop();
  }
  O.techCases = { seed };
})(window);
