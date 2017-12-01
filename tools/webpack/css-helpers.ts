import { Loader as WebpackLoader, Rule as WebpackRule, Plugin as WebpackPlugin } from 'webpack';
import { BuildTarget } from '../utils';

const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const customProperties = require('postcss-custom-properties');
const postcssUrl = require('postcss-url');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

const BROWSER_LIST = [
  'and_chr >= 57',
  'android >= 4.4',
  'chrome >= 49',
  'edge >= 12',
  'firefox >= 48',
  'ie >= 10',
  'ie_mob >= 11',
  'ios_saf >= 9',
  'opera >= 46',
  'safari >= 9.1',
  'samsung >= 4'
];

export function getCSSComponentRules(
  target: BuildTarget,
  globalStylePaths: string[],
  sourcemaps: boolean,
  extractCss: boolean
): WebpackRule[] {
  const cssSourceMap = extractCss && sourcemaps;
  const CSS_COMMON_LOADERS: WebpackLoader[] = [
    {
      loader: 'css-loader',
      options: {
        sourceMap: cssSourceMap,
        importLoaders: 1
      }
    },
    {
      loader: 'postcss-loader',
      options: {
        ident: 'postcss',
        plugins: getPostcssPlugins(target === BuildTarget.production),
        sourceMap: cssSourceMap
      }
    }
  ];

  const SASS_LOADER: WebpackLoader = {
    loader: 'sass-loader',
    options: {
      sourceMap: cssSourceMap,
      precision: 8,
      includePaths: []
    }
  };

  const CSS_COMPONENT_RULES: WebpackRule[] = [
    {
      exclude: globalStylePaths,
      test: /\.css$/,
      use: ['exports-loader?module.exports.toString()', ...CSS_COMMON_LOADERS]
    },
    {
      exclude: globalStylePaths,
      test: /\.scss$|\.sass$/,
      use: ['exports-loader?module.exports.toString()', ...CSS_COMMON_LOADERS, SASS_LOADER]
    }
  ];

  const CSS_GLOBAL_STYLE_RULES: WebpackRule[] = [
    {
      include: globalStylePaths,
      test: /\.css$/,
      use: cssLoaderFinalizeByExtract([...CSS_COMMON_LOADERS], extractCss)
    },
    {
      include: globalStylePaths,
      test: /\.scss$|\.sass$/,
      use: cssLoaderFinalizeByExtract([...CSS_COMMON_LOADERS, SASS_LOADER], extractCss)
    }
  ];

  return CSS_COMPONENT_RULES.concat(CSS_GLOBAL_STYLE_RULES);
}

function getPostcssPlugins(minimizeCss: boolean, deployUrl: string = '', baseHref: string = ''): () => WebpackPlugin[] {
  return function postcssPluginCreator () {
    // safe settings based on: https://github.com/ben-eb/cssnano/issues/358#issuecomment-283696193
    const importantCommentRe = /@preserve|@license|[@#]\s*source(?:Mapping)?URL|^!/i;
    const minimizeOptions = {
      autoprefixer: false,
      safe: true,
      mergeLonghand: false,
      discardComments: { remove: (comment: string) => !importantCommentRe.test(comment) }
    };

    return [
      postcssUrl([
        {
          // Only convert root relative URLs, which CSS-Loader won't process into require().
          filter: ({ url }: { url: string }) => url.startsWith('/') && !url.startsWith('//'),
          url: ({ url }: { url: string }) => {
            if (deployUrl.match(/:\/\//)) {
              // If deployUrl contains a scheme, ignore baseHref use deployUrl as is.
              return `${deployUrl.replace(/\/$/, '')}${url}`;
            } else if (baseHref.match(/:\/\//)) {
              // If baseHref contains a scheme, include it as is.
              return baseHref.replace(/\/$/, '') + `/${deployUrl}/${url}`.replace(/\/\/+/g, '/');
            } else {
              // Join together base-href, deploy-url and the original URL.
              // Also dedupe multiple slashes into single ones.
              return `/${baseHref}/${deployUrl}/${url}`.replace(/\/\/+/g, '/');
            }
          }
        },
        {
          // TODO: inline .cur if not supporting IE (use browserslist to check)
          filter: (asset: any) => !asset.hash && !asset.absolutePath.endsWith('.cur'),
          url: 'inline',
          // NOTE: maxSize is in KB
          maxSize: 10
        }
      ]),
      autoprefixer({
        browsers: BROWSER_LIST,
        cascade: false
      }),
      customProperties({ preserve: true })
    ].concat(minimizeCss ? [cssnano(minimizeOptions)] : []);
  };
}

function cssLoaderFinalizeByExtract(loaders: WebpackLoader[], extract: boolean): WebpackLoader[] {
  return extract
    ? ExtractTextPlugin.extract({
        use: [...loaders],
        publicPath: ''
      })
    : ['style-loader', ...loaders];
}
