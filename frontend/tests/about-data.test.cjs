const {test,after}=require('node:test');const assert=require('node:assert/strict');
process.env.NEXT_PUBLIC_API_URL='http://127.0.0.1:9/api/v1';
const {getAboutPageData,aboutDefaults,aboutImage}=require('../lib/about.ts');
const originalFetch=global.fetch;after(()=>global.fetch=originalFetch);
test('selected published CMS records resolve by slug without a first-page limit',async()=>{
 const paths=[];global.fetch=async url=>{const p=new URL(url).pathname;paths.push(p);const data=p.endsWith('/pages/about')?{...aboutDefaults,product_slugs:['qa-only-product'],service_slugs:['qa-only-service']}:p.endsWith('/products/qa-only-product')?{slug:'qa-only-product',name:'Disposable QA product',status:'published',short_description:'Test fixture only.'}:{slug:'qa-only-service',name:'Disposable QA service',status:'published',short_description:'Test fixture only.'};return new Response(JSON.stringify({data}),{status:200});};
 const result=await getAboutPageData();assert.equal(result.productCards[0].href,'/products/qa-only-product');assert.equal(result.serviceCards[0].href,'/services/qa-only-service');assert.ok(paths.includes('/api/v1/products/qa-only-product'));assert.ok(!paths.some(p=>p==='/api/v1/products'));
});
test('unpublished or unavailable selected records are not displayed',async()=>{
 global.fetch=async url=>new Response(JSON.stringify({data:new URL(url).pathname.endsWith('/pages/about')?{...aboutDefaults,product_slugs:['qa-private'],service_slugs:[]}:{slug:'qa-private',name:'Private test fixture',status:'draft'}}),{status:200});
 const result=await getAboutPageData();assert.deepEqual(result.productCards,[]);
});
test('external and protocol-relative image origins fall back safely',()=>{assert.equal(aboutImage('https://untrusted.example/image.png','/fallback.jpg'),'/fallback.jpg');assert.equal(aboutImage('//untrusted.example/image.png','/fallback.jpg'),'/fallback.jpg');assert.equal(aboutImage('general/test.jpg','/fallback.jpg'),'http://127.0.0.1:9/storage/general/test.jpg');});
