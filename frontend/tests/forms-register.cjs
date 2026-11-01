// Compile source in memory; never emit or modify application files.
const fs = require('node:fs');
const Module = require('node:module');
const ts = require('typescript');
for (const extension of ['.ts', '.tsx']) {
  require.extensions[extension] = (module, filename) => {
    const source = fs.readFileSync(filename, 'utf8');
    const { outputText } = ts.transpileModule(source, { compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
    }, fileName: filename });
    module._compile(outputText, filename);
  };
}
require.extensions['.css'] = module => { module.exports = { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) }; };
const load = Module._load;
Module._load = function(name, parent, main) {
  if (name === 'next/image') return { __esModule: true, default: ({ fill, priority, sizes, ...props }) => require('react').createElement('img', props) };
  if (name === 'next/link') return { __esModule: true, default: props => require('react').createElement('a', props) };
  return load.call(this, name, parent, main);
};
