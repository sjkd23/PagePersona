#!/usr/bin/env node
/**
 * TypeScript Diagnostic Tool for PagePersonAI Monorepo
 *
 * This tool uses the TypeScript compiler API to analyze the entire monorepo
 * and identify compilation errors without relying on shell commands.
 */

import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';

interface DiagnosticResult {
  file: string;
  line: number;
  column: number;
  message: string;
  code: number;
  category: string;
  severity: 'error' | 'warning' | 'info';
}

interface WorkspaceAnalysis {
  name: string;
  path: string;
  tsconfig: string;
  diagnostics: DiagnosticResult[];
  fileCount: number;
  errorCount: number;
  warningCount: number;
}

class TypeScriptAnalyzer {
  private rootPath: string;
  private workspaces: WorkspaceAnalysis[] = [];

  constructor(rootPath: string) {
    this.rootPath = rootPath;
  }

  /**
   * Analyze the entire monorepo
   */
  async analyzeMonorepo(): Promise<WorkspaceAnalysis[]> {
    const workspaces = [
      { name: 'shared', path: path.join(this.rootPath, 'shared') },
      { name: 'server', path: path.join(this.rootPath, 'server') },
      { name: 'client', path: path.join(this.rootPath, 'client') },
    ];

    for (const workspace of workspaces) {
      const analysis = await this.analyzeWorkspace(workspace.name, workspace.path);
      this.workspaces.push(analysis);
    }

    return this.workspaces;
  }

  /**
   * Analyze a single workspace
   */
  private async analyzeWorkspace(name: string, workspacePath: string): Promise<WorkspaceAnalysis> {
    const tsconfigPath = path.join(workspacePath, 'tsconfig.json');
    const appTsconfigPath = path.join(workspacePath, 'tsconfig.app.json');

    // Use tsconfig.app.json for client, tsconfig.json for others
    const configPath =
      name === 'client' && fs.existsSync(appTsconfigPath) ? appTsconfigPath : tsconfigPath;

    if (!fs.existsSync(configPath)) {
      return {
        name,
        path: workspacePath,
        tsconfig: configPath,
        diagnostics: [
          {
            file: configPath,
            line: 0,
            column: 0,
            message: `tsconfig.json not found at ${configPath}`,
            code: 0,
            category: 'error',
            severity: 'error',
          },
        ],
        fileCount: 0,
        errorCount: 1,
        warningCount: 0,
      };
    }

    const diagnostics: DiagnosticResult[] = [];
    let fileCount = 0;

    try {
      // Read and parse tsconfig.json
      const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
      if (configFile.error) {
        diagnostics.push(this.formatDiagnostic(configFile.error));
        return this.createAnalysisResult(name, workspacePath, configPath, diagnostics, fileCount);
      }

      // Parse config with proper project references
      const parsedConfig = ts.parseJsonConfigFileContent(
        configFile.config,
        ts.sys,
        path.dirname(configPath),
        undefined,
        configPath,
      );

      if (parsedConfig.errors.length > 0) {
        diagnostics.push(...parsedConfig.errors.map((err) => this.formatDiagnostic(err)));
      }

      // Create TypeScript program
      const program = ts.createProgram({
        rootNames: parsedConfig.fileNames,
        options: parsedConfig.options,
        projectReferences: parsedConfig.projectReferences,
        configFileParsingDiagnostics: parsedConfig.errors,
      });

      fileCount = program.getSourceFiles().length;

      // Get all diagnostics
      const allDiagnostics = [
        ...program.getConfigFileParsingDiagnostics(),
        ...program.getOptionsDiagnostics(),
        ...program.getGlobalDiagnostics(),
        ...program.getSemanticDiagnostics(),
        ...program.getSyntacticDiagnostics(),
      ];

      // Filter out node_modules and dist files
      const relevantDiagnostics = allDiagnostics.filter((diagnostic) => {
        if (!diagnostic.file) return true;
        const fileName = diagnostic.file.fileName;
        return (
          !fileName.includes('node_modules') &&
          !fileName.includes('/dist/') &&
          !fileName.includes('\\dist\\')
        );
      });

      diagnostics.push(...relevantDiagnostics.map((d) => this.formatDiagnostic(d)));
    } catch (error) {
      diagnostics.push({
        file: configPath,
        line: 0,
        column: 0,
        message: `Failed to analyze workspace: ${error.message}`,
        code: 0,
        category: 'error',
        severity: 'error',
      });
    }

    return this.createAnalysisResult(name, workspacePath, configPath, diagnostics, fileCount);
  }

