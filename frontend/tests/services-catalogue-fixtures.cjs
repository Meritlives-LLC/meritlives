// Disposable GET-only data: no application database or writes.
const http = require('node:http');
const service = { id: 1, name: 'Web Development', slug: 'web-development', status: 'published', description: '', short_description: '', seo: {} };
http.createServer((req,res)=>{
  res.setHeader('Content-Type','application/json');
  res.setHeader('Access-Control-Allow-Origin','http://127.0.0.1:3138');
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);return res.end('{}');}
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/api/v1/services/web-development') return res.end(JSON.stringify({data:service}));
  if(url.pathname.startsWith('/api/v1/services/')){res.writeHead(404);return res.end(JSON.stringify({message:'Fixture record absent'}));}
  if(url.pathname==='/api/v1/search') return res.end(JSON.stringify({data:{news:[],blog:[],products:[],services:[]}}));
  return res.end(JSON.stringify({data:url.pathname==='/api/v1/services'?[service]:[],meta:{current_page:1,last_page:1,per_page:50,total:1}}));
}).listen(3139,'127.0.0.1',()=>console.log('GET-only catalogue fixture ready on 3139'));
