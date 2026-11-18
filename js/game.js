/* B01 mission simulator, phase 0 (playable prototype).
   One vessel, one survey area, one moored mine. All data is simulated. */
import * as THREE from '../vendor/three.module.min.js';

const $=s=>document.querySelector(s);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const D2R=Math.PI/180;
const wrapPi=a=>{while(a>Math.PI)a-=2*Math.PI;while(a<-Math.PI)a+=2*Math.PI;return a;};
const store={get(k,d){try{const v=localStorage.getItem(k);return v===null?d:JSON.parse(v);}catch(e){return d;}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}};
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

/* ---------------- language ---------------- */
const T={
ar:{title:'محاكاة مهمة B01',sim:'بيانات محاكاة، الزمن ×3',time:'الوقت',cov:'التغطية',speed:'السرعة',batt:'البطارية',score:'النقاط',auto:'طيار آلي',cam:'الكاميرا',map:'منطقة المسح',sonar:'عمود الماء، ملتي بيم',dead:'منطقة ميتة',
 press:'اضغط أي زر أو المس الشاشة لتتولى القيادة',keys:'الأسهم للقيادة، المسافة للطيار الآلي، C للكاميرا',
 a1:'B01 مركبة سطحية منخفضة البصمة تمسح مدخل الميناء بحثًا عن الألغام.',
 a2:'المسح الشبكي: خطوط متقاربة كل 25 م حتى لا تبقى فجوة في المنطقة الميتة.',
 a3:'الانعطاف يكون خارج المنطقة، وبيانات الانعطاف لا تُحتسب.',
 a4:'الملتي بيم يرى عمود الماء، والسونار الجانبي يرى القاع وظلاله.',
 a5:'عند الرصد يشرح النظام سبب التصنيف، والقرار للمحلل.',
 b_title:'مهمتك',b_body:'امسح مدخل الميناء على خطوط المسح، وابحث عن الأهداف تحت الماء، وقرّر بناءً على الأدلة. أمامك 4 دقائق.',
 b_tip:'السونار يحسب البيانات وأنت تمشي مستقيمًا فقط، فخلّ الانعطاف خارج حدود المنطقة.',
 b_keys:'التحكم: الأسهم للقيادة والسرعة، المسافة لتشغيل الطيار الآلي، C لتغيير الكاميرا.',b_touch:'التحكم: أزرار اليسار للتوجيه، وأزرار اليمين للسرعة.',start:'ابدأ المهمة',
 turning:'انعطاف: بيانات السونار لا تُحتسب',outside:'خارج منطقة المسح',detected:'رصد هدف في عمود الماء',detAttract:'رصد هدف، والنظام يشرح سبب التصنيف',again2:'رصد الهدف من اتجاه جديد',takeover:'تحكم يدوي',autoOn:'الطيار الآلي يعمل',
 h_title:'هدف مشتبه: لغم مربوط محتمل',h_high:'خطر محتمل مرتفع',h_pot:'خطر محتمل',h_conf:'ثقة النموذج',snip:'مقطع عمود الماء حول الهدف',
 ev_shape:'الشكل',ev_shape_ok:'صدى كروي منتظم، قطره نحو 1 م',
 ev_pos:'الموضع في عمود الماء',ev_pos_ok:'معلّق نحو 9 م فوق القاع',
 ev_bg:'تباين الخلفية',ev_bg_ok:'غير موجود في مسح الأساس لهذه المنطقة',
 ev_shadow:'الظل الصوتي',ev_shadow_ok:'ظل منفصل عن القاع في السونار الجانبي',ev_shadow_no:'لم يُرَ: الهدف كان في فجوة السونار الجانبي تحت المركبة',
 ev_sway:'التأرجح عبر الزمن',ev_sway_ok:'يتحرك حول نقطة ثابتة بين التمريرات',ev_sway_no:'يحتاج تمريرة ثانية',
 ev_cons:'إجماع الزوايا',ev_cons_ok:'رُصد من اتجاهين مختلفين',ev_cons_no:'رُصد من اتجاه واحد فقط',
 d_hand:'تسليم لفريق التحقق',d_cross:'طلب تمريرة متقاطعة',d_reject:'رفض كإنذار كاذب',cont:'متابعة المهمة',
 f_hand_good:'قرار صحيح بأدلة كافية. سُلّمت الحزمة لفريق التحقق.',f_hand_weak:'القرار صحيح، لكن الأدلة ناقصة. تمريرة متقاطعة كانت سترفع الثقة.',
 f_cross:'أُضيفت تمريرة متقاطعة على الخريطة. مُرّ فوق الهدف من الاتجاه الآخر.',f_reject:'خطأ: الأدلة تشير إلى لغم مربوط، والرفض يترك الخطر في الممر.',
 r_title:'انتهت المهمة',r_dec:'قرار الهدف',r_best:'أفضل النتائج',again:'العب مرة ثانية',dec_hand:'سُلّم للتحقق',dec_reject:'رُفض',dec_none:'لم يُتخذ قرار',dec_cross:'بانتظار التمريرة'},
en:{title:'B01 mission simulator',sim:'Simulated data, time ×3',time:'Time',cov:'Coverage',speed:'Speed',batt:'Battery',score:'Score',auto:'Autopilot',cam:'Camera',map:'Survey area',sonar:'Water column, multibeam',dead:'Dead zone',
 press:'Press any key or touch the screen to take control',keys:'Arrows steer, Space autopilot, C camera',
 a1:'B01 is a low-signature surface vehicle surveying a port approach for mines.',
 a2:'Grid survey: lines every 25 m so nothing is left in the dead zone.',
 a3:'Turns happen outside the area, and turning data is never counted.',
 a4:'Multibeam sees the water column; side-scan sonar sees the seabed and its shadows.',
 a5:'On a detection the system explains why, and the analyst decides.',
 b_title:'Your mission',b_body:'Survey the port approach along the survey lines, find targets under the water, and decide from the evidence. You have 4 minutes.',
 b_tip:'Sonar data counts only while you run straight, so make your turns outside the area.',
 b_keys:'Controls: arrows steer and set speed, Space switches autopilot, C changes camera.',b_touch:'Controls: left buttons steer, right buttons set speed.',start:'Start mission',
 turning:'Turning: sonar data is not counted',outside:'Outside the survey area',detected:'Target detected in the water column',detAttract:'Target detected; the system explains why',again2:'Target seen from a new heading',takeover:'Manual control',autoOn:'Autopilot on',
 h_title:'Suspected target: possible moored mine',h_high:'High potential hazard',h_pot:'Potential hazard',h_conf:'Model confidence',snip:'Water-column slice around the target',
 ev_shape:'Shape',ev_shape_ok:'Regular spherical echo, about 1 m',
 ev_pos:'Water-column position',ev_pos_ok:'Suspended about 9 m above the seabed',
 ev_bg:'Background contrast',ev_bg_ok:'Not in this area\'s baseline survey',
 ev_shadow:'Acoustic shadow',ev_shadow_ok:'Detached shadow on the side-scan sonar',ev_shadow_no:'Not seen: the target was in the side-scan gap under the hull',
 ev_sway:'Sway over time',ev_sway_ok:'Moves around a fixed point between passes',ev_sway_no:'Needs another pass',
 ev_cons:'Multi-angle consensus',ev_cons_ok:'Seen from two different headings',ev_cons_no:'Seen from one heading only',
 d_hand:'Hand over for verification',d_cross:'Request a cross-pass',d_reject:'Reject as false alarm',cont:'Continue mission',
 f_hand_good:'Correct, with enough evidence. The package went to the verification team.',f_hand_weak:'Correct, but the evidence was thin. A cross-pass would have raised confidence.',
 f_cross:'Cross-pass added to the map. Run over the target from the other heading.',f_reject:'Wrong: the evidence points to a moored mine, and rejecting it leaves the hazard in the channel.',
 r_title:'Mission complete',r_dec:'Target decision',r_best:'Best scores',again:'Play again',dec_hand:'Handed over',dec_reject:'Rejected',dec_none:'No decision',dec_cross:'Waiting for the pass'}};
