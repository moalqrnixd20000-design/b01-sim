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
/* sound hook: js/audio.js sets AUDIO once the page has been touched; until then every call is silent */
let AUDIO=null;const sfx=(n,o)=>{if(AUDIO)AUDIO.play(n,o);};
const fmt=s=>{s=Math.max(0,Math.floor(s));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');};

/* ---------------- language ---------------- */
const T={
ar:{title:'محاكاة مهمة B01',sim:'بيانات محاكاة، الزمن ×{x}',time:'الوقت',left:'المتبقي',cov:'التغطية',tgs:'الأهداف',speed:'السرعة',batt:'البطارية',score:'النقاط',auto:'طيار آلي',cam:'الكاميرا',map:'منطقة المسح',sonar:'عمود الماء، ملتي بيم',dead:'منطقة ميتة',
 press:'اضغط أي زر أو المس الشاشة لتتولى القيادة',keys:'الأسهم للقيادة، المسافة للطيار الآلي، C للكاميرا، واسحب بالماوس للتدوير',
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
 dec_hand:'سُلّم للتحقق',dec_clear:'غير خطِر',dec_none:'بلا قرار',dec_miss:'لم يُرصد',
 lg_title:'أهلًا بك في محاكي B01',lg_body:'اختر صفتك واكتب رقمك، عشان نحفظ نتيجتك وتقييمك.',role_visitor:'زائر',role_judge:'محكّم',
 lg_label_v:'رقم الزائر أو الاسم',lg_label_j:'رقم المحكّم (ID)',lg_ph:'مثلًا {n}',lg_ph_j:'مثلًا J-07',lg_auto:'تقدر تتركه فاضي وناخذ لك الرقم {n}.',lg_need_j:'اكتب رقم المحكّم.',lg_go:'ادخل',
 visitor:'الآيدي',rate:'قيّم تجربتك',side:'قيّم وأنهِ الجلسة',
 fb_title:'قيّم تجربتك مع B01',star_n:'{n} من 5',s1:'ضعيفة',s2:'مقبولة',s3:'جيدة',s4:'ممتازة',s5:'رائعة',
 fb_note:'ملاحظتك (اختياري)',fb_send:'أرسل التقييم',fb_skip:'تخطي',fb_back:'رجوع للمهمة',fb_need:'اختر عدد النجوم أولًا',
 th_title:'شكرًا لك',th_body:'انحفظ تقييمك لفريق B01. اللعبة ترجع لوضع العرض للزائر اللي بعدك.',th_done:'تم',
 goto:'B01 متجهة للنقطة',arrived:'وصلت. اضغط «طيار آلي» لتكمل المسح.',
 tour1:'هذي B01. قُدها بالأسهم، أو خلّ «طيار آلي» يمسح المنطقة لحاله.',tour2:'هذي خريطة المسح. اضغط على أي نقطة فيها فتروح لها B01، واضغط على هدف مرصود لتشوف ملفه.',
 tour3:'هنا يشوف السونار عمود الماء تحت المركبة. الهدف يبان كنقطة مضيئة.',tour4:'لما يُرصد هدف تفتح حزمة الأدلة، وأنت تقرر. اسحب بالماوس لتدير الكاميرا، والعجلة للتقريب.',
 t_next:'التالي',t_done:'ابدأ',t_skip:'تخطي',t_of:'{i} من 4',
 hl_above:'فوق القاع',hl_depth:'تحت السطح',hl_bed:'على القاع',hl_bg_new:'مسح الأساس: ما كان هنا',hl_bg_old:'مسح الأساس: كان موجودًا',hl_shadow:'ظل صوتي',hl_noshadow:'الظل لم يُرَ',
 hl_still:'ثابت',hl_sway:'يتأرجح حول نقطة',hl_free:'يتحرك بحرية',hl_need:'يحتاج تمريرة ثانية',hl_h1:'اتجاه 1',hl_h2:'اتجاه 2',mute:'كتم الصوت',unmute:'تشغيل الصوت'},
en:{title:'B01 mission simulator',sim:'Simulated data, time ×{x}',time:'Time',left:'Left',cov:'Coverage',tgs:'Targets',speed:'Speed',batt:'Battery',score:'Score',auto:'Autopilot',cam:'Camera',map:'Survey area',sonar:'Water column, multibeam',dead:'Dead zone',
 press:'Press any key or touch the screen to take control',keys:'Arrows steer, Space autopilot, C camera, drag to turn the view',
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
 dec_hand:'Handed over',dec_clear:'Non-hazardous',dec_none:'No decision',dec_miss:'Not detected',
 lg_title:'Welcome to the B01 simulator',lg_body:'Choose who you are and type your ID so we can keep your score and rating.',role_visitor:'Visitor',role_judge:'Judge',
 lg_label_v:'Visitor number or name',lg_label_j:'Judge ID',lg_ph:'e.g. {n}',lg_ph_j:'e.g. J-07',lg_auto:'You can leave it empty and get number {n}.',lg_need_j:'Type the judge ID.',lg_go:'Enter',
 visitor:'ID',rate:'Rate your experience',side:'Rate and finish',
 fb_title:'Rate your experience with B01',star_n:'{n} of 5',s1:'Poor',s2:'Fair',s3:'Good',s4:'Very good',s5:'Excellent',
 fb_note:'Your comment (optional)',fb_send:'Send rating',fb_skip:'Skip',fb_back:'Back to the mission',fb_need:'Pick the stars first',
 th_title:'Thank you',th_body:'Your rating is saved for the B01 team. The game now returns to the demo for the next visitor.',th_done:'Done',
 goto:'B01 heading to the point',arrived:'Arrived. Press Autopilot to continue the survey.',
 tour1:'This is B01. Drive with the arrows, or let Autopilot survey the area.',tour2:'This is the survey map. Click any point to send B01 there, or a detected target to open its file.',
 tour3:'Here the sonar sees the water column under the vessel. A target shows as a bright spot.',tour4:'When a target is detected, the evidence package opens and you decide. Drag to turn the camera; scroll to zoom.',
 t_next:'Next',t_done:'Start',t_skip:'Skip',t_of:'{i} of 4',
 hl_above:'above the seabed',hl_depth:'below the surface',hl_bed:'on the seabed',hl_bg_new:'baseline: nothing here',hl_bg_old:'baseline: already there',hl_shadow:'acoustic shadow',hl_noshadow:'shadow not seen',
 hl_still:'stays put',hl_sway:'sways around a point',hl_free:'moves freely',hl_need:'needs another pass',hl_h1:'heading 1',hl_h2:'heading 2',mute:'Mute',unmute:'Sound on'}};
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
  setSimLabel();renderTimeSel();renderLogin();if(!$('#o-fb').hidden)renderStars();renderTour();
  if(S.mode==='attract')$('#cap-text').textContent=t('a'+(S.capIdx+1));
  if(S.cur&&!$('#o-hand').hidden)renderHand();
  if(S.mode==='results')renderResults();
  updateHud(true);
}

/* ---------------- scenario ---------------- */
const AREA={x0:-100,x1:100,y0:-62.5,y1:62.5},SP=25,SW=14,SWB=16,RUN=28,DEPTH=18,TXD=1.2,CELL=5;
const NA=5,NB=8,NX=Math.round((AREA.x1-AREA.x0)/CELL),NY=Math.round((AREA.y1-AREA.y0)/CELL);
const A_Y=i=>AREA.y0+SP/2+i*SP,B_X=j=>AREA.x0+SP/2+j*SP;
const RATE=3,MAXV=3.0,MAXYAW=22*D2R,IDLE_MS=60000,ROPE_N=16;
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
  S.auto=mode==='attract';S.wp=0;S.queue=[];S.legFrom=null;S.goal=null;S.routeDone=false;S.thr=mode==='attract'?MAXV:0;S.trail=[];
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
scene.add(new THREE.HemisphereLight(0xeaf2f6,0x1c3a45,1.0));
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
const ocean=new THREE.Mesh(oceanGeo,new THREE.MeshStandardMaterial({color:0x3a7d93,roughness:.32,metalness:.08,flatShading:true,transparent:true,opacity:.8,side:THREE.DoubleSide}));/* both sides: the surface is seen from below too */
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
/* the national flag, 3:2: green field, the shahada in white with the sword beneath it. The flag is the same on both faces:
   the text reads right to left and the sword points left (hilt on the right) on either side of the hull, never mirrored.
   The shahada is set in Amiri (classical Naskh) as a stand-in for the official Thuluth calligraphy. */
