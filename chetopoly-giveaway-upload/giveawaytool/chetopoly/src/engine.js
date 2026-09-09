// Chetopoly 3D engine — single shared engine for Version 1 and Version 2.
import * as THREE from 'three';

/* ============================================================ *
 *  BOARD DATA (classic 40 squares, GO at bottom-right)
 * ============================================================ */
const PROP = (name,color,price)=>({type:'property',name,color,price:price!=null?'$'+price:''});
const RAW = [
 {id:'go',type:'go',name:'GO',sub:'COLLECT $200'},
 {...PROP('Mediterranean Ave','#8b4513',60)},
 {type:'chest',name:'Community Chest'},
 {...PROP('Baltic Ave','#8b4513',60)},
 {type:'tax',name:'Income Tax',sub:'PAY $200'},
 {type:'rail',name:'Reading Railroad',sub:'$200'},
 {...PROP('Oriental Ave','#7fd4e6',100)},
 {type:'chance',name:'Chance'},
 {...PROP('Vermont Ave','#7fd4e6',100)},
 {...PROP('Connecticut Ave','#7fd4e6',120)},
 {id:'jail',type:'jail',name:'Jail',sub:'Just Visiting'},
 {...PROP('St. Charles Place','#d93a8b',140)},
 {type:'util',name:'Electric Company',sub:'$150'},
 {...PROP('States Ave','#d93a8b',140)},
 {...PROP('Virginia Ave','#d93a8b',160)},
 {type:'rail',name:'Pennsylvania Railroad',sub:'$200'},
 {...PROP('St. James Place','#f7941d',180)},
 {type:'chest',name:'Community Chest'},
 {...PROP('Tennessee Ave','#f7941d',180)},
 {...PROP('New York Ave','#f7941d',200)},
 {id:'parking',type:'parking',name:'Free Parking'},
 {...PROP('Kentucky Ave','#ed1b24',220)},
 {type:'chance',name:'Chance'},
 {...PROP('Indiana Ave','#ed1b24',220)},
 {...PROP('Illinois Ave','#ed1b24',240)},
 {type:'rail',name:'B&O Railroad',sub:'$200'},
 {...PROP('Atlantic Ave','#fef200',260)},
 {...PROP('Ventnor Ave','#fef200',260)},
 {type:'util',name:'Water Works',sub:'$150'},
 {...PROP('Marvin Gardens','#fef200',280)},
 {id:'gotojail',type:'gotojail',name:'Go To Jail'},
 {...PROP('Pacific Ave','#1fb25a',300)},
 {...PROP('North Carolina Ave','#1fb25a',300)},
 {type:'chest',name:'Community Chest'},
 {...PROP('Pennsylvania Ave','#1fb25a',320)},
 {type:'rail',name:'Short Line',sub:'$200'},
 {type:'chance',name:'Chance'},
 {...PROP('Park Place','#0072bb',350)},
 {type:'tax',name:'Luxury Tax',sub:'PAY $100'},
 {id:'boardwalk',type:'property',name:'Boardwalk',color:'#0072bb',price:'$400'},
];

/* ============================================================ *
 *  GEOMETRY helpers
 * ============================================================ */
const N = RAW.length;               // 40
const TILE = 1.0;                   // world size of one tile
const HALF = (N/4/2)*TILE;          // 5
const EDGE = N/4;                   // 10 steps between corners

function tileCenter(i){
  const side = Math.floor(i/10), off = i%10;
  if(side===0) return new THREE.Vector3((5-off)*TILE,0, 5*TILE);
  if(side===1) return new THREE.Vector3(-5*TILE,0,(5-off)*TILE);
  if(side===2) return new THREE.Vector3((-5+off)*TILE,0,-5*TILE);
  return new THREE.Vector3(5*TILE,0,(-5+off)*TILE);
}
function sideOf(i){ return Math.floor(i/10); }
// yaw so a tile's local +Z (texture top / colour band) faces the outer edge
const SIDE_YAW = [0, Math.PI/2, Math.PI, -Math.PI/2];

/* ============================================================ *
 *  Tile face texture (canvas) — supports custom text + image
 * ============================================================ */
