const fs = require('fs');
const path = require('path');
const prettier = require('prettier');
const resolve = require('resolve');

const boltRcConfigPath = resolve.sync('@bolt/starter-kit/.boltrc.js');
const boltRcConfig = require(boltRcConfigPath);

function updateBoltRcConfig(newPackageName, testingPath) {
  // check if this component has already been added to the .boltrc config and if so, exit early
  if (boltRcConfig.components.global.includes(newPackageName)) {
    console.warn(
      `the .boltrc config already has the new ${newPackageName} component added -- skipped adding this component automatically`,
    );
  } else {
    const updatedBoltRcContent = fs
      .readFileSync(boltRcConfigPath)
      .toString()
      .replace(/global: \[/, `global: [\n      '${newPackageName}',`);

    const updatedPrettyBoltRcContent = prettier.format(updatedBoltRcContent, {
      singleQuote: true,
      trailingComma: 'es5',
      bracketSpacing: true,
      jsxBracketSameLine: true,
      parser: 'flow',
    });

    if (testingPath) {
      fs.writeFileSync(`${testingPath}/.boltrc.js`, updatedPrettyBoltRcContent);
    } else {
      fs.writeFileSync(boltRcConfigPath, updatedPrettyBoltRcContent);
    }
  }
}

module.exports = {
  updateBoltRcConfig,
};