let lang=store.get('b01sim.lang','ar');
const t=k=>(T[lang]&&T[lang][k])||T.ar[k]||k;
function applyLang(){
  document.documentElement.lang=lang;document.documentElement.dir=lang==='ar'?'rtl':'ltr';
  document.querySelectorAll('[data-t]').forEach(el=>{el.textContent=t(el.dataset.t);});
  $('#b-lang').textContent=lang==='ar'?'English':'العربية';
  $('#br-ctrl').textContent=TOUCH?t('b_touch'):t('b_keys');
  if(S.mode==='attract')$('#cap-text').textContent=t('a'+(S.capIdx+1));
  if(!$('#o-hand').hidden)renderHand();
}
const TOUCH=matchMedia('(pointer: coarse)').matches||('ontouchstart' in window);

/* ---------------- scenario ---------------- */
const AREA={x0:-100,x1:100,y0:-62.5,y1:62.5},SP=25,SW=14,RUN=28,DEPTH=18,TXD=1.2,CELL=5;
const NA=5,NB=8,NX=Math.round((AREA.x1-AREA.x0)/CELL),NY=Math.round((AREA.y1-AREA.y0)/CELL);
const A_Y=i=>AREA.y0+SP/2+i*SP,B_X=j=>AREA.x0+SP/2+j*SP;
const MINE={x:35,y:8,z:9};
const MISSION=240,RATE=3,MAXV=3.0,MAXYAW=22*D2R;
function buildRoute(){
  const r=[];
  for(let i=0;i<NA;i++){const y=A_Y(i),east=i%2===0;r.push([east?AREA.x0-RUN:AREA.x1+RUN,y],[east?AREA.x1+RUN:AREA.x0-RUN,y]);}
  for(let k=0;k<NB;k++){const x=B_X(NB-1-k),south=k%2===0;r.push([x,south?AREA.y1+RUN:AREA.y0-RUN],[x,south?AREA.y0-RUN:AREA.y1+RUN]);}
  return r;
}
const S={mode:'attract',paused:false,time:0,simT:0,score:0,batt:86,cov:new Uint8Array(NX*NY),covPct:0,
  boat:{x:AREA.x0-RUN-30,y:A_Y(0),h:90*D2R,v:0,r:0,vT:0},auto:true,route:buildRoute(),wp:0,queue:[],
  keys:{left:0,right:0,up:0,down:0},thr:0,cam:'chase',lastInput:0,capIdx:0,capT:0,
  mine:{state:'hidden',obs:[],shadow:false,lock:false,first:0,fb:'',cross:null},decision:'none',trail:[],turning:false,outside:false};
function resetScenario(mode){
  S.mode=mode;S.paused=false;S.time=0;S.score=0;S.batt=86;S.cov.fill(0);S.covPct=0;
  Object.assign(S.boat,{x:AREA.x0-RUN-30,y:A_Y(0),h:90*D2R,v:mode==='attract'?MAXV:0,r:0,vT:mode==='attract'?MAXV:0});
  S.auto=mode==='attract';S.wp=0;S.queue=[];S.legFrom=null;S.thr=mode==='attract'?MAXV:0;S.trail=[];S.decision='none';
  S.mine={state:'hidden',obs:[],shadow:false,lock:false,first:0,fb:'',cross:null};
  S.capIdx=0;S.capT=0;S.lastInput=performance.now();
  setMine3D();crossGuide.visible=false;
  $('#b-auto').setAttribute('aria-pressed',String(S.auto));
}

/* ---------------- renderer and scene ---------------- */
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
let pixelRatio=Math.min(window.devicePixelRatio||1,1.5);
renderer.setPixelRatio(pixelRatio);
renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
$('#view').appendChild(renderer.domElement);
const scene=new THREE.Scene();
const HAZE=0xe2eaee;
scene.background=new THREE.Color(HAZE);
scene.fog=new THREE.Fog(HAZE,140,620);
const camera=new THREE.PerspectiveCamera(55,innerWidth/innerHeight,.4,2400);
scene.add(new THREE.HemisphereLight(0xeaf2f6,0x1c3a45,1.25));
const sun=new THREE.DirectionalLight(0xffffff,1.7);sun.position.set(-160,220,90);scene.add(sun);

/* sky dome: haze at the horizon, light blue above (no skyline, like the B01 render) */
const sky=new THREE.Mesh(new THREE.SphereGeometry(1800,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,
  uniforms:{top:{value:new THREE.Color(0xa9c3d1)},bot:{value:new THREE.Color(HAZE)}},
  vertexShader:'varying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
  fragmentShader:'uniform vec3 top;uniform vec3 bot;varying vec3 vW;void main(){float h=normalize(vW-cameraPosition).y;gl_FragColor=vec4(mix(bot,top,smoothstep(0.,.42,h)),1.);\n#include <colorspace_fragment>\n}'}));
scene.add(sky);

/* faceted low-poly ocean, world-locked waves, follows the vessel */
const OCEAN=640,OSEG=128,OCELL=OCEAN/OSEG;
const oceanGeo=new THREE.PlaneGeometry(OCEAN,OCEAN,OSEG,OSEG);oceanGeo.rotateX(-Math.PI/2);
const oceanBase=Float32Array.from(oceanGeo.attributes.position.array);
const ocean=new THREE.Mesh(oceanGeo,new THREE.MeshStandardMaterial({color:0x3a7d93,roughness:.32,metalness:.08,flatShading:true,transparent:true,opacity:.8}));
scene.add(ocean);
function waveH(x,z,tt){return .32*Math.sin(x*.045+tt*.9)+.22*Math.sin(z*.061-tt*1.1)+.16*Math.sin((x+z)*.09+tt*1.6)+.07*Math.sin(x*.21-z*.17+tt*2.3);}
let oceanSkip=false,oceanFrame=0;
function updateOcean(tt,cx,cz){
  if(oceanSkip&&(oceanFrame++&1))return;
  const ox=Math.round(cx/OCELL)*OCELL,oz=Math.round(cz/OCELL)*OCELL;ocean.position.set(ox,0,oz);
  const p=oceanGeo.attributes.position.array;
  for(let i=0;i<p.length;i+=3)p[i+1]=waveH(oceanBase[i]+ox,oceanBase[i+2]+oz,tt);
  oceanGeo.attributes.position.needsUpdate=true;
}
const seabed=new THREE.Mesh(new THREE.PlaneGeometry(1200,1200).rotateX(-Math.PI/2),new THREE.MeshStandardMaterial({color:0x1b3a42,roughness:1}));
seabed.position.y=-DEPTH;scene.add(seabed);

