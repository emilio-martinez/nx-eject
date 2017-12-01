import * as fs from 'fs-extra';
import * as path from 'path';
import { TestTask } from '../tools/tasks';
import { log } from '../tools/utils';

const argv = require('minimist')(process.argv.slice(2), {
  boolean: ['verbose']
});
const testTask = new TestTask(argv);

const projectRoot = process.cwd();

/** Clean output path */
const pathToClear = path.resolve(projectRoot, TestTask.outputDirName);
log.warn(`Clearing output directory ${pathToClear}`);
fs.removeSync(path.resolve(projectRoot, TestTask.outputDirName));

log.info(`Starting test task`);
testTask.run();