const SHAHADA='لا إله إلا الله محمد رسول الله',FLAG_FONT='"Amiri", "Noto Naskh Arabic", "Traditional Arabic", "Segoe UI", Tahoma, serif';
function drawFlag(c){
  const Wd=600,Ht=400;c.clearRect(0,0,Wd,Ht);c.fillStyle='#006c35';c.fillRect(0,0,Wd,Ht);
  c.fillStyle='#ffffff';c.direction='rtl';c.textAlign='center';c.textBaseline='alphabetic';
  c.font='700 80px '+FLAG_FONT;const fs=Math.min(96,80*470/c.measureText(SHAHADA).width);c.font='700 '+fs.toFixed(1)+'px '+FLAG_FONT;
  c.fillText(SHAHADA,Wd/2,Ht*.5);
  const y=Ht*.71;
  c.beginPath();c.moveTo(428,y-7);c.lineTo(152,y-7);c.quadraticCurveTo(124,y-8,106,y-19);c.quadraticCurveTo(124,y+4,152,y+7);c.lineTo(428,y+7);c.closePath();c.fill();
  c.fillRect(428,y-18,10,36);
  c.fillRect(438,y-6,42,12);
  c.beginPath();c.moveTo(479,y-6);c.quadraticCurveTo(499,y-5,501,y+16);c.lineTo(491,y+16);c.quadraticCurveTo(489,y+7,479,y+6);c.closePath();c.fill();
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
  /* mast: whip antenna (sways), comms fins, EO/IR turret on its pedestal (pans while it scans), radar dome */
  const whipPivot=new THREE.Group();whipPivot.position.set(-1.05,1.6,0);g.add(whipPivot);
  const whip=new THREE.Mesh(new THREE.CylinderGeometry(.035,.05,1.9,6),dark);whip.position.y=.95;whipPivot.add(whip);
  [[-.75,.5],[-.5,.36]].forEach(([x,h])=>{const f=new THREE.Mesh(new THREE.BoxGeometry(.18,h,.07),dark);f.position.set(x,1.62+h/2,0);g.add(f);});
  const ped=new THREE.Mesh(new THREE.CylinderGeometry(.13,.18,.26,6),dark);ped.position.set(-.05,1.78,0);g.add(ped);
  const turret=new THREE.Group();turret.position.set(-.05,2.08,0);g.add(turret);
  const ball=new THREE.Mesh(new THREE.SphereGeometry(.27,14,10),new THREE.MeshStandardMaterial({color:0x2c4f76,roughness:.35,metalness:.45,flatShading:true}));turret.add(ball);
  const lens=new THREE.Mesh(new THREE.CylinderGeometry(.1,.1,.07,14),glass);lens.rotation.z=Math.PI/2;lens.position.set(.25,0,0);turret.add(lens);
  const lens2=new THREE.Mesh(new THREE.CylinderGeometry(.055,.055,.06,10),glass);lens2.rotation.z=Math.PI/2;lens2.position.set(.24,.13,.08);turret.add(lens2);
  const dome=new THREE.Mesh(new THREE.SphereGeometry(.24,12,6,0,Math.PI*2,0,Math.PI/2),dark);dome.position.set(.85,1.63,0);dome.scale.y=.55;g.add(dome);
  /* multibeam gondola under the hull and the side-scan bars */
  const pod=new THREE.Mesh(new THREE.BoxGeometry(1.9,.36,.6),new THREE.MeshStandardMaterial({color:0x8b979b,roughness:.5,metalness:.4}));pod.position.set(.4,-1.13,0);g.add(pod);
  [-1,1].forEach(s=>{const b=new THREE.Mesh(new THREE.BoxGeometry(2.2,.07,.07),new THREE.MeshStandardMaterial({color:0x2f5561}));b.position.set(-.2,-.45,s*.95);g.add(b);});
  /* silent-survey propulsion: two pods on struts under the stern, three-blade propellers, rudders */
  const podMat=new THREE.MeshStandardMaterial({color:0x22374f,roughness:.5,metalness:.4,flatShading:true}),bronze=new THREE.MeshStandardMaterial({color:0xa8834a,roughness:.35,metalness:.85});
  const props=[];
  [-1,1].forEach(s=>{
    const pd=new THREE.Mesh(new THREE.CylinderGeometry(.16,.2,1.3,12),podMat);pd.rotation.z=Math.PI/2;pd.position.set(-3.35,-.72,s*.55);g.add(pd);
    const st=new THREE.Mesh(new THREE.BoxGeometry(.5,.45,.06),podMat);st.position.set(-3.3,-.45,s*.55);g.add(st);
    const hub=new THREE.Group();hub.position.set(-4.05,-.72,s*.55);hub.add(new THREE.Mesh(new THREE.SphereGeometry(.07,8,6),bronze));
    for(let k=0;k<3;k++){const arm=new THREE.Group();arm.rotation.x=k*2*Math.PI/3;const bl=new THREE.Mesh(new THREE.BoxGeometry(.04,.34,.11),bronze);bl.position.y=.18;bl.rotation.y=.55;arm.add(bl);hub.add(arm);}
    g.add(hub);props.push(hub);
    const rd=new THREE.Mesh(new THREE.BoxGeometry(.3,.5,.035),podMat);rd.position.set(-4.32,-.6,s*.55);g.add(rd);
  });
  /* navigation lights with a soft glow: masthead (on the whip), starboard green, port red, stern */
  const glow=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),gr=x.createRadialGradient(32,32,0,32,32,32);
    gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.22,'rgba(255,255,255,.5)');gr.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=gr;x.fillRect(0,0,64,64);
    const tx=new THREE.CanvasTexture(c);tx.colorSpace=THREE.SRGBColorSpace;return tx;})();
  const lamp=(c,x,y,z,parent)=>{const m=new THREE.Mesh(new THREE.SphereGeometry(.07,8,6),new THREE.MeshBasicMaterial({color:c}));m.position.set(x,y,z);
    const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:c,transparent:true,opacity:.8,depthWrite:false,blending:THREE.AdditiveBlending}));sp.scale.set(.5,.5,1);m.add(sp);(parent||g).add(m);};
  lamp(0xfff4cf,0,1.92,0,whipPivot);lamp(0x35d07f,2.9,1.0,.72);lamp(0xff4d4d,2.9,1.0,-.72);lamp(0xfff4cf,-4.12,.98,0);
  g.userData={turret,whipPivot,props};
  /* the gold emblem mid-hull and the hull number near the bow, on both sides */
  const emb=decalTex(256,256,drawEmblem),num=decalTex(256,96,drawHullNo);
  const embMat=new THREE.MeshStandardMaterial({map:emb,transparent:true,alphaTest:.04,roughness:.42,metalness:.25,emissive:0xffffff,emissiveMap:emb,emissiveIntensity:.28,polygonOffset:true,polygonOffsetFactor:-2,depthWrite:false});
  const numMat=new THREE.MeshStandardMaterial({map:num,transparent:true,alphaTest:.04,roughness:.8,emissive:0xffffff,emissiveMap:num,emissiveIntensity:.18,polygonOffset:true,polygonOffsetFactor:-2,depthWrite:false});
  hullDecal(g,emb,.86,.86,-.35,.7,1.3,.18,0,embMat);
  hullDecal(g,num,1.0,.375,2.62,.7,.9,.28,.24,numMat);
  /* the national flag painted near the stern (a painted flag, not a cloth one, keeps the low radar signature) */
  const flag=decalTex(600,400,drawFlag);
  const flagMat=new THREE.MeshStandardMaterial({map:flag,roughness:.6,metalness:.1,emissive:0xffffff,emissiveMap:flag,emissiveIntensity:.22,polygonOffset:true,polygonOffsetFactor:-2,depthWrite:false});
  hullDecal(g,flag,.9,.6,-2.55,.66,1.25,.19,-.06,flagMat);
  /* sonar fan: clean water column inside the minimum slant range, the rest is the dead zone */
  const fan=(r0,r1,col,op)=>{const pts=[],A=55*D2R,N=24;for(let k=0;k<N;k++){const a0=-A+2*A*k/N,a1=-A+2*A*(k+1)/N;const p=(a,r)=>[0,-TXD-r*Math.cos(a),r*Math.sin(a)];const q=(a)=>Math.min(r1,(DEPTH-TXD)/Math.cos(a));
      const i0=p(a0,r0),i1=p(a1,r0),o0=p(a0,q(a0)),o1=p(a1,q(a1));pts.push(...i0,...o0,...o1,...i0,...o1,...i1);}
    const gg=new THREE.BufferGeometry();gg.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));
    return new THREE.Mesh(gg,new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:op,side:THREE.DoubleSide,depthWrite:false}));};
  /* the hull, cabin and mast cast shadows on each other (decals, glass glints and the sonar fan do not) */
  g.traverse(o=>{if(o.isMesh){o.receiveShadow=true;o.castShadow=!o.material.transparent&&!o.material.polygonOffset;}});
  const fanClean=fan(.01,DEPTH-TXD,0x8fd6cf,.2),fanDead=fan(DEPTH-TXD,60,0xa6b8ca,.07);fanClean.position.x=.4;fanDead.position.x=.4;g.add(fanClean,fanDead);
  g.userData.fan=[fanClean,fanDead];
  return g;
}
const b01=buildB01();scene.add(b01);
/* sun shadows only around the vessel: a small shadow box that follows it */
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-7,right:7,top:7,bottom:-7,near:1,far:70});sun.shadow.camera.updateProjectionMatrix();
sun.shadow.bias=-.0006;sun.shadow.normalBias=.03;scene.add(sun.target);
/* reflections: an environment map rendered from a small copy of the sky over a dark sea, so metal and glass pick up the light */
(()=>{const pm=new THREE.PMREMGenerator(renderer),env=new THREE.Scene();
  env.add(new THREE.Mesh(new THREE.SphereGeometry(40,32,16),sky.material));
  const seaDisk=new THREE.Mesh(new THREE.CircleGeometry(60,32).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0x1e5462}));seaDisk.position.y=-1.5;env.add(seaDisk);
  const sunDisk=new THREE.Mesh(new THREE.SphereGeometry(2.4,16,8),new THREE.MeshBasicMaterial({color:0xffffff}));sunDisk.position.set(-160,220,90).setLength(34);env.add(sunDisk);
  scene.environment=pm.fromScene(env,.035).texture;pm.dispose();})();

/* ---------------- the four targets ---------------- */
const LVC={high:0xff6b45,potential:0xff6b45,unknown:0xc4d0dc,none:0x8fd6cf},HANDC=0xa99cff,CLEARC=0x7a91ab;
const T3={};
(function buildTargets3D(){
  const mat=c=>new THREE.MeshStandardMaterial({color:c,roughness:.7,metalness:.3,flatShading:true,emissive:0xff6b45,emissiveIntensity:0});
  /* moored mine: sphere with horns on a tether to an anchor */
  {const g=new THREE.Group(),m=mat(0x3b4740);g.add(new THREE.Mesh(new THREE.IcosahedronGeometry(.55,1),m));
    for(let k=0;k<8;k++){const h=new THREE.Mesh(new THREE.CylinderGeometry(.04,.06,.32,5),m);const a=k/8*Math.PI*2,e=(k%2?.4:-.25);h.position.set(Math.cos(a)*.55,e,Math.sin(a)*.55);h.lookAt(0,0,0);h.rotateX(Math.PI/2);g.add(h);}
    /* the anchor stays on the seabed and the tether is a simulated rope (see updateRope) */
    const an=new THREE.Mesh(new THREE.BoxGeometry(.8,.4,.8),new THREE.MeshStandardMaterial({color:0x4a524e,roughness:.9,flatShading:true}));scene.add(an);
    const rp=new THREE.Line(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array((ROPE_N+1)*3),3)),new THREE.LineBasicMaterial({color:0x9aa6ad}));
    rp.frustumCulled=false;scene.add(rp);
    T3.mine={g,mats:[m],y:-9,anchor:an,rope:rp};}
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

/* ---------------- underwater view and effects ---------------- */
const UWC=0x0d3440,FX={uw:false,time:{value:0},cstr:{value:.18},slowT:0,flashT:0,bigPing:false},rfx=mulberry(91),CORAL=new THREE.Color(0xff6b45);/* caustics: faint seen from above, full strength underwater */
/* moving light patterns (caustics) on the seabed, seen through the water from above and from below */
seabed.material.onBeforeCompile=sh=>{
  sh.uniforms.uTime=FX.time;sh.uniforms.uCs=FX.cstr;
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWp;').replace('#include <begin_vertex>','#include <begin_vertex>\nvWp=(modelMatrix*vec4(transformed,1.)).xyz;');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform float uTime;uniform float uCs;varying vec3 vWp;\n'+
    'float cau(vec2 p,float t){float v=sin(p.x*1.3+t*1.1+sin(p.y*.9+t*.7)*1.6)+sin(p.y*1.5-t*.9+sin(p.x*1.1-t*.6)*1.4)+sin((p.x+p.y)*.9+t*.8+sin((p.x-p.y)*.7+t)*1.2);return pow(1.-abs(v/3.),7.);}')
    .replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance+=uCs*vec3(.16,.38,.38)*(cau(vWp.xz*.42,uTime)+.6*cau(vWp.xz*.9+3.1,uTime*1.3));');
};
/* particles drifting in the water around the camera */
const SNOW_N=700,snowPos=new Float32Array(SNOW_N*3);for(let i=0;i<SNOW_N*3;i++)snowPos[i]=(rfx()-.5)*40;
const snow=new THREE.Points(new THREE.BufferGeometry().setAttribute('position',new THREE.BufferAttribute(snowPos,3)),new THREE.PointsMaterial({color:0xd6eef0,size:.07,transparent:true,opacity:.6,depthWrite:false}));
snow.frustumCulled=false;snow.visible=false;scene.add(snow);
/* sun shafts coming down from the surface */
const shaftTex=(()=>{const c=document.createElement('canvas');c.width=64;c.height=256;const x=c.getContext('2d'),g1=x.createLinearGradient(0,0,0,256);
  g1.addColorStop(0,'rgba(255,255,255,.95)');g1.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g1;x.fillRect(0,0,64,256);
  x.globalCompositeOperation='destination-in';const g2=x.createLinearGradient(0,0,64,0);g2.addColorStop(0,'rgba(0,0,0,0)');g2.addColorStop(.5,'rgba(0,0,0,1)');g2.addColorStop(1,'rgba(0,0,0,0)');
  x.fillStyle=g2;x.fillRect(0,0,64,256);const tx=new THREE.CanvasTexture(c);tx.colorSpace=THREE.SRGBColorSpace;return tx;})();
