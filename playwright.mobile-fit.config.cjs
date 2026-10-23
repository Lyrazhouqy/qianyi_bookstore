const base=require('./playwright.config.cjs');
module.exports={...base,testMatch:'**/mobile-fit.spec.cjs',outputDir:'evidence/mobile-fit/matrix-results',projects:[...base.projects,...['chromium','webkit'].flatMap(browserName=>[
 ['Android360',{width:360,height:800}],['Android412',{width:412,height:915}],['tablet',{width:768,height:1024}]
].map(([name,viewport])=>({name:browserName+'-'+name,use:{...base.use,browserName,viewport,isMobile:true,hasTouch:true,deviceScaleFactor:1}})))]};
