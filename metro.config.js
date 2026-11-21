const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Disable worker_threads so Metro workers run in isolated child processes,
// preventing single-process Wasm/heap OOM from hermes-parser + flow-parser Wasm instances on Windows.
config.transformer.unstable_workerThreads = false;

// Cap Metro workers so multi-core Windows machines (which otherwise default to ~10+ parallel Node
// worker processes) don't exhaust the Windows virtual memory commit limit ("Committing semi space failed" / "Zone").
config.maxWorkers = 2;

module.exports = config;
