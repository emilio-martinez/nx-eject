import * as path from 'path';
import * as process from 'process';
import * as karma from 'karma';
import { SwAppConfig, log, getAppFromNgConfig, getKarmaConfig } from '../utils';

const { DEFAULT_PORT, VERSION } = karma.constants;

interface TestOptions {
  app?: string;
  watch?: boolean;
  logLevel?: string;
  port?: number;
  progress?: boolean;
}

export class TestTask {

  static readonly outputDirName = 'coverage';

  taskOptions: TestOptions;

  constructor(argv: any) {
    const port = parseInt(argv.port, 10);
    const argvLogLevel = argv.log || argv.logLevel;
    const logLevel = /^(disable|error|warn|info|debug|log)$/i.test(argvLogLevel) ? argvLogLevel : 'warn';
    this.taskOptions = {
      app: argv.app || argv.a,
      watch: argv.watch === true,
      logLevel: karma.constants[`LOG_${logLevel.toUpperCase()}`],
      port: typeof port === 'number' && !isNaN(port) ? port : DEFAULT_PORT,
      progress: argv.progress === true
    };
  }

  run() {
    const taskOptions = this.taskOptions;
    console.log(taskOptions);
    const appConfig: SwAppConfig = getAppFromNgConfig(taskOptions.app);

    if (!appConfig.main) {
      log.error(`An app without 'main' cannot be built.`);
    }

    return new Promise(_ => {
      const karmaOverrides = {
        port: taskOptions.port,
        singleRun: !taskOptions.watch,
        logLevel: taskOptions.logLevel,
        angularCli: {
          codeCoverage: true,
          sourcemaps: true,
          progress: taskOptions.progress,
          preserveSymlinks: true,
          forceTsCommonjs: false,
          app: taskOptions.app
        }
      };

      const karmaConfigPath = path.resolve(process.cwd(), getKarmaConfig());
      const karmaConfig = karma.config.parseConfig(karmaConfigPath, karmaOverrides);

      const karmaServer = new karma.Server(karmaConfig, karmaExit);
      /** On exit, force karma to stop */
      process.on('SIGINT', () => {
        log.warn(`Terminating Karma...`);
        karma.stopper.stop(karmaConfig, karmaExit);
      });

      function karmaExit(exitCode) {
        /**
         * Properly exit karma when it exits with an error code
         * and browsers haven't closed the connection.
         */
        const logMethod = exitCode > 0 ? log.error : log.info;
        logMethod(`Karma has exited with ${exitCode}.`);
        process.exit(exitCode);
      }

      log.info(`Preparing to execute tests with Karma v${VERSION}...`);
      log.info(`Log level set to ${taskOptions.logLevel}.`);
      karmaServer.start();
    });
  }
}
