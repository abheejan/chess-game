const path = require('path');

module.exports = function override(config, env) {
  // Find and modify the source-map-loader rule
  config.module.rules.forEach(rule => {
    if (rule.enforce === 'pre' && rule.use) {
      rule.use.forEach(use => {
        if (typeof use === 'object' && use.loader && use.loader.includes('source-map-loader')) {
          // Add exclusions for problematic packages
          if (!rule.exclude) {
            rule.exclude = [];
          }
          rule.exclude.push(
            /node_modules\/chess\.js/,
            /node_modules\/@mediapipe\/tasks-vision/
          );
        }
      });
    }
  });

  // Alternative: Disable source map warnings entirely
  config.ignoreWarnings = [
    /Failed to parse source map/,
    /Module Warning \(from .*source-map-loader/
  ];

  return config;
}; 