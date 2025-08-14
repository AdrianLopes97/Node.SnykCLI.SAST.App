import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class SnykService {
  private snykToken: string;

  constructor(snykToken: string) {
    if (!snykToken) {
      throw new Error('Snyk token is required.');
    }
    this.snykToken = snykToken;
  }

  public async runSastScan(repoPath: string): Promise<string> {
    try {
      // Garante que o diretório de saída exista
      const outputDir = path.join(repoPath, 'snyk-outs');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
      }

      // Autentica com o Snyk CLI
      const authCommand = `snyk auth ${this.snykToken}`;
      console.log('Autenticando com o Snyk...');
      await execAsync(authCommand);
      console.log('Autenticação com Snyk bem-sucedida.');

      // Executa a varredura SAST
      const command = `snyk code test --json`;
      console.log(`Executando varredura SAST em: ${repoPath}`);

      const { stdout, stderr } = await execAsync(command, {
        cwd: repoPath,
      });

      if (stderr && !stdout) {
        // snyk code test pode retornar sucesso no stderr
        console.error(`Snyk CLI stderr: ${stderr}`);
      }

      const output = stdout || stderr;
      const outputPath = path.join(outputDir, 'sast-results.json');
      fs.writeFileSync(outputPath, output);
      console.log(`Resultado da varredura salvo em: ${outputPath}`);

      console.log('Varredura Snyk SAST concluída.');
      return output;
    } catch (error: any) {
      // O Snyk CLI retorna um código de saída quando encontra vulnerabilidades.
      // Isso não é um erro de execução, então tratamos como sucesso e retornamos o relatório.
      const output = error.stdout || error.stderr;
      if (output) {
        console.log(
          'Varredura Snyk SAST concluída. Vulnerabilidades encontradas.',
        );
        const outputDir = path.join(repoPath, 'snyk-outs');
        const outputPath = path.join(outputDir, 'sast-results.json');
        fs.writeFileSync(outputPath, output);
        console.log(`Resultado da varredura salvo em: ${outputPath}`);
        return output;
      }

      console.error('Erro ao executar a varredura Snyk SAST:', error);
      throw new Error(
        `Falha ao executar a varredura Snyk SAST. ${error.message}`,
      );
    }
  }
}
