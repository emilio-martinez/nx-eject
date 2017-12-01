import * as process from 'process';
import chalk, { Chalk } from 'chalk';

function logFn (name: string, typeColor: Chalk, msgColor: Chalk, callback?: () => void) {
  return (message?: any, ...optionalParams: any[]) => {
    console.log(typeColor(` ${name.toUpperCase()} `), msgColor(message, ...optionalParams));
    if (typeof callback === 'function') { callback(); }
  };
}

const _log = {
  info: logFn('info', chalk.bgBlueBright.black, chalk.blue),
  warn: logFn('warn', chalk.bgYellow.black, chalk.yellow),
  error: logFn('error', chalk.bgRed.black, chalk.red, () => process.exit(1))
};

export const log = Object.freeze(_log);
