import * as fs from 'fs';
import * as path from 'path';
import {
  Configuration as WebpackConfig,
  Entry as WebpackEntry,
  EnvironmentPlugin,
  HashedModuleIdsPlugin,
  LoaderOptionsPlugin,
  NamedModulesPlugin,
  NoEmitOnErrorsPlugin,
  optimize as WebpackOptimize,
  Output as WebpackOutput,
  Plugin as WebpackPlugin,
  ProgressPlugin,
  Rule as WebpackRule,
  SourceMapDevToolPlugin,
  EvalSourceMapDevToolPlugin,
  HotModuleReplacementPlugin
} from 'webpack';
import {
  BaseHrefWebpackPlugin,
  NamedLazyChunksWebpackPlugin,
  SuppressExtractedTextChunksWebpackPlugin
} from '@angular/cli/plugins/webpack';
import {
  AngularCompilerPlugin,
  AngularCompilerPluginOptions,
  PLATFORM
} from '@ngtools/webpack';
import { PurifyPlugin } from '@angular-devkit/build-optimizer';

import { BuildTarget, log, SwAppConfig, ensureBuildTarget } from '../utils';
import { getCSSComponentRules } from './css-helpers';
import { webpackProgressHandler } from './progress-handler';
import { parseCssEntries, getLazyChunks } from './entries';
import { ModuleKind } from 'typescript';