/* game coordinates: x east, y north. Three: x east, z south */
const W=(x,y,h)=>new THREE.Vector3(x,h,-y);

/* survey lines drawn on the water like an overlay */
const guides=new THREE.Group();scene.add(guides);
function dashLine(pts,color,opacity,dash,gap){const g=new THREE.BufferGeometry().setFromPoints(pts);const l=new THREE.Line(g,new THREE.LineDashedMaterial({color,dashSize:dash,gapSize:gap,transparent:true,opacity}));l.computeLineDistances();return l;}
for(let i=0;i<NA;i++)guides.add(dashLine([W(AREA.x0-RUN,A_Y(i),.9),W(AREA.x1+RUN,A_Y(i),.9)],0x8fd6cf,.75,6,4));
for(let j=0;j<NB;j++)guides.add(dashLine([W(B_X(j),AREA.y0-RUN,.9),W(B_X(j),AREA.y1+RUN,.9)],0xdce6ef,.28,1.5,4));
guides.add(dashLine([W(AREA.x0,AREA.y0,1),W(AREA.x1,AREA.y0,1),W(AREA.x1,AREA.y1,1),W(AREA.x0,AREA.y1,1),W(AREA.x0,AREA.y0,1)],0xffffff,.8,3,2));
const crossGuide=dashLine([W(0,0,1),W(0,1,1)],0xff6b45,.95,5,3);crossGuide.visible=false;scene.add(crossGuide);

/* ---------------- B01 model, built from the vessel drawing's faceted hull ---------------- */
const PAL=[0x1f3c5c,0x26466b,0x2e537b,0x19324d,0x3a628e,0x223f62];
function facetMesh(rings,capStart,capEnd,seed,palette){
  const pos=[],col=[],rnd=mulberry(seed),c=new THREE.Color();
  const tri=(a,b,d)=>{pos.push(...a,...b,...d);c.setHex(palette[Math.floor(rnd()*palette.length)]);for(let k=0;k<3;k++)col.push(c.r,c.g,c.b);};
  for(let i=0;i<rings.length-1;i++){const A=rings[i],B=rings[i+1],n=A.length;for(let k=0;k<n;k++){const k2=(k+1)%n;tri(A[k],B[k],B[k2]);tri(A[k],B[k2],A[k2]);}}
  const fan=(R,ctr,rev)=>{for(let k=0;k<R.length;k++){const a=R[k],b=R[(k+1)%R.length];rev?tri(ctr,b,a):tri(ctr,a,b);}};
  fan(rings[0],capStart,true);fan(rings[rings.length-1],capEnd,false);
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.computeVertexNormals();
  return new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,flatShading:true,roughness:.72,metalness:.18,side:THREE.DoubleSide}));
}
function buildB01(){
  const g=new THREE.Group();
  /* hull stations: x (bow +), deck half-width, deck height, chine half-width, chine height, keel depth */
  const ST=[[-4,.95,.55,1.02,.08,-.5],[-2.6,1.12,.7,1.2,.02,-.85],[-.6,1.2,.78,1.28,0,-1],[1.4,1.12,.74,1.2,.02,-.9],[2.9,.72,.6,.78,.06,-.55],[4.2,.05,.4,.05,.12,-.08]];
  const ring=([x,dw,dy,cw,cy,ky])=>[[x,dy+.07,0],[x,dy,dw],[x,cy,cw],[x,ky*.62,cw*.55],[x,ky,0],[x,ky*.62,-cw*.55],[x,cy,-cw],[x,dy,-dw]];
  g.add(facetMesh(ST.map(ring),[-4.05,.1,0],[4.35,.15,0],7,PAL));
  /* cabin */
  const CB=[[-1.9,.82,.74,.46,1.24],[.2,.9,.78,.56,1.32],[1.6,.72,.74,.42,1.2],[2.35,.3,.7,.1,.96]];
  const cring=([x,bw,by,tw,ty])=>[[x,ty,0],[x,ty-.05,tw],[x,by,bw],[x,by,-bw],[x,ty-.05,-tw]];
  g.add(facetMesh(CB.map(cring),[-1.95,1,0],[2.45,.82,0],11,[0x2e537b,0x3a628e,0x26466b,0x4b74a1]));
  const dark=new THREE.MeshStandardMaterial({color:0x1c3552,roughness:.6,metalness:.3,flatShading:true});
  /* solar panels on the cabin sides */
  const solarMat=new THREE.MeshStandardMaterial({color:0x0d1b2b,roughness:.25,metalness:.5});
  [-1,1].forEach(s=>{const p=new THREE.Mesh(new THREE.BoxGeometry(1.7,.26,.02),solarMat);p.position.set(.25,1.02,s*.74);p.rotation.x=s*.42;g.add(p);});
  /* mast: whip antenna, GNSS and comms fins, EO/IR turret, radar dome */
  const whip=new THREE.Mesh(new THREE.CylinderGeometry(.035,.05,1.75,6),dark);whip.position.set(-.9,2.15,0);g.add(whip);
  [[-.62,.42],[-.38,.3]].forEach(([x,h])=>{const f=new THREE.Mesh(new THREE.BoxGeometry(.16,h,.06),dark);f.position.set(x,1.3+h/2,0);g.add(f);});
  const ped=new THREE.Mesh(new THREE.CylinderGeometry(.12,.17,.2,6),dark);ped.position.set(0,1.42,0);g.add(ped);
  const ball=new THREE.Mesh(new THREE.SphereGeometry(.24,10,8),new THREE.MeshStandardMaterial({color:0x27486e,roughness:.4,metalness:.4,flatShading:true}));ball.position.set(0,1.68,0);g.add(ball);
  const lens=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,.06,10),new THREE.MeshStandardMaterial({color:0x0b1724,roughness:.1,metalness:.8}));lens.rotation.z=Math.PI/2;lens.position.set(.22,1.68,0);g.add(lens);
  const dome=new THREE.Mesh(new THREE.SphereGeometry(.22,10,6,0,Math.PI*2,0,Math.PI/2),dark);dome.position.set(.85,1.31,0);dome.scale.y=.55;g.add(dome);
  /* sonar gondola and side-scan bars */
  const pod=new THREE.Mesh(new THREE.BoxGeometry(1.7,.34,.55),new THREE.MeshStandardMaterial({color:0x8b979b,roughness:.5,metalness:.4}));pod.position.set(.3,-1.12,0);g.add(pod);
  [-1,1].forEach(s=>{const b=new THREE.Mesh(new THREE.BoxGeometry(2.2,.07,.07),new THREE.MeshStandardMaterial({color:0x2f5561}));b.position.set(-.2,-.45,s*1.02);g.add(b);});
  /* navigation lights */
  const lamp=(c,x,y,z)=>{const m=new THREE.Mesh(new THREE.SphereGeometry(.07,8,6),new THREE.MeshBasicMaterial({color:c}));m.position.set(x,y,z);g.add(m);};
  lamp(0xfff4cf,-.9,2.95,0);lamp(0x35d07f,2.3,.66,.64);lamp(0xff4d4d,2.3,.66,-.64);lamp(0xfff4cf,-4.02,.6,0);
  /* B01 hull number on both sides */
  const cv=document.createElement('canvas');cv.width=256;cv.height=96;const cx=cv.getContext('2d');cx.font='bold 64px "B612 Mono", Consolas, monospace';cx.fillStyle='#e9ddb0';cx.textBaseline='middle';cx.fillText('B01',24,52);
  const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;
  [1,-1].forEach(s=>{const p=new THREE.Mesh(new THREE.PlaneGeometry(1.1,.41),new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false}));p.position.set(2.75,.36,s*.86);if(s<0)p.rotation.y=Math.PI;g.add(p);});
  /* sonar fan: clean water column inside the minimum slant range, the rest is the dead zone */
  const fan=(r0,r1,col,op)=>{const pts=[],A=55*D2R,N=24;for(let k=0;k<N;k++){const a0=-A+2*A*k/N,a1=-A+2*A*(k+1)/N;const p=(a,r)=>[0,-TXD-r*Math.cos(a),r*Math.sin(a)];const q=(a)=>Math.min(r1,(DEPTH-TXD)/Math.cos(a));
      const i0=p(a0,r0),i1=p(a1,r0),o0=p(a0,q(a0)),o1=p(a1,q(a1));pts.push(...i0,...o0,...o1,...i0,...o1,...i1);}
    const gg=new THREE.BufferGeometry();gg.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));
    return new THREE.Mesh(gg,new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:op,side:THREE.DoubleSide,depthWrite:false}));};
  const fanClean=fan(.01,DEPTH-TXD,0x8fd6cf,.2),fanDead=fan(DEPTH-TXD,60,0xa6b8ca,.07);fanClean.position.x=.3;fanDead.position.x=.3;g.add(fanClean,fanDead);
  return g;
}
const b01=buildB01();scene.add(b01);

