/* B01 mission simulator (playable prototype).
   One vessel, one survey area and four targets that follow the auv-platform demo:
   a possible moored mine, a likely wreck, an unknown object and marine life. All data is simulated. */
import * as THREE from '../vendor/three.module.min.js';

const $=s=>document.querySelector(s);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const D2R=Math.PI/180;
const wrapPi=a=>{while(a>Math.PI)a-=2*Math.PI;while(a<-Math.PI)a+=2*Math.PI;return a;};
const store={get(k,d){try{const v=localStorage.getItem(k);return v===null?d:JSON.parse(v);}catch(e){return d;}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}};
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const fmt=s=>{s=Math.max(0,Math.floor(s));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');};

/* ---------------- language ---------------- */
const T={
ar:{title:'محاكاة مهمة B01',sim:'بيانات محاكاة، الزمن ×{x}',time:'الوقت',left:'المتبقي',cov:'التغطية',tgs:'الأهداف',speed:'السرعة',batt:'البطارية',score:'النقاط',auto:'طيار آلي',cam:'الكاميرا',map:'منطقة المسح',sonar:'عمود الماء، ملتي بيم',dead:'منطقة ميتة',
 press:'اضغط أي زر أو المس الشاشة لتتولى القيادة',keys:'الأسهم للقيادة، المسافة للطيار الآلي، C للكاميرا',
 a1:'B01 مركبة سطحية منخفضة البصمة تمسح مدخل الميناء بحثًا عن الألغام.',
 a2:'المسح الشبكي: تمريرة أفقية كاملة، ثم تمريرة عمودية فوق المنطقة نفسها.',
 a3:'الخطوط كل 25 م حتى لا تبقى فجوة في المنطقة الميتة، والانعطاف خارج المنطقة.',
 a4:'الملتي بيم يرى عمود الماء والقاع، والسونار الجانبي يرى القاع وظلاله.',
 a5:'في المنطقة أربعة أهداف: لغم مربوط محتمل، وحطام، وجسم غير معروف، وأسماك.',
 a6:'عند كل رصد يشرح النظام سبب التصنيف، والقرار للمحلل.',
 b_title:'مهمتك',b_body:'امسح مدخل الميناء بالتمريرتين، وابحث عن الأهداف تحت الماء، وقرّر في كل هدف بناءً على الأدلة.',
 b_tip:'السونار يحسب البيانات وأنت تمشي مستقيمًا فقط، فخلّ الانعطاف خارج حدود المنطقة.',
 b_keys:'التحكم: الأسهم للقيادة والسرعة، المسافة لتشغيل الطيار الآلي، C لتغيير الكاميرا.',b_touch:'التحكم: أزرار اليسار للتوجيه، وأزرار اليمين للسرعة.',start:'ابدأ المهمة',
 t_label:'مدة المهمة',t_free:'حتى يكتمل المسح',t_set:'وقت أحدده',less:'أقل',more:'أكثر',
 t_note_free:'المسح الكامل بالطيار الآلي يأخذ نحو {n}، والوقت يتوقف وأنت تقرأ حزمة التسليم.',t_note_fast:'يتسارع الزمن حتى يكتمل المسح في الوقت اللي تحدده.',t_note_ok:'الوقت يكفي للمسح الكامل بالسرعة العادية.',
 turning:'انعطاف: بيانات السونار لا تُحتسب',outside:'خارج منطقة المسح',det_wc:'رصد هدف في عمود الماء',det_sb:'رصد هدف على القاع',detAttract:'رصد هدف، والنظام يشرح سبب التصنيف',again2:'رصد الهدف من اتجاه جديد',takeover:'تحكم يدوي',autoOn:'الطيار الآلي يعمل',
 lv_high:'خطر محتمل مرتفع',lv_potential:'خطر محتمل',lv_unknown:'غير معروف، يحتاج تحققًا',lv_none:'غير خطِر',
 h_conf:'ثقة النموذج',snip:'مقطع السونار حول الهدف',
 h_mine:'هدف مشتبه: لغم مربوط محتمل',h_wreck:'جسم صناعي كبير على القاع: حطام مرجّح',h_unknown:'جسم غير معروف على القاع',h_fish:'أصداء متحركة في عمود الماء: حياة بحرية مرجّحة',
 k_mine:'لغم مربوط محتمل',k_wreck:'حطام مرجّح',k_unknown:'جسم غير معروف',k_fish:'حياة بحرية',
 ev_shape:'الشكل',ev_pos:'الموضع',ev_bg:'تباين الخلفية',ev_shadow:'الظل الصوتي',ev_move:'الحركة عبر الزمن',ev_cons:'إجماع الزوايا',
 m_shape:'صدى كروي منتظم، قطره نحو 1 م',m_pos:'معلّق في عمود الماء، نحو 9 م فوق القاع',m_bg:'غير موجود في مسح الأساس لهذه المنطقة',m_sh:'ظل منفصل عن القاع في السونار الجانبي',m_move:'يتأرجح حول نقطة ثابتة بين التمريرات',
 w_shape:'بنية طولها نحو 14 م بحواف مستقيمة',w_pos:'على القاع، عمق 18 م',w_bg:'موجود في مسح الأساس: جسم قديم في المنطقة',w_sh:'ظل طويل وواضح في السونار الجانبي',
 u_shape:'شكل غير منتظم وأبعاده غير واضحة',u_pos:'على القاع، مغطى جزئيًا بالرسوبيات',u_bg:'غير موجود في مسح الأساس',u_sh:'ظل ضعيف لا يحدد الشكل',u_cons:'رُصد من اتجاهين، والشكل ما زال غير محسوم',
 f_shape:'أصداء صغيرة متفرقة يتغير شكلها',f_pos:'في عمود الماء، نحو 8 م تحت السطح',f_bg:'غير موجودة في مسح الأساس',f_sh:'لا ظل ثابت على القاع',f_move:'تتحرك بحرية، وليست مربوطة بنقطة',
 gap:'لم يُرَ: الهدف كان في فجوة السونار الجانبي تحت المركبة',need:'يحتاج تمريرة ثانية',still:'ثابت في مكانه بين التمريرات',cons_ok:'رُصد من اتجاهين مختلفين',cons_no:'رُصد من اتجاه واحد فقط',
 d_hand:'تسليم لفريق التحقق',d_cross:'طلب تمريرة متقاطعة',d_clear:'غير خطِر، تابع المسح',cont:'متابعة المهمة',
 fb_mine_hand:'قرار صحيح بأدلة كافية. سُلّمت الحزمة لفريق التحقق.',fb_mine_weak:'القرار صحيح، لكن الأدلة ناقصة. تمريرة متقاطعة كانت سترفع الثقة.',fb_mine_clear:'خطأ خطير: الأدلة تشير إلى لغم مربوط، وتصنيفه غير خطِر يترك الخطر في الممر.',
 fb_wreck_hand:'صحيح: جسم صناعي كبير على القاع عائق ملاحي، ويحتاج فحصًا.',fb_wreck_clear:'الحطام ليس لغمًا، لكنه عائق ملاحي، والأجسام الصناعية تُفحص قبل فتح الممر.',
 fb_unknown_hand:'صحيح: النظام لا يفرض تصنيفًا، والهدف غير المعروف يُحال للتحقق.',fb_unknown_clear:'خطأ: الأدلة لا تكفي للحكم بأنه غير خطِر. غير المعروف يُحال للتحقق.',
 fb_fish_clear:'صحيح: أصداء تتحرك بحرية في عمود الماء، حياة بحرية غير خطرة.',fb_fish_hand:'الأدلة تشير إلى حياة بحرية، وإحالتها تشغل فريق التحقق بلا حاجة.',
 fb_cross:'أُضيفت تمريرة متقاطعة على الخريطة. الطيار الآلي يمر فوق الهدف من الاتجاه الآخر، أو قُدها بنفسك.',
 r_title:'انتهت المهمة',r_ok:'قرارات صحيحة',r_time:'الزمن',r_best:'أفضل النتائج',again:'العب مرة ثانية',r_right:'صحيح',r_wrong:'غير صحيح',
 dec_hand:'سُلّم للتحقق',dec_clear:'غير خطِر',dec_none:'بلا قرار',dec_miss:'لم يُرصد'},
en:{title:'B01 mission simulator',sim:'Simulated data, time ×{x}',time:'Time',left:'Left',cov:'Coverage',tgs:'Targets',speed:'Speed',batt:'Battery',score:'Score',auto:'Autopilot',cam:'Camera',map:'Survey area',sonar:'Water column, multibeam',dead:'Dead zone',
 press:'Press any key or touch the screen to take control',keys:'Arrows steer, Space autopilot, C camera',
 a1:'B01 is a low-signature surface vehicle surveying a port approach for mines.',
 a2:'Grid survey: a full horizontal pass, then a full perpendicular pass over the same area.',
 a3:'Lines every 25 m leave no gap in the dead zone, and turns happen outside the area.',
 a4:'Multibeam sees the water column and seabed; side-scan sonar sees the seabed and its shadows.',
 a5:'Four targets in the area: a possible moored mine, a wreck, an unknown object and fish.',
 a6:'On each detection the system explains why, and the analyst decides.',
 b_title:'Your mission',b_body:'Survey the port approach with both passes, find the targets under the water, and decide on each one from the evidence.',
 b_tip:'Sonar data counts only while you run straight, so make your turns outside the area.',
 b_keys:'Controls: arrows steer and set speed, Space switches autopilot, C changes camera.',b_touch:'Controls: left buttons steer, right buttons set speed.',start:'Start mission',
 t_label:'Mission time',t_free:'Until the survey is complete',t_set:'Set a time',less:'Less',more:'More',
 t_note_free:'A full autopilot survey takes about {n}; the clock stops while you read a handover package.',t_note_fast:'Time runs faster so the full survey fits the time you set.',t_note_ok:'That is enough for the full survey at normal speed.',
 turning:'Turning: sonar data is not counted',outside:'Outside the survey area',det_wc:'Target detected in the water column',det_sb:'Target detected on the seabed',detAttract:'Target detected; the system explains why',again2:'Target seen from a new heading',takeover:'Manual control',autoOn:'Autopilot on',
 lv_high:'High potential hazard',lv_potential:'Potential hazard',lv_unknown:'Unknown, needs verification',lv_none:'Non-hazardous',
 h_conf:'Model confidence',snip:'Sonar slice around the target',
 h_mine:'Suspected target: possible moored mine',h_wreck:'Large man-made object on the seabed: likely wreck',h_unknown:'Unknown object on the seabed',h_fish:'Moving echoes in the water column: likely marine life',
 k_mine:'Possible moored mine',k_wreck:'Likely wreck',k_unknown:'Unknown object',k_fish:'Marine life',
 ev_shape:'Shape',ev_pos:'Position',ev_bg:'Background contrast',ev_shadow:'Acoustic shadow',ev_move:'Movement over time',ev_cons:'Multi-angle consensus',
 m_shape:'Regular spherical echo, about 1 m',m_pos:'Suspended in the water column, about 9 m above the seabed',m_bg:'Not in this area\'s baseline survey',m_sh:'Detached shadow on the side-scan sonar',m_move:'Sways around a fixed point between passes',
 w_shape:'Structure about 14 m long with straight edges',w_pos:'On the seabed, 18 m deep',w_bg:'In the baseline survey: an old object in the area',w_sh:'Long, clear shadow on the side-scan sonar',
 u_shape:'Irregular shape with unclear dimensions',u_pos:'On the seabed, partly covered by sediment',u_bg:'Not in the baseline survey',u_sh:'Weak shadow that does not settle the shape',u_cons:'Seen from two headings; the shape is still unresolved',
 f_shape:'Small scattered echoes that change shape',f_pos:'In the water column, about 8 m below the surface',f_bg:'Not in the baseline survey',f_sh:'No fixed shadow on the seabed',f_move:'Moves freely, not tied to a point',
 gap:'Not seen: the target was in the side-scan gap under the hull',need:'Needs another pass',still:'Stays in place between passes',cons_ok:'Seen from two different headings',cons_no:'Seen from one heading only',
 d_hand:'Hand over for verification',d_cross:'Request a cross-pass',d_clear:'Non-hazardous, continue',cont:'Continue mission',
 fb_mine_hand:'Correct, with enough evidence. The package went to the verification team.',fb_mine_weak:'Correct, but the evidence was thin. A cross-pass would have raised confidence.',fb_mine_clear:'Serious error: the evidence points to a moored mine, and calling it non-hazardous leaves the hazard in the channel.',
 fb_wreck_hand:'Correct: a large man-made object on the seabed is a navigation obstruction and needs inspection.',fb_wreck_clear:'A wreck is not a mine, but it obstructs navigation; man-made objects are inspected before the channel opens.',
 fb_unknown_hand:'Correct: the system does not force a class, and an unknown object goes to verification.',fb_unknown_clear:'Wrong: the evidence is not enough to call it non-hazardous. Unknown objects go to verification.',
 fb_fish_clear:'Correct: echoes moving freely in the water column, non-hazardous marine life.',fb_fish_hand:'The evidence points to marine life; handing it over takes the verification team\'s time for nothing.',
 fb_cross:'Cross-pass added to the map. Autopilot runs over the target from the other heading, or drive it yourself.',
 r_title:'Mission complete',r_ok:'Correct decisions',r_time:'Time',r_best:'Best scores',again:'Play again',r_right:'Correct',r_wrong:'Not correct',
 dec_hand:'Handed over',dec_clear:'Non-hazardous',dec_none:'No decision',dec_miss:'Not detected'}};
let lang=store.get('b01sim.lang','ar');
const t=k=>(T[lang]&&T[lang][k]!=null)?T[lang][k]:(T.ar[k]!=null?T.ar[k]:k);
const mins=n=>lang==='ar'?(n===1?'دقيقة واحدة':n===2?'دقيقتان':n<=10?n+' دقائق':n+' دقيقة'):n+' min';
const TOUCH=matchMedia('(pointer: coarse)').matches||('ontouchstart' in window);
function applyLang(){
  document.documentElement.lang=lang;document.documentElement.dir=lang==='ar'?'rtl':'ltr';
  document.querySelectorAll('[data-t]').forEach(el=>{el.textContent=t(el.dataset.t);});
  document.querySelectorAll('[data-tl]').forEach(el=>{el.setAttribute('aria-label',t(el.dataset.tl));});
  $('#b-lang').textContent=lang==='ar'?'English':'العربية';
  $('#br-ctrl').textContent=TOUCH?t('b_touch'):t('b_keys');
  setSimLabel();renderTimeSel();
  if(S.mode==='attract')$('#cap-text').textContent=t('a'+(S.capIdx+1));
  if(S.cur&&!$('#o-hand').hidden)renderHand();
  if(S.mode==='results')renderResults();
  updateHud(true);
}

/* ---------------- scenario ---------------- */
const AREA={x0:-100,x1:100,y0:-62.5,y1:62.5},SP=25,SW=14,SWB=16,RUN=28,DEPTH=18,TXD=1.2,CELL=5;
const NA=5,NB=8,NX=Math.round((AREA.x1-AREA.x0)/CELL),NY=Math.round((AREA.y1-AREA.y0)/CELL);
const A_Y=i=>AREA.y0+SP/2+i*SP,B_X=j=>AREA.x0+SP/2+j*SP;
const RATE=3,MAXV=3.0,MAXYAW=22*D2R,IDLE_MS=60000;
const ROUTE_S=440;/* autopilot time for the full two-pass route at normal speed, simulated seconds (measured) */
/* d = depth below the surface; bed = lies on the seabed (seen by multibeam bathymetry and side-scan, not the water column) */
const TARGETS=[
  {kind:'wreck',x:-20,y:-38,d:16.2,bed:true},
  {kind:'unknown',x:70,y:-15,d:17.1,bed:true},
  {kind:'mine',x:35,y:8,d:9,bed:false},
  {kind:'fish',x:-55,y:30,d:8,bed:false}];
const GOOD={mine:'hand',wreck:'hand',unknown:'hand',fish:'clear'};
/* autopilot route: every line runs RR past the area on both ends, so turns stay outside it */
function buildRoute(){
  const r=[],RR=RUN+6;
  for(let i=0;i<NA;i++){const y=A_Y(i),east=i%2===0;r.push([east?AREA.x0-RR:AREA.x1+RR,y],[east?AREA.x1+RR:AREA.x0-RR,y]);}
  /* from pass A to pass B: three square turns well outside the area, so the first B line starts straight */
  const xe=r[r.length-1][0],yN=AREA.y1+RR+20;r.push([xe,yN],[B_X(NB-1),yN]);
  for(let k=0;k<NB;k++){const x=B_X(NB-1-k),south=k%2===0;r.push([x,south?AREA.y1+RR:AREA.y0-RR],[x,south?AREA.y0-RR:AREA.y1+RR]);}
  return r;
}
const newTargets=()=>TARGETS.map(d=>({...d,state:'hidden',obs:[],shadow:false,lock:false,id:'',fb:'',cross:null,crossed:false,dec:''}));
const timeSel=Object.assign({free:true,min:5},store.get('b01sim.time',{}));
const S={mode:'attract',paused:false,time:0,real:0,k:1,limit:0,score:0,batt:86,cov:new Uint8Array(NX*NY),covPct:0,covA:0,covB:0,
  boat:{x:AREA.x0-RUN-30,y:A_Y(0),h:90*D2R,v:0,r:0},auto:true,route:buildRoute(),wp:0,queue:[],legFrom:null,routeDone:false,
  keys:{left:0,right:0,up:0,down:0},thr:0,cam:'chase',lastInput:0,capIdx:0,capT:0,
  tg:newTargets(),cur:null,pend:[],nextId:0,trail:[],turning:false,outside:false,result:null};
/* the fish school drifts, the moored mine sways a little on its tether, seabed objects stay put */
function tpos(tg,tt){if(tg.kind==='fish')return [tg.x+7*Math.sin(tt*.045),tg.y+5*Math.sin(tt*.06+1)];if(tg.kind==='mine')return [tg.x+.3*Math.sin(tt*.8),tg.y];return [tg.x,tg.y];}
function resetScenario(mode){
  S.mode=mode;S.paused=false;S.time=0;S.real=0;S.score=0;S.batt=86;S.cov.fill(0);S.covPct=S.covA=S.covB=0;
  if(mode==='play'&&!timeSel.free){S.limit=timeSel.min*60;S.k=Math.max(1,ROUTE_S/(.88*S.limit));}else{S.limit=0;S.k=1;}
  Object.assign(S.boat,{x:AREA.x0-RUN-30,y:A_Y(0),h:90*D2R,v:mode==='attract'?MAXV:0,r:0});
  S.auto=mode==='attract';S.wp=0;S.queue=[];S.legFrom=null;S.routeDone=false;S.thr=mode==='attract'?MAXV:0;S.trail=[];
  S.tg=newTargets();S.cur=null;S.pend=[];S.nextId=0;S.result=null;
  S.capIdx=0;S.capT=0;S.lastInput=performance.now();
  S.tg.forEach(setTg3D);crossGuide.visible=false;setSimLabel();
  $('#b-auto').setAttribute('aria-pressed',String(S.auto));
}
function setSimLabel(){const el=$('[data-t=sim]');if(el)el.textContent=t('sim').replace('{x}',String(Math.round(RATE*S.k*10)/10));}

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

/* ---------------- B01 model, after the team's render: faceted camouflage hull, raised cabin, mast ---------------- */
const PAL=[0x29496e,0x2f5379,0x365d85,0x223e60,0x3f6890,0x2a4a70,0x1d3757];
function facetMesh(rings,capStart,capEnd,seed,palette){
  const pos=[],col=[],rnd=mulberry(seed),c=new THREE.Color();
  const tri=(a,b,d)=>{pos.push(...a,...b,...d);c.setHex(palette[Math.floor(rnd()*palette.length)]);for(let k=0;k<3;k++)col.push(c.r,c.g,c.b);};
  for(let i=0;i<rings.length-1;i++){const A=rings[i],B=rings[i+1],n=A.length;for(let k=0;k<n;k++){const k2=(k+1)%n;tri(A[k],B[k],B[k2]);tri(A[k],B[k2],A[k2]);}}
  const fan=(R,ctr,rev)=>{for(let k=0;k<R.length;k++){const a=R[k],b=R[(k+1)%R.length];rev?tri(ctr,b,a):tri(ctr,a,b);}};
  fan(rings[0],capStart,true);fan(rings[rings.length-1],capEnd,false);
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.computeVertexNormals();
  return new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,flatShading:true,roughness:.7,metalness:.15,side:THREE.DoubleSide}));
}
/* the gold emblem from the render, drawn as vector shapes: a palm over two crossed curved swords */
function drawEmblem(c){
  const cx=128;c.clearRect(0,0,256,256);
  const gold=c.createLinearGradient(0,26,0,236);gold.addColorStop(0,'#f8e08f');gold.addColorStop(.5,'#dcae4a');gold.addColorStop(1,'#ab7d27');
  c.fillStyle=gold;c.strokeStyle=gold;c.lineJoin='round';c.lineCap='round';c.shadowColor='rgba(38,26,4,.85)';c.shadowBlur=2.5;
  const sword=m=>{
    const X=x=>cx+m*(x-cx),H=[X(cx+34),222],K=[X(cx-48),228],P=[X(cx-108),150],N=26,pts=[];
    for(let i=0;i<=N;i++){const s=i/N,a=(1-s)*(1-s),b=2*(1-s)*s,q=s*s,x=a*H[0]+b*K[0]+q*P[0],y=a*H[1]+b*K[1]+q*P[1];
      const tx=2*(1-s)*(K[0]-H[0])+2*s*(P[0]-K[0]),ty=2*(1-s)*(K[1]-H[1])+2*s*(P[1]-K[1]),l=Math.hypot(tx,ty);pts.push([x,y,-ty/l,tx/l,7.5*Math.pow(1-s,.7)+.5]);}
    c.beginPath();pts.forEach(([x,y,nx,ny,w],i)=>{const px=x+nx*w/2,py=y+ny*w/2;i?c.lineTo(px,py):c.moveTo(px,py);});
    for(let i=pts.length-1;i>=0;i--){const [x,y,nx,ny,w]=pts[i];c.lineTo(x-nx*w/2,y-ny*w/2);}c.closePath();c.fill();
    const l=Math.hypot(K[0]-H[0],K[1]-H[1]),ux=(K[0]-H[0])/l,uy=(K[1]-H[1])/l;
    c.lineWidth=4.4;c.beginPath();c.moveTo(H[0]-uy*10,H[1]+ux*10);c.lineTo(H[0]+uy*10,H[1]-ux*10);c.stroke();
    c.lineWidth=4.8;c.beginPath();c.moveTo(H[0],H[1]);c.lineTo(H[0]-ux*15,H[1]-uy*15);c.stroke();
    c.beginPath();c.arc(H[0]-ux*18,H[1]-uy*18,3.6,0,Math.PI*2);c.fill();
  };
  sword(1);sword(-1);
  for(let i=0;i<8;i++){const y=180-i*12,w=8.2-i*.42;c.beginPath();c.moveTo(cx-w,y+12);c.lineTo(cx-w*.86,y+1);c.lineTo(cx+w*.86,y+1);c.lineTo(cx+w,y+12);c.closePath();c.fill();}
  const crown=[cx,86];
  const frond=(a,L,dp)=>{
    const Tp=[cx+Math.sin(a)*L,crown[1]-Math.cos(a)*L+dp],Kp=[cx+Math.sin(a)*L*.55,crown[1]-Math.cos(a)*L*.55-18];
    const P=s=>[(1-s)*(1-s)*crown[0]+2*(1-s)*s*Kp[0]+s*s*Tp[0],(1-s)*(1-s)*crown[1]+2*(1-s)*s*Kp[1]+s*s*Tp[1]];
    const D=s=>{const x=2*(1-s)*(Kp[0]-crown[0])+2*s*(Tp[0]-Kp[0]),y=2*(1-s)*(Kp[1]-crown[1])+2*s*(Tp[1]-Kp[1]),l=Math.hypot(x,y)||1;return [x/l,y/l];};
    c.lineWidth=3;c.beginPath();for(let i=0;i<=16;i++){const p=P(i/16);i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]);}c.stroke();
    c.lineWidth=2.4;for(let s=.12;s<=.97;s+=.07){const p=P(s),[ux,uy]=D(s),len=10*(1-s)+3.5;
      [1,-1].forEach(side=>{c.beginPath();c.moveTo(p[0],p[1]);c.lineTo(p[0]+(-uy*side*.85+ux*.5)*len,p[1]+(ux*side*.85+uy*.5)*len);c.stroke();});}
  };
  [[1.95,58,24],[1.45,62,16],[.95,60,6],[.45,52,-4]].forEach(([a,L,dp])=>{frond(-a,L,dp);frond(a,L,dp);});frond(0,38,-12);
  c.beginPath();c.arc(cx,crown[1]+2,6,0,Math.PI*2);c.fill();
}
function drawHullNo(c){c.clearRect(0,0,256,96);c.font='600 70px "Readex Pro", "Segoe UI", sans-serif';c.fillStyle='#c6d6e5';c.textBaseline='middle';c.direction='ltr';c.textAlign='left';c.fillText('B01',18,52);}
const decals=[];
function decalTex(w,h,draw){const cv=document.createElement('canvas');cv.width=w;cv.height=h;draw(cv.getContext('2d'));const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4;decals.push({cv,tex,draw});return tex;}
/* a decal on both sides of the hull: placed on the hull surface, tilted with the tumblehome, yawed with the taper */
function hullDecal(g,tex,w,h,x,y,z,tilt,yaw,mat){
  [1,-1].forEach(s=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),mat);const p=new THREE.Group();p.rotation.order='YXZ';
    p.position.set(x,y,s*z);p.rotation.y=s>0?yaw:Math.PI-yaw;p.rotation.x=-tilt;p.add(m);g.add(p);});
}
function buildB01(){
  const g=new THREE.Group();
  /* hull stations: x (bow +), deck half-width, deck height, chine half-width, chine height, keel depth; wedge bow and stern */
  const ST=[[-4.1,.95,.95,1.1,.3,-.45],[-2.8,1.12,1.08,1.28,.25,-.8],[-.8,1.18,1.15,1.34,.22,-.95],[1.4,1.1,1.1,1.28,.25,-.85],[3.0,.7,.95,.9,.35,-.5],[4.3,.06,.62,.08,.5,-.1]];
  const ring=([x,dw,dy,cw,cy,ky])=>[[x,dy+.06,0],[x,dy,dw],[x,cy,cw],[x,ky*.6,cw*.55],[x,ky,0],[x,ky*.6,-cw*.55],[x,cy,-cw],[x,dy,-dw]];
  /* finer camouflage like the render: split every station gap and every ring edge in two (the shape stays the same) */
  const lerp=(a,b,f)=>a.map((v,i)=>v+(b[i]-v)*f),ST2=[];for(let i=0;i<ST.length-1;i++)ST2.push(ST[i],lerp(ST[i],ST[i+1],.5));ST2.push(ST[ST.length-1]);
  const dens=R=>{const o=[];R.forEach((a,k)=>{const b=R[(k+1)%R.length];o.push(a,lerp(a,b,.5));});return o;};
  g.add(facetMesh(ST2.map(s=>dens(ring(s))),[-4.15,.5,0],[4.45,.56,0],7,PAL));
  /* raised cabin */
  const CB=[[-2.1,.86,1.12,.52,1.56],[.2,.94,1.17,.6,1.66],[1.7,.78,1.13,.46,1.54],[2.5,.3,1.0,.12,1.22]];
  const cring=([x,bw,by,tw,ty])=>[[x,ty,0],[x,ty-.04,tw],[x,by,bw],[x,by,-bw],[x,ty-.04,-tw]];
  g.add(facetMesh(CB.map(cring),[-2.15,1.35,0],[2.6,1.08,0],11,[0x30567f,0x3a628e,0x2a4b72,0x45709b]));
  const dark=new THREE.MeshStandardMaterial({color:0x1c3552,roughness:.6,metalness:.3,flatShading:true});
  const glass=new THREE.MeshStandardMaterial({color:0x0a1522,roughness:.18,metalness:.6});
  /* dark windows on the cabin sides and the sloped front, like the render */
  [1,-1].forEach(s=>{[[1.05,1.0],[.05,.6]].forEach(([x,len])=>{const wv=new THREE.Mesh(new THREE.BoxGeometry(len,.27,.015),glass);wv.position.set(x,1.38,s*.73);wv.rotation.x=s*-.63;g.add(wv);});});
  const ws=new THREE.Mesh(new THREE.BoxGeometry(.62,.015,.5),glass);ws.position.set(2.1,1.41,0);ws.rotation.z=-.38;g.add(ws);
  /* solar panels on the cabin roof, aft of the mast */
  const solarMat=new THREE.MeshStandardMaterial({color:0x0d1b2b,roughness:.25,metalness:.5});
  [-1,1].forEach(s=>{const p=new THREE.Mesh(new THREE.BoxGeometry(1.3,.02,.4),solarMat);p.position.set(-1.35,1.6,s*.24);p.rotation.x=s*.1;g.add(p);});
  /* mast: whip antenna, comms fins, EO/IR turret on its pedestal, radar dome */
  const whip=new THREE.Mesh(new THREE.CylinderGeometry(.035,.05,1.9,6),dark);whip.position.set(-1.05,2.55,0);g.add(whip);
  [[-.75,.5],[-.5,.36]].forEach(([x,h])=>{const f=new THREE.Mesh(new THREE.BoxGeometry(.18,h,.07),dark);f.position.set(x,1.62+h/2,0);g.add(f);});
  const ped=new THREE.Mesh(new THREE.CylinderGeometry(.13,.18,.26,6),dark);ped.position.set(-.05,1.78,0);g.add(ped);
  const ball=new THREE.Mesh(new THREE.SphereGeometry(.27,12,9),new THREE.MeshStandardMaterial({color:0x2c4f76,roughness:.4,metalness:.35,flatShading:true}));ball.position.set(-.05,2.08,0);g.add(ball);
  const lens=new THREE.Mesh(new THREE.CylinderGeometry(.1,.1,.07,12),glass);lens.rotation.z=Math.PI/2;lens.position.set(.2,2.08,0);g.add(lens);
  const dome=new THREE.Mesh(new THREE.SphereGeometry(.24,12,6,0,Math.PI*2,0,Math.PI/2),dark);dome.position.set(.85,1.63,0);dome.scale.y=.55;g.add(dome);
  /* multibeam gondola under the hull and the side-scan bars */
  const pod=new THREE.Mesh(new THREE.BoxGeometry(1.9,.36,.6),new THREE.MeshStandardMaterial({color:0x8b979b,roughness:.5,metalness:.4}));pod.position.set(.4,-1.13,0);g.add(pod);
  [-1,1].forEach(s=>{const b=new THREE.Mesh(new THREE.BoxGeometry(2.2,.07,.07),new THREE.MeshStandardMaterial({color:0x2f5561}));b.position.set(-.2,-.45,s*.95);g.add(b);});
  /* navigation lights: masthead, starboard green, port red, stern */
  const lamp=(c,x,y,z)=>{const m=new THREE.Mesh(new THREE.SphereGeometry(.07,8,6),new THREE.MeshBasicMaterial({color:c}));m.position.set(x,y,z);g.add(m);};
  lamp(0xfff4cf,-1.05,3.52,0);lamp(0x35d07f,2.9,1.0,.72);lamp(0xff4d4d,2.9,1.0,-.72);lamp(0xfff4cf,-4.12,.98,0);
  /* the gold emblem mid-hull and the hull number near the bow, on both sides */
  const emb=decalTex(256,256,drawEmblem),num=decalTex(256,96,drawHullNo);
  const embMat=new THREE.MeshStandardMaterial({map:emb,transparent:true,alphaTest:.04,roughness:.42,metalness:.25,emissive:0xffffff,emissiveMap:emb,emissiveIntensity:.28,polygonOffset:true,polygonOffsetFactor:-2,depthWrite:false});
  const numMat=new THREE.MeshStandardMaterial({map:num,transparent:true,alphaTest:.04,roughness:.8,emissive:0xffffff,emissiveMap:num,emissiveIntensity:.18,polygonOffset:true,polygonOffsetFactor:-2,depthWrite:false});
  hullDecal(g,emb,.86,.86,-.35,.7,1.3,.18,0,embMat);
  hullDecal(g,num,1.0,.375,2.62,.7,.9,.28,.24,numMat);
  /* sonar fan: clean water column inside the minimum slant range, the rest is the dead zone */
  const fan=(r0,r1,col,op)=>{const pts=[],A=55*D2R,N=24;for(let k=0;k<N;k++){const a0=-A+2*A*k/N,a1=-A+2*A*(k+1)/N;const p=(a,r)=>[0,-TXD-r*Math.cos(a),r*Math.sin(a)];const q=(a)=>Math.min(r1,(DEPTH-TXD)/Math.cos(a));
      const i0=p(a0,r0),i1=p(a1,r0),o0=p(a0,q(a0)),o1=p(a1,q(a1));pts.push(...i0,...o0,...o1,...i0,...o1,...i1);}
    const gg=new THREE.BufferGeometry();gg.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));
    return new THREE.Mesh(gg,new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:op,side:THREE.DoubleSide,depthWrite:false}));};
  const fanClean=fan(.01,DEPTH-TXD,0x8fd6cf,.2),fanDead=fan(DEPTH-TXD,60,0xa6b8ca,.07);fanClean.position.x=.4;fanDead.position.x=.4;g.add(fanClean,fanDead);
  return g;
}
const b01=buildB01();scene.add(b01);

