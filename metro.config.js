const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Pin React Native Gradle plugin to 0.81.0 to fix serviceOf issue
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;