function makeTileTexture(t){
  const S=256, c=document.createElement('canvas'); c.width=S; c.height=S;
  const g=c.getContext('2d');
  g.fillStyle='#f5f2ea'; g.fillRect(0,0,S,S);
  // colour band at TOP of canonical canvas (mesh yaw puts it outward)
  if(t.color){ g.fillStyle=t.color; g.fillRect(0,0,S,56); }
  g.strokeStyle='#222'; g.lineWidth=6; g.strokeRect(3,3,S-6,S-6);
  g.fillStyle='#111'; g.textAlign='center';
  // icon for special tiles
  const icons={chance:'?',chest:'📦',rail:'🚂',util:'💡',tax:'💰',jail:'⛓',parking:'🅿',go:'➜',gotojail:''};
  if(icons[t.type]){ g.font='700 90px system-ui'; g.fillText(icons[t.type],S/2, t.color?150:140); }
  // title (wrap)
  g.font='700 26px system-ui';
  const words=(t.name||'').split(' '); let line='', y=t.color?100:96;
  const maxW=S-28;
  g.fillStyle='#111';
  for(const w of words){ const test=line?line+' '+w:w;
    if(g.measureText(test).width>maxW && line){ g.fillText(line,S/2,y); y+=30; line=w; } else line=test; }
  if(line){ g.fillText(line,S/2,y); y+=30; }
  // subtitle / price
  if(t.price||t.sub){ g.font='600 26px system-ui'; g.fillStyle='#333'; g.fillText(t.price||t.sub, S/2, S-24); }
  // custom image (drawn centred)
  if(t._img){ try{ g.drawImage(t._img, S/2-70, 60, 140, 140); }catch(e){} }
  const tex=new THREE.CanvasTexture(c);
  tex.anisotropy=8; tex.colorSpace=THREE.SRGBColorSpace;
  return tex;
}

/* ============================================================ *
 *  CHETOPOLY centre logo
 * ============================================================ */
function makeLogoTexture(){
  const W=1024,H=300,c=document.createElement('canvas');c.width=W;c.height=H;
  const g=c.getContext('2d');
  g.clearRect(0,0,W,H);
  g.fillStyle='#3b6fd4'; g.fillRect(0,0,W,H);
  g.strokeStyle='#ffffff'; g.lineWidth=10; g.strokeRect(14,14,W-28,H-28);
  g.fillStyle='#fff'; g.textAlign='center'; g.textBaseline='middle';
  g.font='900 120px system-ui'; g.fillText('CHETOPOLY', W/2, H/2+6);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t;
}

/* ============================================================ *
 *  Dice (two 3D dice with pips)
 * ============================================================ */
function pipTexture(count){
  const S=128,c=document.createElement('canvas');c.width=S;c.height=S;
  const g=c.getContext('2d'); g.fillStyle='#fff'; g.fillRect(0,0,S,S);
  g.strokeStyle='#bbb'; g.lineWidth=4; g.strokeRect(2,2,S-4,S-4);
  g.fillStyle='#d21'; const P={1:[[.5,.5]],2:[[.25,.25],[.75,.75]],3:[[.25,.25],[.5,.5],[.75,.75]],
    4:[[.25,.25],[.75,.25],[.25,.75],[.75,.75]],5:[[.25,.25],[.75,.25],[.5,.5],[.25,.75],[.75,.75]],
    6:[[.25,.25],[.75,.25],[.25,.5],[.75,.5],[.25,.75],[.75,.75]]}[count];
  for(const[x,y]of P){ g.beginPath(); g.arc(x*S,y*S,13,0,7); g.fill(); }
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t;
}
function buildDie(){
  const mats=[1,2,3,4,5,6].map(n=>new THREE.MeshStandardMaterial({map:pipTexture(n),roughness:.35}));
  // three.js box material order: +x,-x,+y,-y,+z,-z  -> map so top(+y)=value
  const m=new THREE.Mesh(new THREE.BoxGeometry(.62,.62,.62),mats);
  m.castShadow=true; return m;
}
// orient a die so face `v` is up
const UP_FACE=[null,[0,0,Math.PI/2],[0,0,-Math.PI/2],[0,0,0],[Math.PI,0,0],[-Math.PI/2,0,0],[Math.PI/2,0,0]];
function setDieUp(die,v){ const e=UP_FACE[v]; die.rotation.set(e[0],e[1],e[2]); }

/* ============================================================ *
 *  Tiny tween system
 * ============================================================ */
