import * as fs from 'fs-extra';
import * as path from 'path';
import * as process from 'process';
import { log, SwAppConfig, getAppFromNgConfig } from '../tools/utils';
import { BuildTask } from '../tools/tasks';

const argv = require('minimist')(process.argv.slice(2), {
  boolean: ['verbose']
});
const buildTask = new BuildTask(argv);

const projectRoot = process.cwd();
const appConfig: SwAppConfig = getAppFromNgConfig(buildTask.taskOptions.app);
const outputPath = appConfig.outDir;

if (projectRoot === path.resolve(outputPath)) {
  log.error(`Output path MUST not be project root directory!`);
}

/** Clean output path */
const pathToClear = path.resolve(projectRoot, outputPath);
log.warn(`Clearing output directory ${pathToClear}`);
fs.removeSync(path.resolve(projectRoot, outputPath));

log.info(`Starting build task`);
buildTask.run();
