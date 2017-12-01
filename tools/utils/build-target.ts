import { log } from './logger';

export enum BuildTarget {
  development = 'development',
  production = 'production'
}

/**
 * Returns proper build target.
 * Will throw if an invalid target is given.
 */
export function ensureBuildTarget(target: BuildTarget): BuildTarget {
  if (!target) {
    return BuildTarget.development;
  }
  if (target in BuildTarget === false) {
    log.error(`Invalid target '${target}' was provided. Valid options are '${Object.keys(BuildTarget).join('\', \'')}'.`);
  }
  return target;
}