const shafts=new THREE.Group();shafts.visible=false;scene.add(shafts);
for(let i=0;i<9;i++){const m=new THREE.Mesh(new THREE.PlaneGeometry(2.2+rfx()*2.5,20),new THREE.MeshBasicMaterial({map:shaftTex,color:0x9fe0e0,transparent:true,opacity:.1,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,fog:false}));
  m.userData={ox:(rfx()-.5)*36,oz:(rfx()-.5)*36,ph:rfx()*6.28,tilt:(rfx()-.5)*.35};shafts.add(m);}
/* the wake: foam behind the stern; the propeller wash fades fast, the two outer arms spread and last longer */
const WAKE_N=90,wakePts=[],wkGeo=new THREE.BufferGeometry();
wkGeo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(WAKE_N*4*3),3));wkGeo.setAttribute('color',new THREE.BufferAttribute(new Float32Array(WAKE_N*4*4),4));
(()=>{const ix=[];for(let i=0;i<WAKE_N-1;i++)for(let j=0;j<3;j++){const a=i*4+j,b=a+1,c=a+4,d=c+1;ix.push(a,c,b,b,c,d);}wkGeo.setIndex(ix);})();
const wake=new THREE.Mesh(wkGeo,new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,depthWrite:false,side:THREE.DoubleSide}));wake.frustumCulled=false;scene.add(wake);
function updateWake(tt,b,bp){
  const fx=Math.sin(b.h),fz=-Math.cos(b.h),sx=bp.x-fx*4.2,sz=bp.z-fz*4.2,P=wakePts;
  if(!P.length||Math.hypot(P[0].x-sx,P[0].z-sz)>.7){P.unshift({x:sx,z:sz,t:tt,v:b.v});if(P.length>WAKE_N)P.pop();}
  const pos=wkGeo.attributes.position.array,col=wkGeo.attributes.color.array,n=P.length;
  for(let i=0;i<n;i++){
    const p=P[i],q=P[Math.min(n-1,i+1)],r=P[Math.max(0,i-1)];let dx=r.x-q.x,dz=r.z-q.z;const l=Math.hypot(dx,dz)||1;dx/=l;dz/=l;
    const age=tt-p.t,w=.9+age*1.6,vf=clamp(p.v/MAXV,0,1)*(i?1:0),ae=vf*.45*clamp(1-age/9,0,1),ac=vf*.55*clamp(1-age/3.5,0,1),y=waveH(p.x,p.z,tt)+.07;
    [-1,-.3,.3,1].forEach((s,j)=>{const o=(i*4+j);pos[o*3]=p.x-dz*w*s;pos[o*3+1]=y;pos[o*3+2]=p.z+dx*w*s;col[o*4]=col[o*4+1]=col[o*4+2]=1;col[o*4+3]=(j===0||j===3)?ae:ac;});
  }
  wkGeo.setDrawRange(0,Math.max(0,(n-1)*18));wkGeo.attributes.position.needsUpdate=true;wkGeo.attributes.color.needsUpdate=true;
}
/* sonar pulses: a ring spreading on the water under B01 every 4 s, a big coral one on a detection */
const pings=[0,1,2].map(()=>{const m=new THREE.Mesh(new THREE.RingGeometry(.92,1,64).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0x8fd6cf,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide}));
  m.visible=false;m.frustumCulled=false;scene.add(m);return {m,t:9,big:false};});
let pingT=0;
function updatePings(dt,tt,bp){
  pingT+=dt;
  if(FX.bigPing||pingT>4){const p=pings.reduce((a,c)=>c.t>a.t?c:a);p.t=0;p.big=FX.bigPing;p.m.position.set(bp.x,.2,bp.z);p.m.material.color.setHex(p.big?0xff6b45:0x8fd6cf);p.m.visible=true;
    if(!p.big&&(S.mode==='play'||S.mode==='attract')&&!S.paused)sfx('ping',{soft:true});FX.bigPing=false;pingT=0;}
  for(const p of pings){if(!p.m.visible)continue;p.t+=dt;const u=p.t/2.6;if(u>=1){p.m.visible=false;continue;}
    const r=1+u*(p.big?40:26);p.m.scale.set(r,1,r);p.m.position.y=waveH(p.m.position.x,p.m.position.z,tt)+.12;p.m.material.opacity=(p.big?.8:.38)*(1-u);}
}
function updateFx(dt,tt,b,bp){
  FX.time.value=tt;
  const cp=camera.position,uw=cp.y<waveH(cp.x,cp.z,tt)-.05;
  if(uw!==FX.uw){FX.uw=uw;scene.fog.color.set(uw?UWC:HAZE);scene.fog.near=uw?1:140;scene.fog.far=uw?46:620;scene.background.set(uw?UWC:HAZE);sky.visible=!uw;snow.visible=uw;shafts.visible=uw;FX.cstr.value=uw?1:.18;}
  if(uw){
    const a=snowPos,cx=cp.x,cy=cp.y,cz=cp.z,wr=(v,c)=>c+((((v-c+20)%40)+40)%40)-20;
    for(let i=0;i<SNOW_N;i++){const k=i*3;a[k]=wr(a[k]+Math.sin(tt*.3+i)*.004,cx);a[k+1]=wr(a[k+1]-.15*dt,cy);a[k+2]=wr(a[k+2],cz);if(a[k+1]>-.4)a[k+1]-=40;if(a[k+1]<-DEPTH)a[k+1]+=DEPTH-1;}
    snow.geometry.attributes.position.needsUpdate=true;
    shafts.children.forEach(m=>{const u=m.userData,wx=cx+u.ox,wz=cz+u.oz;m.position.set(wx,-10,wz);m.rotation.set(0,Math.atan2(cx-wx,cz-wz),u.tilt);m.material.opacity=.12+.07*Math.sin(tt*.7+u.ph);});
  }
  updateWake(tt,b,bp);
}

