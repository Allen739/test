import { FileSystemManager } from '../utils/fileSystem';
import { glob } from 'glob';
import * as path from 'path';

export interface ProjectUnderstanding {
  architecture: string;
  framework: string;
  language: string;
  patterns: string[];
  conventions: {
    naming: string;
    structure: string;
    testing: string;
  };
  keyFiles: {
    entry: string[];
    config: string[];
    tests: string[];
  };
  dependencies: {
    ui: string[];
    backend: string[];
    testing: string[];
    build: string[];
  };
}

export class ProjectContext {
  private fileSystem: FileSystemManager;
  private workingDir: string;
  private understanding: ProjectUnderstanding | null = null;

  constructor(fileSystem: FileSystemManager) {
    this.fileSystem = fileSystem;
    this.workingDir = fileSystem.getWorkingDirectory();
  }

  async analyzeProject(): Promise<ProjectUnderstanding> {
    if (this.understanding) return this.understanding;

    const packageJson = await this.readPackageJson();
    const files = await this.getAllFiles();

    this.understanding = {
      architecture: this.detectArchitecture(files, packageJson),
      framework: this.detectFramework(packageJson),
      language: this.detectLanguage(files),
      patterns: this.detectPatterns(files),
      conventions: this.detectConventions(files),
      keyFiles: this.identifyKeyFiles(files),
      dependencies: this.categorizeDependencies(packageJson),
    };

    return this.understanding;
  }

  private async readPackageJson(): Promise<any> {
    try {
      const content = await this.fileSystem.readFile('package.json');
      return JSON.parse(content);
    } catch {
      return {};
    }
  }

  private async getAllFiles(): Promise<string[]> {
    return glob('**/*', {
      cwd: this.workingDir,
      nodir: true,
      ignore: ['node_modules/**', '.git/**', 'dist/**', '.next/**', 'build/**'],
    });
  }

  private detectArchitecture(files: string[], packageJson: any): string {
    // Check for monorepo
    if (files.some(f => f.includes('packages/') || f.includes('apps/'))) {
      return 'monorepo';
    }

    // Check for microservices
    if (files.some(f => f.includes('services/')) && files.length > 100) {
      return 'microservices';
    }

    // Check for layered architecture
    const hasLayers = ['controllers', 'services', 'models', 'routes'].filter(
      layer => files.some(f => f.includes(layer))
    ).length >= 3;

    if (hasLayers) return 'layered';

    // Check for feature-based
    const featureDirs = files.filter(f => f.includes('features/') || f.includes('modules/')).length;
    if (featureDirs > 10) return 'feature-based';

    return 'standard';
  }

  private detectFramework(packageJson: any): string {
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

    if (deps.next) return 'Next.js';
    if (deps.react && deps['react-dom']) return 'React';
    if (deps.vue) return 'Vue';
    if (deps.angular) return 'Angular';
    if (deps.express) return 'Express';
    if (deps.nestjs) return 'NestJS';
    if (deps.fastify) return 'Fastify';

    return 'Unknown';
  }

  private detectLanguage(files: string[]): string {
    const tsFiles = files.filter(f => f.endsWith('.ts') || f.endsWith('.tsx')).length;
    const jsFiles = files.filter(f => f.endsWith('.js') || f.endsWith('.jsx')).length;

    if (tsFiles > jsFiles) return 'TypeScript';
    if (jsFiles > 0) return 'JavaScript';
    if (files.some(f => f.endsWith('.py'))) return 'Python';
    if (files.some(f => f.endsWith('.go'))) return 'Go';

    return 'Unknown';
  }

  private detectPatterns(files: string[]): string[] {
    const patterns: string[] = [];

    // Check for common patterns
    if (files.some(f => f.includes('hooks/'))) patterns.push('Custom Hooks');
    if (files.some(f => f.includes('context/'))) patterns.push('Context API');
    if (files.some(f => f.includes('store/') || f.includes('redux'))) patterns.push('State Management');
    if (files.some(f => f.includes('hoc/'))) patterns.push('Higher-Order Components');
    if (files.some(f => f.includes('middleware/'))) patterns.push('Middleware');
    if (files.some(f => f.includes('decorators/'))) patterns.push('Decorators');
    if (files.some(f => f.includes('factories/'))) patterns.push('Factory Pattern');
    if (files.some(f => f.includes('adapters/'))) patterns.push('Adapter Pattern');

    return patterns;
  }