  /**
   * Format TypeScript diagnostic to our standard format
   */
  private formatDiagnostic(diagnostic: ts.Diagnostic): DiagnosticResult {
    let line = 0;
    let column = 0;
    let fileName = 'unknown';

    if (diagnostic.file && diagnostic.start !== undefined) {
      const { line: lineNum, character } = diagnostic.file.getLineAndCharacterOfPosition(
        diagnostic.start,
      );
      line = lineNum + 1;
      column = character + 1;
      fileName = diagnostic.file.fileName;
    }

    const category = ts.DiagnosticCategory[diagnostic.category].toLowerCase();
    const severity = category === 'error' ? 'error' : category === 'warning' ? 'warning' : 'info';

    return {
      file: fileName,
      line,
      column,
      message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
      code: diagnostic.code,
      category,
      severity,
    };
  }

  /**
   * Create analysis result
   */
  private createAnalysisResult(
    name: string,
    workspacePath: string,
    configPath: string,
    diagnostics: DiagnosticResult[],
    fileCount: number,
  ): WorkspaceAnalysis {
    const errorCount = diagnostics.filter((d) => d.severity === 'error').length;
    const warningCount = diagnostics.filter((d) => d.severity === 'warning').length;

    return {
      name,
      path: workspacePath,
      tsconfig: configPath,
      diagnostics,
      fileCount,
      errorCount,
      warningCount,
    };
  }

  /**
   * Generate comprehensive report
   */
  generateReport(): string {
    let report = '# TypeScript Diagnostic Report\n\n';

    // Summary
    const totalErrors = this.workspaces.reduce((sum, ws) => sum + ws.errorCount, 0);
    const totalWarnings = this.workspaces.reduce((sum, ws) => sum + ws.warningCount, 0);
    const totalFiles = this.workspaces.reduce((sum, ws) => sum + ws.fileCount, 0);

    report += `## Summary\n`;
    report += `- Total files analyzed: ${totalFiles}\n`;
    report += `- Total errors: ${totalErrors}\n`;
    report += `- Total warnings: ${totalWarnings}\n\n`;

    // Workspace breakdown
    for (const workspace of this.workspaces) {
      report += `## Workspace: ${workspace.name}\n`;
      report += `- Path: ${workspace.path}\n`;
      report += `- Config: ${workspace.tsconfig}\n`;
      report += `- Files: ${workspace.fileCount}\n`;
      report += `- Errors: ${workspace.errorCount}\n`;
      report += `- Warnings: ${workspace.warningCount}\n\n`;

      if (workspace.diagnostics.length > 0) {
        report += `### Diagnostics:\n`;
        for (const diag of workspace.diagnostics) {
          const relativePath = path.relative(this.rootPath, diag.file);
          report += `- **${diag.severity.toUpperCase()}** [TS${diag.code}] ${relativePath}:${diag.line}:${diag.column}\n`;
          report += `  ${diag.message}\n\n`;
        }
      }
    }

    return report;
  }

  /**
   * Get unique error patterns for fix generation
   */
  getErrorPatterns(): Map<number, DiagnosticResult[]> {
    const patterns = new Map<number, DiagnosticResult[]>();

    for (const workspace of this.workspaces) {
      for (const diagnostic of workspace.diagnostics) {
        if (diagnostic.severity === 'error') {
          if (!patterns.has(diagnostic.code)) {
            patterns.set(diagnostic.code, []);
          }
          patterns.get(diagnostic.code)!.push(diagnostic);
        }
      }
    }

    return patterns;
  }
}

// Main execution
async function main() {
  const rootPath = process.argv[2] || process.cwd();
  const analyzer = new TypeScriptAnalyzer(rootPath);

  console.log('🔍 Analyzing TypeScript monorepo...');
  await analyzer.analyzeMonorepo();

  console.log('\n📊 Analysis Results:');
  console.log(analyzer.generateReport());

  const errorPatterns = analyzer.getErrorPatterns();
  if (errorPatterns.size > 0) {
    console.log('\n🔧 Error Patterns Found:');
    for (const [code, diagnostics] of errorPatterns) {
      console.log(`- TS${code}: ${diagnostics.length} occurrence(s)`);
      console.log(`  Sample: ${diagnostics[0].message}`);
    }
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { TypeScriptAnalyzer, DiagnosticResult, WorkspaceAnalysis };
