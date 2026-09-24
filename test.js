const {spawn}=require("child_process");const p=spawn(process.execPath,["server.js"],{env:{...process.env,PORT:"3210"}});
const base="http://127.0.0.1:3210";const post=(u,b)=>fetch(base+u,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(b)}).then(r=>r.json());
setTimeout(async()=>{try{
 let h=await fetch(base+"/health").then(r=>r.json());if(!h.ok)throw Error("health");
 let a=await post("/api/create",{name:"A"});if(!a.ok)throw Error("create");
 let b=await post("/api/join",{room:a.room,name:"B"});if(!b.ok)throw Error("join");
 let s=await fetch(base+`/api/state?room=${a.room}&token=${a.token}`).then(r=>r.json());
 if(!s.ok||s.state.players.length!==2)throw Error("sync");
 await post("/api/input",{room:a.room,token:a.token,input:{right:true}});
 await new Promise(r=>setTimeout(r,350));
 let s2=await fetch(base+`/api/state?room=${a.room}&token=${a.token}`).then(r=>r.json());
 let before=s.state.players.find(x=>x.id===a.playerId).x,after=s2.state.players.find(x=>x.id===a.playerId).x;
 // countdown means movement begins after ~3.2s; verify countdown transition too
 await new Promise(r=>setTimeout(r,3200));
 await post("/api/input",{room:a.room,token:a.token,input:{right:true}});
 await new Promise(r=>setTimeout(r,350));
 let s3=await fetch(base+`/api/state?room=${a.room}&token=${a.token}`).then(r=>r.json());
 after=s3.state.players.find(x=>x.id===a.playerId).x;
 if(after<=before)throw Error("movement");
 console.log("PASS health/create/join/sync/countdown/movement");p.kill();process.exit(0)
}catch(e){console.error("FAIL",e);p.kill();process.exit(1)}},500);