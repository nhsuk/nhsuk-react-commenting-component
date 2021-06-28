// Mapping from package name to exposed global variable.
const exposedDependencies = {
  'focus-trap-react': 'FocusTrapReact',
  'react': 'React',
  'react-dom': 'ReactDOM',
  'react-transition-group/CSSTransitionGroup': 'CSSTransitionGroup',
  'draft-js': 'DraftJS',
};

module.exports = function exports() {
  return {
    entry: [
      './src/entrypoints/admin/comments.js',
      './src/utils/polyfills.js',
    ],
    output: {
      filename: 'nhs-comments.js',
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js'],

      // Some libraries import Node modules but don't use them in the browser.
      // Tell Webpack to provide empty mocks for them so importing them works.
      fallback: {
        fs: false,
        net: false,
        tls: false,
      },
    },
    externals: {
      jquery: 'jQuery',
    },
    module: {
      rules: [
        {
          test: /\.(js|ts)x?$/,
          loader: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.scss$/,
          use: [
            'style-loader',
            'css-loader',
            'sass-loader'
          ]
        },
        {
          test: /\.css$/,
          use: [
            'style-loader',
            'css-loader',
          ]
        }
      ].concat(Object.keys(exposedDependencies).map((name) => {
        const globalName = exposedDependencies[name];

        // Create expose-loader configs for each Wagtail dependency.
        return {
          test: require.resolve(name),
          use: [
            {
              loader: 'expose-loader',
              options: {
                exposes: {
                  globalName,
                  override: true
                }
              },
            },
          ],
        };
      }))
    },

    optimization: {
      splitChunks: {
        cacheGroups: {
          vendor: {
            name: 'wagtail/admin/static/wagtailadmin/js/vendor',
            chunks: 'initial',
            minChunks: 2,
            reuseExistingChunk: true,
          },
        },
      },
    },

    // See https://webpack.js.org/configuration/devtool/.
    devtool: 'source-map',

    // For development mode only.
    watchOptions: {
      poll: 1000,
      aggregateTimeout: 300,
    },

    // Disable performance hints – currently there are much more valuable
    // optimizations for us to do outside of Webpack
    performance: {
      hints: false
    },

    stats: {
      // Add chunk information (setting this to `false` allows for a less verbose output)
      chunks: false,
      // Add the hash of the compilation
      hash: false,
      // `webpack --colors` equivalent
      colors: true,
      // Add information about the reasons why modules are included
      reasons: false,
      // Add webpack version information
      version: false,
    },
  };
};
