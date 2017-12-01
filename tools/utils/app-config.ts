interface SwAppConfigAssetObject {
  /** The pattern to match. */
  glob: string;
  /** The dir to search within. */
  input: string;
  /** The output path (relative to the outDir). */
  output: string;
}

type SwAppConfigAsset = string | SwAppConfigAssetObject;

interface SwAppConfigStyleObject {
  input: string;
}

type SwAppConfigStyle = string | SwAppConfigStyleObject;

interface SwAppStylePreprocessorOptions {
  /** Paths to include. Paths will be resolved to project root. */
  includePaths: string[];
}

interface SwAppConfigScriptObject {
  input: string;
}

type SwAppConfigScript = string | SwAppConfigScriptObject;

export interface SwAppConfig {
  /** Name of the app. */
  name: string;
  /** Directory where app files are placed. */
  appRoot: string;
  /** The root directory of the app. */
  root: string;
  /** The output directory for build results. */
  outDir: string;
  /** List of application assets */
  assets: SwAppConfigAsset[];
  /** URL where files will be deployed. */
  deployUrl: string;
  /** Base url for the application being built. */
  baseHref: string;
  /** The runtime platform of the app. */
  platform: 'browser' | 'server';
  /** The name of the start HTML file */
  index: string;
  /** The name of the main entry-point file. */
  main: string;
  /** The name of the polyfills file. */
  polyfills: string;
  /** The name of the test entry-point file. */
  test: string;
  /** The name of the TypeScript configuration file. */
  tsconfig: string;
  /** The name of the TypeScript configuration file for unit tests. */
  testTsconfig: string;
  /** The prefix to apply to generated selectors */
  prefix: string;
  /** Experimental support for a service worker from @angular/service-worker. */
  serviceWorker: boolean;
  /** Global styles to be included in the build */
  styles: SwAppConfigStyle[];
  /** Options to pass to style preprocessors */
  stylePreprocessorOptions: SwAppStylePreprocessorOptions;
  /** Global scripts to be included in the build */
  scripts: SwAppConfigScript[];
  /** Source file for environment config. */
  environmentSource: string;
  /** Name and corresponding file for environment config. */
  environments: {
    prod: string;
    dev: string;
  };
}
