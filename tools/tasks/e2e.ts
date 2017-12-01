import * as url from 'url';
import { checkPort } from '@angular/cli/utilities/check-port';
import { getProtractorConfig, log } from '../utils';
import { ServeTask, ServeTaskOptions } from './serve';

interface E2ETaskOptions extends ServeTaskOptions {
  config: string;
  webdriverUpdate: boolean;
  specs: string[];
  elementExplorer: boolean;
}

export class E2eTask {
  taskOptions: E2ETaskOptions;
  serveTask: ServeTask;

  constructor (argv: any) {
    this.serveTask = new ServeTask(argv);
    const serveTaskOptions = this.serveTask.taskOptions;
    this.taskOptions = Object.assign({}, serveTaskOptions, {
      config: getProtractorConfig(),
      webdriverUpdate: argv.webdriverUpdate || true || argv.wu === true,
      elementExplorer: argv.elementExplorer === true || argv.ee === true,
      specs: argv.specs || []
    });
  }

  run () {
    const taskOptions = this.taskOptions;

    const protractorLauncher = require('protractor/built/launcher');

    return new Promise(function () {
      let promise = Promise.resolve();
      const additionalProtractorConfig: any = {
        elementExplorer: taskOptions.elementExplorer
      };

      // use serve url as override for protractors baseUrl
      if (taskOptions.publicHost) {
        let publicHost = taskOptions.publicHost;
        if (!/^\w+:\/\//.test(publicHost)) {
          publicHost = `${taskOptions.ssl ? 'https' : 'http'}://${publicHost}`;
        }
        const clientUrl = url.parse(publicHost);
        taskOptions.publicHost = clientUrl.host;
        additionalProtractorConfig.baseUrl = url.format(clientUrl);
      } else {
        additionalProtractorConfig.baseUrl = url.format({
          protocol: taskOptions.ssl ? 'https' : 'http',
          hostname: taskOptions.host,
          port: taskOptions.port.toString()
        });
      }

      if (taskOptions.specs.length !== 0) {
        additionalProtractorConfig['specs'] = taskOptions.specs;
      }

      if (taskOptions.webdriverUpdate) {
        // The webdriver-manager update command can only be accessed via a deep import.
        const webdriverDeepImport = 'webdriver-manager/built/lib/cmds/update';
        let webdriverUpdate: any;

        try {
          // When using npm, webdriver is within protractor/node_modules.
          webdriverUpdate = require(`protractor/node_modules/${webdriverDeepImport}`);
        } catch (e) {
          try {
            // When using yarn, webdriver is found as a root module.
            webdriverUpdate = require(webdriverDeepImport);
          } catch (e) {
            log.error([
              'Cannot automatically find webdriver-manager to update.',
              `Please update webdriver-manager manually instead.`
            ].join(' '));
          }
        }
        // run `webdriver-manager update --standalone false --gecko false --quiet`
        // if you change this, update the command comment in prev line, and in `eject` task
        promise = promise.then(() => webdriverUpdate.program.run({
          standalone: false,
          gecko: false,
          quiet: true
        }));
      }

      // Don't call resolve(), protractor will manage exiting the process itself
      return promise.then(() =>
        protractorLauncher.init(taskOptions.config, additionalProtractorConfig));
    });
  }

  serveAndRun () {
    const taskOptions = this.taskOptions;

    return new Promise((resolve, reject) => {
      let firstRebuild = true;

      function rebuildCb(stats: any) {
        // don't run re-run tests on subsequent rebuilds
        const cleanBuild = !!!stats.compilation.errors.length;
        if (firstRebuild && cleanBuild) {
          firstRebuild = false;
          return resolve(this.run());
        } else {
          return reject('Build did not succeed. Please fix errors before running e2e task');
        }
      }

      checkPort(taskOptions.port, taskOptions.host)
        .then((port: number) => taskOptions.port = port)
        .then(() => this.serveTask.run(rebuildCb.bind(this)))
        .catch(reject);
    });
  }
}
