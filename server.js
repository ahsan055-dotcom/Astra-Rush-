const http=require("http"),fs=require("fs"),path=require("path"),crypto=require("crypto");
const PORT=process.env.PORT||3000, PUBLIC=path.join(__dirname,"public");
const rooms=new Map(), ARENA={w:1000,h:600}, SPEED=330, PR=24, OR=17, WIN=10;
const chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const code=()=>{let x;do{x=Array.from({length:5},()=>chars[Math.floor(Math.random()*chars.length)]).join("")}while(rooms.has(x));return x};
const token=()=>crypto.randomBytes(16).toString("hex");
const orb=()=>({x:80+Math.random()*840,y:80+Math.random()*440});
function state(r){return{room:r.id,arena:ARENA,players:Object.values(r.players).map(({token,input,...p})=>p),orb:r.orb,status:r.status,countdownUntil:r.countdownUntil,winner:r.winner,winScore:WIN}}
function reset(r){let p=Object.values(r.players).sort((a,b)=>a.number-b.number);if(p[0])Object.assign(p[0],{x:150,y:300});if(p[1])Object.assign(p[1],{x:850,y:300})}
function countdown(r){if(Object.keys(r.players).length===2){r.status="countdown";r.winner=null;r.countdownUntil=Date.now()+3200;for(const p of Object.values(r.players))p.input={}}}
function json(res,status,data){res.writeHead(status,{"Content-Type":"application/json","Cache-Control":"no-store","Access-Control-Allow-Origin":"*"});res.end(JSON.stringify(data))}
function body(req){return new Promise((ok,bad)=>{let s="";req.on("data",d=>{s+=d;if(s.length>1e5)req.destroy()});req.on("end",()=>{try{ok(s?JSON.parse(s):{})}catch(e){bad(e)}})})}
function player(r,t){return Object.values(r.players).find(p=>p.token===t)}
function mime(f){return f.endsWith(".html")?"text/html":f.endsWith(".css")?"text/css":f.endsWith(".js")?"application/javascript":f.endsWith(".png")?"image/png":"application/octet-stream"}
const server=http.createServer(async(req,res)=>{
 try{
  const u=new URL(req.url,"http://localhost");
  if(req.method==="OPTIONS"){res.writeHead(204,{"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"Content-Type","Access-Control-Allow-Methods":"GET,POST,OPTIONS"});return res.end()}
  if(u.pathname==="/health")return json(res,200,{ok:true,game:"Astra Rush",transport:"HTTP realtime"});
  if(u.pathname==="/api/create"&&req.method==="POST"){let b=await body(req),id=code(),t=token(),r={id,players:{},orb:orb(),status:"waiting",countdownUntil:0,winner:null,last:Date.now()};r.players[t]={id:t,token:t,name:String(b.name||"Player 1").slice(0,18),number:1,x:150,y:300,score:0,input:{}};rooms.set(id,r);return json(res,200,{ok:true,room:id,playerId:t,token:t})}
  if(u.pathname==="/api/join"&&req.method==="POST"){let b=await body(req),id=String(b.room||"").trim().toUpperCase(),r=rooms.get(id);if(!r)return json(res,404,{ok:false,error:"Room not found. Check the code."});if(Object.keys(r.players).length>=2)return json(res,409,{ok:false,error:"Room already has two players."});let t=token();r.players[t]={id:t,token:t,name:String(b.name||"Player 2").slice(0,18),number:2,x:850,y:300,score:0,input:{}};reset(r);countdown(r);return json(res,200,{ok:true,room:id,playerId:t,token:t})}
  if(u.pathname==="/api/state"){let r=rooms.get(String(u.searchParams.get("room")||"").toUpperCase()),t=u.searchParams.get("token");if(!r||!player(r,t))return json(res,404,{ok:false,error:"Game session not found."});return json(res,200,{ok:true,state:state(r)})}
  if(u.pathname==="/api/input"&&req.method==="POST"){let b=await body(req),r=rooms.get(String(b.room||"").toUpperCase()),p=r&&player(r,b.token);if(!p)return json(res,404,{ok:false});p.input={up:!!b.input?.up,down:!!b.input?.down,left:!!b.input?.left,right:!!b.input?.right};return json(res,200,{ok:true})}
  if(u.pathname==="/api/rematch"&&req.method==="POST"){let b=await body(req),r=rooms.get(String(b.room||"").toUpperCase());if(!r||!player(r,b.token)||Object.keys(r.players).length!==2)return json(res,400,{ok:false});for(const p of Object.values(r.players))p.score=0;r.orb=orb();reset(r);countdown(r);return json(res,200,{ok:true})}
  let rel=u.pathname==="/"?"index.html":decodeURIComponent(u.pathname.slice(1)),f=path.normalize(path.join(PUBLIC,rel));if(!f.startsWith(PUBLIC))return json(res,403,{error:"Forbidden"});fs.readFile(f,(e,d)=>{if(e){res.writeHead(404);res.end("Not found")}else{res.writeHead(200,{"Content-Type":mime(f),"Cache-Control":"no-cache"});res.end(d)}})
 }catch(e){json(res,500,{ok:false,error:"Server error"})}
});
setInterval(()=>{let now=Date.now();for(const [id,r] of rooms){let dt=Math.min((now-r.last)/1000,.05);r.last=now;if(r.status==="countdown"&&now>=r.countdownUntil)r.status="playing";if(r.status==="playing"){for(const p of Object.values(r.players)){let dx=(p.input.right?1:0)-(p.input.left?1:0),dy=(p.input.down?1:0)-(p.input.up?1:0);if(dx||dy){let l=Math.hypot(dx,dy);p.x=Math.max(PR,Math.min(1000-PR,p.x+dx/l*SPEED*dt));p.y=Math.max(PR,Math.min(600-PR,p.y+dy/l*SPEED*dt))}if(Math.hypot(p.x-r.orb.x,p.y-r.orb.y)<PR+OR){p.score++;if(p.score>=WIN){r.status="finished";r.winner={id:p.id,name:p.name}}else r.orb=orb();break}}}if(now-r.lastSeen>3600000&&r.lastSeen)rooms.delete(id)}},1000/30);
server.listen(PORT,"0.0.0.0",()=>console.log(`Astra Rush ready on port ${PORT}`));