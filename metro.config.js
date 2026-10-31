const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Disable worker_threads so Metro workers run in isolated child processes,
// preventing single-process Wasm/heap OOM from hermes-parser + flow-parser Wasm instances on Windows.
config.transformer.unstable_workerThreads = false;

module.exports = config;