/* ---------------- input ---------------- */
function anyInput(){S.lastInput=performance.now();if(S.mode==='attract'){openLogin();return true;}return false;}
const KEYMAP={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',ArrowUp:'up',KeyW:'up',ArrowDown:'down',KeyS:'down'};
const adminOpen=()=>!$('#o-admin').hidden||!$('#o-pin').hidden;
addEventListener('keydown',e=>{
  /* the hidden admin panel: Ctrl+Shift+D from any screen, then the passcode */
  if(e.ctrlKey&&e.shiftKey&&e.code==='KeyD'){e.preventDefault();e.stopPropagation();openAdminGate();return;}
  if(adminOpen()){if(e.key==='Escape')closeAdmin();else if(e.key==='Enter'&&e.target&&e.target.id&&e.target.id.startsWith('pin-')){e.preventDefault();pinGo();}return;}
  if(tourI>=0){S.lastInput=performance.now();if(e.key==='Escape'){e.preventDefault();closeTour();}return;}
  /* typing in the entry or feedback fields is never a game control */
  if(e.target&&e.target.matches&&e.target.matches('input,textarea')){S.lastInput=performance.now();if(e.target.id==='v-id'&&e.key==='Enter'){e.preventDefault();doLogin();}return;}
  if(S.mode==='feedback'){S.lastInput=performance.now();const n=+e.key;if(n>=1&&n<=5)setStars(n);return;}
  if(anyInput())return;
  const onBtn=e.target&&e.target.closest&&e.target.closest('button');
  if(!$('#o-brief').hidden){if((e.code==='Enter'||e.code==='Space')&&!onBtn){e.preventDefault();startPlay();}return;}
  if(S.mode!=='play'||S.paused)return;
  const k=KEYMAP[e.code];if(k){e.preventDefault();press(k,1);}
  if(e.code==='Space'){e.preventDefault();toggleAuto();}
  if(e.code==='KeyC')toggleCam();
});
addEventListener('keyup',e=>{const k=KEYMAP[e.code];if(k)press(k,0);});
addEventListener('pointerdown',e=>{if(adminOpen())return;if(S.mode==='attract'&&!e.target.closest('button')){anyInput();}else S.lastInput=performance.now();});
function press(k,on){S.keys[k]=on;if(on&&(k==='left'||k==='right')&&S.auto){S.auto=false;if(S.goal){S.goal=null;S.queue=[];}$('#b-auto').setAttribute('aria-pressed','false');toast(t('takeover'));}}
function releaseKeys(){S.keys={left:0,right:0,up:0,down:0};document.querySelectorAll('.tbtn.on').forEach(b=>b.classList.remove('on'));}
document.querySelectorAll('.tbtn').forEach(b=>{const k=b.dataset.k;
  const on=e=>{e.preventDefault();S.lastInput=performance.now();if(S.mode!=='play'||S.paused)return;b.classList.add('on');press(k,1);};
  const off=()=>{b.classList.remove('on');press(k,0);};
  b.addEventListener('pointerdown',on);b.addEventListener('pointerup',off);b.addEventListener('pointerleave',off);b.addEventListener('pointercancel',off);});
function toggleAuto(){S.auto=!S.auto;$('#b-auto').setAttribute('aria-pressed',String(S.auto));toast(S.auto?t('autoOn'):t('takeover'));if(S.auto){S.thr=MAXV;S.legFrom=[S.boat.x,S.boat.y];S.routeDone=false;if(S.goal){S.goal=null;S.queue=[];}}}
function toggleCam(){S.cam={chase:'side',side:'under',under:'top',top:'chase'}[S.cam]||'chase';}
$('#b-auto').addEventListener('click',()=>{S.lastInput=performance.now();if(S.mode==='play')toggleAuto();});
$('#b-cam').addEventListener('click',()=>{S.lastInput=performance.now();toggleCam();});
$('#b-lang').addEventListener('click',()=>{lang=lang==='ar'?'en':'ar';store.set('b01sim.lang',lang);applyLang();});

/* ---------------- flow: attract, entry, briefing, play, results, rating ---------------- */
/* entry gate: visitor or judge, any ID (no password); a visitor may leave it empty and take the next number on this device */
const ENTRY={role:'visitor'};
function renderLogin(){
  const n=store.get('b01sim.nextNo',1),j=ENTRY.role==='judge',note=$('#lg-note');
  $('#r-vis').setAttribute('aria-pressed',String(!j));$('#r-judge').setAttribute('aria-pressed',String(j));
  $('#lg-lab').textContent=t(j?'lg_label_j':'lg_label_v');
  $('#v-id').placeholder=j?t('lg_ph_j'):t('lg_ph').replace('{n}',n);
  note.textContent=j?'':t('lg_auto').replace('{n}',n);note.classList.remove('err');
}
function openLogin(){S.mode='login';$('#caption').hidden=true;ENTRY.role='visitor';const inp=$('#v-id');inp.value='';renderLogin();$('#o-login').hidden=false;inp.focus({preventScroll:true});}
$('#r-vis').addEventListener('click',()=>{ENTRY.role='visitor';renderLogin();$('#v-id').focus();});
$('#r-judge').addEventListener('click',()=>{ENTRY.role='judge';renderLogin();$('#v-id').focus();});
function doLogin(){
  const inp=$('#v-id');let v=inp.value.trim().replace(/\s+/g,' ').slice(0,24),n=store.get('b01sim.nextNo',1);
  if(!v){if(ENTRY.role==='judge'){const nt=$('#lg-note');nt.textContent=t('lg_need_j');nt.classList.add('err');inp.focus();return;}v=String(n);n++;}
  else if(ENTRY.role==='visitor'&&/^\d+$/.test(v)&&+v>=n)n=+v+1;
  store.set('b01sim.nextNo',n);S.visitor=v;inp.blur();openSession(v,ENTRY.role);openBrief();
}
$('#b-login').addEventListener('click',doLogin);
function openBrief(){S.mode='brief';$('#caption').hidden=true;$('#o-login').hidden=true;renderTimeSel();$('#o-brief').hidden=false;$('#b-start').focus();showControls();}
function startPlay(){$('#o-brief').hidden=true;resetScenario('play');S.cam='chase';Object.assign(CAMU,{on:false,yaw:0,pitch:0,zoom:1,drag:null});showControls();updateHud(true);
  if(!tourDone){tourDone=true;openTour();}}
function showControls(){const play=S.mode==='play';document.body.classList.toggle('playing',play);$('#t-steer').hidden=!(play&&TOUCH);$('#t-thr').hidden=!(play&&TOUCH);$('#hint').hidden=!(play&&!TOUCH);$('#b-side').hidden=!(play&&!!sess);}
function toAttract(){
  /* a visitor who walks away still leaves a session; stars picked but not sent are kept */
  if(sess){if(S.mode==='feedback'&&FB.stars)Object.assign(sess,{stars:FB.stars,review:$('#fb-text').value.trim().slice(0,600)});closeSession(S.mode==='feedback'&&FB.stars?'partial':'left');}
  clearTimeout(thanksTimer);tourI=-1;['#o-login','#o-brief','#o-hand','#o-res','#o-fb','#o-thanks','#tour'].forEach(s=>$(s).hidden=true);
  resetScenario('attract');S.visitor='';$('#caption').hidden=false;$('#cap-text').textContent=t('a1');showControls();
}
$('#b-start').addEventListener('click',startPlay);
$('#b-again').addEventListener('click',()=>{$('#o-res').hidden=true;openBrief();});
$('#b-rate').addEventListener('click',()=>openFeedback('results'));
$('#b-side').addEventListener('click',()=>{if(S.mode==='play'&&!S.paused)openFeedback('play');});

/* first-time tour: four short steps for each new visitor, the mission waits until it ends */
const TOUR=[['#b-auto','tour1'],['#mm','tour2'],['#wcd','tour3'],[null,'tour4']];let tourI=-1,tourDone=false;
function openTour(){tourI=0;S.paused=true;$('#tour').hidden=false;renderTour();}
function renderTour(){
  if(tourI<0)return;const [sel,k]=TOUR[tourI],ring=$('#tour-ring'),card=$('#tour-card');
  $('#tour-text').textContent=t(k);$('#tour-step').textContent=t('t_of').replace('{i}',tourI+1);$('#tour-next').textContent=t(tourI===TOUR.length-1?'t_done':'t_next');$('#tour-skip').textContent=t('t_skip');
  const cw=Math.min(380,innerWidth-32);card.style.width=cw+'px';$('#tour').classList.toggle('dim',!sel);
  if(sel){const r=$(sel).getBoundingClientRect(),p=8;Object.assign(ring.style,{display:'block',left:(r.left-p)+'px',top:(r.top-p)+'px',width:(r.width+2*p)+'px',height:(r.height+2*p)+'px'});
    const below=r.bottom+18+190<innerHeight;Object.assign(card.style,{left:clamp(r.left+r.width/2-cw/2,16,innerWidth-cw-16)+'px',top:(below?r.bottom+18:Math.max(16,r.top-208))+'px'});}
  else{ring.style.display='none';Object.assign(card.style,{left:(innerWidth-cw)/2+'px',top:Math.round(innerHeight*.36)+'px'});}
  $('#tour-next').focus({preventScroll:true});
}
function closeTour(){if(tourI<0)return;tourI=-1;$('#tour').hidden=true;S.paused=false;S.lastInput=performance.now();}
$('#tour-next').addEventListener('click',()=>{sfx('click');S.lastInput=performance.now();if(tourI<TOUR.length-1){tourI++;renderTour();}else closeTour();});
$('#tour-skip').addEventListener('click',closeTour);
addEventListener('resize',()=>renderTour());

/* ---------------- exhibition log: one session per visitor, kept on this device first, then sent to Google Sheets ---------------- */
const SESS='b01sim.sessions',SHEET='b01sim.sheet',PINK='b01sim.pin';
const pad2=n=>String(n).padStart(2,'0'),stamp=d=>d.getFullYear()+'-'+pad2(d.getMonth()+1)+'-'+pad2(d.getDate())+' '+pad2(d.getHours())+':'+pad2(d.getMinutes())+':'+pad2(d.getSeconds());
let sess=null;
const sessions=()=>store.get(SESS,[]);
function putSession(r){const a=sessions(),i=a.findIndex(x=>x.id===r.id);if(i>=0)a[i]=r;else a.push(r);store.set(SESS,a);}
function openSession(visitor,role){
  if(sess)closeSession('left');/* never leave a previous session hanging open */
  tourDone=false;/* each new visitor gets the tour once */
  const now=new Date();
  sess={id:now.getTime().toString(36)+Math.random().toString(36).slice(2,6),visitor,role,stars:0,review:'',start:stamp(now),end:'',duration_s:0,
    missions:0,score:'',coverage:'',correct:'',mine:'',wreck:'',unknown:'',fish:'',time_mode:'',device:TOUCH?'tablet':'pc',lang,status:'open',t0:now.getTime(),t1:now.getTime(),synced:false};
  putSession(sess);
}
function noteMission(){
  if(!sess)return;const R=S.result;sess.missions++;
  Object.assign(sess,{score:R.total,coverage:R.covPct,correct:R.ok,time_mode:S.limit?String(Math.round(S.limit/60)):'free',lang,t1:Date.now()});
  S.tg.forEach(x=>{sess[x.kind]=x.state==='hidden'?'miss':(x.dec||'none');});putSession(sess);
}
function closeSession(status){
  if(!sess)return;const now=new Date();
  Object.assign(sess,{end:stamp(now),t1:now.getTime(),duration_s:Math.round((now.getTime()-sess.t0)/1000),status,synced:false});
  putSession(sess);sess=null;syncSoon();
}
/* a session left open by a closed tab or a reload is closed at its last activity */
(()=>{const a=sessions();let ch=false;a.forEach(r=>{if(r.status==='open'){const t1=r.t1||r.t0;Object.assign(r,{status:'left',end:stamp(new Date(t1)),duration_s:Math.round((t1-r.t0)/1000)});ch=true;}});if(ch)store.set(SESS,a);})();
/* what the sheet, the admin table and the CSV show: readable Arabic values, one column per field */
const LBL={role:{visitor:'زائر',judge:'محكّم'},status:{rated:'قيّم',partial:'اختار النجوم ولم يرسل',skipped:'تخطّى التقييم',left:'غادر بدون تقييم',open:'جلسة جارية'},
  dec:{hand:'تسليم للتحقق',clear:'غير خطِر',none:'بلا قرار',miss:'لم يُرصد'},device:{pc:'كمبيوتر',tablet:'تابلت'},lang:{ar:'عربي',en:'English'}};
const COLS=[['id','المعرّف'],['visitor','الآيدي'],['role','الصفة'],['stars','التقييم (من 5)'],['review','الملاحظة'],['start','البداية'],['end','النهاية'],['duration_s','المدة (ثانية)'],
  ['missions','عدد المهمات'],['score','النقاط'],['coverage','التغطية %'],['correct','قرارات صحيحة (من 4)'],['mine','اللغم المربوط'],['wreck','الحطام'],['unknown','الجسم غير المعروف'],['fish','الأسماك'],
  ['time_mode','مدة المهمة'],['device','الجهاز'],['lang','اللغة'],['status','الحالة']];
function human(r){
  const o={};
  COLS.forEach(([k])=>{let v=r[k];if(v==null)v='';
    if(k==='role'||k==='status'||k==='device'||k==='lang')v=LBL[k][v]||v;
    else if(k==='mine'||k==='wreck'||k==='unknown'||k==='fish')v=LBL.dec[v]||v;
    else if(k==='time_mode')v=v==='free'?'حتى يكتمل المسح':(/^\d+$/.test(String(v))?v+' دقائق':v);
    else if(k==='stars'&&!v)v='';
    o[k]=v;});
  return o;
}
/* every device sends to the team sheet with the public send key (it can only add sessions);
   reading needs the admin key, entered only in the hidden panel on the team's own devices */
const SHEET_URL='https://script.google.com/macros/s/AKfycbygQwCYxFhDJthPwkQnmr_ywa97IVpJ7if4MJ-CQ1DuWOEe24Y2E1aC5HkfwEDHqEziYg/exec',WRITE_KEY='w-0gKSqgbwPrBcQmp2xI9';
const sheetCfg=()=>{const c=store.get(SHEET,{url:'',key:''});return {url:c.url||SHEET_URL,key:c.key||''};};
const sendCfg=()=>{const c=sheetCfg();return {url:c.url,key:c.key||WRITE_KEY};};
let syncing=false,syncT=0;
function syncSoon(){clearTimeout(syncT);syncT=setTimeout(syncNow,600);}
/* outbox: every closed session not yet in the sheet goes in one request; a lost answer only means it is sent again (the sheet updates by id) */
async function syncNow(){
  const c=sendCfg();if(!c.url||!c.key)return {ok:false,msg:'not-set'};if(!navigator.onLine)return {ok:false,msg:'offline'};if(syncing)return {ok:false,msg:'busy'};
  const pend=sessions().filter(r=>r.status!=='open'&&!r.synced);if(!pend.length)return {ok:true,sent:0};
  syncing=true;
  try{
    const res=await fetch(c.url,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({key:c.key,action:'save',records:pend.map(human)})});
    const j=await res.json();if(!j||!j.ok)throw new Error((j&&j.error)||('HTTP '+res.status));
    const done=new Set((j.saved||[]).map(String)),a=sessions();a.forEach(r=>{if(done.has(String(r.id)))r.synced=true;});store.set(SESS,a);
    return {ok:true,sent:done.size};
  }catch(err){return {ok:false,msg:String((err&&err.message)||err)};}
  finally{syncing=false;}
}
addEventListener('online',syncSoon);setInterval(()=>{syncNow();},60000);