/* the moored mine: sphere with horns on a tether to an anchor */
const mine=new THREE.Group();
const mineMat=new THREE.MeshStandardMaterial({color:0x3b4740,roughness:.55,metalness:.4,emissive:0xff6b45,emissiveIntensity:0,flatShading:true});
mine.add(new THREE.Mesh(new THREE.IcosahedronGeometry(.55,1),mineMat));
for(let k=0;k<8;k++){const h=new THREE.Mesh(new THREE.CylinderGeometry(.04,.06,.32,5),mineMat);const a=k/8*Math.PI*2,e=(k%2?.4:-.25);h.position.set(Math.cos(a)*.55,e,Math.sin(a)*.55);h.lookAt(0,0,0);h.rotateX(Math.PI/2);mine.add(h);}
const tether=new THREE.Mesh(new THREE.CylinderGeometry(.02,.02,DEPTH-MINE.z,4),new THREE.MeshBasicMaterial({color:0x6f7a81}));tether.position.y=-(DEPTH-MINE.z)/2;mine.add(tether);
const anchor=new THREE.Mesh(new THREE.BoxGeometry(.8,.4,.8),new THREE.MeshStandardMaterial({color:0x4a524e}));anchor.position.y=-(DEPTH-MINE.z)+.2;mine.add(anchor);
mine.position.copy(W(MINE.x,MINE.y,-MINE.z));scene.add(mine);
const ring=new THREE.Mesh(new THREE.TorusGeometry(3.2,.12,6,40),new THREE.MeshBasicMaterial({color:0xff6b45}));ring.rotation.x=Math.PI/2;ring.position.copy(W(MINE.x,MINE.y,1.1));scene.add(ring);
function setMine3D(){const st=S.mine.state;ring.visible=st!=='hidden';
  ring.material.color.setHex(st==='handed'?0xa99cff:st==='rejected'?0x7a91ab:0xff6b45);mineMat.emissiveIntensity=st==='hidden'?0:.9;}

/* ---------------- input ---------------- */
function anyInput(){S.lastInput=performance.now();if(S.mode==='attract'){openBrief();return true;}return false;}
const KEYMAP={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',ArrowUp:'up',KeyW:'up',ArrowDown:'down',KeyS:'down'};
addEventListener('keydown',e=>{
  if(anyInput())return;
  if(!$('#o-brief').hidden&&(e.code==='Enter'||e.code==='Space')){e.preventDefault();startPlay();return;}
  if(S.mode!=='play'||S.paused)return;
  const k=KEYMAP[e.code];if(k){e.preventDefault();press(k,1);}
  if(e.code==='Space'){e.preventDefault();toggleAuto();}
  if(e.code==='KeyC')toggleCam();
});
addEventListener('keyup',e=>{const k=KEYMAP[e.code];if(k)press(k,0);});
addEventListener('pointerdown',e=>{if(S.mode==='attract'&&!e.target.closest('button')){anyInput();}else S.lastInput=performance.now();});
function press(k,on){S.keys[k]=on;if(on&&(k==='left'||k==='right')&&S.auto){S.auto=false;$('#b-auto').setAttribute('aria-pressed','false');toast(t('takeover'));}}
document.querySelectorAll('.tbtn').forEach(b=>{const k=b.dataset.k;
  const on=e=>{e.preventDefault();S.lastInput=performance.now();if(S.mode!=='play'||S.paused)return;b.classList.add('on');press(k,1);};
  const off=()=>{b.classList.remove('on');press(k,0);};
  b.addEventListener('pointerdown',on);b.addEventListener('pointerup',off);b.addEventListener('pointerleave',off);b.addEventListener('pointercancel',off);});
function toggleAuto(){S.auto=!S.auto;$('#b-auto').setAttribute('aria-pressed',String(S.auto));toast(S.auto?t('autoOn'):t('takeover'));if(S.auto){S.thr=MAXV;S.legFrom=[S.boat.x,S.boat.y];}}
function toggleCam(){S.cam=S.cam==='chase'?'top':'chase';}
$('#b-auto').addEventListener('click',()=>{S.lastInput=performance.now();if(S.mode==='play')toggleAuto();});
$('#b-cam').addEventListener('click',()=>{S.lastInput=performance.now();toggleCam();});
$('#b-lang').addEventListener('click',()=>{lang=lang==='ar'?'en':'ar';store.set('b01sim.lang',lang);applyLang();});

/* ---------------- flow: attract, briefing, play, results ---------------- */
function openBrief(){S.mode='brief';$('#caption').hidden=true;$('#o-brief').hidden=false;$('#b-start').focus();}
function startPlay(){$('#o-brief').hidden=true;resetScenario('play');S.cam='chase';showControls();}
function showControls(){const play=S.mode==='play';$('#t-steer').hidden=!(play&&TOUCH);$('#t-thr').hidden=!(play&&TOUCH);$('#hint').hidden=!(play&&!TOUCH);}
function toAttract(){['#o-brief','#o-hand','#o-res'].forEach(s=>$(s).hidden=true);resetScenario('attract');$('#caption').hidden=false;$('#cap-text').textContent=t('a1');showControls();}
$('#b-start').addEventListener('click',startPlay);
$('#b-again').addEventListener('click',()=>{$('#o-res').hidden=true;openBrief();});

let toastTimer=0;
function toast(msg,cls){const el=$('#toast');el.textContent=msg;el.className='toast plate'+(cls?' '+cls:'');el.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>{el.hidden=true;},2600);}

