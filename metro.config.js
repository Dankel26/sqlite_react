const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Agregar soporte para archivos WASM (fix expo-sqlite web)
config.resolver.assetExts.push('wasm');

module.exports = config;