/* ---------------- the four targets ---------------- */
const LVC={high:0xff6b45,potential:0xff6b45,unknown:0xc4d0dc,none:0x8fd6cf},HANDC=0xa99cff,CLEARC=0x7a91ab;
const T3={};
(function buildTargets3D(){
  const mat=c=>new THREE.MeshStandardMaterial({color:c,roughness:.7,metalness:.3,flatShading:true,emissive:0xff6b45,emissiveIntensity:0});
  /* moored mine: sphere with horns on a tether to an anchor */
  {const g=new THREE.Group(),m=mat(0x3b4740);g.add(new THREE.Mesh(new THREE.IcosahedronGeometry(.55,1),m));
    for(let k=0;k<8;k++){const h=new THREE.Mesh(new THREE.CylinderGeometry(.04,.06,.32,5),m);const a=k/8*Math.PI*2,e=(k%2?.4:-.25);h.position.set(Math.cos(a)*.55,e,Math.sin(a)*.55);h.lookAt(0,0,0);h.rotateX(Math.PI/2);g.add(h);}
    const L=DEPTH-9,te=new THREE.Mesh(new THREE.CylinderGeometry(.02,.02,L,4),new THREE.MeshBasicMaterial({color:0x6f7a81}));te.position.y=-L/2;g.add(te);
    const an=new THREE.Mesh(new THREE.BoxGeometry(.8,.4,.8),new THREE.MeshStandardMaterial({color:0x4a524e}));an.position.y=-L+.2;g.add(an);
    T3.mine={g,mats:[m],y:-9};}
  /* a small school of fish */
  {const g=new THREE.Group(),m=new THREE.MeshStandardMaterial({color:0x9db4bf,roughness:.35,metalness:.55,flatShading:true,emissive:0x8fd6cf,emissiveIntensity:0}),fish=[];
    for(let i=0;i<16;i++){const r=mulberry(30+i),p=new THREE.Group(),f=new THREE.Mesh(new THREE.ConeGeometry(.11,.42,4),m);f.rotation.z=-Math.PI/2;p.add(f);g.add(p);fish.push({p,a:r()*Math.PI*2,rad:.6+r()*1.7,h:(r()-.5)*1.2,s:.35+r()*.3});}
    T3.fish={g,mats:[m],y:-8,fish};}
  /* wreck lying on the seabed */
  {const g=new THREE.Group(),m=mat(0x5b4a3c);
    const hull=new THREE.Mesh(new THREE.BoxGeometry(10,2.2,3.4),m);hull.position.set(-1,1.1,0);g.add(hull);
    const bow=new THREE.Mesh(new THREE.ConeGeometry(1.9,3.2,4),m);bow.rotation.set(Math.PI/4,0,-Math.PI/2);bow.scale.set(1,1,.9);bow.position.set(5.6,1.1,0);g.add(bow);
    const dk=new THREE.Mesh(new THREE.BoxGeometry(3,1.4,2.2),m);dk.position.set(-2.4,2.85,0);dk.rotation.z=.12;g.add(dk);
    const ms=new THREE.Mesh(new THREE.CylinderGeometry(.1,.13,5,5),m);ms.position.set(1.4,1.5,2.1);ms.rotation.set(1.25,0,.3);g.add(ms);
    g.rotation.set(0,.45,.1);T3.wreck={g,mats:[m],y:-DEPTH+.15};}
  /* unknown object: irregular, partly buried */
  {const g=new THREE.Group(),m=mat(0x56604f);
    const a=new THREE.Mesh(new THREE.IcosahedronGeometry(1,0),m);a.scale.set(1.4,.55,1);a.position.y=.3;g.add(a);
    const b=new THREE.Mesh(new THREE.DodecahedronGeometry(.6,0),m);b.position.set(.9,.22,.5);b.scale.y=.6;g.add(b);
    T3.unknown={g,mats:[m],y:-DEPTH+.1};}
  for(const k in T3){scene.add(T3[k].g);const r=new THREE.Mesh(new THREE.TorusGeometry(k==='wreck'?8:3.4,.12,6,48),new THREE.MeshBasicMaterial({color:0xff6b45}));r.rotation.x=Math.PI/2;r.visible=false;scene.add(r);T3[k].ring=r;}
})();
function setTg3D(tg){
  const o=T3[tg.kind],shown=tg.state!=='hidden',col=tg.state==='hand'?HANDC:tg.state==='clear'?CLEARC:LVC[ev(tg).lv];
  o.ring.visible=shown;o.ring.material.color.setHex(col);
  o.mats.forEach(m=>{m.emissive.setHex(col);m.emissiveIntensity=shown?.55:0;});
}