/* ---------------- evidence and the handover package ---------------- */
function evidence(){
  const m=S.mine,axes=new Set(m.obs.map(o=>o.axis)),n=m.obs.length;
  const sway=n>=2&&(m.obs[n-1].t-m.obs[0].t)>=10,cons=axes.size>=2;
  let conf=12+28+9+12+(m.shadow?18:0)+(sway?17:0)+(cons?6:0);
  return {conf:Math.min(97,conf),sway,cons,shadow:m.shadow};
}
function renderHand(){
  const e=evidence(),hi=e.conf>=80;
  const lvl=$('#h-lvl');lvl.textContent=hi?t('h_high'):t('h_pot');lvl.className='lvl'+(hi?'':' pot');
  $('#h-conf').textContent=e.conf+'%';
  const items=[['ev_shape',1,'ev_shape_ok'],['ev_pos',1,'ev_pos_ok'],['ev_bg',1,'ev_bg_ok'],['ev_shadow',e.shadow,e.shadow?'ev_shadow_ok':'ev_shadow_no'],['ev_sway',e.sway,e.sway?'ev_sway_ok':'ev_sway_no'],['ev_cons',e.cons,e.cons?'ev_cons_ok':'ev_cons_no']];
  $('#h-ev').innerHTML=items.map(([k,ok,d])=>'<li class="'+(ok?'':'no')+'"><span class="mark" aria-hidden="true"></span><span><b>'+t(k)+'</b><span class="d">'+t(d)+'</span></span></li>').join('');
  const fb=$('#h-fb');fb.hidden=!S.mine.fb;fb.textContent=S.mine.fb?t(S.mine.fb):'';
  const closed=S.mine.state==='handed'||S.mine.state==='rejected';
  $('#h-act').hidden=closed||!!S.mine.fb;$('#h-cont').hidden=!(closed||S.mine.fb);
  $('#d-cross').disabled=e.cons;
  requestAnimationFrame(drawSnip);
}
function openHand(){S.paused=true;S.mine.fb='';S.keys={left:0,right:0,up:0,down:0};renderHand();$('#o-hand').hidden=false;$('#d-hand').focus();}
function decide(kind){
  const e=evidence(),m=S.mine;
  if(kind==='hand'){S.score+=e.conf>=80?300:120;m.state='handed';S.decision='hand';m.fb=e.conf>=80?'f_hand_good':'f_hand_weak';}
  if(kind==='reject'){S.score-=150;m.state='rejected';S.decision='reject';m.fb='f_reject';}
  if(kind==='cross'){S.score+=40;m.state='cross';S.decision='cross';m.fb='f_cross';
    const first=m.obs[0].axis,ns=first===1;/* first seen on an east-west run, so cross north-south */
    const a=ns?[MINE.x,MINE.y+RUN+30]:[MINE.x-RUN-30,MINE.y],b=ns?[MINE.x,MINE.y-RUN-30]:[MINE.x+RUN+30,MINE.y];
    m.cross=[a,b];crossGuide.geometry.setFromPoints([W(a[0],a[1],1),W(b[0],b[1],1)]);crossGuide.computeLineDistances();crossGuide.visible=true;
    const bt=S.boat,near=Math.hypot(a[0]-bt.x,a[1]-bt.y)<=Math.hypot(b[0]-bt.x,b[1]-bt.y);
    S.queue=near?[a,b]:[b,a];S.legFrom=[bt.x,bt.y];}
  setMine3D();renderHand();updateHud(true);
}
$('#d-hand').addEventListener('click',()=>decide('hand'));
$('#d-cross').addEventListener('click',()=>decide('cross'));
$('#d-reject').addEventListener('click',()=>decide('reject'));
$('#d-cont').addEventListener('click',()=>{$('#o-hand').hidden=true;S.paused=false;S.lastInput=performance.now();});

function observe(axis,across){
  const m=S.mine,isNewAxis=!m.obs.some(o=>o.axis===axis);
  m.obs.push({t:S.time,axis});
  if(across>=6&&across<=50)m.shadow=true;
  if(m.state==='hidden'){m.state='detected';setMine3D();
    if(S.mode==='play'){toast(t('detected'),'hit');setTimeout(openHand,450);}else toast(t('detAttract'),'hit');}
  else if(S.mode==='play'&&m.state==='cross'&&isNewAxis){m.state='detected';toast(t('again2'),'hit');setTimeout(openHand,450);}
}

function endMission(){
  S.paused=true;S.mode='results';
  const covPct=Math.round(S.covPct*100);const total=Math.max(0,Math.round(S.score+covPct*3));
  $('#r-score').textContent=total;$('#r-cov').textContent=covPct+'%';
  $('#r-dec').textContent=t({hand:'dec_hand',reject:'dec_reject',cross:'dec_cross',none:'dec_none'}[S.decision]);
  const best=store.get('b01sim.best',[]);const me={s:total,c:covPct,d:Date.now()};best.push(me);best.sort((a,b)=>b.s-a.s);const top=best.slice(0,5);store.set('b01sim.best',top);
  $('#r-best').innerHTML=top.map((b,i)=>'<li class="'+(b.d===me.d?'me':'')+'"><span class="n">'+(i+1)+'</span><span class="n">'+b.s+'</span><span class="n">'+b.c+'%</span></li>').join('');
  $('#o-res').hidden=false;$('#b-again').focus();showControls();
}

