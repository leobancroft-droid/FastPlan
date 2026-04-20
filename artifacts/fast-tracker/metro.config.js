const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.resolver.blockList = [
  /\/node_modules\/@bacons\/.*/,
  /\/targets\/.*/,
];

module.exports = config;