/* ---------------- input ---------------- */
function anyInput(){S.lastInput=performance.now();if(S.mode==='attract'){openBrief();return true;}return false;}
const KEYMAP={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',ArrowUp:'up',KeyW:'up',ArrowDown:'down',KeyS:'down'};
addEventListener('keydown',e=>{
  if(anyInput())return;
  const onBtn=e.target&&e.target.closest&&e.target.closest('button');
  if(!$('#o-brief').hidden){if((e.code==='Enter'||e.code==='Space')&&!onBtn){e.preventDefault();startPlay();}return;}
  if(S.mode!=='play'||S.paused)return;
  const k=KEYMAP[e.code];if(k){e.preventDefault();press(k,1);}
  if(e.code==='Space'){e.preventDefault();toggleAuto();}
  if(e.code==='KeyC')toggleCam();
});
addEventListener('keyup',e=>{const k=KEYMAP[e.code];if(k)press(k,0);});
addEventListener('pointerdown',e=>{if(S.mode==='attract'&&!e.target.closest('button')){anyInput();}else S.lastInput=performance.now();});
function press(k,on){S.keys[k]=on;if(on&&(k==='left'||k==='right')&&S.auto){S.auto=false;$('#b-auto').setAttribute('aria-pressed','false');toast(t('takeover'));}}
function releaseKeys(){S.keys={left:0,right:0,up:0,down:0};document.querySelectorAll('.tbtn.on').forEach(b=>b.classList.remove('on'));}
document.querySelectorAll('.tbtn').forEach(b=>{const k=b.dataset.k;
  const on=e=>{e.preventDefault();S.lastInput=performance.now();if(S.mode!=='play'||S.paused)return;b.classList.add('on');press(k,1);};
  const off=()=>{b.classList.remove('on');press(k,0);};
  b.addEventListener('pointerdown',on);b.addEventListener('pointerup',off);b.addEventListener('pointerleave',off);b.addEventListener('pointercancel',off);});
function toggleAuto(){S.auto=!S.auto;$('#b-auto').setAttribute('aria-pressed',String(S.auto));toast(S.auto?t('autoOn'):t('takeover'));if(S.auto){S.thr=MAXV;S.legFrom=[S.boat.x,S.boat.y];S.routeDone=false;}}
function toggleCam(){S.cam=S.cam==='chase'?'side':S.cam==='side'?'top':'chase';}
$('#b-auto').addEventListener('click',()=>{S.lastInput=performance.now();if(S.mode==='play')toggleAuto();});
$('#b-cam').addEventListener('click',()=>{S.lastInput=performance.now();toggleCam();});
$('#b-lang').addEventListener('click',()=>{lang=lang==='ar'?'en':'ar';store.set('b01sim.lang',lang);applyLang();});

/* ---------------- flow: attract, briefing, play, results ---------------- */
function openBrief(){S.mode='brief';$('#caption').hidden=true;renderTimeSel();$('#o-brief').hidden=false;$('#b-start').focus();}
function startPlay(){$('#o-brief').hidden=true;resetScenario('play');S.cam='chase';showControls();updateHud(true);}
function showControls(){const play=S.mode==='play';$('#t-steer').hidden=!(play&&TOUCH);$('#t-thr').hidden=!(play&&TOUCH);$('#hint').hidden=!(play&&!TOUCH);}
function toAttract(){['#o-brief','#o-hand','#o-res'].forEach(s=>$(s).hidden=true);resetScenario('attract');$('#caption').hidden=false;$('#cap-text').textContent=t('a1');showControls();}
$('#b-start').addEventListener('click',startPlay);
$('#b-again').addEventListener('click',()=>{$('#o-res').hidden=true;openBrief();});

/* mission time: until the survey is complete, or a time the visitor sets (time then runs faster to fit the full survey) */
function renderTimeSel(){
  $('#t-free').setAttribute('aria-pressed',String(timeSel.free));$('#t-set').setAttribute('aria-pressed',String(!timeSel.free));
  $('#t-step').hidden=timeSel.free;$('#t-val').textContent=mins(timeSel.min);
  $('#t-note').textContent=timeSel.free?t('t_note_free').replace('{n}',mins(Math.round(ROUTE_S/60))):(timeSel.min*60*.88<ROUTE_S?t('t_note_fast'):t('t_note_ok'));
}
const setTime=p=>{Object.assign(timeSel,p);store.set('b01sim.time',timeSel);renderTimeSel();};
$('#t-free').addEventListener('click',()=>setTime({free:true}));
$('#t-set').addEventListener('click',()=>setTime({free:false}));
$('#t-minus').addEventListener('click',()=>setTime({min:Math.max(2,timeSel.min-1)}));
$('#t-plus').addEventListener('click',()=>setTime({min:Math.min(20,timeSel.min+1)}));

let toastTimer=0;
function toast(msg,cls){const el=$('#toast');el.textContent=msg;el.className='toast plate'+(cls?' '+cls:'');el.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>{el.hidden=true;},2600);}