class Tweens{
  constructor(){ this.list=[]; }
  add(dur,fn,done,ease){ this.list.push({t:0,dur,fn,done,ease:ease||(x=>x<.5?2*x*x:1-Math.pow(-2*x+2,2)/2)}); }
  update(dt){ for(let i=this.list.length-1;i>=0;i--){ const w=this.list[i]; w.t+=dt;
    const k=Math.min(1,w.t/w.dur); w.fn(w.ease(k),k);
    if(k>=1){ this.list.splice(i,1); if(w.done) w.done(); } } }
  clear(){ this.list.length=0; }
}

/* ============================================================ *
 *  THE GAME
 * ============================================================ */
export function createGame(opts){
  const mount=opts.mount;
  const MODE=opts.mode||'v1';
  const cfg=Object.assign({ rollsPerPlayer: MODE==='v2'?2:Infinity, doublesGoAgain: MODE==='v2', turnSeconds:40 }, opts);

  const renderer=new THREE.WebGLRenderer({antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.domElement.style.position='absolute';
  renderer.domElement.style.inset='0';
  mount.appendChild(renderer.domElement);

  const scene=new THREE.Scene();
  scene.background=new THREE.Color(0x0a0f1e);
  scene.fog=new THREE.Fog(0x0a0f1e, 26, 60);

  const camera=new THREE.PerspectiveCamera(50,1,.1,200);

  scene.add(new THREE.HemisphereLight(0xbfd6ff,0x0b0e14,.9));
  const sun=new THREE.DirectionalLight(0xffffff,1.4);
  sun.position.set(8,14,6); sun.castShadow=true; sun.shadow.mapSize.set(2048,2048);
  sun.shadow.camera.left=-12; sun.shadow.camera.right=12; sun.shadow.camera.top=12; sun.shadow.camera.bottom=-12;
  scene.add(sun);

  // ground
  const ground=new THREE.Mesh(new THREE.CircleGeometry(30,48).rotateX(-Math.PI/2),
    new THREE.MeshStandardMaterial({color:0x0d1526,roughness:1}));
  ground.receiveShadow=true; ground.position.y=-0.02; scene.add(ground);

  // board base
  const base=new THREE.Mesh(new THREE.BoxGeometry(11.4,0.3,11.4),
    new THREE.MeshStandardMaterial({color:0xcfe3cf,roughness:.9}));
  base.position.y=-0.16; base.receiveShadow=true; scene.add(base);

  const tweens=new Tweens();
  const tiles=[];      // {def, mesh, texture}
  const tileMeshes=[]; // for raycast

  RAW.forEach((def,i)=>{
    def=Object.assign({},def); def.index=i;
    const tex=makeTileTexture(def);
    const matTop=new THREE.MeshStandardMaterial({map:tex,roughness:.8});
    const matSide=new THREE.MeshStandardMaterial({color:0xe8e2d2,roughness:.9});
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(TILE*.98,0.08,TILE*.98),
      [matSide,matSide,matTop,matSide,matSide,matSide]);
    const c=tileCenter(i);
    mesh.position.set(c.x,0.04,c.z);
    mesh.rotation.y=SIDE_YAW[sideOf(i)];
    mesh.castShadow=mesh.receiveShadow=true;
    mesh.userData.index=i;
    scene.add(mesh);
    tiles.push({def,mesh,texture:tex,matTop});
    tileMeshes.push(mesh);
  });

  // centre logo (two crossed planes)
  const logoTex=makeLogoTexture();
  const logoMat=new THREE.MeshBasicMaterial({map:logoTex,transparent:true});
  const logo=new THREE.Mesh(new THREE.PlaneGeometry(8,2.35),logoMat);
  logo.rotation.x=-Math.PI/2; logo.rotation.z=Math.PI/4; logo.position.y=0.02; scene.add(logo);

  // dice
  const dieA=buildDie(), dieB=buildDie();
  const diceGroup=new THREE.Group(); diceGroup.add(dieA,dieB);
  dieA.position.set(-0.5,0.4,0); dieB.position.set(0.5,0.4,0);
  diceGroup.position.set(0,0,0);
  diceGroup.visible=false; scene.add(diceGroup);

  /* ---------- tokens ---------- */
  const tokens=[];
  function addToken(name,color){
    const g=new THREE.Group();
    const body=new THREE.Mesh(new THREE.CylinderGeometry(.16,.2,.42,24),
      new THREE.MeshStandardMaterial({color,roughness:.4,metalness:.3}));
    body.position.y=.21; body.castShadow=true;
    const head=new THREE.Mesh(new THREE.SphereGeometry(.14,20,20),
      new THREE.MeshStandardMaterial({color,roughness:.3,metalness:.4}));
    head.position.y=.55; head.castShadow=true;
    g.add(body,head);
    const label=makeLabel(name,color); label.position.y=0.9; g.add(label);
    const c=tileCenter(0); g.position.set(c.x,0.08,c.z);
    scene.add(g);
    const t={name,color,obj:g,pos:0,skip:false,rollsLeft:cfg.rollsPerPlayer,prize:null,label};
    tokens.push(t); return t;
  }
  function makeLabel(text,color){
    const c=document.createElement('canvas'); c.width=256;c.height=96;
    const g=c.getContext('2d');
    g.fillStyle='rgba(0,0,0,0.55)'; roundRect(g,6,6,244,84,18); g.fill();
    g.strokeStyle='#'+new THREE.Color(color).getHexString(); g.lineWidth=4; roundRect(g,6,6,244,84,18); g.stroke();
    g.fillStyle='#fff'; g.font='700 40px system-ui'; g.textAlign='center'; g.textBaseline='middle';
    g.fillText(text,128,50);
    const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace;
    const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthTest:false}));
    s.scale.set(0.95,0.36,1); return s;
  }
  function roundRect(g,x,y,w,h,r){ g.beginPath(); g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r); g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath(); }

  /* ---------- camera rig ---------- */
  const cam={ mode:'overview', target:new THREE.Vector3(0,0,0), desired:new THREE.Vector3(0,11,12) };
  let userYaw=0.6, userPitch=1.0, userDist=15.5;
  function overviewUpdate(){
    const d=userDist;
    camera.position.set(
      Math.sin(userYaw)*Math.cos(userPitch)*d,
      Math.sin(userPitch)*d,
      Math.cos(userYaw)*Math.cos(userPitch)*d);
    camera.lookAt(0,0,0);
  }

  /* ---------- HUD / DOM ---------- */
  mount.insertAdjacentHTML('beforeend', HUD_HTML(MODE));
  const $=s=>mount.querySelector(s);
  const logEl=$('#log'), bannerEl=$('#banner');
  function log(msg,cls){ const d=document.createElement('div'); d.className='line'+(cls?' '+cls:''); d.textContent=msg; logEl.appendChild(d); logEl.scrollTop=logEl.scrollHeight; }
  function banner(msg,sub){ bannerEl.innerHTML=`<div class="b-main">${msg}</div>${sub?`<div class="b-sub">${sub}</div>`:''}`; bannerEl.classList.add('show'); clearTimeout(banner._t); banner._t=setTimeout(()=>bannerEl.classList.remove('show'),4200); }

  /* ---------- game state ---------- */
  const G={ turn:-1, busy:false, timer:null, timeLeft:0, started:false, over:false };

  function nextPlayer(){
    if(!tokens.length) return null;
    let guard=0;
    do{ G.turn=(G.turn+1)%tokens.length; guard++; }while(tokens[G.turn].skip && guard<tokens.length+1);
    const t=tokens[G.turn];
    if(t.skip){ t.skip=false; log(`${t.name} is in jail — skipping this turn.`,'warn'); return nextPlayer(); }
    return t;
  }

  function startGame(names){
    tokens.length=0;
    const colors=[0x53fc18,0x00d4ff,0xff3366,0xffd700,0xb26bff,0xff8a3d];
    names.slice(0,6).forEach((n,i)=>addToken(n,colors[i]));
    G.started=true; G.over=false; G.turn=-1;
    log('Game started. '+MODE.toUpperCase()+' rules.','ok');
    $('#players').textContent=tokens.map(t=>t.name).join(' · ');
    beginTurn();
  }

  function beginTurn(){
    if(G.over||!tokens.length) return;
    const t=nextPlayer(); if(!t) return;
    log(`— ${t.name}'s turn. Type !roll or press Roll (${cfg.turnSeconds}s).`);
    $('#turn').textContent=`${t.name}'s turn`;
    startTimer();
    diceGroup.visible=false;
    camTo('overview');
  }
  function startTimer(){ stopTimer(); G.timeLeft=cfg.turnSeconds; $('#clock').textContent=G.timeLeft+'s';
    G.timer=setInterval(()=>{ G.timeLeft--; $('#clock').textContent=G.timeLeft+'s';
      if(G.timeLeft<=0){ stopTimer(); log(`${tokens[G.turn]?.name} ran out of time — skipped.`,'warn'); beginTurn(); } },1000); }
  function stopTimer(){ if(G.timer){clearInterval(G.timer); G.timer=null;} }

  function rollDice(){
    if(G.busy||G.over) return;
    if(!G.started||G.turn<0){ log('Start the game first.','warn'); return; }
    stopTimer(); G.busy=true;
    const t=tokens[G.turn];
    const a=1+Math.floor(Math.random()*6), b=1+Math.floor(Math.random()*6);
    log(`${t.name} rolled a ${a+b}  (${a}+${b})`,'ok');
    camTo('dice');
    diceGroup.visible=true;
    // tumble
    const spin={a:0};
    tweens.add(1.1,k=>{ dieA.rotation.x=spin.a*7; dieA.rotation.z=spin.a*5; dieB.rotation.x=-spin.a*6; dieB.rotation.y=spin.a*7; dieA.position.y=dieB.position.y=0.4+Math.sin(k*Math.PI)*1.6; spin.a=k; },()=>{
      setDieUp(dieA,a); setDieUp(dieB,b);
      $('#diceVal').textContent=`${a} + ${b} = ${a+b}`;
      banner(`${t.name} rolled ${a+b}`, MODE==='v2' && a===b ? 'DOUBLES — roll again!' : null);
      setTimeout(()=>{ $('#diceVal').textContent=''; walk(t,a+b,()=>afterMove(t,a===b)); },650);
    });
  }

  function walk(t,steps,done){
    camTo('follow',t);
    let moved=0;
    const step=()=>{
      if(moved>=steps){ done(); return; }
      const from=t.obj.position.clone();
      t.pos=(t.pos+1)%N; if(t.pos===0) onPassGo(t);
      const to=tileCenter(t.pos); to.y=0.08;
      moved++;
      tweens.add(.42,k=>{ t.obj.position.lerpVectors(from,to,k); t.obj.position.y=0.08+Math.sin(k*Math.PI)*.35; },()=>{ setTimeout(step,60); });
    };
    step();
  }
  function onPassGo(t){ t.cash=(t.cash||0)+200; t.laps=(t.laps||0)+1; log(`${t.name} passed GO — collect $200.`,'ok'); }

  function afterMove(t,doubles){
    const def=tiles[t.pos].def;
    camTo('land',t);
    setTimeout(()=>{ applyTile(t,def, ()=>resolveEnd(t,doubles)); },500);
  }

  function applyTile(t,def,done){
    const type=def.type;
    const custom=def.custom; // custom prize/punishment text set in editor
    const say=m=>{ log(`${t.name} → ${def.name}: ${m}`); banner(def.name,m); };
    if(custom){ say(custom); return setTimeout(done,900); }
    switch(type){
      case 'chance': {
        const r=Math.random();
        if(MODE==='v2' && r<0.12){ goTo(t,0,()=>say('Chance! Straight to GO!'),done); return; }
        const d=(Math.random()<.5?-1:1)*(1+Math.floor(Math.random()*4));
        say(`Chance! Move ${d>0?d:-d} spaces.`);
        moveBy(t,d,done); return;
      }
      case 'chest': {
        const pts=[10,20,30][Math.floor(Math.random()*3)];
        t.cash=(t.cash||0)+pts; say(`Community Chest — you earn ${pts} points!`); return setTimeout(done,900);
      }
      case 'tax': say('Pay a portion of your reward.'); return setTimeout(done,900);
      case 'gotojail': goTo(t,10,()=>{ t.skip=true; say('Go to Jail — skip a turn.'); },done); return;
      default: say(def.price||''); return setTimeout(done,700);
    }
  }
  function moveBy(t,d,done){
    const dir=d>0?1:-1; let n=Math.abs(d);
    const one=()=>{ if(n<=0) return done(); n--; const from=t.obj.position.clone();
      t.pos=(t.pos+dir+N)%N; if(t.pos===0&&dir>0) onPassGo(t);
      const to=tileCenter(t.pos); to.y=.08;
      tweens.add(.3,k=>{t.obj.position.lerpVectors(from,to,k);},one); };
    one();
  }
  function goTo(t,idx,msg,done){ const from=t.obj.position.clone(); const to=tileCenter(idx); to.y=.08;
    t.pos=idx; tweens.add(.7,k=>{t.obj.position.lerpVectors(from,to,k); t.obj.position.y=.08+Math.sin(k*Math.PI)*.6;},()=>{msg();done();}); }

  function resolveEnd(t,doubles){
    // win conditions
    if(t.laps>=1){ return win(t); }
    if(MODE==='v2'){
      if(doubles && cfg.doublesGoAgain){ G.busy=false; log(`${t.name} rolled doubles — go again!`,'ok'); startTimer(); return; }
      t.rollsLeft--;
      if(t.rollsLeft<=0){
        const prize=tiles[t.pos].def;
        t.prize=prize.custom||prize.name;
        banner(`${t.name} used all rolls`, `Prize: ${t.prize}`);
        log(`${t.name}'s prize revealed: ${t.prize}`,'ok');
        return nextAfterResolve();
      }
      log(`${t.name} has ${t.rollsLeft} roll(s) left.`);
    }
    G.busy=false; beginTurn();
  }
  function nextAfterResolve(){ G.busy=false; beginTurn(); }
  function win(t){ G.over=true; stopTimer();
    banner(`🏆 ${t.name} WINS!`, MODE==='v2'?'Top prize — first to the GO finish line!':'First to the finish line!');
    log(`🏆 ${t.name} wins the game!`,'ok');
    camTo('win',t);
  }

  /* ---------- camera control ---------- */
  function camTo(mode,t){ cam.mode=mode; cam.focus=t||null; }
  function updateCam(dt){
    if(cam.mode==='overview'){ overviewUpdate(); return; }
    let look=new THREE.Vector3(0,0,0), pos;
    if(cam.mode==='dice'){ look.set(0,0.4,0); pos=new THREE.Vector3(2.2,2.4,2.6); }
    else if(cam.mode==='follow'&&cam.focus){ const p=cam.focus.obj.position; look.copy(p); look.y=.4; pos=p.clone().add(new THREE.Vector3(2.1,2.9,2.5)); }
    else if(cam.mode==='land'&&cam.focus){ const p=cam.focus.obj.position; look.copy(p); look.y=.2; pos=p.clone().add(new THREE.Vector3(0.9,1.6,1.2)); }
    else if(cam.mode==='win'&&cam.focus){ const p=cam.focus.obj.position; look.copy(p); look.y=.5; pos=p.clone().add(new THREE.Vector3(1.2,1.4,2.4)); }
    else { overviewUpdate(); return; }
    camera.position.lerp(pos, 1-Math.pow(0.001,dt));
    camera.lookAt(look);
  }

  /* ---------- tile editor ---------- */
  const ray=new THREE.Raycaster(), mouse=new THREE.Vector2();
  let drag=null;
  renderer.domElement.addEventListener('pointerdown',e=>{ drag={x:e.clientX,y:e.clientY,t:Date.now()}; });
  renderer.domElement.addEventListener('pointermove',e=>{ if(drag&&(e.buttons&1)){ userYaw+=(e.clientX-drag.x)*.005; userPitch=Math.min(1.45,Math.max(.35,userPitch+(e.clientY-drag.y)*.005)); drag={x:e.clientX,y:e.clientY,t:drag.t}; } });
  renderer.domElement.addEventListener('wheel',e=>{ userDist=Math.min(26,Math.max(7,userDist+e.deltaY*.01)); });
  renderer.domElement.addEventListener('pointerup',e=>{
    const moved=drag?Math.hypot(e.clientX-drag.x,e.clientY-drag.y):0; drag=null;
    if(moved>5) return; // it was a drag/orbit, not a click
    const r=renderer.domElement.getBoundingClientRect();
    mouse.x=((e.clientX-r.left)/r.width)*2-1; mouse.y=-((e.clientY-r.top)/r.height)*2+1;
    ray.setFromCamera(mouse,camera);
    const hit=ray.intersectObjects(tileMeshes)[0];
    if(hit) openEditor(hit.object.userData.index);
  });

  function openEditor(i){
    const def=tiles[i].def;
    $('#ed-title').value=def.name||''; $('#ed-sub').value=def.sub||def.price||'';
    $('#ed-color').value=def.color||'#888888'; $('#ed-custom').value=def.custom||'';
    $('#editor').classList.add('open'); $('#editor').dataset.index=i;
  }
  function saveEditor(){
    const i=+$('#editor').dataset.index, def=tiles[i].def;
    def.name=$('#ed-title').value; def.sub=$('#ed-sub').value; def.color=$('#ed-color').value; def.custom=$('#ed-custom').value||null;
    const file=$('#ed-file').files[0];
    const apply=()=>{ const t=tiles[i]; t.texture.dispose(); t.texture=makeTileTexture(def); t.matTop.map=t.texture; t.matTop.needsUpdate=true; $('#editor').classList.remove('open'); };
    if(file){ const rd=new FileReader(); rd.onload=()=>{ const img=new Image(); img.onload=()=>{ def._img=img; apply(); }; img.src=rd.result; }; rd.readAsDataURL(file); }
    else apply();
  }

  /* ---------- wire controls ---------- */
  $('#btn-start').addEventListener('click',()=>{ const names=($('#names').value||'').split(',').map(s=>s.trim()).filter(Boolean); if(!names.length){log('Enter player names.','warn');return;} startGame(names); });
  $('#btn-roll').addEventListener('click',rollDice);
  $('#chat').addEventListener('keydown',e=>{ if(e.key==='Enter'){ const v=e.target.value.trim(); if(v){ log('chat: '+v); if(/^!roll/i.test(v)) rollDice(); e.target.value=''; } } });

  $('#ed-save').addEventListener('click',saveEditor);
  $('#ed-close').addEventListener('click',()=>$('#editor').classList.remove('open'));
  const rollsSel=$('#rolls'); if(rollsSel){ rollsSel.value=String(isFinite(cfg.rollsPerPlayer)?cfg.rollsPerPlayer:2);
    rollsSel.addEventListener('change',()=>{ cfg.rollsPerPlayer=+rollsSel.value; tokens.forEach(t=>t.rollsLeft=+rollsSel.value); log(`Rolls to see prize set to ${rollsSel.value}.`); }); }

  /* ---------- resize / loop ---------- */
  function resize(){ const w=mount.clientWidth,h=mount.clientHeight; renderer.setSize(w,h); camera.aspect=w/h; camera.updateProjectionMatrix(); }
  addEventListener('resize',resize); resize();

  const clock=new THREE.Clock();
  renderer.setAnimationLoop(()=>{ const dt=Math.min(clock.getDelta(),.05); tweens.update(dt); updateCam(dt); renderer.render(scene,camera); });

  log(`Chetopoly ${MODE.toUpperCase()} ready. Add players and press Start.`,'ok');

  function screenPosOfTile(i){
    const v=tileCenter(i).clone(); v.y=0.1;
    v.project(camera);
    const r=renderer.domElement.getBoundingClientRect();
    return { x:(v.x*0.5+0.5)*r.width + r.left, y:(-v.y*0.5+0.5)*r.height + r.top };
  }

  return {
    get scene(){return scene;}, get camera(){return camera;}, get renderer(){return renderer;},
    get tokens(){return tokens;},
    start:startGame, roll:rollDice,
    overview:()=>camTo('overview'),
    openEditor, setTile(i,fields){ const d=tiles[i].def; Object.assign(d,fields);
      const t=tiles[i]; t.texture.dispose(); t.texture=makeTileTexture(d); t.matTop.map=t.texture; t.matTop.needsUpdate=true; },
    screenPosOfTile,
    screenshot:()=>renderer.domElement.toDataURL('image/png'),
  };
}

