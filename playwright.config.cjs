const {defineConfig,devices} = require('@playwright/test');
const viewports = [
  ['small',{width:320,height:568}],
  ['SE',{width:375,height:667}],
  ['iPhone14',{width:390,height:844}],
  ['ProMax',{width:430,height:932}],
  ['landscape',{width:844,height:390}],
];
module.exports = defineConfig({
  testDir:'./tests', testMatch:'**/*.spec.cjs', timeout:60000, expect:{timeout:5000},
  fullyParallel:true, workers:2,
  reporter:[['list'],['json',{outputFile:'evidence/bookshop-v0624/final-results.json'}]],
  use:{baseURL:process.env.BASE_URL || 'http://127.0.0.1:4173',trace:'retain-on-failure',screenshot:'only-on-failure'},
  outputDir:'evidence/bookshop-v0624/final-test-results',
  projects:['chromium','webkit'].flatMap(browserName=>viewports.map(([name,viewport])=>({name:browserName+'-'+name,testIgnore:[...(name==='iPhone14'?[]:['**/mobile.spec.cjs'])],use:{...devices['iPhone 13'],browserName,viewport,deviceScaleFactor:1}})))
});
