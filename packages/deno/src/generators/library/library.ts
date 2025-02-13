import {
  addProjectConfiguration,
  formatFiles,
  generateFiles,
  getImportPath,
  getWorkspaceLayout,
  joinPathFragments,
  names,
  offsetFromRoot,
  ProjectConfiguration,
  Tree,
  updateJson,
} from '@nrwl/devkit';
import { join } from 'path';
import { initDeno } from '../init/generator';
import { addPathToDenoSettings } from '../utils/add-path';
import { LibraryGeneratorSchema } from './schema';

interface NormalizedSchema extends LibraryGeneratorSchema {
  projectName: string;
  projectRoot: string;
  projectDirectory: string;
  parsedTags: string[];
}

function normalizeOptions(
  tree: Tree,
  options: LibraryGeneratorSchema
): NormalizedSchema {
  const name = names(options.name).fileName;
  const projectDirectory = options.directory
    ? `${names(options.directory).fileName}/${name}`
    : name;
  const projectName = projectDirectory.replace(new RegExp('/', 'g'), '-');
  const libDir = getWorkspaceLayout(tree).libsDir;
  // prevent paths from being dist/./lib-name
  const projectRoot = joinPathFragments(
    libDir === '.' ? '' : libDir,
    projectDirectory
  );
  const parsedTags = options.tags
    ? options.tags.split(',').map((s) => s.trim())
    : [];

  return {
    ...options,
    projectName,
    projectRoot,
    projectDirectory,
    parsedTags,
  };
}

function addFiles(tree: Tree, options: NormalizedSchema) {
  const templateOptions = {
    ...options,
    ...names(options.name),
    importMapPath: joinPathFragments(
      offsetFromRoot(options.projectRoot),
      'import_map.json'
    ),
    template: '',
    hasUnitTestRunner: options.unitTestRunner !== 'none',
    cliCommand: 'nx',
  };
  generateFiles(
    tree,
    join(__dirname, 'files'),
    options.projectRoot,
    templateOptions
  );
}

function addProjectConfig(tree: Tree, opts: NormalizedSchema) {
  const targets: ProjectConfiguration['targets'] = {
    test: {
      executor: '@nrwl/deno:test',
      outputs: [`coverage/${opts.projectRoot}`],
      options: {
        coverageDirectory: `coverage/${opts.projectRoot}`,
        denoConfig: `${opts.projectRoot}/deno.json`,
        check: 'local',
      },
    },
    lint: {
      executor: '@nrwl/deno:lint',
      options: {
        denoConfig: `${opts.projectRoot}/deno.json`,
      },
    },
  };

  if (opts.unitTestRunner === 'none') {
    delete targets.test;
  }

  if (opts.linter === 'none') {
    delete targets.lint;
  }

  addProjectConfiguration(tree, opts.projectName, {
    name: opts.projectName,
    root: opts.projectRoot,
    sourceRoot: opts.projectRoot,
    projectType: 'library',
    targets,
    tags: opts.parsedTags,
  });
}

export async function denoLibraryGenerator(
  tree: Tree,
  options: LibraryGeneratorSchema
) {
  const normalizedOptions = normalizeOptions(tree, options);

  initDeno(tree);
  addProjectConfig(tree, normalizedOptions);
  addFiles(tree, normalizedOptions);
  updateImportMap(tree, normalizedOptions);
  addPathToDenoSettings(tree, normalizedOptions.projectRoot);

  await formatFiles(tree);
}

function updateImportMap(tree: Tree, options: NormalizedSchema) {
  const { npmScope } = getWorkspaceLayout(tree);
  updateJson(tree, 'import_map.json', (json) => {
    const importPath = getImportPath(npmScope, options.projectName);
    json.imports = json.imports || {};
    if (json.imports[importPath]) {
      throw new Error(
        `Import path already exists in import_map.json for ${importPath}`
      );
    }
    // NOTE relative paths need to be prefixed with './' for deno to treat as a local file import
    json.imports[importPath] = `./${joinPathFragments(
      options.projectRoot,
      'mod.ts'
    )}`;
    return json;
  });
}

export default denoLibraryGenerator;
