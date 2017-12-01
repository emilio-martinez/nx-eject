
import * as fs from 'fs-extra';
import * as path from 'path';
import * as process from 'process';
import { log } from './logger';

const CLI_CONFIG_FILE_NAME = '.angular-cli.json';
const CLI_CONFIG_FILE_NAME_ALT = 'angular-cli.json';

function getNgCliConfig () {
  const CWD = process.cwd();
  const configFiles = [CLI_CONFIG_FILE_NAME, CLI_CONFIG_FILE_NAME_ALT]
    .map(fileName => path.resolve(CWD, fileName))
    .filter(filePath => fs.pathExistsSync(filePath))
    .map(filePath => fs.readJsonSync(filePath, { encoding: 'utf-8', throws: true }));

  if (configFiles.length === 0) {
    log.error('No configuration files found.');
  }

  return configFiles[0];
}

export function getAppFromNgConfig(nameOrIndex?: String) {
  const apps: any[] = getNgCliConfig().apps;
  if (!apps) {
    log.error('Unable to find any apps in config.');
  }

  if (nameOrIndex) {
    if (nameOrIndex.match(/^[0-9]+$/)) {
      const index = parseInt(nameOrIndex.toString(), 10);
      if (apps[index]) {
        return apps[index];
      }
    } else {
      const filtered = apps.filter((currentApp: any) => currentApp.name === nameOrIndex);
      if (filtered.length > 0) {
        return filtered[0];
      }
    }
  } else {
    return apps[0];
  }

  log.error('Unable to find app with name or index. Please verify the configuration.');
}

export function getKarmaConfig () {
  const testConfig = getNgCliConfig().test;

  if (!testConfig.karma.config) {
    log.error('No karma config found in config.');
  }

  return testConfig.karma.config;
}

export function getProtractorConfig () {
  const e2eConfig = getNgCliConfig().e2e;

  if (!e2eConfig.protractor.config) {
    log.error('No protractor config found in config.');
  }

  return e2eConfig.protractor.config;
}