const { CommonsChunkPlugin, ModuleConcatenationPlugin } = WebpackOptimize;
const CompressionPlugin = require('compression-webpack-plugin');
const { LicenseWebpackPlugin } = require('license-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const CircularDependencyPlugin = require('circular-dependency-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const rxPaths = require('rxjs/_esm5/path-mapping');

interface ConfigBuildOptions {
  target: BuildTarget;
  serve?: boolean;
  hmr?: boolean;
  host?: string;
  port?: number;
  ssl?: boolean;
  circular?: boolean;
  vendor?: boolean;
  verbose?: boolean;
}

export class AppWebpackConfig {
  constructor(public config: SwAppConfig) {
    if (!config) {
      log.error(`No config provided to AppWebpackConfig.`);
    }
  }

  buildConfig (_options: ConfigBuildOptions): WebpackConfig {

    let options: ConfigBuildOptions =
      _options && typeof _options === 'object' ?
      _options : {} as ConfigBuildOptions;
    options = {
      target: ensureBuildTarget(options.target),
      serve: options.serve === true,
      hmr: options.hmr === true,
      host: options.host || '0.0.0.0',
      port: options.port || 3000,
      ssl: false,
      circular: options.circular === true,
      vendor: options.vendor === true,
      verbose: options.verbose === true
    };

    const buildTarget = ensureBuildTarget(options.target);
    const isProd = buildTarget === BuildTarget.production;
    const buildSourcemaps = isProd === false;
    const extractCss = isProd === true;
    const hotModuleReplacement = options.serve && options.hmr === true;
    const forceTsCommonjs = options.serve && buildTarget === BuildTarget.development;
    /** Eval sourcemaps are faster for rebuilding */
    const evalSourcemaps = options.serve;


    /** Base paths */
    const appRoot = path.resolve(process.cwd(), this.config.root);
    const nodeModules = path.resolve(process.cwd(), 'node_modules');
    const realNodeModules = fs.realpathSync(nodeModules);
    const genDirNodeModules = path.resolve(process.cwd(), this.config.root, '$$_gendir', 'node_modules');
    const entryPoints = ['inline', 'polyfills', 'sw-register', 'styles', 'vendor', 'main'];

    /** Entries. More will be added below. */

    const ENTRIES: WebpackEntry = {
      main: [path.resolve(appRoot, this.config.main)],
      polyfills: [path.resolve(appRoot, this.config.polyfills)]
    };

    if (hotModuleReplacement) {
      const clientAddress = `${options.ssl ? 'https' : 'http'}://0.0.0.0:0`;

      /**
       * This allows for live reload of page.
       * https://webpack.github.io/docs/webpack-dev-server.html#inline-mod
       */
      const hmrEntryPoints = [
        `webpack-dev-server/client?${clientAddress}`,
        'webpack/hot/dev-server'
      ];
      ENTRIES.main = [
        ...hmrEntryPoints,
        ...(ENTRIES.main as string[])
      ];

      log.warn('Hot Module Replacement (HMR) is enabled for the dev server.');
    }

    /** Output */

    const OUTPUT_PATH = path.resolve(process.cwd(), this.config.outDir);
    const OUTPUT: WebpackOutput = {
      path: OUTPUT_PATH,
      filename: isProd ? '[name].[chunkhash:20].bundle.js' : '[name].bundle.js',
      chunkFilename: isProd ? '[id].[chunkhash:20].chunk.js' : '[id].chunk.js',
      crossOriginLoading: false
    };

    const lazyChunks = getLazyChunks(appRoot, this.config.scripts, this.config.styles);

    /**
     * Rule definitions
     */

    const parsedCssEntries = parseCssEntries(appRoot, this.config.styles);
    ENTRIES.styles = parsedCssEntries.entry;

    const cssRules: WebpackRule[] = getCSSComponentRules(
      buildTarget,
      parsedCssEntries.global,
      buildSourcemaps,
      extractCss
    );

    const angularBuildOptimizerLoader = {
      loader: '@angular-devkit/build-optimizer/webpack-loader',
      options: {
        sourceMap: false
      }
    };

    const allRules: WebpackRule[] = [
      {
        test: /\.html$/,
        loader: 'raw-loader'
      },
      {
        test: /\.(eot|svg|cur)$/,
        loader: 'file-loader',
        options: {
          name: '[name].[hash:20].[ext]',
          limit: 10000
        }
      },
      {
        test: /\.(jpg|png|webp|gif|otf|ttf|woff|woff2|ani)$/,
        loader: 'url-loader',
        options: {
          name: '[name].[hash:20].[ext]',
          limit: 10000
        }
      },
      isProd ? {
        test: /\.js$/,
        use: [angularBuildOptimizerLoader]
      } : null,
      ...cssRules,
      (
        isProd ?
        {
          test: /(?:\.ngfactory\.js|\.ngstyle\.js|\.ts)$/,
          use: [
            angularBuildOptimizerLoader,
            '@ngtools/webpack'
          ]
        } :
        {
          test: /\.ts$/,
          loader: '@ngtools/webpack'
        }
      )
    ];

    /**
     * Plugin composition
     */

    const productionOnlyPlugins: WebpackPlugin[] = isProd ?
      [
        new ExtractTextPlugin({
          filename: '[name].[contenthash:20].bundle.css'
        }),
        new SuppressExtractedTextChunksWebpackPlugin(),
        new EnvironmentPlugin({
          NODE_ENV: buildTarget
        }),
        new HashedModuleIdsPlugin(),
        new ModuleConcatenationPlugin(),
        new LicenseWebpackPlugin({
          pattern: /^(MIT|ISC|BSD.*)$/,
          suppressErrors: true,
          perChunkOutput: false,
          outputFilename: '3rdpartylicenses.txt'
        }),
        new PurifyPlugin(),
        new UglifyJsPlugin({
          sourceMap: false,
          uglifyOptions: {
            output: {
              ascii_only: true,
              comments: false,
              webkit: true
            },
            ecma: 5,
            warnings: options.verbose,
            ie8: false,
            mangle: {
              safari10: true
            },
            compress: {
              pure_getters: true,
              passes: 3,
              // Disabled because of an issue with Mapbox GL when using the Webpack node global and UglifyJS:
              // https://github.com/mapbox/mapbox-gl-js/issues/4359#issuecomment-303880888
              // https://github.com/angular/angular-cli/issues/5804
              // https://github.com/angular/angular-cli/pull/7931
              typeofs : false
            }
          }
        }),
        new CompressionPlugin({
          test: /\.js$|\.html$/,
          threshold: 10240,
          minRatio: 0.8
        })
      ] : [];

    const angularCompilerPluginConfig: AngularCompilerPluginOptions = {
      mainPath: path.resolve(appRoot, this.config.main),
      platform: PLATFORM.Browser,
      hostReplacementPaths: {
        [path.resolve(appRoot, this.config.environmentSource)]:
          path.resolve(appRoot, isProd ? this.config.environments.prod : this.config.environments.dev)
      },
      sourceMap: buildSourcemaps,
      tsConfigPath: path.resolve(appRoot, this.config.tsconfig),
      compilerOptions: {}
    };

    if (!isProd) {
      angularCompilerPluginConfig.skipCodeGeneration = true;
    }

    if (forceTsCommonjs) {
      angularCompilerPluginConfig.compilerOptions.module = ModuleKind.CommonJS;
    }

    const sourceMapPlugin: WebpackPlugin = !isProd ?
      evalSourcemaps ?
        new EvalSourceMapDevToolPlugin({
          moduleFilenameTemplate: '[resource-path]',
          sourceRoot: 'webpack:///'
        }) :
        new SourceMapDevToolPlugin({
          filename: '[file].map[query]',
          moduleFilenameTemplate: '[resource-path]',
          fallbackModuleFilenameTemplate: '[resource-path]?[hash]',
          sourceRoot: 'webpack:///'
        })
      : null;

    const copyWebpackPluginPatterns = [
      {
        context: process.cwd(),
        to: '',
        from: {
          glob: 'assets/**/*',
          dot: true
        }
      },
      {
        context: process.cwd(),
        to: '',
        from: {
          glob: 'favicon.ico',
          dot: true
        }
      }
    ];
    const copyWebpackPluginOptions = {
      ignore: ['.gitkeep', '**/.DS_Store', '**/Thumbs.db'],
      debug: 'warning'
    };

    const circularDependenciesPlugin = options.circular ? new CircularDependencyPlugin({
      exclude: /(\\|\/)node_modules(\\|\/)/,
      failOnError: false
    }) : null;

    const commonChunksVendorPlugin = options.vendor ? new CommonsChunkPlugin({
      name: 'vendor',
      chunks: ['main'],
      minChunks: module => {
        return (
          module.resource &&
          (module.resource.startsWith(nodeModules) ||
            module.resource.startsWith(genDirNodeModules) ||
            module.resource.startsWith(realNodeModules))
        );
      }
    }) : null;

    const allPlugins: WebpackPlugin[] = [
      new LoaderOptionsPlugin({ debug: true }),
      new NoEmitOnErrorsPlugin(),
      new CopyWebpackPlugin(copyWebpackPluginPatterns, copyWebpackPluginOptions),
      new ProgressPlugin(webpackProgressHandler),
      circularDependenciesPlugin,
      !isProd ? new NamedLazyChunksWebpackPlugin() : null,
      new HtmlWebpackPlugin({
        template: path.resolve(appRoot, this.config.index),
        filename: path.resolve(OUTPUT_PATH, this.config.index),
        minify: buildTarget === BuildTarget.production ? {
          caseSensitive: true,
          collapseWhitespace: true,
          keepClosingSlash: true
        } : false,
        excludeChunks: lazyChunks,
        xhtml: true,
        chunksSortMode: function sort(left, right) {
          const leftIndex = entryPoints.indexOf(left.names[0]);
          const rightindex = entryPoints.indexOf(right.names[0]);
          if (leftIndex > rightindex) {
            return 1;
          } else if (leftIndex < rightindex) {
            return -1;
          } else {
            return 0;
          }
        }
      }),
      new BaseHrefWebpackPlugin({ baseHref: undefined }),
      new CommonsChunkPlugin({
        name: 'inline',
        minChunks: Infinity
      }),
      commonChunksVendorPlugin,
      sourceMapPlugin,
      new CommonsChunkPlugin({
        name: 'main',
        async: 'common',
        children: true,
        minChunks: 2
      }),
      !isProd ? new NamedModulesPlugin() : null,
      ...productionOnlyPlugins,
      new AngularCompilerPlugin(angularCompilerPluginConfig),
      hotModuleReplacement ? new HotModuleReplacementPlugin() : null
    ];

    /**
     * Final compilation
     */

    return {
      context: process.cwd(),
      resolve: {
        extensions: ['.ts', '.js'],
        modules: [nodeModules, realNodeModules],
        symlinks: true,
        alias: rxPaths(),
        mainFields: ['browser', 'module', 'main']
      },
      resolveLoader: {
        modules: [nodeModules, realNodeModules]
      },
      entry: ENTRIES,
      output: OUTPUT,
      module: {
        rules: allRules.filter(r => !!r)
      },
      plugins: allPlugins.filter(p => !!p),
      node: {
        fs: 'empty',
        global: true,
        crypto: 'empty',
        tls: 'empty',
        net: 'empty',
        process: true,
        module: false,
        clearImmediate: false,
        setImmediate: false
      },
      devServer: {
        historyApiFallback: true
      }
    };
  }
}