/* ---------------- rating: 1 to 5 stars and a comment, at the end of the session or early from the side button ---------------- */
const FB={stars:0,from:'results'};
const STAR='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8l2.85 5.95 6.5.85-4.75 4.5 1.2 6.45L12 17.4l-5.8 3.15 1.2-6.45L2.65 9.6l6.5-.85z"/></svg>';
function renderStars(){
  $('#fb-stars').innerHTML=[1,2,3,4,5].map(n=>'<button class="star" role="radio" aria-checked="'+(FB.stars===n)+'" aria-label="'+t('star_n').replace('{n}',n)+'" data-v="'+n+'" tabindex="'+((FB.stars||1)===n?0:-1)+'">'+STAR+'</button>').join('');
  paintStars(FB.stars);$('#fb-send').disabled=!FB.stars;$('#fb-hint').hidden=!!FB.stars;
}
function paintStars(n){document.querySelectorAll('#fb-stars .star').forEach(b=>b.classList.toggle('on',+b.dataset.v<=n));$('#fb-star-l').textContent=n?t('s'+n):'';}
function setStars(n){
  FB.stars=n;document.querySelectorAll('#fb-stars .star').forEach(b=>{const v=+b.dataset.v;b.setAttribute('aria-checked',String(v===n));b.tabIndex=v===n?0:-1;});
  paintStars(n);$('#fb-send').disabled=false;$('#fb-hint').hidden=true;S.lastInput=performance.now();
}
$('#fb-stars').addEventListener('click',e=>{const b=e.target.closest('.star');if(b){setStars(+b.dataset.v);b.focus();}});
$('#fb-stars').addEventListener('pointerover',e=>{const b=e.target.closest('.star');if(b)paintStars(+b.dataset.v);});
$('#fb-stars').addEventListener('pointerleave',()=>paintStars(FB.stars));
$('#fb-stars').addEventListener('keydown',e=>{
  const rtl=document.documentElement.dir==='rtl';let d=0;
  if(e.key==='ArrowRight')d=rtl?-1:1;else if(e.key==='ArrowLeft')d=rtl?1:-1;else if(e.key==='ArrowUp')d=1;else if(e.key==='ArrowDown')d=-1;
  if(d){e.preventDefault();e.stopPropagation();const n=clamp((FB.stars||0)+d,1,5);setStars(n);const b=$('#fb-stars .star[data-v="'+n+'"]');if(b)b.focus();}
});
function openFeedback(from){
  FB.from=from;FB.stars=0;S.mode='feedback';S.paused=true;releaseKeys();S.lastInput=performance.now();$('#fb-text').value='';renderStars();
  $('#fb-back').hidden=from!=='play';$('#o-res').hidden=true;$('#o-fb').hidden=false;$('#o-fb .card').scrollTop=0;showControls();
  const s=$('#fb-stars .star');if(s)s.focus({preventScroll:true});
}
let thanksTimer=0;
$('#fb-send').addEventListener('click',()=>{
  if(!FB.stars)return;
  if(sess){Object.assign(sess,{stars:FB.stars,review:$('#fb-text').value.trim().slice(0,600)});closeSession('rated');}
  S.mode='thanks';$('#o-fb').hidden=true;$('#o-thanks').hidden=false;$('#th-done').focus();clearTimeout(thanksTimer);thanksTimer=setTimeout(toAttract,9000);
});
$('#fb-skip').addEventListener('click',()=>{closeSession('skipped');toAttract();});
$('#fb-back').addEventListener('click',()=>{$('#o-fb').hidden=true;S.mode='play';S.paused=false;S.lastInput=performance.now();showControls();});
$('#th-done').addEventListener('click',toAttract);

