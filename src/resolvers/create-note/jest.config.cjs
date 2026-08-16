const base = require('../../../jest.config.cjs');

/** @type {import('jest').Config} */
module.exports = {
  ...base,
  rootDir: '../../..',
  roots: ['<rootDir>/src/resolvers/create-note'],
};
