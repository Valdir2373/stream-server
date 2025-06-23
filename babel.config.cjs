// babel.config.cjs
module.exports = {
  presets: [
    [
      "@babel/preset-env",
      {
        targets: { node: "current" },
        // Remova 'modules: false'. Deixe o Babel decidir (ou use 'auto' ou 'cjs').
        // O Jest funciona melhor quando o Babel transpila import/export para CommonJS no contexto de teste.
        // A menos que você esteja usando um Jest Runner específico para ESM.
        // modules: 'auto' é o padrão, que muitas vezes significa CJS para Node.
      },
    ],
    "@babel/preset-typescript",
  ],
};