/* ---------------- hidden admin panel: Ctrl+Shift+D, then the passcode; nothing on screen points to it ---------------- */
const AD={src:'local',fails:0,lockUntil:0,list:[],mode:'enter'};
async function sha(s){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');}
function showPin(mode){
  AD.mode=mode;const T0={create:['إنشاء رمز دخول الإدارة','اختر رمزًا من 4 خانات أو أكثر، واكتبه مرتين. يُطلب كل مرة تفتح فيها اللوحة على هذا الجهاز.'],
    enter:['دخول الإدارة','اكتب رمز الدخول.'],change:['تغيير رمز الدخول','اكتب الرمز الجديد مرتين.']}[mode];
  $('#pin-t').textContent=T0[0];$('#pin-msg').textContent=T0[1];$('#pin-2').hidden=mode==='enter';
  $('#pin-1').value='';$('#pin-2').value='';$('#pin-err').textContent='';$('#o-pin').hidden=false;$('#pin-1').focus();
}
function openAdminGate(){if(!$('#o-admin').hidden||!$('#o-pin').hidden)return;showPin(store.get(PINK,null)?'enter':'create');}
async function pinGo(){
  const p1=$('#pin-1').value,p2=$('#pin-2').value,err=$('#pin-err');
  if(AD.mode!=='enter'){
    if(p1.length<4){err.textContent='الرمز لازم يكون 4 خانات أو أكثر.';return;}
    if(p1!==p2){err.textContent='الرمزان غير متطابقين.';return;}
    const salt=Math.random().toString(36).slice(2,10);store.set(PINK,{salt,hash:await sha(salt+p1)});
    $('#o-pin').hidden=true;openAdmin();return;
  }
  if(Date.now()<AD.lockUntil){err.textContent='محاولات كثيرة. انتظر دقيقة.';return;}
  const p=store.get(PINK,null);
  if(p&&await sha(p.salt+p1)===p.hash){AD.fails=0;$('#o-pin').hidden=true;openAdmin();}
  else{AD.fails++;$('#pin-1').value='';err.textContent='الرمز غير صحيح.';if(AD.fails>=5){AD.lockUntil=Date.now()+60000;AD.fails=0;}}
}
$('#pin-go').addEventListener('click',pinGo);
$('#pin-x').addEventListener('click',()=>{$('#o-pin').hidden=true;S.lastInput=performance.now();});
function closeAdmin(){$('#o-pin').hidden=true;$('#o-admin').hidden=true;S.lastInput=performance.now();}
function openAdmin(){
  const c=sheetCfg();$('#ad-url').value=c.url||'';$('#ad-key').value=c.key||'';$('#ad-set-msg').textContent='';
  /* with the admin key saved, the panel opens on all devices: that is what the team reads */
  if($('#o-admin').hidden)AD.src=c.key?'all':'local';$('#o-admin').hidden=false;$('#o-admin .card').scrollTop=0;loadAdmin();$('#ad-close').focus();
}
/* reads go by POST too, so the secret never sits in a URL (history, logs) */
const sheetGet=c=>fetch(c.url,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({key:c.key,action:'list'})}).then(r=>r.json());
async function loadAdmin(){
  $('#ad-src-local').setAttribute('aria-pressed',String(AD.src==='local'));$('#ad-src-all').setAttribute('aria-pressed',String(AD.src==='all'));
  if(AD.src==='local'){AD.list=sessions().slice().reverse().map(r=>Object.assign(human(r),{_where:r.status==='open'?'—':r.synced?'في الجدول':'على الجهاز فقط'}));renderAdmin();return;}
  const c=sheetCfg();if(!c.key){AD.list=[];renderAdmin('أدخل مفتاح الإدارة في الإعدادات تحت عشان تقرأ كل الأجهزة.');return;}
  AD.list=[];renderAdmin('جارٍ التحميل من Google Sheets…');
  try{
    const j=await sheetGet(c);if(!j.ok)throw new Error(j.error||'');
    const byId=new Map();(j.records||[]).forEach(r=>byId.set(String(r.id),Object.assign(r,{_where:'في الجدول'})));
    sessions().filter(r=>!r.synced&&r.status!=='open').forEach(r=>byId.set(String(r.id),Object.assign(human(r),{_where:'على الجهاز فقط'})));
    AD.list=[...byId.values()].sort((a,b)=>String(b.start).localeCompare(String(a.start)));renderAdmin();
  }catch(e){AD.list=[];renderAdmin('تعذّر التحميل من Google Sheets. تأكد من الرابط والمفتاح والاتصال بالإنترنت.');}
}
/* Arabic count of sessions: جلسة واحدة، جلستان، 3 جلسات، 11 جلسة */
function nS(n){return n===1?'جلسة واحدة':n===2?'جلستان':n>=3&&n<=10?n+' جلسات':n+' جلسة';}
const escH=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const starsTxt=n=>{n=Math.round(+n||0);return n?'★'.repeat(n)+'☆'.repeat(5-n):'—';};
function renderAdmin(msg){
  /* only ratings the visitor actually sent count in the averages shown to the judges */
  const L=AD.list,rated=L.filter(r=>+r.stars>0&&(r.status==='قيّم'||r.status==='rated')),avg=a=>a.length?a.reduce((s,r)=>s+(+r.stars),0)/a.length:0;
  const nr=n=>n===1?'تقييم واحد':n===2?'تقييمان':n>=3&&n<=10?n+' تقييمات':n+' تقييمًا';
  const judges=rated.filter(r=>r.role==='محكّم'),visitors=rated.filter(r=>r.role!=='محكّم');
  const durs=L.map(r=>+r.duration_s||0).filter(Boolean),corr=L.filter(r=>r.correct!==''&&r.correct!=null&&!isNaN(+r.correct)).map(r=>+r.correct);
  const pending=sessions().filter(r=>r.status!=='open'&&!r.synced).length,c=sheetCfg(),a=avg(rated);
  $('#ad-status').textContent='الإرسال إلى Google Sheets مفعّل من كل الأجهزة.'+(c.key?' مفتاح الإدارة محفوظ على هذا الجهاز.':' مفتاح الإدارة غير محفوظ هنا، فالقراءة من الجدول مقفلة.')+(pending?' '+nS(pending)+' بانتظار الإرسال.':'')+(msg?' '+msg:'');
  const mini=n=>'<span class="mini" aria-hidden="true">'+[1,2,3,4,5].map(i=>'<svg viewBox="0 0 24 24" class="'+(i<=Math.round(n)?'on':'')+'"><path d="M12 2.8l2.85 5.95 6.5.85-4.75 4.5 1.2 6.45L12 17.4l-5.8 3.15 1.2-6.45L2.65 9.6l6.5-.85z"/></svg>').join('')+'</span>';
  const fmtAvg=x=>x?x.toFixed(1):'—';
  $('#ad-sum').innerHTML=
    '<div class="ad-avg"><span>متوسط التقييم</span><b class="n">'+fmtAvg(a)+'</b>'+mini(a)+'<small>'+(rated.length?'من '+nr(rated.length):'ما فيه تقييمات للحين')+'</small></div>'+
    '<div><span>المحكّمون</span><b class="n">'+fmtAvg(avg(judges))+'</b><small>'+(judges.length?nr(judges.length):'—')+'</small></div>'+
    '<div><span>الزوار</span><b class="n">'+fmtAvg(avg(visitors))+'</b><small>'+(visitors.length?nr(visitors.length):'—')+'</small></div>'+
    '<div><span>الجلسات</span><b class="n">'+L.length+'</b><small>متوسط المدة '+(durs.length?fmt(durs.reduce((s,x)=>s+x,0)/durs.length):'—')+'</small></div>'+
    '<div><span>القرارات الصحيحة</span><b class="n">'+(corr.length?(corr.reduce((s,x)=>s+x,0)/corr.length).toFixed(1)+'/4':'—')+'</b><small>متوسط من أكمل مهمة</small></div>';
  const cnt=[5,4,3,2,1].map(s=>[s,rated.filter(r=>Math.round(+r.stars)===s).length]);
  $('#ad-dist').innerHTML=cnt.map(([s,n])=>'<div class="r"><span class="st">'+'★'.repeat(s)+'</span><span class="bar"><i style="width:'+(rated.length?n/rated.length*100:0).toFixed(1)+'%"></i></span><span class="n">'+n+(rated.length?' ('+Math.round(n/rated.length*100)+'%)':'')+'</span></div>').join('');
  $('#ad-rows').innerHTML=L.map(r=>'<tr><td><bdi>'+escH(r.visitor)+'</bdi></td><td>'+escH(r.role)+'</td><td class="st" aria-label="'+(+r.stars||0)+' من 5">'+starsTxt(r.stars)+'</td><td class="rv">'+escH(r.review)+'</td><td class="n">'+escH(r.start)+'</td><td class="n">'+(r.duration_s?fmt(+r.duration_s):'—')+'</td><td class="n">'+escH(r.score)+'</td><td class="n">'+(r.correct!==''&&r.correct!=null?escH(r.correct)+'/4':'—')+'</td><td>'+escH(r.status)+'</td><td>'+escH(r._where||'')+'</td></tr>').join('');
  $('#ad-empty').hidden=L.length>0;
}
function csvCell(v){v=v==null?'':String(v);if(/^[=+\-@]/.test(v))v="'"+v;return '"'+v.replace(/"/g,'""')+'"';}
function exportCsv(){
  const rows=[COLS.map(([,h])=>h)].concat(AD.list.map(r=>COLS.map(([k])=>r[k])));
  const text='﻿'+rows.map(r=>r.map(csvCell).join(',')).join('\r\n');
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:'text/csv;charset=utf-8'}));
  a.download='b01-feedback-'+(AD.src==='all'?'all-':'')+stamp(new Date()).slice(0,10)+'.csv';document.body.appendChild(a);a.click();
  setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},1500);
}
$('#ad-src-local').addEventListener('click',()=>{AD.src='local';loadAdmin();});
$('#ad-src-all').addEventListener('click',()=>{AD.src='all';loadAdmin();});
$('#ad-csv').addEventListener('click',exportCsv);
$('#ad-close').addEventListener('click',closeAdmin);
$('#ad-save').addEventListener('click',async()=>{
  let url=$('#ad-url').value.trim();const key=$('#ad-key').value.trim(),m=$('#ad-set-msg');
  if(url&&!/^https:\/\//.test(url)){m.textContent='الرابط لازم يبدأ بـ https://';return;}
  store.set(SHEET,{url:url===SHEET_URL?'':url,key});if(!key){m.textContent='انحفظ. الإرسال شغّال، لكن القراءة تحتاج مفتاح الإدارة.';loadAdmin();return;}
  url=url||SHEET_URL;
  m.textContent='جارٍ اختبار الاتصال…';
  try{const j=await sheetGet({url,key});
    if(!j.ok){m.textContent='الرابط يرد، لكن المفتاح غير صحيح.';return;}
    const cnt=(j.records||[]).length;m.textContent=cnt?'الاتصال يعمل، وفي الجدول '+nS(cnt)+'.':'الاتصال يعمل، والجدول فاضي للحين.';
    const r=await syncNow();if(r.ok&&r.sent)m.textContent+=' وأُرسلت '+nS(r.sent)+' محفوظة على هذا الجهاز.';
    AD.src='all';/* the key works: show what is in the sheet */
  }catch(e){m.textContent='تعذّر الوصول للرابط. تأكد منه ومن الاتصال بالإنترنت.';}
  loadAdmin();
});
$('#ad-sync').addEventListener('click',async()=>{
  const m=$('#ad-set-msg');m.textContent='جارٍ الإرسال…';const r=await syncNow();
  m.textContent=r.ok?(r.sent?'أُرسلت '+nS(r.sent)+'.':'ما فيه شيء بانتظار الإرسال.'):r.msg==='not-set'?'اربط Google Sheets أولًا.':r.msg==='offline'?'ما فيه اتصال بالإنترنت.':'تعذّر الإرسال: '+r.msg;
  loadAdmin();
});
$('#ad-pin').addEventListener('click',()=>showPin('change'));
$('#ad-best').addEventListener('click',()=>{if(confirm('تصفير لوحة أفضل النتائج على هذا الجهاز؟ لا يمكن التراجع.'))store.set('b01sim.best',[]);});
$('#ad-wipe').addEventListener('click',()=>{
  const a=sessions().filter(r=>r.status!=='open'),pend=a.filter(r=>!r.synced).length;
  if(!confirm('حذف '+nS(a.length)+' محفوظة على هذا الجهاز؟'+(pend?' منها '+pend+' لم تُرسل إلى Google Sheets وستضيع.':' كلها في Google Sheets وتبقى هناك.')+' لا يمكن التراجع.'))return;
  store.set(SESS,sess?[sess]:[]);loadAdmin();
});

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
  $('#h-ev').innerHTML=e.rows.map(([k,ok,d])=>'<li class="'+(ok?'':'no')+(S.evHi===k?' on':'')+'" data-k="'+k+'" tabindex="0" role="button" aria-pressed="'+(S.evHi===k)+'"><span class="mark" aria-hidden="true"></span><span><b>'+t(k)+'</b><span class="d">'+t(d)+'</span></span></li>').join('');
  const fb=$('#h-fb');fb.hidden=!tg.fb;fb.textContent=tg.fb?t(tg.fb):'';
  const closed=tg.state==='hand'||tg.state==='clear';
  $('#h-act').hidden=closed||!!tg.fb;$('#h-cont').hidden=!(closed||tg.fb);
  $('#d-cross').disabled=e.cons;
  requestAnimationFrame(drawSnip);
}
/* a detection pauses the mission; packages open one at a time */
/* the detection moment: a second of slow motion, the sonar fan flashes coral, the screen edge pulses, two pings, then the package */
function queueHand(tg,msg){
  releaseKeys();toast(t(msg),'hit');if(!S.pend.includes(tg))S.pend.push(tg);
  FX.slowT=1;FX.flashT=1.3;FX.bigPing=true;const bd=document.body;bd.classList.remove('det');void bd.offsetWidth;bd.classList.add('det');setTimeout(()=>bd.classList.remove('det'),1400);
  sfx('ping');setTimeout(()=>sfx('ping'),260);sfx('alert');
  if(!S.cur)setTimeout(()=>{if(S.mode==='play'){S.paused=true;nextHand();}},1000);
}
function nextHand(){
  if(S.cur||S.mode!=='play')return;const tg=S.pend.shift();if(!tg){S.paused=false;return;}
  S.cur=tg;tg.fb='';S.lastInput=performance.now();releaseKeys();S.evHi=S.evPin=null;renderHand();
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
  S.queue=[wide,E1,E2,resume];S.legFrom=[bt.x,bt.y];S.routeDone=false;S.goal=null;
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
  const best=store.get('b01sim.best',[]);const me={s:total,c:covPct,d:Date.now(),n:S.visitor||''};best.push(me);best.sort((a,b)=>b.s-a.s);const top=best.slice(0,5);store.set('b01sim.best',top);
  S.result={total,covPct,ok,real:S.real,top,me:me.d};noteMission();
  renderResults();$('#o-res').hidden=false;$('#b-rate').focus();showControls();updateHud(true);
}
function renderResults(){
  const R=S.result;if(!R)return;
  $('#r-score').textContent=R.total;$('#r-cov').textContent=R.covPct+'%';$('#r-ok').textContent=R.ok+'/'+S.tg.length;$('#r-time').textContent=fmt(R.real);
  const rows=[...S.tg].sort((a,b)=>(a.id||'T-99').localeCompare(b.id||'T-99'));
  $('#r-tg').innerHTML=rows.map(x=>{const dec=x.state==='hidden'?'dec_miss':x.dec?'dec_'+x.dec:'dec_none',good=!!x.dec&&x.dec===GOOD[x.kind];
    return '<li><span class="n">'+(x.id||'—')+'</span><span>'+t('k_'+x.kind)+'</span><span class="d">'+t(dec)+'</span><span class="'+(good?'ok':'bad')+'" role="img" aria-label="'+t(good?'r_right':'r_wrong')+'">'+(good?'✓':'✗')+'</span></li>';}).join('');
  const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  $('#r-who').textContent=S.visitor?t('visitor')+': '+S.visitor:'';
  $('#r-best').innerHTML='<li class="hd"><span></span><span>'+t('visitor')+'</span><span>'+t('score')+'</span><span>'+t('cov')+'</span></li>'+R.top.map((b,i)=>'<li class="'+(b.d===R.me?'me':'')+'"><span class="n">'+(i+1)+'</span><span>'+(b.n?esc(b.n):'—')+'</span><span class="n">'+b.s+'</span><span class="n">'+b.c+'%</span></li>').join('');
}

