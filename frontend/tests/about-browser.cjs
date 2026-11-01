const {chromium,expect}=require('@playwright/test');
const fs=require('node:fs');const path=require('node:path');const assert=require('node:assert/strict');
const origin='http://127.0.0.1:3188',api='http://127.0.0.1:3187';
const dir=path.resolve('../backend/tests/browser/about-evidence');fs.mkdirSync(dir,{recursive:true});
const publicOnly=process.argv.includes('--public-only'),cmsOnly=process.argv.includes('--cms-only');
const resultFile=publicOnly?'public-results.json':cmsOnly?'cms-results.json':'results.json';
const results=[];const pass=(name,detail='')=>{results.push({scenario:name,result:'PASS',detail});fs.writeFileSync(path.join(dir,resultFile),JSON.stringify(results,null,2));console.log('PASS',name,detail);};
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});
 let context=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block'});
 await context.route('**/*',route=>[origin,api].includes(new URL(route.request().url()).origin)?route.continue():route.abort());
 let page=await context.newPage();page.setDefaultTimeout(45000);page.setDefaultNavigationTimeout(90000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const shot=async(name,fullPage=true)=>page.screenshot({path:path.join(dir,name+'.png'),fullPage});
 try{
  await page.goto(origin+'/about',{waitUntil:'domcontentloaded'});assert.equal(await page.locator('h1').innerText(),'Technology Built Around Real Business Needs.');pass('Default About content renders');
  if(!publicOnly){
  await page.goto(api+'/admin/about-page',{waitUntil:'domcontentloaded'});assert.match(page.url(),/login/);
  await page.locator('input[type=email]').fill('about-admin@example.test');await page.locator('[id="data.password"]').fill('Disposable-About-Only-483!');await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.waitForURL(u=>!u.pathname.includes('login'),{waitUntil:'domcontentloaded'});
  await page.goto(api+'/admin/about-page',{waitUntil:'domcontentloaded'});await page.locator('[id="data.hero_title"]').waitFor();pass('Actual admin login and About management route');
  await page.locator('[id="data.hero_title"]').fill('Private About draft browser check');await page.getByRole('button',{name:'Save draft',exact:true}).first().click();await page.getByText('Draft saved. The public page is unchanged.',{exact:true}).waitFor();
  const publicDraft=await context.request.get(api+'/api/v1/pages/about');assert.equal((await publicDraft.json()).data.hero_title,'Technology Built Around Real Business Needs.');pass('Saved draft excluded from public API');
  await page.getByRole('button',{name:'Preview changes',exact:true}).click();await page.getByRole('region',{name:'Unpublished About page preview'}).waitFor();assert.match(await page.getByRole('region',{name:'Unpublished About page preview'}).innerText(),/Private About draft browser check/);await shot('admin-preview');pass('Unpublished admin content preview');
  await page.locator('[id="data.hero_title"]').fill('Technology Built Around Real Business Needs.');
  const uploader=page.locator('.filepond--root').first();
  const remove=uploader.locator('.filepond--action-remove-item');if(await remove.count()){
   await remove.first().click();await uploader.locator('.filepond--item').waitFor({state:'hidden'});
   await Promise.all([page.waitForResponse(r=>r.url().endsWith('/livewire/update')),page.getByRole('button',{name:'Save draft',exact:true}).first().click()]);
   await page.waitForTimeout(700);
  }
  await uploader.locator('input[type=file]').setInputFiles(path.resolve('public/security/stakeholder-review.jpg'));
  await page.locator('.filepond--item[data-filepond-item-state="processing-complete"]').first().waitFor();
  await Promise.all([page.waitForResponse(r=>r.url().endsWith('/livewire/update')),page.getByRole('button',{name:'Save draft',exact:true}).first().click()]);
  await page.getByText('Draft saved. The public page is unchanged.',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Publish changes',exact:true}).click();const modal=page.locator('.fi-modal-window:visible');await modal.waitFor();await shot('admin-publish-confirmation',false);await modal.getByRole('button',{name:'Confirm',exact:true}).click();await page.getByText('About page published.',{exact:true}).waitFor();pass('Explicit CMS publish confirmation');
  const published=(await (await context.request.get(api+'/api/v1/pages/about')).json()).data;
  assert.match(published.hero_image,/\/storage\/general\//);assert.equal((await context.request.get(published.hero_image)).status(),200);pass('Validated hero upload published and served from disposable storage');
  await page.locator('[id="data.hero_title"]').fill('Later unpublished change');await page.getByRole('button',{name:'Save draft',exact:true}).first().click();await page.getByText('Draft saved. The public page is unchanged.',{exact:true}).waitFor();
  await page.goto(origin+'/about',{waitUntil:'domcontentloaded'});assert.equal(await page.locator('h1').innerText(),'Technology Built Around Real Business Needs.');assert.match(await page.locator('main img').first().getAttribute('src'),/3187\/storage/);pass('Published CMS media reaches frontend; later draft remains private');
  }
  if(cmsOnly){assert.deepEqual(errors,[]);pass('No uncaught browser errors');return;}
  for(const width of [320,390,768,1440].filter(w=>!process.env.ABOUT_TEST_WIDTH||w===Number(process.env.ABOUT_TEST_WIDTH))){
   await context.close();context=await browser.newContext({viewport:{width,height:1000},serviceWorkers:'block'});
   await context.route('**/*',route=>[origin,api].includes(new URL(route.request().url()).origin)?route.continue():route.abort());
   page=await context.newPage();page.setDefaultTimeout(45000);page.setDefaultNavigationTimeout(90000);page.on('pageerror',e=>errors.push(e.message));
   await page.setViewportSize({width,height:1000});await page.goto(origin+'/about',{waitUntil:'domcontentloaded'});
   for(const img of await page.locator('main img').all()){
    await img.scrollIntoViewIfNeeded();await page.mouse.wheel(0,2);await page.waitForTimeout(150);
    try { await expect.poll(async()=>{await img.scrollIntoViewIfNeeded();return img.evaluate(el=>el.complete&&el.naturalWidth>0);},{timeout:30000}).toBe(true); }
    catch(error){console.log('IMAGE FAILURE',await img.evaluate(el=>({src:el.currentSrc,complete:el.complete,width:el.naturalWidth,html:el.outerHTML,connected:el.isConnected,bounds:el.getBoundingClientRect().toJSON()})),errors);throw error;}
   }
   await page.evaluate(()=>window.scrollTo(0,0));
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.equal(await page.locator('h1').count(),1);
   assert.equal(await page.locator('main img').evaluateAll(imgs=>imgs.filter(img=>!img.complete||img.naturalWidth===0).length),0);
   assert.equal(await page.locator('[aria-labelledby="services-title"] h3').count(),8);assert.equal(await page.locator('[aria-labelledby="products-title"] h3').count(),5);
   await shot('about-'+width);pass('Responsive layout and images '+width+'px');
  }
  const links=await page.locator('[aria-labelledby="services-title"] a,[aria-labelledby="products-title"] h3 a').evaluateAll(ns=>ns.map(n=>n.getAttribute('href')));
  for(const href of links){const response=await context.request.get(origin+href);assert.equal(response.status(),200,href);}pass('All eight service and five product destinations return 200');
  assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'),origin+'/about');assert.ok(await page.locator('meta[property="og:image"]').getAttribute('content'));pass('Canonical and Open Graph metadata');
  await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.locator('main section').first().locator('div').first().evaluate(el=>getComputedStyle(el).animationName),'none');pass('Reduced motion respected');
  assert.deepEqual(errors,[]);pass('No uncaught browser errors');
 }catch(e){results.push({scenario:'Browser completion',result:'FAIL',detail:e.message});fs.writeFileSync(path.join(dir,resultFile),JSON.stringify(results,null,2));console.error(e);console.log((await page.locator('body').innerText()).slice(-3000));await shot('failure');process.exitCode=1;}finally{await browser.close();}
})();
