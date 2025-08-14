import 'dotenv/config';
import express from 'express';
import { SnykService } from './snyk/snyk.service';

const app = express();
const port = 3000;

// Carrega as variáveis de ambiente do arquivo .env
const snykToken = process.env.SNYK_TOKEN;
if (!snykToken) {
  console.error(
    'A variável de ambiente SNYK_TOKEN não está definida no arquivo .env.',
  );
  process.exit(1);
}

const snykService = new SnykService(snykToken);
//exemplo
//const repoPath = 'C:\\work\\my-projects\\ulbra\\projeto_tecnologico\\sast_labs\\lab_one';
const repoPath = '';

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/scan', async (req, res) => {
  try {
    console.log(`Iniciando varredura SAST para o repositório: ${repoPath}`);
    const result = await snykService.runSastScan(repoPath);
    res.send(`<pre>${result}</pre>`);
  } catch (error: any) {
    res.status(500).send(`Erro ao executar a varredura SAST: ${error.message}`);
  }
});

app.listen(port, () => {
  console.log(`Servidor está rodando em http://localhost:${port}`);
  console.log(`Para iniciar a varredura, acesse http://localhost:${port}/scan`);
});