/* ---------------- simulation step ---------------- */
function steerAuto(){
  const b=S.boat;let P=S.queue.length?S.queue[0]:S.route[S.wp];
  if(!P){return null;}
  if(Math.hypot(P[0]-b.x,P[1]-b.y)<(S.goal&&S.queue.length===1?5:9)){S.legFrom=P;if(S.queue.length)S.queue.shift();else S.wp++;
    /* a point picked on the map: stop there and wait for the visitor */
    if(S.goal&&!S.queue.length){S.goal=null;S.auto=false;S.thr=0;$('#b-auto').setAttribute('aria-pressed','false');toast(t('arrived'));return {rud:0,v:0};}
    P=S.queue.length?S.queue[0]:S.route[S.wp];if(!P)return null;}
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
  /* the demo orbits above the vessel, and for 16 s of every minute glides underwater beside it */
  if((S.mode==='attract'||S.mode==='brief'||S.mode==='login')&&tt%60>44){const u=(tt%60-44)/16;
    want=bp.clone().addScaledVector(right,11).addScaledVector(fwd,-7+14*u).add(new THREE.Vector3(0,-3.6,0));look=bp.clone().addScaledVector(fwd,.5).add(new THREE.Vector3(0,-3.4,0));}
  else if(S.mode==='attract'||S.mode==='brief'||S.mode==='login'){const a=tt*.07;want=bp.clone().add(new THREE.Vector3(Math.cos(a)*13,3.4+1.2*Math.sin(tt*.13),Math.sin(a)*13));look=bp.clone().add(new THREE.Vector3(0,.7,0));}
  else if(S.cam==='under'){want=bp.clone().addScaledVector(right,11).addScaledVector(fwd,-4).add(new THREE.Vector3(0,-3.4,0));look=bp.clone().addScaledVector(fwd,1).add(new THREE.Vector3(0,-3.2,0));}
  else if(S.cam==='top'){want=bp.clone().add(new THREE.Vector3(0,120,40));look=bp.clone();}
  else if(S.cam==='side'){want=bp.clone().addScaledVector(right,9.5*(S.camSide||1)).addScaledVector(fwd,1.2).add(new THREE.Vector3(0,2.1,0));look=bp.clone().addScaledVector(fwd,.4).add(new THREE.Vector3(0,.8,0));}
  else{want=bp.clone().addScaledVector(fwd,-15).addScaledVector(right,5.5).add(new THREE.Vector3(0,5.8,0));look=bp.clone().addScaledVector(fwd,5).add(new THREE.Vector3(0,1.2,0));}
  /* the visitor's own camera: drag turns it around B01, the wheel zooms; 8 s after the last touch it eases back */
  if(S.mode==='play'&&CAMU.on){
    if(!CAMU.drag&&performance.now()-CAMU.last>8000){const f=clamp(dt*1.6,0,1);CAMU.yaw-=CAMU.yaw*f;CAMU.pitch-=CAMU.pitch*f;CAMU.zoom+=(1-CAMU.zoom)*f;
      if(Math.abs(CAMU.yaw)+Math.abs(CAMU.pitch)+Math.abs(CAMU.zoom-1)<.01)CAMU.on=false;}
    const off=want.clone().sub(look),L=off.length()||1,r=clamp(L*CAMU.zoom,6,60),az=Math.atan2(off.x,off.z)+CAMU.yaw,el=clamp(Math.asin(clamp(off.y/L,-1,1))+CAMU.pitch,-1.2,1.45);
    want=look.clone().add(new THREE.Vector3(Math.sin(az)*Math.cos(el)*r,Math.sin(el)*r,Math.cos(az)*Math.cos(el)*r));
  }
  const k=clamp(dt*(CAMU.drag?9:2.4),0,1);camPos.lerp(want,k);camLook.lerp(look,k);
  camera.position.copy(camPos);camera.lookAt(camLook);sky.position.copy(camera.position);
}
const CAMU={on:false,yaw:0,pitch:0,zoom:1,last:0,drag:null},cv3=renderer.domElement;
cv3.addEventListener('pointerdown',e=>{if(S.mode!=='play'||S.paused||e.button!==0)return;CAMU.drag={x:e.clientX,y:e.clientY};CAMU.on=true;CAMU.last=performance.now();cv3.setPointerCapture(e.pointerId);cv3.classList.add('grabbing');});
cv3.addEventListener('pointermove',e=>{if(!CAMU.drag)return;CAMU.yaw-=(e.clientX-CAMU.drag.x)*.006;CAMU.pitch=clamp(CAMU.pitch+(e.clientY-CAMU.drag.y)*.004,-.9,.9);
  CAMU.drag={x:e.clientX,y:e.clientY};CAMU.last=S.lastInput=performance.now();});
const camEnd=()=>{CAMU.drag=null;cv3.classList.remove('grabbing');};cv3.addEventListener('pointerup',camEnd);cv3.addEventListener('pointercancel',camEnd);
cv3.addEventListener('wheel',e=>{if(S.mode!=='play')return;e.preventDefault();CAMU.on=true;CAMU.zoom=clamp(CAMU.zoom*Math.exp(e.deltaY*.0012),.35,3.5);CAMU.last=S.lastInput=performance.now();},{passive:false});
cv3.addEventListener('dblclick',()=>{Object.assign(CAMU,{on:false,yaw:0,pitch:0,zoom:1});});

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
const mmCv=$('#mm'),MM={w:1,h:1,sc:1};
/* the map answers clicks: a detected target opens its file, any other point sends B01 there */
mmCv.addEventListener('pointerdown',e=>{
  if(S.mode!=='play'||S.paused)return;e.stopPropagation();S.lastInput=performance.now();
  const r=mmCv.getBoundingClientRect(),x=(e.clientX-r.left-MM.w/2)/MM.sc,y=(MM.h/2-(e.clientY-r.top))/MM.sc;
  for(const tg of S.tg){if(tg.state==='hidden'||tg.state==='open')continue;const [tx,ty]=tpos(tg,S.time);if(Math.hypot(tx-x,ty-y)*MM.sc<11){openTargetFile(tg);return;}}
  const b=S.boat;S.goal=[x,y];S.queue=[[x,y]];S.legFrom=[b.x,b.y];S.auto=true;S.thr=MAXV;S.routeDone=false;$('#b-auto').setAttribute('aria-pressed','true');toast(t('goto'));sfx('click');
});
function openTargetFile(tg){S.paused=true;releaseKeys();S.cur=tg;S.evHi=S.evPin=null;renderHand();$('#o-hand').hidden=false;$('#o-hand .card').scrollTop=0;$('#d-cont').focus({preventScroll:true});sfx('click');}
function drawMinimap(){
  const {ctx,w,h}=fitCanvas(mmCv);const m=RUN+12,sx=w/(AREA.x1-AREA.x0+2*m),sy=h/(AREA.y1-AREA.y0+2*m),sc=Math.min(sx,sy);
  const X=x=>w/2+x*sc,Y=y=>h/2-y*sc;MM.w=w;MM.h=h;MM.sc=sc;
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
  if(S.goal){const gx=X(S.goal[0]),gy=Y(S.goal[1]);ctx.strokeStyle='#8fd6cf';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(gx,gy,5,0,Math.PI*2);ctx.moveTo(gx-9,gy);ctx.lineTo(gx+9,gy);ctx.moveTo(gx,gy-9);ctx.lineTo(gx,gy+9);ctx.stroke();ctx.lineWidth=1;}
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
  if(S.evHi)drawEvHi(ctx,tg,U,Z,pxm,w,z0,ar);
}
/* the evidence the visitor points at, drawn in amber on the sonar slice */
function drawEvHi(ctx,tg,U,Z,pxm,w,z0,ar){
  const K=tg.kind,hk=S.evHi,o=tg.obs,n=o.length,two=n>=2&&o[n-1].t-o[0].t>=10;
  const cz=K==='mine'||K==='fish'?tg.d:DEPTH-(K==='wreck'?1.3:.45),cu=K==='unknown'?.3:0,rw=K==='wreck'?7.4:K==='fish'?3.4:K==='unknown'?1.6:.75,rh=K==='wreck'?1.7:K==='fish'?1.5:K==='unknown'?.8:.75;
  ctx.save();ctx.setLineDash([]);ctx.lineWidth=2.2;ctx.strokeStyle='#f2b84b';ctx.fillStyle='rgba(242,184,75,.16)';
  const say=(s,x,y,al)=>{ctx.save();ctx.font='600 12px "Readex Pro", Tahoma, sans-serif';ctx.direction=ar?'rtl':'ltr';ctx.textBaseline='middle';ctx.textAlign=al||'center';ctx.lineWidth=3;ctx.strokeStyle='rgba(4,11,18,.92)';ctx.fillStyle='#f2b84b';ctx.strokeText(s,x,y);ctx.fillText(s,x,y);ctx.restore();};
  const arrow=(x1,y1,x2,y2)=>{const a=Math.atan2(y2-y1,x2-x1);ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.moveTo(x2,y2);ctx.lineTo(x2-8*Math.cos(a-.45),y2-8*Math.sin(a-.45));ctx.moveTo(x2,y2);ctx.lineTo(x2-8*Math.cos(a+.45),y2-8*Math.sin(a+.45));ctx.stroke();};
  if(hk==='ev_shape'){ctx.beginPath();ctx.ellipse(U(cu),Z(cz),rw*pxm+6,rh*pxm+6,0,0,Math.PI*2);ctx.fill();ctx.stroke();}
  else if(hk==='ev_pos'){const top=K==='fish'?z0:cz,bot=K==='fish'?cz:DEPTH,x=U(cu)+rw*pxm+18;arrow(x,Z((top+bot)/2),x,Z(top)+1);arrow(x,Z((top+bot)/2),x,Z(bot)-1);
    say(t(K==='fish'?'hl_depth':tg.bed?'hl_bed':'hl_above'),x+8,Z((top+bot)/2),'left');}
  else if(hk==='ev_bg'){ctx.setLineDash([6,4]);ctx.beginPath();ctx.moveTo(0,Z(DEPTH));ctx.lineTo(w,Z(DEPTH));ctx.stroke();ctx.setLineDash([]);say(t(K==='wreck'?'hl_bg_old':'hl_bg_new'),w/2,Z(DEPTH)-14);}
  else if(hk==='ev_shadow'){if(tg.shadow){const x0=U(cu)+rw*pxm,x1=x0+4.5*pxm;ctx.fillStyle='rgba(242,184,75,.22)';ctx.fillRect(x0,Z(DEPTH-.4),x1-x0,Z(DEPTH+1.2)-Z(DEPTH-.4));ctx.strokeRect(x0,Z(DEPTH-.4),x1-x0,Z(DEPTH+1.2)-Z(DEPTH-.4));say(t('hl_shadow'),(x0+x1)/2,Z(DEPTH-.4)-12);}
    else say(t('hl_noshadow'),U(0),Z(DEPTH)-16);}
  else if(hk==='ev_move'){if(!two){say(t('hl_need'),U(cu),Z(cz)-rh*pxm-16);}
    else{const d=K==='fish'?2.6:K==='mine'?.45:0;if(d){ctx.globalAlpha=.55;ctx.beginPath();ctx.arc(U(cu-d),Z(cz),Math.max(5,rh*pxm*.7),0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;arrow(U(cu-d)+6,Z(cz)-rh*pxm-8,U(cu+d)-6,Z(cz)-rh*pxm-8);}
      say(t(K==='fish'?'hl_free':K==='mine'?'hl_sway':'hl_still'),U(cu),Z(cz)-rh*pxm-24);}}
  else if(hk==='ev_cons'){const ax=26,ay=24;arrow(ax-14,ay,ax+18,ay);say(t('hl_h1'),ax+24,ay,'left');
    if(new Set(o.map(q=>q.axis)).size>=2){arrow(ax,ay+12,ax,ay+42);say(t('hl_h2'),ax+10,ay+30,'left');}}
  ctx.restore();
}
const setEvHi=k=>{if(S.evHi===k)return;S.evHi=k;document.querySelectorAll('#h-ev li').forEach(li=>{const on=li.dataset.k===k;li.classList.toggle('on',on);li.setAttribute('aria-pressed',String(on));});requestAnimationFrame(drawSnip);};
$('#h-ev').addEventListener('click',e=>{const li=e.target.closest('li');if(!li)return;sfx('click');S.evPin=S.evPin===li.dataset.k?null:li.dataset.k;setEvHi(S.evPin);});
$('#h-ev').addEventListener('pointerover',e=>{const li=e.target.closest('li');if(li)setEvHi(li.dataset.k);});
$('#h-ev').addEventListener('pointerleave',()=>setEvHi(S.evPin||null));
$('#h-ev').addEventListener('focusin',e=>{const li=e.target.closest('li');if(li)setEvHi(li.dataset.k);});
$('#h-ev').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){const li=e.target.closest('li');if(li){e.preventDefault();e.stopPropagation();li.click();}}});