/* ---------------- evidence and the handover package ---------------- */
/* Each target builds its own evidence from what the sonar actually saw: observations, headings, the side-scan shadow, movement. */
function ev(tg){
  const o=tg.obs,n=o.length,K=tg.kind,cons=new Set(o.map(q=>q.axis)).size>=2,two=n>=2&&o[n-1].t-o[0].t>=10,sh=tg.shadow;
  const moved=two?Math.hypot(o[n-1].px-o[0].px,o[n-1].py-o[0].py):0;
  const consRow=['ev_cons',cons,cons?(K==='unknown'?'u_cons':'cons_ok'):'cons_no'],shRow=p=>['ev_shadow',sh,sh?p+'_sh':'gap'];
  if(K==='mine'){const conf=Math.min(97,61+(sh?18:0)+(two?17:0)+(cons?6:0));
    return {conf,lv:conf>=80?'high':'potential',cons,rows:[['ev_shape',1,'m_shape'],['ev_pos',1,'m_pos'],['ev_bg',1,'m_bg'],shRow('m'),['ev_move',two,two?'m_move':'need'],consRow]};}
  if(K==='wreck')return {conf:52+(sh?20:0)+(two?10:0)+(cons?8:0),lv:'potential',cons,rows:[['ev_shape',1,'w_shape'],['ev_pos',1,'w_pos'],['ev_bg',1,'w_bg'],shRow('w'),['ev_move',two,two?'still':'need'],consRow]};
  if(K==='unknown')return {conf:24+(sh?6:0)+(two?5:0)+(cons?5:0),lv:'unknown',cons,rows:[['ev_shape',1,'u_shape'],['ev_pos',1,'u_pos'],['ev_bg',1,'u_bg'],shRow('u'),['ev_move',two,two?'still':'need'],consRow]};
  const free=two&&moved>2.5;
  return {conf:56+(sh?4:0)+(free?26:0)+(cons?8:0),lv:'none',cons,rows:[['ev_shape',1,'f_shape'],['ev_pos',1,'f_pos'],['ev_bg',1,'f_bg'],shRow('f'),['ev_move',two,two?(free?'f_move':'still'):'need'],consRow]};
}
function renderHand(){
  const tg=S.cur;if(!tg)return;const e=ev(tg);
  $('#o-hand .card').dataset.lv=e.lv;
  const lvl=$('#h-lvl');lvl.textContent=t('lv_'+e.lv);lvl.className='lvl lv-'+e.lv;
  $('#h-id').textContent=tg.id;$('#h-t').textContent=t('h_'+tg.kind);$('#h-conf').textContent=e.conf+'%';
  $('#h-ev').innerHTML=e.rows.map(([k,ok,d])=>'<li class="'+(ok?'':'no')+'"><span class="mark" aria-hidden="true"></span><span><b>'+t(k)+'</b><span class="d">'+t(d)+'</span></span></li>').join('');
  const fb=$('#h-fb');fb.hidden=!tg.fb;fb.textContent=tg.fb?t(tg.fb):'';
  const closed=tg.state==='hand'||tg.state==='clear';
  $('#h-act').hidden=closed||!!tg.fb;$('#h-cont').hidden=!(closed||tg.fb);
  $('#d-cross').disabled=e.cons;
  requestAnimationFrame(drawSnip);
}
/* a detection pauses the mission; packages open one at a time */
function queueHand(tg,msg){S.paused=true;releaseKeys();toast(t(msg),'hit');if(!S.pend.includes(tg))S.pend.push(tg);if(!S.cur)setTimeout(nextHand,450);}
function nextHand(){
  if(S.cur||S.mode!=='play')return;const tg=S.pend.shift();if(!tg){S.paused=false;return;}
  S.cur=tg;tg.fb='';S.lastInput=performance.now();releaseKeys();renderHand();
  $('#o-hand').hidden=false;$('#o-hand .card').scrollTop=0;$('#d-hand').focus({preventScroll:true});
}
const SCORE={mine:{clear:-300},wreck:{hand:150,clear:-120},unknown:{hand:200,clear:-200},fish:{hand:-60,clear:150}};
function decide(kind){
  const tg=S.cur;if(!tg)return;const e=ev(tg),K=tg.kind;
  if(kind==='cross'){if(!tg.crossed){S.score+=40;tg.crossed=true;}tg.state='cross';tg.fb='fb_cross';planCross(tg);}
  else{const pts=K==='mine'&&kind==='hand'?(e.conf>=80?300:150):SCORE[K][kind];S.score+=pts;tg.state=kind;tg.dec=kind;
    tg.fb=K==='mine'&&kind==='hand'&&e.conf<80?'fb_mine_weak':'fb_'+K+'_'+kind;}
  setTg3D(tg);renderHand();updateHud(true);
}
/* cross-pass: perpendicular to the first heading, running far enough past the target that the boat has finished its turn
   and is straight again before it reaches it; then back to where the survey line was left */