/* ---------------- simulation step ---------------- */
function steerAuto(){
  const b=S.boat;let P=S.queue.length?S.queue[0]:S.route[S.wp];
  if(!P){return null;}
  if(Math.hypot(P[0]-b.x,P[1]-b.y)<9){S.legFrom=P;if(S.queue.length)S.queue.shift();else S.wp++;P=S.queue.length?S.queue[0]:S.route[S.wp];if(!P)return null;}
  /* line-following: steer to a look-ahead point on the current leg, so the boat rejoins the line after each turn */
  const A=S.legFrom||[b.x,b.y];let ux=P[0]-A[0],uy=P[1]-A[1];const L=Math.hypot(ux,uy)||1;ux/=L;uy/=L;
  const s=clamp((b.x-A[0])*ux+(b.y-A[1])*uy+16,0,L),tx=A[0]+ux*s,ty=A[1]+uy*s;
  const err=wrapPi(Math.atan2(tx-b.x,ty-b.y)-b.h);
  return {rud:clamp(err*1.8,-1,1),v:Math.abs(err)>.35?MAXV*.7:MAXV};
}
function step(dt){
  const b=S.boat;
  let rud=0;
  if(S.auto){const a=steerAuto();if(a){rud=a.rud;S.thr=a.v;}else if(S.mode==='attract'){resetScenario('attract');return;}else{S.auto=false;$('#b-auto').setAttribute('aria-pressed','false');}}
  else{rud=S.keys.right-S.keys.left;S.thr=clamp(S.thr+(S.keys.up-S.keys.down)*1.2*dt,0,MAXV);}
  b.v+=(S.thr-b.v)*clamp(dt*.8,0,1);
  const yawT=rud*MAXYAW*clamp(b.v/1.2,.2,1);b.r+=(yawT-b.r)*clamp(dt*3,0,1);
  b.h=wrapPi(b.h+b.r*dt);
  b.x+=Math.sin(b.h)*b.v*RATE*dt;b.y+=Math.cos(b.h)*b.v*RATE*dt;
  S.time+=dt;S.batt=Math.max(5,S.batt-dt*.012*(.4+b.v/MAXV));
  const inArea=b.x>AREA.x0&&b.x<AREA.x1&&b.y>AREA.y0&&b.y<AREA.y1;
  S.turning=Math.abs(b.r)>4*D2R&&inArea;S.outside=!inArea;
  const straight=Math.abs(b.r)<4*D2R&&b.v>.4,axis=Math.abs(Math.sin(b.h))>Math.abs(Math.cos(b.h))?1:2,sh=Math.sin(b.h),ch=Math.cos(b.h);
  if(straight){
    const i0=Math.max(0,Math.floor((b.x-AREA.x0-SW-4)/CELL)),i1=Math.min(NX-1,Math.floor((b.x-AREA.x0+SW+4)/CELL)),j0=Math.max(0,Math.floor((b.y-AREA.y0-SW-4)/CELL)),j1=Math.min(NY-1,Math.floor((b.y-AREA.y0+SW+4)/CELL));
    for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const dx=AREA.x0+(i+.5)*CELL-b.x,dy=AREA.y0+(j+.5)*CELL-b.y,al=dx*sh+dy*ch,ac=dx*ch-dy*sh;if(Math.abs(al)<=3.5&&Math.abs(ac)<=SW)S.cov[j*NX+i]|=axis;}
  }
  /* the mine is seen only inside the clean water-column swath */
  const mdx=MINE.x-b.x,mdy=MINE.y-b.y,mal=mdx*sh+mdy*ch,mac=mdx*ch-mdy*sh,clean=Math.sqrt(DEPTH*DEPTH-MINE.z*MINE.z)-.5;
  if(straight&&Math.abs(mal)<3&&Math.abs(mac)<clean){if(!S.mine.lock){S.mine.lock=true;observe(axis,Math.abs(mac));}}
  else if(Math.abs(mal)>8)S.mine.lock=false;
  if(S.trail.length===0||Math.hypot(S.trail[S.trail.length-1][0]-b.x,S.trail[S.trail.length-1][1]-b.y)>3){S.trail.push([b.x,b.y]);if(S.trail.length>400)S.trail.shift();}
  if(S.mode==='play'){
    if(S.time>=MISSION||(S.mine.state==='handed'&&S.covPct>=.8)){endMission();return;}
    if(performance.now()-S.lastInput>60000&&!S.auto)toAttract();
  }
}

/* ---------------- camera ---------------- */
const camPos=new THREE.Vector3(-170,14,40),camLook=new THREE.Vector3();
function updateCamera(dt,tt){
  const b=S.boat,bp=W(b.x,b.y,0),fwd=new THREE.Vector3(Math.sin(b.h),0,-Math.cos(b.h));
  let want,look;
  if(S.mode==='attract'||S.mode==='brief'){const a=tt*.07;want=bp.clone().add(new THREE.Vector3(Math.cos(a)*15,4.5+1.5*Math.sin(tt*.13),Math.sin(a)*15));look=bp.clone().add(new THREE.Vector3(0,.4,0));}
  else if(S.cam==='top'){want=bp.clone().add(new THREE.Vector3(0,120,40));look=bp.clone();}
  else{want=bp.clone().addScaledVector(fwd,-20).add(new THREE.Vector3(0,8.5,0));look=bp.clone().addScaledVector(fwd,10).add(new THREE.Vector3(0,1,0));}
  const k=clamp(dt*2.4,0,1);camPos.lerp(want,k);camLook.lerp(look,k);
  camera.position.copy(camPos);camera.lookAt(camLook);sky.position.copy(camera.position);
}

