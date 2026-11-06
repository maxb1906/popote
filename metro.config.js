// Learn more: https://docs.expo.dev/guides/customizing-metro
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// The Anthropic SDK's ESM build has import cycles that Metro evaluates too early
// ("Cannot access ... before initialization"). Its CommonJS build is cycle-safe, so use that one.
const anthropicCjs = path.join(__dirname, 'node_modules/@anthropic-ai/sdk/index.js');
const defaultResolve = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@anthropic-ai/sdk') return { type: 'sourceFile', filePath: anthropicCjs };
  if (context.originModulePath.includes(`${path.sep}@anthropic-ai${path.sep}sdk${path.sep}`)) {
    // keep resolving inside the SDK with the "require" condition, so .js (CJS) files are used
    return context.resolveRequest({ ...context, unstable_conditionNames: ['require', 'default'] }, moduleName, platform);
  }
  return (defaultResolve ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = config;
