// jest.config.mjs
/** @type {import('@jest/types').Config.InitialOptions} */
export default {
  testEnvironment: "node",

  // REMOVA ESTA LINHA: extensionsToTreatAsEsm: ['.ts', '.tsx'],
  // Não precisamos disso se o Babel vai transpilar para CJS para o Jest

  moduleNameMapper: {
    // Mantenha isso, pode ser útil para resolver caminhos absolutos/aliases
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },

  transform: {
    // Continua usando Babel para transpilar TS para JS (agora CJS)
    "^.+\\.(t|j)sx?$": ["babel-jest", {}],
  },

  transformIgnorePatterns: [
    "/node_modules/", // Simplifique para evitar problemas
  ],

  testMatch: ["<rootDir>/src/test/**/*.ts", "<rootDir>/src/test/**/*.tsx"],
};