/* ---------------- HUD: stats, minimap, sonar ---------------- */
let hudT=0;
function updateHud(force){
  const now=performance.now();if(!force&&now-hudT<120)return;hudT=now;
  let c=0;for(let i=0;i<S.cov.length;i++)if(S.cov[i])c++;S.covPct=c/S.cov.length;
  const left=Math.max(0,MISSION-S.time),mm=Math.floor(left/60),ss=Math.floor(left%60);
  $('#s-time').textContent=S.mode==='play'?mm+':'+String(ss).padStart(2,'0'):'—';
  $('#s-cov').textContent=Math.round(S.covPct*100)+'%';
  $('#s-speed').textContent=(S.boat.v*1.944).toFixed(1)+' kn';
  $('#s-batt').textContent=Math.round(S.batt)+'%';
  $('#s-score').textContent=Math.round(S.score);
  if(S.mode==='play'&&!S.paused){if(S.turning)toastOnce('turning','warn');else if(S.outside&&!S.auto)toastOnce('outside','warn');else lastToast='';}
}
let lastToast='';function toastOnce(k,cls){if(lastToast===k)return;lastToast=k;toast(t(k),cls);}
function fitCanvas(cv){const r=cv.getBoundingClientRect(),d=Math.min(2,devicePixelRatio||1),w=Math.max(1,Math.round(r.width*d)),h=Math.max(1,Math.round(r.height*d));if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h;}const ctx=cv.getContext('2d');ctx.setTransform(d,0,0,d,0,0);return{ctx,w:r.width,h:r.height};}
const mmCv=$('#mm');
function drawMinimap(){
  const {ctx,w,h}=fitCanvas(mmCv);const m=RUN+12,sx=w/(AREA.x1-AREA.x0+2*m),sy=h/(AREA.y1-AREA.y0+2*m),sc=Math.min(sx,sy);
  const X=x=>w/2+x*sc,Y=y=>h/2-y*sc;
  ctx.fillStyle='#0a1626';ctx.fillRect(0,0,w,h);
  for(let j=0;j<NY;j++)for(let i=0;i<NX;i++){const v=S.cov[j*NX+i];if(!v)continue;ctx.fillStyle=v===3?'rgba(143,214,207,.55)':'rgba(62,154,163,.38)';ctx.fillRect(X(AREA.x0+i*CELL),Y(AREA.y0+(j+1)*CELL),CELL*sc+.5,CELL*sc+.5);}
  ctx.lineWidth=1;ctx.setLineDash([3,3]);ctx.strokeStyle='rgba(143,214,207,.7)';
  for(let i=0;i<NA;i++){ctx.beginPath();ctx.moveTo(X(AREA.x0-RUN),Y(A_Y(i)));ctx.lineTo(X(AREA.x1+RUN),Y(A_Y(i)));ctx.stroke();}
  ctx.setLineDash([1,3]);ctx.strokeStyle='rgba(220,230,239,.35)';
  for(let j=0;j<NB;j++){ctx.beginPath();ctx.moveTo(X(B_X(j)),Y(AREA.y0-RUN));ctx.lineTo(X(B_X(j)),Y(AREA.y1+RUN));ctx.stroke();}
  ctx.setLineDash([]);ctx.strokeStyle='rgba(220,230,239,.8)';ctx.strokeRect(X(AREA.x0),Y(AREA.y1),(AREA.x1-AREA.x0)*sc,(AREA.y1-AREA.y0)*sc);
  if(S.mine.cross&&S.mine.state==='cross'){ctx.setLineDash([5,3]);ctx.strokeStyle='#ff6b45';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(X(S.mine.cross[0][0]),Y(S.mine.cross[0][1]));ctx.lineTo(X(S.mine.cross[1][0]),Y(S.mine.cross[1][1]));ctx.stroke();ctx.setLineDash([]);ctx.lineWidth=1;}
  if(S.trail.length>1){ctx.strokeStyle='rgba(143,214,207,.6)';ctx.beginPath();S.trail.forEach((p,i)=>i?ctx.lineTo(X(p[0]),Y(p[1])):ctx.moveTo(X(p[0]),Y(p[1])));ctx.stroke();}
  if(S.mine.state!=='hidden'){const st=S.mine.state;ctx.fillStyle=st==='handed'?'#a99cff':st==='rejected'?'#7a91ab':'#ff6b45';ctx.beginPath();ctx.arc(X(MINE.x),Y(MINE.y),4.5,0,Math.PI*2);ctx.fill();}
  const b=S.boat;ctx.save();ctx.translate(X(b.x),Y(b.y));ctx.rotate(b.h);ctx.fillStyle='#dce6ef';ctx.beginPath();ctx.moveTo(0,-7);ctx.lineTo(4.5,5);ctx.lineTo(-4.5,5);ctx.closePath();ctx.fill();ctx.restore();
  ctx.fillStyle='rgba(220,230,239,.7)';ctx.font='10px "B612 Mono", monospace';ctx.direction='ltr';ctx.textAlign='left';ctx.fillText('N',6,12);
}
/* water-column fan: same idea as the console, with the dead zone outside the minimum slant range */
const SONAR=(()=>{const st=[[0,'#040b12'],[.16,'#08222b'],[.36,'#0f4a52'],[.58,'#27858a'],[.8,'#7fcfc4'],[1,'#effffb']],o=new Uint8ClampedArray(768);const hx=c=>[parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)];for(let i=0;i<256;i++){const v=i/255;let j=0;while(j<st.length-2&&v>st[j+1][0])j++;const a=st[j],bb=st[j+1],f=clamp((v-a[0])/(bb[0]-a[0]),0,1),ca=hx(a[1]),cb=hx(bb[1]);for(let k=0;k<3;k++)o[i*3+k]=ca[k]+(cb[k]-ca[k])*f;}return o;})();
const wcdCv=$('#wcd'),wbuf=document.createElement('canvas');
function drawWCD(){
  const {ctx,w,h}=fitCanvas(wcdCv);const bw=Math.max(40,Math.round(w*.6)),bh=Math.max(30,Math.round(h*.6));if(wbuf.width!==bw||wbuf.height!==bh){wbuf.width=bw;wbuf.height=bh;}
  const bc=wbuf.getContext('2d'),img=bc.createImageData(bw,bh),D=img.data,b=S.boat,maxA=55*D2R,Rm=DEPTH*1.9,top=3,k=Math.max(Rm/(bh-top-2),2*Rm*Math.sin(maxA)/(bw-4)),ax=bw/2,zb0=DEPTH-TXD;
  const sh=Math.sin(b.h),ch=Math.cos(b.h),mdx=MINE.x-b.x,mdy=MINE.y-b.y,mal=mdx*sh+mdy*ch,mac=mdx*ch-mdy*sh,clean=Math.sqrt(DEPTH*DEPTH-MINE.z*MINE.z)-.5;
  const tg=Math.abs(mal)<4&&Math.abs(mac)<clean?{u:mac+Math.sin(S.time*.8)*.3,z:MINE.z-TXD}:null;
  for(let py=0;py<bh;py++){const dz=(py-top)*k;for(let px=0;px<bw;px++){const o=(py*bw+px)*4,dx=(px-ax)*k,r=Math.hypot(dx,dz),an=Math.atan2(dx,dz);
    if(dz<=0||r>Rm||Math.abs(an)>maxA){D[o+3]=0;continue;}
    const zb=zb0+.6*Math.sin(dx*.09+b.x*.02);let v=.04+Math.random()*.07;const e=dz-zb;
    if(r>zb0&&e<-.3){v+=.08+Math.random()*.14;if(((px+py)&7)===0)v+=.1;}
    if(e>-.3&&e<.5)v=.6+.32*Math.random()-Math.abs(e)*.5;else if(e>=.5)v=Math.max(.03,.3*Math.exp(-(e-.5)*.5)+Math.random()*.05);
    if(tg){const dd=Math.hypot(dx-tg.u,dz-tg.z);if(dd<.7)v=Math.max(v,.97-dd*.4);else if(dd<1.4)v+=.18*(1.4-dd);if(dz>tg.z+.6&&dz<zb&&Math.abs(dx-tg.u)<.12&&Math.random()<.7)v+=.28;}
    const i3=clamp(Math.round(v*255),0,255)*3;D[o]=SONAR[i3];D[o+1]=SONAR[i3+1];D[o+2]=SONAR[i3+2];D[o+3]=255;}}
  bc.putImageData(img,0,0);ctx.clearRect(0,0,w,h);ctx.drawImage(wbuf,0,0,w,h);
  const f=w/bw,AX=ax*f,AY=top*(h/bh),pxm=f/k;
  ctx.setLineDash([4,3]);ctx.strokeStyle='rgba(220,230,239,.6)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(AX,AY,zb0*pxm,Math.PI/2+maxA,Math.PI/2-maxA,true);ctx.stroke();ctx.setLineDash([]);
  ctx.font='500 11px "Readex Pro", Tahoma, sans-serif';ctx.direction=lang==='ar'?'rtl':'ltr';ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineWidth=3;ctx.strokeStyle='rgba(4,11,18,.85)';ctx.fillStyle='#dce6ef';
  const la=50*D2R,lr=zb0*(1+1/Math.cos(la))/2*pxm;[-1,1].forEach(s=>{const lx=AX+s*Math.sin(la)*lr,ly=AY+Math.cos(la)*lr;ctx.strokeText(t('dead'),lx,ly);ctx.fillText(t('dead'),lx,ly);});
  if(tg){const tx=AX+tg.u*pxm,ty=AY+tg.z*pxm;ctx.strokeStyle='#ff6b45';ctx.lineWidth=1.4;ctx.strokeRect(tx-9,ty-9,18,18);}
}
/* the evidence slice in the handover package */
function drawSnip(){
  const cv=$('#snip');const {ctx,w,h}=fitCanvas(cv);const bw=Math.round(w),bh=Math.round(h);if(bw<10)return;
  const img=ctx.createImageData(bw,bh),D=img.data,rnd=mulberry(42),z0=2,pxm=bh/(DEPTH+2-z0);
  for(let py=0;py<bh;py++){const z=z0+py/pxm;for(let px=0;px<bw;px++){const u=(px-bw/2)/pxm,o=(py*bw+px)*4,zb=DEPTH+.25*Math.sin(u*.7);let v=.05+rnd()*.08;const e=z-zb;
    if(e>-.3&&e<.45)v=.6+.3*rnd()-Math.abs(e)*.5;else if(e>=.45)v=Math.max(.03,.32*Math.exp(-(e-.45)*.55)+rnd()*.05);
    const dd=Math.hypot(u,z-MINE.z);if(dd<.5)v=Math.max(v,.97-dd*.4);else if(dd<1.1)v+=.22*(1.1-dd);
    if(z>MINE.z+.5&&z<zb&&Math.abs(u)<.07&&rnd()<.75)v+=.32;
    const i3=clamp(Math.round(v*255),0,255)*3;D[o]=SONAR[i3];D[o+1]=SONAR[i3+1];D[o+2]=SONAR[i3+2];D[o+3]=255;}}
  const d=Math.min(2,devicePixelRatio||1);ctx.setTransform(1,0,0,1,0,0);const tmp=document.createElement('canvas');tmp.width=bw;tmp.height=bh;tmp.getContext('2d').putImageData(img,0,0);ctx.setTransform(d,0,0,d,0,0);ctx.drawImage(tmp,0,0,w,h);
  const U=u=>w/2+u*pxm,Z=z=>(z-z0)*pxm;
  ctx.strokeStyle='#ff6b45';ctx.lineWidth=1.6;ctx.setLineDash([4,3]);ctx.beginPath();ctx.arc(U(0),Z(MINE.z),.5*pxm+3,0,Math.PI*2);ctx.stroke();
  const x=U(-1.6);ctx.beginPath();ctx.moveTo(x,Z(MINE.z+.5));ctx.lineTo(x,Z(DEPTH));ctx.stroke();ctx.setLineDash([]);
  ctx.font='500 11px "Readex Pro", Tahoma, sans-serif';ctx.direction=lang==='ar'?'rtl':'ltr';ctx.textBaseline='middle';ctx.lineWidth=3;ctx.strokeStyle='rgba(4,11,18,.85)';ctx.fillStyle='#ff6b45';
  const lab=(s,lx,ly,al)=>{ctx.textAlign=al;ctx.strokeText(s,lx,ly);ctx.fillText(s,lx,ly);};
  lab(lang==='ar'?'كروي، قطر 1 م':'spherical, 1 m',U(0)+.5*pxm+8,Z(MINE.z),'left');
  lab(lang==='ar'?'9 م فوق القاع':'9 m above seabed',x-6,Z((MINE.z+DEPTH)/2),'right');
}

