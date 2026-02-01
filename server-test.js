const WebSocket = require('ws');
const http = require('http');

const server = http.createServer();
const wss = new WebSocket.Server({ server });

console.log('Serveur WebSocket demarre sur ws://localhost:3000');

wss.on('connection', (ws) => {
  console.log('\n=== Extension connectee ===\n');

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data);
      console.log('Message recu:', JSON.stringify(msg, null, 2));
      
      // Echo response
      if (msg.type === 'command_response') {
        // Juste afficher
      } else if (msg.type === 'connection') {
        console.log('Extension conectee a l\'espace de travail:', msg.workspace);
      }
    } catch (e) {
      console.log('Message brut:', data.toString());
    }
  });

  ws.on('close', () => {
    console.log('\n=== Extension deconnectee ===\n');
  });

  ws.on('error', (err) => {
    console.error('Erreur WebSocket:', err.message);
  });
});

server.listen(3000, () => {
  console.log('Ecoute sur http://localhost:3000');
  console.log('\nLance l\'extension avec F5 dans VS Code');
  console.log('Puis execute: CodeIA: start (Ctrl+Shift+P)\n');
});
