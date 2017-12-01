import { stderr } from 'process';
import * as ProgressBar from 'progress';
import chalk from 'chalk';

const stream = stderr;
const enabled = stream && stream.isTTY;

const barLeft = chalk.bold('[');
const barRight = chalk.bold(']');
const barNamespace = chalk.bgGreen.black(' webpack '.toUpperCase());
const barPercent = chalk.magenta(' :percent');
const barFormat = `${barNamespace} ${barLeft} :bar ${barRight} ${barPercent} :msg `;
const barMsg = (msg: string) => chalk.cyan(msg);

const barOptions = {
  complete: '=',
  incomplete: ' ',
  width: 20,
  total: 100,
  clear: true
};

const bar = new ProgressBar(barFormat, barOptions);

let running = false;
// let startTime = 0;
let lastPercent = 0;

export function webpackProgressHandler (percent: number, msg: string) {
  if (!enabled) { return; }

  if (!running && lastPercent !== 0) {
    stream.write('\n');
  }

  const newPercent = Math.ceil(percent * barOptions.width);

  if (lastPercent !== newPercent) {
    bar.update(percent, {
      msg: barMsg(msg)
    });
    lastPercent = newPercent;
  }

  if (!running) {
    running = true;
    // startTime = Date.now();
    lastPercent = 0;
  } else if (percent === 1) {
    // let now = Date.now();
    // let buildTime = (now - startTime) / 1000 + 's';

    bar.terminate();

    running = false;
  }
}
