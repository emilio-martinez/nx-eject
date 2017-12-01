import { extraEntryParser, lazyChunksFilter } from '@angular/cli/models/webpack-configs';

export function parseCssEntries(appRoot: string, styles: any[]) {
  const ENTRY_KEY = 'styles';
  const entryPoints: { [key: string]: string[] } = {};
  const globalStylePaths: string[] = [];

  if (styles.length > 0) {
    const globalStyles = extraEntryParser(styles, appRoot, ENTRY_KEY);
    // add style entry points
    globalStyles.forEach(style =>
      entryPoints[style.entry]
        ? entryPoints[style.entry].push(style.path)
        : entryPoints[style.entry] = [style.path]
    );
    // add global css paths
    globalStylePaths.push(...globalStyles.map((style) => style.path));
  }

  return {
    entry: entryPoints[ENTRY_KEY],
    global: globalStylePaths
  };
}

export function getLazyChunks (appRoot: string, scripts: any[], styles: any[]) {
  return lazyChunksFilter([
    ...extraEntryParser(scripts, appRoot, 'scripts'),
    ...extraEntryParser(styles, appRoot, 'styles')
  ]);
}