/* ---------------- buoyancy: the vessel floats on the waves ----------------
   Twelve points on the hull bottom each feel how deep they sit in the local wave (Archimedes, per point).
   The sum gives heave, pitch and roll with inertia and water damping; speed trims the bow up a little,
   and turning heels the vessel outward. The survey track (x, y, heading) still comes from the helm. */
const PH={y:.05,vy:0,p:0,vp:0,r:0,vr:0};
const HULLPTS=[[-3.5,-1],[-3.5,0],[-3.5,1],[-1.2,-1.05],[-1.2,0],[-1.2,1.05],[1.2,-1],[1.2,0],[1.2,1],[3.4,-.55],[3.4,0],[3.4,.55]];
const GRAV=9.81,DRAFT=.55,BK=GRAV/(HULLPTS.length*DRAFT),HB=-.6,IP=5.9,IR=.9;
function buoyancy(dt,tt,b,bp){
  const sh=Math.sin(b.h),ch=Math.cos(b.h),n=Math.max(1,Math.ceil(dt*120)),h=dt/n,vn=b.v/MAXV;
  for(let s=0;s<n;s++){
    let F=0,TP=0,TR=0;const sp=Math.sin(PH.p),sr=Math.sin(PH.r);
    for(const [xi,zi] of HULLPTS){
      const wx=bp.x+sh*xi+ch*zi,wz=bp.z-ch*xi+sh*zi,yi=PH.y+xi*sp-zi*sr+HB,f=BK*clamp(waveH(wx,wz,tt)-yi,0,1.5);
      F+=f;TP+=f*xi;TR-=f*zi;
    }
    TP+=4.2*vn;TR-=.55*(b.r/MAXYAW)*vn;
    PH.vy+=(F-GRAV-2.4*PH.vy)*h;PH.y+=PH.vy*h;
    PH.vp+=(TP/IP-2.6*PH.vp)*h;PH.p=clamp(PH.p+PH.vp*h,-.35,.35);
    PH.vr+=(TR/IR-2.2*PH.vr)*h;PH.r=clamp(PH.r+PH.vr*h,-.35,.35);
  }
}
/* the moored mine's tether: a rope of linked points from the anchor on the seabed to the mine, moved by a slow current */
function updateRope(o,ax,az,mp,dt,tt){
  const R=o.ropeState||(o.ropeState={p:[],q:[]}),top=[mp.x,mp.y-.55,mp.z],bot=[ax,-DEPTH+.4,az],P=R.p,Q=R.q;
  if(!P.length)for(let i=0;i<=ROPE_N;i++){const f=i/ROPE_N,v=[bot[0]+(top[0]-bot[0])*f,bot[1]+(top[1]-bot[1])*f,bot[2]+(top[2]-bot[2])*f];P.push(v.slice());Q.push(v.slice());}
  const seg=Math.hypot(top[0]-bot[0],top[1]-bot[1],top[2]-bot[2])*1.015/ROPE_N,h2=Math.min(dt,.05)**2,cx=.5*Math.sin(tt*.21),cz=.35*Math.cos(tt*.17);
  for(let i=1;i<ROPE_N;i++){const p=P[i],q=Q[i],f=i/ROPE_N;for(let k=0;k<3;k++){const v=(p[k]-q[k])*.94;q[k]=p[k];p[k]+=v+(k===0?cx*f:k===2?cz*f:-.4)*h2;}}
  P[0]=bot.slice();P[ROPE_N]=top.slice();
  for(let it=0;it<10;it++)for(let i=0;i<ROPE_N;i++){const a=P[i],c=P[i+1],dx=c[0]-a[0],dy=c[1]-a[1],dz=c[2]-a[2],d=Math.hypot(dx,dy,dz)||1e-6,e=(d-seg)/d*.5;
    if(i>0){a[0]+=dx*e;a[1]+=dy*e;a[2]+=dz*e;}if(i+1<ROPE_N){c[0]-=dx*e;c[1]-=dy*e;c[2]-=dz*e;}}
  const arr=o.rope.geometry.attributes.position.array;P.forEach((v,i)=>{arr[i*3]=v[0];arr[i*3+1]=v[1];arr[i*3+2]=v[2];});o.rope.geometry.attributes.position.needsUpdate=true;
  o.anchor.position.set(ax,-DEPTH+.2,az);
}

/* ---------------- main loop ---------------- */
let last=performance.now(),wcdT=0,mmT=0,fpsAcc=0,fpsN=0,fpsChecked=false,startT=performance.now();
const v3=new THREE.Vector3();
function frame(now){
  const dt=Math.min(.05,(now-last)/1000);last=now;const tt=now/1000;
  /* time compression: several fixed sub-steps per frame, so turns and detection behave the same at any speed */
  if(FX.slowT>0)FX.slowT-=dt;
  if((S.mode==='attract'||S.mode==='play')&&!S.paused){const sd=dt*S.k*(FX.slowT>0?.2:1),n=Math.max(1,Math.ceil(sd*30));for(let i=0;i<n&&!S.paused&&(S.mode==='attract'||S.mode==='play');i++)step(sd/n);}
  else if((S.mode==='brief'||S.mode==='login')&&S.auto)step(dt);
  if(S.mode==='attract'){S.capT+=dt;if(S.capT>6.5){S.capT=0;S.capIdx=(S.capIdx+1)%6;$('#cap-text').textContent=t('a'+(S.capIdx+1));}}
  /* back to the attract demo after 60 s without input, on any screen; a mission running on autopilot is left to finish */
  else if(!(S.mode==='play'&&S.auto&&!S.paused)&&now-S.lastInput>IDLE_MS)toAttract();
  const b=S.boat,bp=W(b.x,b.y,0);
  buoyancy(dt,tt,b,bp);
  b01.position.set(bp.x,PH.y,bp.z);b01.rotation.set(0,0,0);b01.rotateY(Math.PI/2-b.h);b01.rotateZ(PH.p);b01.rotateX(PH.r);
  const ud=b01.userData;ud.turret.rotation.y=Math.sin(tt*.32)*1.05;ud.whipPivot.rotation.x=-PH.vr*.05+Math.sin(tt*2.3)*.025;ud.whipPivot.rotation.z=-PH.vp*.05-b.v*.012;
  ud.props.forEach((p,i)=>{p.rotation.x+=(i?1:-1)*dt*(3+b.v*14);});
  sun.position.set(bp.x-16,22,bp.z+9);sun.target.position.copy(bp);
  updateOcean(tt,bp.x,bp.z);updateCamera(dt,tt);updateFx(dt,tt,b,bp);updatePings(dt,tt,bp);
  const fl=FX.flashT>0?clamp((FX.flashT-=dt)/1.3,0,1):0;ud.fan[0].material.color.setHex(0x8fd6cf).lerp(CORAL,fl);ud.fan[0].material.opacity=.2+.3*fl;
  if(AUDIO)AUDIO.update({v:b.v/MAXV,uw:FX.uw,mode:S.mode,paused:S.paused});
  for(const tg of S.tg){const o=T3[tg.kind],[px,py]=tpos(tg,S.time);o.g.position.copy(W(px,py,o.y));o.ring.position.copy(W(px,py,1.1));if(o.ring.visible)o.ring.rotation.z=tt*.6;
    if(tg.kind==='mine'){o.g.position.y=o.y+Math.sin(tt*.8)*.15;const g0=W(tg.x,tg.y,0);updateRope(o,g0.x,g0.z,o.g.position,dt,tt);}
    if(o.fish)o.fish.forEach(f=>{const a=f.a+tt*f.s;f.p.position.set(Math.cos(a)*f.rad,f.h+Math.sin(tt*.9+f.a)*.15,Math.sin(a)*f.rad);v3.set(-Math.sin(a),0,Math.cos(a));f.p.rotation.y=Math.atan2(-v3.z,v3.x);});}
  renderer.render(scene,camera);
  updateHud(false);
  if(now-mmT>140){mmT=now;drawMinimap();}
  if(now-wcdT>250){wcdT=now;drawWCD();}
  if(!fpsChecked){fpsAcc+=dt;fpsN++;if(now-startT>4000){const fps=fpsN/fpsAcc;fpsChecked=true;if(fps<45&&pixelRatio>1){pixelRatio=1;renderer.setPixelRatio(1);}if(fps<38)sun.castShadow=false;if(fps<32)oceanSkip=true;}}
  requestAnimationFrame(frame);
}
addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();});
/* test hook: advance the simulation without animation frames (used for checks while the window is hidden) */
window.__b01={S,decide,startPlay,toAttract,openBrief,ev,timeSel,setTime,drawFlag,drawEmblem,openLogin,doLogin,openFeedback,FB,setStars,sessions,syncNow,openAdminGate,pinGo,loadAdmin,AD,human,PH,FX,CAMU,
  get wake(){const c=wkGeo.attributes.color.array;return {n:wakePts.length,count:wkGeo.drawRange.count,alpha:[3,7,11,15,35,39,43,47,203,207].map(i=>+c[i].toFixed(2))};},
  phys(sec,v){const b=S.boat,bp=W(b.x,b.y,0),out=[];let tt=performance.now()/1000;if(v!=null)b.v=v;for(let i=0;i<sec*60;i++){tt+=1/60;buoyancy(1/60,tt,b,bp);if(i%30===29)out.push([PH.y.toFixed(2),(PH.p*57.3).toFixed(1),(PH.r*57.3).toFixed(1)].join('/'));}return out.join(' ');},
  get sess(){return sess;},
  advance(sec,dt){dt=dt||1/30;const n=Math.round(sec/dt);for(let i=0;i<n;i++){if(!S.paused&&(S.mode==='attract'||S.mode==='play'))step(dt);}
    updateCamera(1,performance.now()/1000);last=performance.now();frame(performance.now());updateHud(true);drawMinimap();drawWCD();
    return {mode:S.mode,time:+S.time.toFixed(1),real:+S.real.toFixed(1),x:+S.boat.x.toFixed(1),y:+S.boat.y.toFixed(1),cov:Math.round(S.covPct*100),covA:Math.round(S.covA*100),covB:Math.round(S.covB*100),
      tg:S.tg.map(x=>x.kind+':'+x.state+(x.id?'('+x.id+')':'')).join(' '),cur:S.cur&&S.cur.kind,pend:S.pend.length,paused:S.paused,wp:S.wp,routeDone:S.routeDone};}};

resetScenario('attract');applyLang();toAttract();syncSoon();
/* redraw the hull decals once the web fonts arrive (Amiri for the flag is fetched only when asked for) */
const redrawDecals=()=>decals.forEach(d=>{d.draw(d.cv.getContext('2d'));d.tex.needsUpdate=true;});
if(document.fonts&&document.fonts.ready){document.fonts.ready.then(()=>{redrawDecals();applyLang();});
  if(document.fonts.load)document.fonts.load('700 40px "Amiri"',SHAHADA).then(redrawDecals,()=>{});}
requestAnimationFrame(frame);
