import * as fs from 'fs-extra';
import * as path from 'path';
import * as webpack from 'webpack';
import { getWebpackStatsConfig } from '@angular/cli/models/webpack-configs';
import { statsWarningsToString, statsErrorsToString, statsToString } from '@angular/cli/utilities/stats';
import { ensureBuildTarget, SwAppConfig, log, BuildTarget, getAppFromNgConfig } from '../utils';
import { AppWebpackConfig } from '../webpack';

export class BuildTask {
  taskOptions: {
    app: string;
    target: BuildTarget;
    verbose: boolean;
    watch: boolean;
    stats: boolean;
  };

  constructor (argv: any) {
    this.taskOptions = {
      app: argv.app || argv.a,
      target: ensureBuildTarget(argv.target),
      verbose: argv.verbose === true,
      watch: argv.watch === true,
      stats: argv.stats === true
    };
  }

  run () {
    const taskOptions = this.taskOptions;

    const appConfig: SwAppConfig = getAppFromNgConfig(taskOptions.app);
    const outputPath = appConfig.outDir;

    if (!appConfig.main) {
      log.error(`An app without 'main' cannot be built.`);
    }

    log.info(`Preparing to build '${appConfig.name}' in ${taskOptions.target.toUpperCase()} mode.`);

    const webpackConfig = new AppWebpackConfig(appConfig).buildConfig({
      target: taskOptions.target,
      serve: false,
      verbose: taskOptions.verbose
    });
    const webpackCompiler = webpack(webpackConfig);
    const statsConfig = getWebpackStatsConfig(taskOptions.verbose);

    new Promise((resolve, reject) => {
      const callback: webpack.compiler.CompilerCallback = (err, stats) => {
        if (err) {
          return reject(err);
        }

        const json = stats.toJson('verbose');
        if (taskOptions.verbose) {
          log.info(stats.toString(statsConfig));
        } else {
          log.info(statsToString(json, statsConfig));
        }

        if (stats.hasWarnings()) {
          log.warn(statsWarningsToString(json, statsConfig));
        }
        if (stats.hasErrors()) {
          log.error(statsErrorsToString(json, statsConfig));
        }

        if (taskOptions.watch) {
          return;
        } else if (taskOptions.stats) {
          fs.writeFileSync(
            path.resolve(appConfig.root, outputPath, 'stats.json'),
            JSON.stringify(stats.toJson(), null, 2)
          );
        }

        if (stats.hasErrors()) {
          reject();
        } else {
          // if (!!app.serviceWorker && runTaskOptions.target === 'production' &&
          //     usesServiceWorker(appConfig.root) && runTaskOptions.serviceWorker !== false) {
          //   const appRoot = path.resolve(appConfig.root, app.root);
          //   augmentAppWithServiceWorker(appConfig.root, appRoot, path.resolve(outputPath),
          //       runTaskOptions.baseHref || '/')
          //     .then(() => resolve(), (err: any) => reject(err));
          // } else {
            resolve();
          // }
        }
      };

      if (taskOptions.watch) {
        webpackCompiler.watch({}, callback);
      } else {
        webpackCompiler.run(callback);
      }
    })
    .catch((err: Error) => {
      if (err) {
        log.error('\nAn error occurred during the build:\n' + ((err && err.stack) || err));
      }
      throw err;
    });
  }
}
