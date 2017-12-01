import * as fs from 'fs-extra';
import * as path from 'path';
import * as process from 'process';
import { log, SwAppConfig, getAppFromNgConfig } from '../tools/utils';
import { E2eTask } from '../tools/tasks';

const argv = require('minimist')(process.argv.slice(2), {
  boolean: ['verbose']
});

const e2eTask = new E2eTask(argv);

const projectRoot = process.cwd();
const appConfig: SwAppConfig = getAppFromNgConfig(e2eTask.taskOptions.app);
const outputPath = appConfig.outDir;

if (projectRoot === path.resolve(outputPath)) {
  log.error(`Output path MUST not be project root directory!`);
}

/** Clean output path */
const pathToClear = path.resolve(projectRoot, outputPath);
log.warn(`Clearing output directory ${pathToClear}`);
fs.removeSync(path.resolve(projectRoot, outputPath));

log.info(`Starting e2e task`);
e2eTask.serveAndRun();