function planCross(tg){
  const [tx,ty]=tpos(tg,S.time),ns=tg.obs[0].axis===1,D=RUN+62;
  const a=ns?[tx,ty+D]:[tx-D,ty],b=ns?[tx,ty-D]:[tx+D,ty];
  tg.cross=[a,b];crossGuide.geometry.setFromPoints([W(a[0],a[1],1),W(b[0],b[1],1)]);crossGuide.computeLineDistances();crossGuide.visible=true;
  const bt=S.boat,near=Math.hypot(a[0]-bt.x,a[1]-bt.y)<=Math.hypot(b[0]-bt.x,b[1]-bt.y),E1=near?a:b,E2=near?b:a;
  const ux=(E2[0]-E1[0])/(2*D),uy=(E2[1]-E1[1])/(2*D),side=((bt.x-E1[0])*uy-(bt.y-E1[1])*ux)>=0?1:-1;
  const wide=[E1[0]+uy*side*36,E1[1]-ux*side*36];
  const resume=[bt.x-Math.sin(bt.h)*45,bt.y-Math.cos(bt.h)*45];/* rejoin far enough back to be straight again where the line was left */
  S.queue=[wide,E1,E2,resume];S.legFrom=[bt.x,bt.y];S.routeDone=false;
}
$('#d-hand').addEventListener('click',()=>decide('hand'));
$('#d-cross').addEventListener('click',()=>decide('cross'));
$('#d-clear').addEventListener('click',()=>decide('clear'));
$('#d-cont').addEventListener('click',()=>{$('#o-hand').hidden=true;S.cur=null;S.lastInput=performance.now();
  if(!S.tg.some(x=>x.state==='cross'))crossGuide.visible=false;
  if(S.pend.length)setTimeout(nextHand,250);else S.paused=false;});

