import * as url from 'url';
import * as webpack from 'webpack';
import { getWebpackStatsConfig } from '@angular/cli/models/webpack-configs';
import { statsToString, statsWarningsToString, statsErrorsToString } from '@angular/cli/utilities/stats';
import { ensureBuildTarget, SwAppConfig, log, BuildTarget, getAppFromNgConfig } from '../utils';
import { AppWebpackConfig, WebpackDevServerConfigurationOptions } from '../webpack';
import { checkPort } from '@angular/cli/utilities/check-port';

const WebpackDevServer = require('webpack-dev-server');
const opn = require('opn');

const DEFAULT_PORT = 3000;

export interface ServeTaskOptions {
  app: string;
  target: BuildTarget;
  verbose: boolean;
  ssl: boolean;
  host: string;
  port: number;
  publicHost: string;
  baseHref: string;
  deployUrl: string;
  disableHostCheck: boolean;
  hmr: boolean;
}

export class ServeTask {
  taskOptions: ServeTaskOptions;

  constructor (argv: any) {
    const port = parseInt(argv.port, 10);
    this.taskOptions = {
      app: argv.app || argv.a,
      target: ensureBuildTarget(argv.target),
      verbose: argv.verbose === true,
      ssl: argv.ssl === true,
      host: argv.host || 'localhost',
      port: typeof port === 'number' && !isNaN(port) ? port : DEFAULT_PORT,
      publicHost: argv.publicHost,
      baseHref: '',
      deployUrl: '',
      disableHostCheck: true,
      hmr: argv.hmr === true && ensureBuildTarget(argv.target) === BuildTarget.development
    };
  }

  run (rebuildDoneCb?: any) {

    const taskOptions = this.taskOptions;
    const appConfig: SwAppConfig = getAppFromNgConfig(taskOptions.app);

    return checkPort(taskOptions.port, taskOptions.host, DEFAULT_PORT)
      .then((port: number) => taskOptions.port = port)
      .then(port => {

        // TODO: Review disableHostCheck
        // if (serveTaskOptions.disableHostCheck) {
        //   log.warn([
        //     'Running a server with --disable-host-check is a security risk.',
        //     'See https://medium.com/webpack/webpack-dev-server-middleware-security-issues-1489d950874a for more information.'
        //   ].join(' '));
        // }

        const webpackConfig = new AppWebpackConfig(appConfig).buildConfig({
          target: taskOptions.target,
          serve: true,
          hmr: taskOptions.hmr,
          port: port,
          verbose: taskOptions.verbose
        });
        const serverAddress = url.format({
          protocol: taskOptions.ssl ? 'https' : 'http',
          hostname: taskOptions.host === '0.0.0.0' ? 'localhost' : taskOptions.host,
          port: port.toString()
        });

        const webpackCompiler = webpack(webpackConfig);

        if (rebuildDoneCb) {
          webpackCompiler.plugin('done', rebuildDoneCb);
        }

        const statsConfig = getWebpackStatsConfig(taskOptions.verbose);

        // TODO: Add SSL compat
        // let sslKey: string = null;
        // let sslCert: string = null;
        // if (taskOptions.ssl) {
        //   const keyPath = path.resolve(this.project.root, taskOptions.sslKey);
        //   if (fs.existsSync(keyPath)) {
        //     sslKey = fs.readFileSync(keyPath, 'utf-8');
        //   }
        //   const certPath = path.resolve(this.project.root, taskOptions.sslCert);
        //   if (fs.existsSync(certPath)) {
        //     sslCert = fs.readFileSync(certPath, 'utf-8');
        //   }
        // }

        const servePath = '';
        const webpackDevServerConfiguration: WebpackDevServerConfigurationOptions = {
          headers: { 'Access-Control-Allow-Origin': '*' },
          historyApiFallback: {
            index: `${servePath}/${appConfig.index}`,
            disableDotRule: true,
            htmlAcceptHeaders: ['text/html', 'application/xhtml+xml']
          },
          stats: taskOptions.verbose ? statsConfig : 'none',
          inline: true,
          compress: taskOptions.target === BuildTarget.production,
          https: taskOptions.ssl,
          overlay: {
            errors: taskOptions.target === BuildTarget.development,
            warnings: false
          },
          contentBase: false,
          public: taskOptions.publicHost,
          disableHostCheck: taskOptions.disableHostCheck,
          publicPath: '/',
          hot: taskOptions.hmr
        };

        log.info(`Development Server is listening on ${taskOptions.host}:${port}.`);

        const server = new WebpackDevServer(webpackCompiler, webpackDevServerConfiguration);

        if (!taskOptions.verbose) {
          webpackCompiler.plugin('done', (stats: any) => {
            const json = stats.toJson('verbose');

            log.info(statsToString(json, statsConfig));

            if (stats.hasWarnings()) {
              log.warn(statsWarningsToString(json, statsConfig));
            }
            if (stats.hasErrors()) {
              log.error(statsErrorsToString(json, statsConfig));
            }
          });
        }

        return new Promise((_, reject) => {
          const httpServer = server.listen(port, taskOptions.host, (err: any, _stats: any) => {
              if (err) {
                return reject(err);
              }

              opn(serverAddress);
            }
          );

          /**
           * Node 8 has a keepAliveTimeout bug which doesn't respect active connections.
           * Connections will end after ~5 seconds (arbitrary), often not letting the full download
           * of large pieces of content, such as a vendor javascript file.  This results in browsers
           * throwing a "net::ERR_CONTENT_LENGTH_MISMATCH" error.
           * https://github.com/angular/angular-cli/issues/7197
           * https://github.com/nodejs/node/issues/13391
           * https://github.com/nodejs/node/commit/2cb6f2b281eb96a7abe16d58af6ebc9ce23d2e96
           */
          if (/^v8.\d.\d+$/.test(process.version)) {
            httpServer.keepAliveTimeout = 30000; // 30 seconds
          }
        })
        .catch((err: Error) => {
          if (err) {
            log.error('\nAn error occurred during the build:\n' + ((err && err.stack) || err));
          }
          throw err;
        });
      });
  }
}
