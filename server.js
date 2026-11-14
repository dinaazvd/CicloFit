// Importa o framework Express para gerir rotas e o servidor HTTP
const express = require('express');
const cors = require('cors'); // Habilita o CORS

// Importa o módulo nativo path para manipular caminhos de pastas e ficheiros no sistema
const path = require('path');

// Inicializa a aplicação Express
const app = express();

// Define a porta do servidor
const PORT = process.env.PORT || 3000;

// Configura o middleware para processar requisições em formato JSON e o CORS
app.use(express.json());
app.use(cors());

// Configura o middleware para servir ficheiros estáticos (HTML, CSS, JS) a partir da pasta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Rota explícita para entregar a página inicial index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Rota de status da API (Endpoint REST de verificação)
app.get('/api/status', (req, res) => {
  res.status(200).json({ status: 'Servidor online', versao: '1.0.0' });
});

// Inicializa a escuta de conexões HTTP na porta especificada
app.listen(PORT, () => {
  console.log(`Servidor a correr com sucesso em http://localhost:${PORT}`);
});