function observe(tg,axis,across,px,py){
  const isNew=!tg.obs.some(o=>o.axis===axis);
  tg.obs.push({t:S.time,axis,px,py});
  if(across>=6)tg.shadow=true;
  if(tg.state==='hidden'){tg.id='T-'+String(++S.nextId).padStart(2,'0');
    if(S.mode==='play'){tg.state='open';queueHand(tg,tg.bed?'det_sb':'det_wc');}else{tg.state='auto';toast(t('detAttract'),'hit');}}
  else if(S.mode==='play'&&tg.state==='cross'&&isNew){tg.state='open';queueHand(tg,'again2');}
  setTg3D(tg);
}

function endMission(){
  S.paused=true;S.mode='results';S.lastInput=performance.now();calcCov();
  const covPct=Math.round(S.covPct*100),ok=S.tg.filter(x=>x.dec&&x.dec===GOOD[x.kind]).length,total=Math.max(0,Math.round(S.score+covPct*3));
  const best=store.get('b01sim.best',[]);const me={s:total,c:covPct,d:Date.now()};best.push(me);best.sort((a,b)=>b.s-a.s);const top=best.slice(0,5);store.set('b01sim.best',top);
  S.result={total,covPct,ok,real:S.real,top,me:me.d};
  renderResults();$('#o-res').hidden=false;$('#b-again').focus();showControls();updateHud(true);
}
function renderResults(){
  const R=S.result;if(!R)return;
  $('#r-score').textContent=R.total;$('#r-cov').textContent=R.covPct+'%';$('#r-ok').textContent=R.ok+'/'+S.tg.length;$('#r-time').textContent=fmt(R.real);
  const rows=[...S.tg].sort((a,b)=>(a.id||'T-99').localeCompare(b.id||'T-99'));
  $('#r-tg').innerHTML=rows.map(x=>{const dec=x.state==='hidden'?'dec_miss':x.dec?'dec_'+x.dec:'dec_none',good=!!x.dec&&x.dec===GOOD[x.kind];
    return '<li><span class="n">'+(x.id||'—')+'</span><span>'+t('k_'+x.kind)+'</span><span class="d">'+t(dec)+'</span><span class="'+(good?'ok':'bad')+'" role="img" aria-label="'+t(good?'r_right':'r_wrong')+'">'+(good?'✓':'✗')+'</span></li>';}).join('');
  $('#r-best').innerHTML='<li class="hd"><span></span><span>'+t('score')+'</span><span>'+t('cov')+'</span></li>'+R.top.map((b,i)=>'<li class="'+(b.d===R.me?'me':'')+'"><span class="n">'+(i+1)+'</span><span class="n">'+b.s+'</span><span class="n">'+b.c+'%</span></li>').join('');
}

/* ---------------- simulation step ---------------- */
function steerAuto(){
  const b=S.boat;let P=S.queue.length?S.queue[0]:S.route[S.wp];
  if(!P){return null;}
  if(Math.hypot(P[0]-b.x,P[1]-b.y)<9){S.legFrom=P;if(S.queue.length)S.queue.shift();else S.wp++;P=S.queue.length?S.queue[0]:S.route[S.wp];if(!P)return null;}
  /* line-following: steer to a look-ahead point on the current leg, so the boat rejoins the line after each turn */
  const A=S.legFrom||[b.x,b.y];let ux=P[0]-A[0],uy=P[1]-A[1];const L=Math.hypot(ux,uy)||1;ux/=L;uy/=L;
  const s=clamp((b.x-A[0])*ux+(b.y-A[1])*uy+16,0,L),tx=A[0]+ux*s,ty=A[1]+uy*s;
  const err=wrapPi(Math.atan2(tx-b.x,ty-b.y)-b.h),ae=Math.abs(err);
  /* slow down in sharp turns: the turning circle then fits inside the 25 m line spacing, so the boat is back on the
     next line and running straight before it re-enters the area */
  return {rud:clamp(err*1.8,-1,1),v:ae>.5?MAXV*.36:ae>.18?MAXV*.7:MAXV};
}
const settled=x=>x.state==='hidden'||x.state==='hand'||x.state==='clear';
function step(dt){
  const b=S.boat;
  let rud=0;
  if(S.auto){const a=steerAuto();if(a){rud=a.rud;S.thr=a.v;}
    else if(S.mode==='attract'){resetScenario('attract');return;}
    else{S.routeDone=true;S.auto=false;S.thr=0;$('#b-auto').setAttribute('aria-pressed','false');}}
  else{rud=S.keys.right-S.keys.left;S.thr=clamp(S.thr+(S.keys.up-S.keys.down)*1.2*dt,0,MAXV);}
  b.v+=(S.thr-b.v)*clamp(dt*.8,0,1);
  const yawT=rud*MAXYAW*clamp(b.v/1.2,.2,1);b.r+=(yawT-b.r)*clamp(dt*3,0,1);
  b.h=wrapPi(b.h+b.r*dt);
  b.x+=Math.sin(b.h)*b.v*RATE*dt;b.y+=Math.cos(b.h)*b.v*RATE*dt;
  S.time+=dt;S.real+=dt/S.k;S.batt=Math.max(5,S.batt-dt*.01*(.4+b.v/MAXV));
  const inArea=b.x>AREA.x0&&b.x<AREA.x1&&b.y>AREA.y0&&b.y<AREA.y1;
  S.turning=Math.abs(b.r)>4*D2R&&inArea;S.outside=!inArea;
  const straight=Math.abs(b.r)<4*D2R&&b.v>.4,axis=Math.abs(Math.sin(b.h))>Math.abs(Math.cos(b.h))?1:2,sh=Math.sin(b.h),ch=Math.cos(b.h);
  if(straight){
    const i0=Math.max(0,Math.floor((b.x-AREA.x0-SW-4)/CELL)),i1=Math.min(NX-1,Math.floor((b.x-AREA.x0+SW+4)/CELL)),j0=Math.max(0,Math.floor((b.y-AREA.y0-SW-4)/CELL)),j1=Math.min(NY-1,Math.floor((b.y-AREA.y0+SW+4)/CELL));
    for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const dx=AREA.x0+(i+.5)*CELL-b.x,dy=AREA.y0+(j+.5)*CELL-b.y,al=dx*sh+dy*ch,ac=dx*ch-dy*sh;if(Math.abs(al)<=3.5&&Math.abs(ac)<=SW)S.cov[j*NX+i]|=axis;}
  }
  /* water-column targets are seen only inside the clean swath (before the dead zone); seabed targets across the multibeam swath */
  for(const tg of S.tg){
    const [px,py]=tpos(tg,S.time),dx=px-b.x,dy=py-b.y,al=dx*sh+dy*ch,ac=dx*ch-dy*sh;
    const lim=tg.bed?SWB:Math.sqrt((DEPTH-TXD)**2-(tg.d-TXD)**2)-.5;
    if(straight&&Math.abs(al)<3&&Math.abs(ac)<lim){if(!tg.lock){tg.lock=true;observe(tg,axis,Math.abs(ac),px,py);}}
    else if(Math.abs(al)>8)tg.lock=false;
  }
  if(S.trail.length===0||Math.hypot(S.trail[S.trail.length-1][0]-b.x,S.trail[S.trail.length-1][1]-b.y)>3){S.trail.push([b.x,b.y]);if(S.trail.length>700)S.trail.shift();}
  if(S.mode==='play'&&!S.paused){
    if(S.limit&&S.real>=S.limit){endMission();return;}
    calcCov();
    if(!S.cur&&!S.pend.length&&S.tg.every(settled)&&(S.routeDone||S.covPct>=.999)){endMission();return;}
  }
}

/* ---------------- camera ---------------- */
const camPos=new THREE.Vector3(-170,14,40),camLook=new THREE.Vector3();
function updateCamera(dt,tt){
  const b=S.boat,bp=W(b.x,b.y,0),fwd=new THREE.Vector3(Math.sin(b.h),0,-Math.cos(b.h)),right=new THREE.Vector3(Math.cos(b.h),0,Math.sin(b.h));
  let want,look;
  if(S.mode==='attract'||S.mode==='brief'){const a=tt*.07;want=bp.clone().add(new THREE.Vector3(Math.cos(a)*13,3.4+1.2*Math.sin(tt*.13),Math.sin(a)*13));look=bp.clone().add(new THREE.Vector3(0,.7,0));}
  else if(S.cam==='top'){want=bp.clone().add(new THREE.Vector3(0,120,40));look=bp.clone();}
  else if(S.cam==='side'){want=bp.clone().addScaledVector(right,9.5).addScaledVector(fwd,1.2).add(new THREE.Vector3(0,2.1,0));look=bp.clone().addScaledVector(fwd,.4).add(new THREE.Vector3(0,.8,0));}
  else{want=bp.clone().addScaledVector(fwd,-15).addScaledVector(right,5.5).add(new THREE.Vector3(0,5.8,0));look=bp.clone().addScaledVector(fwd,5).add(new THREE.Vector3(0,1.2,0));}
  const k=clamp(dt*2.4,0,1);camPos.lerp(want,k);camLook.lerp(look,k);
  camera.position.copy(camPos);camera.lookAt(camLook);sky.position.copy(camera.position);
}