/* ---------------- main loop ---------------- */
let last=performance.now(),wcdT=0,mmT=0,fpsAcc=0,fpsN=0,fpsChecked=false,startT=performance.now();
function frame(now){
  const dt=Math.min(.05,(now-last)/1000);last=now;const tt=now/1000;
  if(S.mode==='attract'||S.mode==='play'||S.mode==='brief'){if(!S.paused&&S.mode!=='brief')step(dt);else if(S.mode==='brief'&&S.auto)step(dt);}
  if(S.mode==='attract'){S.capT+=dt;if(S.capT>6.5){S.capT=0;S.capIdx=(S.capIdx+1)%5;$('#cap-text').textContent=t('a'+(S.capIdx+1));}}
  const b=S.boat,bp=W(b.x,b.y,0);
  const wy=waveH(bp.x,bp.z,tt),wx1=waveH(bp.x+2,bp.z,tt)-waveH(bp.x-2,bp.z,tt),wz1=waveH(bp.x,bp.z+2,tt)-waveH(bp.x,bp.z-2,tt);
  b01.position.set(bp.x,wy*.6+.05,bp.z);b01.rotation.set(0,0,0);b01.rotateY(Math.PI/2-b.h);b01.rotateZ(Math.atan2(wx1*Math.sin(b.h)-wz1*Math.cos(b.h),8)*.6);b01.rotateX(Math.atan2(wx1*Math.cos(b.h)+wz1*Math.sin(b.h),8)*-.6);
  updateOcean(tt,bp.x,bp.z);updateCamera(dt,tt);
  if(S.mine.state!=='hidden')ring.rotation.z=tt*.6;
  mine.position.y=-MINE.z+Math.sin(tt*.8)*.15;mine.position.x=MINE.x+Math.sin(tt*.8)*.3;
  renderer.render(scene,camera);
  updateHud(false);
  if(now-mmT>140){mmT=now;drawMinimap();}
  if(now-wcdT>250){wcdT=now;drawWCD();}
  if(!fpsChecked){fpsAcc+=dt;fpsN++;if(now-startT>4000){const fps=fpsN/fpsAcc;fpsChecked=true;if(fps<45&&pixelRatio>1){pixelRatio=1;renderer.setPixelRatio(1);}if(fps<32)oceanSkip=true;}}
  requestAnimationFrame(frame);
}
addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();});
/* test hook: advance the simulation without animation frames (used for checks while the window is hidden) */
window.__b01={S,decide,startPlay,toAttract,openBrief,
  advance(sec,dt){dt=dt||1/30;const n=Math.round(sec/dt);for(let i=0;i<n;i++){if(!S.paused&&(S.mode==='attract'||S.mode==='play'))step(dt);}
    updateCamera(1,performance.now()/1000);last=performance.now();frame(performance.now());updateHud(true);drawMinimap();drawWCD();return {mode:S.mode,time:+S.time.toFixed(1),x:+S.boat.x.toFixed(1),y:+S.boat.y.toFixed(1),cov:Math.round(S.covPct*100),mine:S.mine.state,obs:S.mine.obs.length,paused:S.paused};}};

resetScenario('attract');applyLang();toAttract();
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>{applyLang();});
requestAnimationFrame(frame);
