// Local GET-only fixture API. Never creates subscribers or contacts production.
const http=require('node:http');
const article={id:1,slug:'newsletter-fixture',title:'Technology and ideas',excerpt:'Editorial fixture for local newsletter checks.',status:'published',published_at:'2026-10-28T12:00:00Z',category:{id:1,name:'Technology',slug:'technology',type:'news',status:'active'},content:Array.from({length:35},(_,i)=>`<p>Insight ${i+1}. Technology helps people build useful products. This local fixture contains no live editorial data.</p>`).join('')};
http.createServer((req,res)=>{res.setHeader('Content-Type','application/json');res.setHeader('Access-Control-Allow-Origin','http://127.0.0.1:3138');if(req.method!=='GET'){res.writeHead(405);return res.end('{}');}const path=new URL(req.url,'http://localhost').pathname;let data=[];
if(/\/(news|blog)\/newsletter-fixture$/.test(path))data=article;
else if(/\/(news|blog)$/.test(path))data=Array.from({length:6},(_,i)=>({...article,id:i+1}));
else if(path.endsWith('/services/web-development'))data={id:1,name:'Web Development',slug:'web-development',status:'published',seo:{}};
else if(path.endsWith('/search'))data={news:[],blog:[],products:[],services:[]};
res.end(JSON.stringify({data,meta:{current_page:1,last_page:1,total:6,per_page:12}}));}).listen(3139,'127.0.0.1',()=>console.log('Newsletter GET-only fixtures on 3139'));