/* ---------------- HUD: stats, minimap, sonar ---------------- */
let hudT=0;
function calcCov(){let a=0,c=0;const n=S.cov.length;for(let i=0;i<n;i++){const v=S.cov[i];if(v&1)a++;if(v&2)c++;}S.covA=a/n;S.covB=c/n;S.covPct=(a+c)/(2*n);}
function updateHud(force){
  const now=performance.now();if(!force&&now-hudT<120)return;hudT=now;
  calcCov();
  const live=S.mode==='play'||S.mode==='results';
  $('#s-time-l').textContent=S.limit&&live?t('left'):t('time');
  $('#s-time').textContent=live?fmt(S.limit?S.limit-S.real:S.real):'—';
  $('#s-cov').textContent=Math.round(S.covPct*100)+'%';
  const dec=S.tg.filter(x=>x.state==='hand'||x.state==='clear').length,det=S.tg.filter(x=>x.state!=='hidden').length;
  $('#s-tg').textContent=(S.mode==='attract'?det:dec)+'/'+S.tg.length;
  $('#s-speed').textContent=(S.boat.v*1.944).toFixed(1)+' kn';
  $('#s-batt').textContent=Math.round(S.batt)+'%';
  $('#s-score').textContent=Math.round(S.score);
  if(S.mode==='play'&&!S.paused){if(S.turning)toastOnce('turning','warn');else if(S.outside&&!S.auto)toastOnce('outside','warn');else lastToast='';}
}
let lastToast='';function toastOnce(k,cls){if(lastToast===k)return;lastToast=k;toast(t(k),cls);}
function fitCanvas(cv){const r=cv.getBoundingClientRect(),d=Math.min(2,devicePixelRatio||1),w=Math.max(1,Math.round(r.width*d)),h=Math.max(1,Math.round(r.height*d));if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h;}const ctx=cv.getContext('2d');ctx.setTransform(d,0,0,d,0,0);return{ctx,w:r.width,h:r.height};}
const LVH={high:'#ff6b45',potential:'#ff6b45',unknown:'#c4d0dc',none:'#8fd6cf'};
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
  if(S.trail.length>1){ctx.strokeStyle='rgba(143,214,207,.6)';ctx.beginPath();S.trail.forEach((p,i)=>i?ctx.lineTo(X(p[0]),Y(p[1])):ctx.moveTo(X(p[0]),Y(p[1])));ctx.stroke();}
  for(const tg of S.tg){
    if(tg.state==='hidden')continue;
    if(tg.state==='cross'&&tg.cross){ctx.setLineDash([5,3]);ctx.strokeStyle='#ff6b45';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(X(tg.cross[0][0]),Y(tg.cross[0][1]));ctx.lineTo(X(tg.cross[1][0]),Y(tg.cross[1][1]));ctx.stroke();ctx.setLineDash([]);ctx.lineWidth=1;}
    const [px,py]=tpos(tg,S.time),x=X(px),y=Y(py),lv=ev(tg).lv,col=LVH[lv];
    ctx.save();ctx.translate(x,y);
    if(lv==='high'||lv==='potential'){ctx.rotate(Math.PI/4);if(lv==='high'){ctx.fillStyle=col;ctx.fillRect(-3.6,-3.6,7.2,7.2);}else{ctx.strokeStyle=col;ctx.lineWidth=1.6;ctx.strokeRect(-3.4,-3.4,6.8,6.8);}}
    else if(lv==='unknown'){ctx.fillStyle=col;ctx.beginPath();ctx.arc(0,0,4.6,0,Math.PI*2);ctx.fill();ctx.fillStyle='#0a1626';ctx.font='700 8px "Readex Pro", sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.direction='ltr';ctx.fillText('?',0,.5);}
    else{ctx.fillStyle=col;ctx.beginPath();ctx.arc(0,0,3.2,0,Math.PI*2);ctx.fill();}
    ctx.restore();
    if(tg.state==='hand'||tg.state==='clear'){ctx.strokeStyle=tg.state==='hand'?'#a99cff':'#7a91ab';ctx.lineWidth=1.4;ctx.beginPath();ctx.arc(x,y,7.5,0,Math.PI*2);ctx.stroke();ctx.lineWidth=1;}
  }
  const b=S.boat;ctx.save();ctx.translate(X(b.x),Y(b.y));ctx.rotate(b.h);ctx.fillStyle='#dce6ef';ctx.beginPath();ctx.moveTo(0,-7);ctx.lineTo(4.5,5);ctx.lineTo(-4.5,5);ctx.closePath();ctx.fill();ctx.restore();
  ctx.fillStyle='rgba(220,230,239,.7)';ctx.font='10px "B612 Mono", monospace';ctx.direction='ltr';ctx.textAlign='left';ctx.fillText('N',6,12);
}
/* water-column fan: same idea as the console, with the dead zone outside the minimum slant range */
const SONAR=(()=>{const st=[[0,'#040b12'],[.16,'#08222b'],[.36,'#0f4a52'],[.58,'#27858a'],[.8,'#7fcfc4'],[1,'#effffb']],o=new Uint8ClampedArray(768);const hx=c=>[parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)];for(let i=0;i<256;i++){const v=i/255;let j=0;while(j<st.length-2&&v>st[j+1][0])j++;const a=st[j],bb=st[j+1],f=clamp((v-a[0])/(bb[0]-a[0]),0,1),ca=hx(a[1]),cb=hx(bb[1]);for(let k=0;k<3;k++)o[i*3+k]=ca[k]+(cb[k]-ca[k])*f;}return o;})();
const BLOBS=Array.from({length:10},(_,i)=>{const r=mulberry(70+i);return [(r()-.5)*6,(r()-.5)*2.4,.2+r()*.22];});
/* echo strength a target adds at (u across, z down) in a sonar picture; zb is the seabed at that point */
function echo(kind,du,dz,zb,rnd){
  if(kind==='mine'){const dd=Math.hypot(du,dz);if(dd<.6)return .97-dd*.4;if(dd<1.3)return -(.2*(1.3-dd));if(dz>.6&&dz<zb&&Math.abs(du)<.09&&rnd()<.72)return -.3;return 0;}
  if(kind==='fish'){let v=0;for(const [bu,bz,br] of BLOBS){const dd=Math.hypot(du-bu,dz-bz);if(dd<br)v=Math.max(v,.9-dd*1.2);}return v;}
  if(kind==='wreck'){const top=zb-2.4+.45*Math.sin(du*1.1)+(du>2.5?.5:0);if(Math.abs(du)<7&&dz>top&&dz<zb+.2)return dz-top<.45?.97:.6+.25*rnd();return 0;}
  const rr=Math.hypot((du-.3)/1.3,(dz-(zb-.45))/.55);return rr<1+.12*Math.sin(du*5+dz*3)?.66+.25*rnd():0;
}
const wcdCv=$('#wcd'),wbuf=document.createElement('canvas');
function drawWCD(){
  const {ctx,w,h}=fitCanvas(wcdCv);const bw=Math.max(40,Math.round(w*.6)),bh=Math.max(30,Math.round(h*.6));if(wbuf.width!==bw||wbuf.height!==bh){wbuf.width=bw;wbuf.height=bh;}
  const bc=wbuf.getContext('2d'),img=bc.createImageData(bw,bh),D=img.data,b=S.boat,maxA=55*D2R,Rm=DEPTH*1.9,top=3,k=Math.max(Rm/(bh-top-2),2*Rm*Math.sin(maxA)/(bw-4)),ax=bw/2,zb0=DEPTH-TXD;
  const sh=Math.sin(b.h),ch=Math.cos(b.h),vis=[];
  for(const tg of S.tg){const [px,py]=tpos(tg,S.time),dx=px-b.x,dy=py-b.y,al=dx*sh+dy*ch,ac=dx*ch-dy*sh;if(Math.abs(al)<(tg.kind==='wreck'?7:4)&&Math.abs(ac)<Rm)vis.push({u:ac,z:tg.d-TXD,tg});}
  for(let py=0;py<bh;py++){const dz=(py-top)*k;for(let px=0;px<bw;px++){const o=(py*bw+px)*4,dx=(px-ax)*k,r=Math.hypot(dx,dz),an=Math.atan2(dx,dz);
    if(dz<=0||r>Rm||Math.abs(an)>maxA){D[o+3]=0;continue;}
    const zb=zb0+.6*Math.sin(dx*.09+b.x*.02);let v=.04+Math.random()*.07;const e=dz-zb;
    if(r>zb0&&e<-.3){v+=.08+Math.random()*.14;if(((px+py)&7)===0)v+=.1;}
    if(e>-.3&&e<.5)v=.6+.32*Math.random()-Math.abs(e)*.5;else if(e>=.5)v=Math.max(.03,.3*Math.exp(-(e-.5)*.5)+Math.random()*.05);
    for(const q of vis){if(!q.tg.bed&&r>zb0)continue;const off=q.tg.bed?0:q.z,a=echo(q.tg.kind,dx-q.u,dz-off,zb-off,Math.random);v=a<0?v-a:Math.max(v,a);}
    const i3=clamp(Math.round(v*255),0,255)*3;D[o]=SONAR[i3];D[o+1]=SONAR[i3+1];D[o+2]=SONAR[i3+2];D[o+3]=255;}}
  bc.putImageData(img,0,0);ctx.clearRect(0,0,w,h);ctx.drawImage(wbuf,0,0,w,h);
  const f=w/bw,AX=ax*f,AY=top*(h/bh),pxm=f/k;
  ctx.setLineDash([4,3]);ctx.strokeStyle='rgba(220,230,239,.6)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(AX,AY,zb0*pxm,Math.PI/2+maxA,Math.PI/2-maxA,true);ctx.stroke();ctx.setLineDash([]);
  ctx.font='500 11px "Readex Pro", Tahoma, sans-serif';ctx.direction=lang==='ar'?'rtl':'ltr';ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineWidth=3;ctx.strokeStyle='rgba(4,11,18,.85)';ctx.fillStyle='#dce6ef';
  const la=50*D2R,lr=zb0*(1+1/Math.cos(la))/2*pxm;[-1,1].forEach(s=>{const lx=AX+s*Math.sin(la)*lr,ly=AY+Math.cos(la)*lr;ctx.strokeText(t('dead'),lx,ly);ctx.fillText(t('dead'),lx,ly);});
  for(const q of vis){if(q.tg.state==='hidden')continue;const tx=AX+q.u*pxm,ty=AY+(q.tg.bed?zb0-.9:q.z)*pxm,hw=q.tg.kind==='wreck'?7.5*pxm:9;ctx.strokeStyle=LVH[ev(q.tg).lv];ctx.lineWidth=1.4;ctx.strokeRect(tx-hw,ty-9,hw*2,18);}
}
/* the evidence slice in the handover package */
function drawSnip(){
  const tg=S.cur;if(!tg)return;
  const cv=$('#snip');const {ctx,w,h}=fitCanvas(cv);const bw=Math.round(w),bh=Math.round(h);if(bw<10)return;
  const K=tg.kind,img=ctx.createImageData(bw,bh),D=img.data,rnd=mulberry(42),z0=2,pxm=bh/(DEPTH+2-z0);
  for(let py=0;py<bh;py++){const z=z0+py/pxm;for(let px=0;px<bw;px++){const u=(px-bw/2)/pxm,o=(py*bw+px)*4,zb=DEPTH+.25*Math.sin(u*.7);let v=.05+rnd()*.08;const e=z-zb;
    if(e>-.3&&e<.45)v=.6+.3*rnd()-Math.abs(e)*.5;else if(e>=.45)v=Math.max(.03,.32*Math.exp(-(e-.45)*.55)+rnd()*.05);
    if(K==='wreck'&&u>7&&u<12.5&&e>-.3)v*=.22;/* the wreck's acoustic shadow: no seabed return behind it */
    const off=tg.bed?0:tg.d,a=echo(K,u,z-off,zb-off,rnd);v=a<0?v-a:Math.max(v,a);
    const i3=clamp(Math.round(v*255),0,255)*3;D[o]=SONAR[i3];D[o+1]=SONAR[i3+1];D[o+2]=SONAR[i3+2];D[o+3]=255;}}
  const d=Math.min(2,devicePixelRatio||1);ctx.setTransform(1,0,0,1,0,0);const tmp=document.createElement('canvas');tmp.width=bw;tmp.height=bh;tmp.getContext('2d').putImageData(img,0,0);ctx.setTransform(d,0,0,d,0,0);ctx.drawImage(tmp,0,0,w,h);
  const U=u=>w/2+u*pxm,Z=z=>(z-z0)*pxm,col=LVH[ev(tg).lv],ar=lang==='ar';
  ctx.strokeStyle=col;ctx.lineWidth=1.6;ctx.setLineDash([4,3]);
  ctx.font='500 11px "Readex Pro", Tahoma, sans-serif';ctx.direction=ar?'rtl':'ltr';ctx.textBaseline='middle';
  const lab=(s,lx,ly,al)=>{ctx.save();ctx.setLineDash([]);ctx.lineWidth=3;ctx.strokeStyle='rgba(4,11,18,.85)';ctx.fillStyle=col;ctx.textAlign=al;ctx.strokeText(s,lx,ly);ctx.fillText(s,lx,ly);ctx.restore();};
  if(K==='mine'){ctx.beginPath();ctx.arc(U(0),Z(tg.d),.5*pxm+3,0,Math.PI*2);ctx.stroke();const x=U(-1.6);ctx.beginPath();ctx.moveTo(x,Z(tg.d+.5));ctx.lineTo(x,Z(DEPTH));ctx.stroke();ctx.setLineDash([]);
    lab(ar?'كروي، قطر 1 م':'spherical, 1 m',U(0)+.5*pxm+8,Z(tg.d),'left');lab(ar?'9 م فوق القاع':'9 m above seabed',x-6,Z((tg.d+DEPTH)/2),'right');}
  else if(K==='fish'){ctx.strokeRect(U(-3.6),Z(tg.d-1.8),7.2*pxm,3.6*pxm);ctx.setLineDash([]);lab(ar?'أصداء صغيرة متفرقة':'small scattered echoes',U(0),Z(tg.d-2.6),'center');}
  else if(K==='wreck'){ctx.strokeRect(U(-7.3),Z(DEPTH-3),14.6*pxm,3.2*pxm);ctx.setLineDash([]);lab(ar?'بنية طولها 14 م':'structure, 14 m long',U(0),Z(DEPTH-4),'center');lab(ar?'ظل':'shadow',U(9.6),Z(DEPTH-1),'center');}
  else{ctx.beginPath();ctx.arc(U(.3),Z(DEPTH-.4),1.7*pxm,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);lab(ar?'شكل غير منتظم':'irregular shape',U(.3),Z(DEPTH-2.8),'center');}
}