  private detectConventions(files: string[]): ProjectUnderstanding['conventions'] {
    // Naming conventions
    const hasCamelCase = files.some(f => /[a-z][A-Z]/.test(path.basename(f)));
    const hasKebabCase = files.some(f => /-/.test(path.basename(f)));
    const hasPascalCase = files.some(f => /^[A-Z]/.test(path.basename(f)));

    let naming = 'mixed';
    if (hasKebabCase && !hasCamelCase) naming = 'kebab-case';
    else if (hasPascalCase && !hasKebabCase) naming = 'PascalCase';
    else if (hasCamelCase) naming = 'camelCase';

    // Structure conventions
    const hasIndexFiles = files.filter(f => f.endsWith('index.ts') || f.endsWith('index.js')).length;
    const structure = hasIndexFiles > 5 ? 'barrel exports' : 'direct exports';

    // Testing conventions
    const testFiles = files.filter(f => f.includes('.test.') || f.includes('.spec.'));
    const hasTestDirs = files.some(f => f.includes('__tests__'));
    const testing = hasTestDirs ? 'separate test directories' : testFiles.length > 0 ? 'co-located tests' : 'no tests';

    return { naming, structure, testing };
  }

  private identifyKeyFiles(files: string[]): ProjectUnderstanding['keyFiles'] {
    const entry: string[] = [];
    const config: string[] = [];
    const tests: string[] = [];

    files.forEach(f => {
      const basename = path.basename(f);

      // Entry points
      if (['index.ts', 'index.js', 'main.ts', 'main.js', 'app.ts', 'app.js'].includes(basename)) {
        entry.push(f);
      }

      // Config files
      if (basename.includes('config') ||
          ['tsconfig.json', 'package.json', '.env', 'next.config.js'].includes(basename)) {
        config.push(f);
      }

      // Test files
      if (f.includes('.test.') || f.includes('.spec.') || f.includes('__tests__')) {
        tests.push(f);
      }
    });

    return { entry, config, tests };
  }

  private categorizeDependencies(packageJson: any): ProjectUnderstanding['dependencies'] {
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    const ui: string[] = [];
    const backend: string[] = [];
    const testing: string[] = [];
    const build: string[] = [];

    Object.keys(deps).forEach(dep => {
      // UI frameworks
      if (['react', 'vue', 'angular', '@angular', 'svelte', 'next'].some(f => dep.includes(f))) {
        ui.push(dep);
      }
      // Backend
      else if (['express', 'fastify', 'nest', 'koa', 'hapi'].some(f => dep.includes(f))) {
        backend.push(dep);
      }
      // Testing
      else if (['jest', 'mocha', 'chai', 'vitest', 'testing-library', 'cypress', 'playwright'].some(f => dep.includes(f))) {
        testing.push(dep);
      }
      // Build tools
      else if (['webpack', 'vite', 'rollup', 'esbuild', 'babel', 'typescript', 'swc'].some(f => dep.includes(f))) {
        build.push(dep);
      }
    });

    return { ui, backend, testing, build };
  }

  async getRelevantFiles(task: string): Promise<string[]> {
    const files = await this.getAllFiles();
    const keywords = this.extractKeywords(task);

    const scored = files.map(file => ({
      file,
      score: this.scoreFileRelevance(file, keywords),
    })).filter(item => item.score > 0);

    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, 10).map(item => item.file);
  }

  private extractKeywords(task: string): string[] {
    const common = ['the', 'a', 'an', 'to', 'for', 'in', 'on', 'at', 'is', 'and', 'or'];
    return task.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2 && !common.includes(word));
  }

  private scoreFileRelevance(file: string, keywords: string[]): number {
    let score = 0;
    const fileLower = file.toLowerCase();

    keywords.forEach(keyword => {
      if (fileLower.includes(keyword)) score += 10;
      if (path.basename(fileLower).includes(keyword)) score += 5;
    });

    // Boost certain file types
    if (file.includes('component')) score += 2;
    if (file.includes('service')) score += 2;
    if (file.includes('util')) score += 1;

    return score;
  }

  async generateProjectSummary(): Promise<string> {
    const understanding = await this.analyzeProject();

    return `
# Project Summary

## Architecture
- **Type**: ${understanding.architecture}
- **Framework**: ${understanding.framework}
- **Language**: ${understanding.language}

## Patterns in Use
${understanding.patterns.map(p => `- ${p}`).join('\n')}

## Coding Conventions
- **Naming**: ${understanding.conventions.naming}
- **Structure**: ${understanding.conventions.structure}
- **Testing**: ${understanding.conventions.testing}

## Key Dependencies
- **UI**: ${understanding.dependencies.ui.slice(0, 3).join(', ')}
- **Backend**: ${understanding.dependencies.backend.slice(0, 3).join(', ')}
- **Testing**: ${understanding.dependencies.testing.slice(0, 3).join(', ')}

## Entry Points
${understanding.keyFiles.entry.slice(0, 3).map(f => `- ${f}`).join('\n')}
    `.trim();
  }

  getUnderstanding(): ProjectUnderstanding | null {
    return this.understanding;
  }

  clearCache(): void {
    this.understanding = null;
  }
}
