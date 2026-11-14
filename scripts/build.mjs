import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const assets={};for(const [route,file,type]of [['/','app.html','text/html; charset=utf-8'],['/app.js','app.js','text/javascript; charset=utf-8'],['/style.css','style.css','text/css; charset=utf-8']])assets[route]={body:readFileSync(file,'utf8'),type};
const server=readFileSync('server.js','utf8').replace('export async function handle','async function handle');
const worker=server+'\nconst assets='+JSON.stringify(assets)+';\nexport default {fetch(request,env){return handle(request,env,assets)}};\n';
mkdirSync('worker',{recursive:true});writeFileSync('worker/index.js',worker);mkdirSync('dist/server',{recursive:true});mkdirSync('dist/.openai',{recursive:true});writeFileSync('dist/server/index.js',worker);writeFileSync('dist/.openai/hosting.json',readFileSync('.openai/hosting.json'));console.log('Built Birthday Wrapped worker.');