/* ---------------- main loop ---------------- */
let last=performance.now(),wcdT=0,mmT=0,fpsAcc=0,fpsN=0,fpsChecked=false,startT=performance.now();
const v3=new THREE.Vector3();
function frame(now){
  const dt=Math.min(.05,(now-last)/1000);last=now;const tt=now/1000;
  /* time compression: several fixed sub-steps per frame, so turns and detection behave the same at any speed */
  if((S.mode==='attract'||S.mode==='play')&&!S.paused){const sd=dt*S.k,n=Math.max(1,Math.ceil(sd*30));for(let i=0;i<n&&!S.paused&&(S.mode==='attract'||S.mode==='play');i++)step(sd/n);}
  else if(S.mode==='brief'&&S.auto)step(dt);
  if(S.mode==='attract'){S.capT+=dt;if(S.capT>6.5){S.capT=0;S.capIdx=(S.capIdx+1)%6;$('#cap-text').textContent=t('a'+(S.capIdx+1));}}
  /* back to the attract demo after 60 s without input, on any screen; a mission running on autopilot is left to finish */
  else if(!(S.mode==='play'&&S.auto&&!S.paused)&&now-S.lastInput>IDLE_MS)toAttract();
  const b=S.boat,bp=W(b.x,b.y,0);
  const wy=waveH(bp.x,bp.z,tt),wx1=waveH(bp.x+2,bp.z,tt)-waveH(bp.x-2,bp.z,tt),wz1=waveH(bp.x,bp.z+2,tt)-waveH(bp.x,bp.z-2,tt);
  b01.position.set(bp.x,wy*.6+.05,bp.z);b01.rotation.set(0,0,0);b01.rotateY(Math.PI/2-b.h);b01.rotateZ(Math.atan2(wx1*Math.sin(b.h)-wz1*Math.cos(b.h),8)*.6);b01.rotateX(Math.atan2(wx1*Math.cos(b.h)+wz1*Math.sin(b.h),8)*-.6);
  updateOcean(tt,bp.x,bp.z);updateCamera(dt,tt);
  for(const tg of S.tg){const o=T3[tg.kind],[px,py]=tpos(tg,S.time);o.g.position.copy(W(px,py,o.y));o.ring.position.copy(W(px,py,1.1));if(o.ring.visible)o.ring.rotation.z=tt*.6;
    if(tg.kind==='mine')o.g.position.y=o.y+Math.sin(tt*.8)*.15;
    if(o.fish)o.fish.forEach(f=>{const a=f.a+tt*f.s;f.p.position.set(Math.cos(a)*f.rad,f.h+Math.sin(tt*.9+f.a)*.15,Math.sin(a)*f.rad);v3.set(-Math.sin(a),0,Math.cos(a));f.p.rotation.y=Math.atan2(-v3.z,v3.x);});}
  renderer.render(scene,camera);
  updateHud(false);
  if(now-mmT>140){mmT=now;drawMinimap();}
  if(now-wcdT>250){wcdT=now;drawWCD();}
  if(!fpsChecked){fpsAcc+=dt;fpsN++;if(now-startT>4000){const fps=fpsN/fpsAcc;fpsChecked=true;if(fps<45&&pixelRatio>1){pixelRatio=1;renderer.setPixelRatio(1);}if(fps<32)oceanSkip=true;}}
  requestAnimationFrame(frame);
}
addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();});
/* test hook: advance the simulation without animation frames (used for checks while the window is hidden) */
window.__b01={S,decide,startPlay,toAttract,openBrief,ev,timeSel,setTime,
  advance(sec,dt){dt=dt||1/30;const n=Math.round(sec/dt);for(let i=0;i<n;i++){if(!S.paused&&(S.mode==='attract'||S.mode==='play'))step(dt);}
    updateCamera(1,performance.now()/1000);last=performance.now();frame(performance.now());updateHud(true);drawMinimap();drawWCD();
    return {mode:S.mode,time:+S.time.toFixed(1),real:+S.real.toFixed(1),x:+S.boat.x.toFixed(1),y:+S.boat.y.toFixed(1),cov:Math.round(S.covPct*100),covA:Math.round(S.covA*100),covB:Math.round(S.covB*100),
      tg:S.tg.map(x=>x.kind+':'+x.state+(x.id?'('+x.id+')':'')).join(' '),cur:S.cur&&S.cur.kind,pend:S.pend.length,paused:S.paused,wp:S.wp,routeDone:S.routeDone};}};

resetScenario('attract');applyLang();toAttract();
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>{decals.forEach(d=>{d.draw(d.cv.getContext('2d'));d.tex.needsUpdate=true;});applyLang();});
requestAnimationFrame(frame);