/* ============================================================ *
 *  HUD html
 * ============================================================ */
function HUD_HTML(mode){
  const v2=mode==='v2';
  return `
<style>
  .cp-root{position:fixed;inset:0;font-family:system-ui,sans-serif;color:#eaf2ff;pointer-events:none;}
  .cp-root canvas{display:block;}
  .cp-hud{position:absolute;top:12px;left:12px;right:12px;display:flex;gap:10px;align-items:flex-start;pointer-events:none;flex-wrap:wrap;}
  .cp-panel{background:rgba(8,12,24,.78);border:1px solid rgba(120,160,255,.25);backdrop-filter:blur(8px);border-radius:12px;padding:10px 12px;pointer-events:auto;}
  .cp-title{font-weight:900;letter-spacing:.08em;font-size:15px;color:#53fc18;}
  .cp-row{display:flex;gap:6px;align-items:center;margin-top:8px;flex-wrap:wrap;}
  .cp-input,.cp-select{background:#0d1526;border:1px solid #2a3b5f;color:#eaf2ff;border-radius:8px;padding:6px 8px;font-size:13px;}
  .cp-btn{background:linear-gradient(135deg,#53fc18,#2fae0d);border:0;color:#04150a;font-weight:800;border-radius:8px;padding:7px 14px;cursor:pointer;font-size:13px;}
  .cp-btn.ghost{background:#152036;color:#cfe0ff;border:1px solid #2a3b5f;font-weight:600;}
  .cp-log{position:absolute;left:12px;bottom:12px;width:340px;max-height:180px;overflow:auto;font-size:12px;line-height:1.5;background:rgba(8,12,24,.72);border:1px solid rgba(120,160,255,.2);border-radius:10px;padding:8px 10px;pointer-events:auto;}
  .cp-log .line.ok{color:#7dffab;} .cp-log .line.warn{color:#ffd166;}
  .cp-banner{position:absolute;top:16%;left:50%;transform:translateX(-50%) scale(.9);opacity:0;transition:.3s;text-align:center;background:rgba(5,10,20,.85);border:2px solid #53fc18;border-radius:16px;padding:18px 34px;pointer-events:none;}
  .cp-banner.show{opacity:1;transform:translateX(-50%) scale(1);}
  .b-main{font-size:30px;font-weight:900;} .b-sub{font-size:15px;color:#9fe8b8;margin-top:4px;}
  .cp-editor{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:320px;background:#0b1220;border:1px solid #33507f;border-radius:14px;padding:16px;display:none;z-index:50;pointer-events:auto;}
  .cp-editor.open{display:block;}
  .cp-editor label{display:block;font-size:11px;color:#9fb4d8;margin:8px 0 3px;text-transform:uppercase;letter-spacing:.06em;}
  .cp-editor input[type=text],.cp-editor textarea,.cp-editor input[type=color]{width:100%;background:#0d1526;border:1px solid #2a3b5f;color:#eaf2ff;border-radius:8px;padding:7px 8px;font-size:13px;box-sizing:border-box;}
  .cp-clock{font-size:20px;font-weight:900;color:#ffd166;}
  .cp-menu{color:#8fa3c8;font-size:12px;text-decoration:none;align-self:flex-end;}
  .cp-menu:hover{color:#53fc18;}
  .cp-diceval{font-size:22px;font-weight:900;color:#fff;}
  .cp-right{margin-left:auto;display:flex;flex-direction:column;gap:6px;align-items:flex-end;}
</style>
<div class="cp-root">
  <div id="stage"></div>
  <div class="cp-hud">
    <div class="cp-panel">
      <div class="cp-title">CHETOPOLY · ${mode.toUpperCase()}</div>
      <div class="cp-row"><span id="turn" style="font-size:13px;color:#cfe0ff">Not started</span>
        <span class="cp-clock" id="clock">--</span></div>
      <div class="cp-row">
        <input id="names" class="cp-input" style="width:170px" placeholder="Player names, comma separated" value="Chet, Alex, Sam">
        <button id="btn-start" class="cp-btn">Start</button>
        <button id="btn-roll" class="cp-btn ghost">Roll 🎲</button>
      </div>
      <div class="cp-row">
        <input id="chat" class="cp-input" style="width:220px" placeholder="Chat: type !roll then Enter">
      </div>
      ${v2?`<div class="cp-row"><label style="font-size:11px;color:#9fb4d8">Rolls to see prize</label>
        <select id="rolls" class="cp-select"><option>2</option><option>3</option><option>5</option></select></div>`:''}
      <div class="cp-row" style="font-size:11px;color:#8fa3c8">Click any tile to edit its text / colour / image.</div>
    </div>
    <div class="cp-panel cp-right">
      <a class="cp-menu" href="./index.html">‹ Menu</a>
      <div class="cp-diceval" id="diceVal"></div>
      <div id="players" style="font-size:12px;color:#9fb4d8"></div>
    </div>
  </div>
  <div class="cp-log" id="log"></div>
  <div class="cp-banner" id="banner"></div>
  <div class="cp-editor" id="editor">
    <div style="font-weight:900;color:#53fc18">EDIT TILE</div>
    <label>Title</label><input type="text" id="ed-title">
    <label>Sub / price text</label><input type="text" id="ed-sub">
    <label>Band colour</label><input type="color" id="ed-color">
    <label>Prize / punishment (custom message)</label><textarea id="ed-custom" rows="2"></textarea>
    <label>Tile image</label><input type="file" id="ed-file" accept="image/*">
    <div class="cp-row" style="margin-top:12px"><button id="ed-save" class="cp-btn">Save</button><button id="ed-close" class="cp-btn ghost">Close</button></div>
  </div>
</div>`;
}
