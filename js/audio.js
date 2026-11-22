/* B01 sound.
   Off by default. While it is off no audio context exists, so the browser never opens the sound output:
   an open output, even a silent one, made the speakers of a team laptop hiss.
   When it is on, the output opens with the first click or key (browsers allow sound only after one),
   sleeps after two seconds with nothing to hear or while the page is hidden, and closes completely when
   sound is turned off.
   The sea is a natural recording (sounds/sea.wav; source and licence in sounds/CREDITS.md). Underwater, the
   same recording plays slower and muffled. The motor is a soft electric hum made here, because B01 surveys on
   quiet hybrid propulsion. The short sounds are made here too. A missing recording is simply silent. */

const SEA='sounds/sea.wav';
const SLEEP_MS=2000;

/* the output chain for one audio context: everything passes a gentle compressor and a limiter,
   so no sound can come out harsh */
function chain(c,vol){
  const out=c.createGain();out.gain.value=vol*.9;
  const comp=c.createDynamicsCompressor();comp.threshold.value=-20;comp.knee.value=10;comp.ratio.value=6;comp.attack.value=.004;comp.release.value=.25;
  const lim=c.createDynamicsCompressor();lim.threshold.value=-4;lim.knee.value=0;lim.ratio.value=20;lim.attack.value=.001;lim.release.value=.1;
  /* underwater, a low-pass filter muffles everything, the way sound reaches you under the surface */
  const muffle=c.createBiquadFilter();muffle.type='lowpass';muffle.frequency.value=16000;muffle.Q.value=.5;
  const dry=c.createGain();
  muffle.connect(comp);dry.connect(comp);comp.connect(lim);lim.connect(out);out.connect(c.destination);
  /* the vessel's own sounds come from the vessel: a panner placed where B01 is, seen from the camera */
  const pan=c.createPanner();pan.panningModel='equalpower';pan.distanceModel='inverse';pan.refDistance=10;pan.rolloffFactor=.7;pan.maxDistance=500;
  pan.connect(muffle);
  /* the sonar's echo: one short delay with a little feedback */
  const echo=c.createGain(),dl=c.createDelay(1),fb=c.createGain(),wet=c.createGain();
  dl.delayTime.value=.34;fb.gain.value=.26;wet.gain.value=.22;echo.connect(dl);dl.connect(fb);fb.connect(dl);dl.connect(wet);wet.connect(pan);
  /* the sea above water, and the same recording slower and darker underwater */
  const beds={};for(const k of ['sea','under','motor']){const g=c.createGain();g.gain.value=0;beds[k]={g,src:null,level:0};}
  beds.sea.g.connect(muffle);
  const deep=c.createBiquadFilter();deep.type='lowpass';deep.frequency.value=500;deep.Q.value=.4;beds.under.g.connect(deep);deep.connect(muffle);
  /* the motor: a soft electric hum from the vessel, a low tone and its octave with a faint whine on top,
     a slow wobble so it never sounds static; its pitch rises with speed */
  const hum=c.createBiquadFilter();hum.type='lowpass';hum.frequency.value=1100;hum.Q.value=.7;hum.connect(beds.motor.g);beds.motor.g.connect(pan);
  const osc=[['sine',1,1],['sine',2,.35],['triangle',9,.035]].map(([type,mul,amp])=>{const o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.value=90*mul;g.gain.value=amp;o.connect(g);g.connect(hum);o.start();return {o,mul};});
  const lfo=c.createOscillator(),lfoG=c.createGain();lfo.frequency.value=5.3;lfoG.gain.value=1.1;lfo.connect(lfoG);lfoG.connect(osc[0].o.frequency);lfo.start();
  beds.motor.osc=osc;beds.motor.src=true;
  return {c,out,muffle,dry,pan,echo,beds,busy:0};
}

/* ---- voices made in code; each gets the chain and the start time ---- */
function tone(n,t,o){
  const c=n.c,osc=c.createOscillator(),g=c.createGain(),a=o.a||.005,d=o.d||.5,peak=o.peak||.1;
  osc.type=o.type||'sine';osc.frequency.setValueAtTime(o.f,t);if(o.f2)osc.frequency.exponentialRampToValueAtTime(o.f2,t+a+d*.7);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+a);g.gain.exponentialRampToValueAtTime(.0001,t+a+d);
  osc.connect(g);g.connect(o.to==='pan'?n.pan:o.to==='dry'?n.dry:n.muffle);if(o.echo)g.connect(n.echo);
  osc.start(t);osc.stop(t+a+d+.05);n.busy=Math.max(n.busy,t+a+d+(o.echo?1.6:.3));
}
/* sonar ping: a short tone that glides down a little and rings out, with its echo */
function ping(n,t,lvl){tone(n,t,{f:1180,f2:1080,peak:.16*lvl,a:.004,d:.75,to:'pan',echo:true});tone(n,t,{f:2360,f2:2160,peak:.03*lvl,a:.003,d:.3,to:'pan'});}
const VOICES={
  ping:(n,t)=>ping(n,t,.45),
  /* a detection: two pings, then two calm notes */
  detect:(n,t)=>{ping(n,t,1);ping(n,t+.26,1);tone(n,t+.55,{type:'triangle',f:740,peak:.07,a:.02,d:.45});tone(n,t+.76,{type:'triangle',f:988,peak:.07,a:.02,d:.6});},
  confirm:(n,t)=>{tone(n,t,{f:587,peak:.08,a:.008,d:.18});tone(n,t+.11,{f:880,peak:.08,a:.008,d:.3});},
  cross:(n,t)=>{ping(n,t,.6);ping(n,t+.2,.6);},
  click:(n,t)=>tone(n,t,{f:2000,peak:.08,a:.003,d:.05,to:'dry'}),
  on:(n,t)=>{tone(n,t,{f:660,peak:.06,a:.01,d:.15,to:'dry'});tone(n,t+.09,{f:990,peak:.06,a:.01,d:.22,to:'dry'});},
  done:(n,t)=>{[523,659,784].forEach((f,i)=>tone(n,t+i*.07,{f,peak:.05,a:.03,d:1.2}));},
  /* bubbles: short tones that rise quickly, scattered over most of a second */
  bubbles:(n,t)=>{for(let i=0;i<9;i++){const f=300+Math.random()*520;tone(n,t+Math.random()*.8,{f,f2:f*1.9,peak:.025+Math.random()*.035,a:.004,d:.04+Math.random()*.05,to:'dry'});}}
};

export function createAudio(){
  let N=null,want=false,vol=.8,lastUw=false,quietSince=0,hidden=document.hidden;
  const bufs={};

  /* the sea recording feeds two looping beds: as recorded above water, and at 55 % speed underwater */
  function startSea(){
    const b=bufs.sea;if(!b||!N||N.beds.sea.src)return;
    for(const [k,rate] of [['sea',1],['under',.55]]){const s=N.c.createBufferSource();s.buffer=b;s.loop=true;s.playbackRate.value=rate;s.connect(N.beds[k].g);
      s.start(N.c.currentTime+.02,Math.random()*b.duration*.9);N.beds[k].src=s;}
  }
  /* the recording is fetched only once sound is on; the decoded buffer is kept for the next time */
  function load(){
    const n=N;if(bufs.sea){startSea();return;}
    fetch(SEA).then(r=>r.ok?r.arrayBuffer():null).then(ab=>ab?n.c.decodeAudioData(ab):null)
      .then(b=>{if(!b)return;bufs.sea=b;if(N===n)startSea();}).catch(()=>{});
  }
  function ensure(){
    if(!want||hidden)return;
    if(!N){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;N=chain(new AC({latencyHint:'balanced'}),vol);load();}
    else if(N.c.state==='suspended')N.c.resume();
    quietSince=0;
  }
  function play(name){
    if(!want||!VOICES[name])return;ensure();if(!N)return;quietSince=0;
    const n=N,go=()=>{if(N===n)VOICES[name](n,n.c.currentTime+.02);};
    if(n.c.state==='running')go();else n.c.resume().then(go,()=>{});
  }

  /* called by the game about ten times a second while sound is on */
  function update(st){
    if(!N)return;
    const n=N,t=n.c.currentTime,inPlay=st.mode==='play',calm=st.mode==='attract'||st.mode==='login'||st.mode==='brief',
      quiet=!inPlay&&!calm,duck=inPlay&&st.paused?.5:1,v=Math.max(0,Math.min(1,st.v||0));
    const L={sea:quiet?0:(st.uw?.08:calm?.16:.3)*duck,motor:inPlay?(.05+.17*v)*duck*(st.uw?.7:1):0,under:quiet?0:(st.uw?.34:0)*duck};
    for(const k in L){const b=n.beds[k];if(Math.abs(b.level-L[k])>.003){b.g.gain.setTargetAtTime(L[k],t,.4);b.level=L[k];}}
    const f0=78+62*v;n.beds.motor.osc.forEach(x=>x.o.frequency.setTargetAtTime(f0*x.mul,t,.3));
    n.muffle.frequency.setTargetAtTime(st.uw?700:16000,t,.2);
    if(st.uw&&!lastUw&&inPlay)play('bubbles');lastUw=!!st.uw;
    const p=st.vessel;if(p){const P=n.pan;if(P.positionX){P.positionX.setTargetAtTime(p.x,t,.05);P.positionY.setTargetAtTime(p.y,t,.05);P.positionZ.setTargetAtTime(p.z,t,.05);}else P.setPosition(p.x,p.y,p.z);}
    /* sleep when there has been nothing to hear for two seconds */
    const audible=t<n.busy||Object.keys(L).some(k=>L[k]>.001&&n.beds[k].src);
    if(audible){quietSince=0;if(n.c.state==='suspended'&&!hidden)n.c.resume();}
    else if(!quietSince)quietSince=performance.now();
    else if(performance.now()-quietSince>SLEEP_MS&&n.c.state==='running')n.c.suspend();
  }
  function on(gesture){want=true;if(gesture)ensure();}
  /* off: the output closes completely */
  function off(){
    want=false;if(!N)return;const n=N;N=null;quietSince=0;
    try{n.out.gain.setTargetAtTime(0,n.c.currentTime,.03);}catch(e){}
    setTimeout(()=>{n.c.close().catch(()=>{});},180);
  }
  document.addEventListener('visibilitychange',()=>{hidden=document.hidden;if(!N)return;if(hidden){if(N.c.state==='running')N.c.suspend();}else quietSince=0;});
  return {on,off,play,update,
    gesture(){if(want)ensure();},
    setVolume(x){vol=Math.max(0,Math.min(1,x));if(N)N.out.gain.setTargetAtTime(vol*.9,N.c.currentTime,.05);},
    get active(){return !!N;},
    state(){return {want,ctx:N?N.c.state:'none',loaded:Object.keys(bufs),beds:N?Object.fromEntries(Object.entries(N.beds).map(([k,b])=>[k,+b.level.toFixed(3)])):{},vol};},
    /* for tests: render one voice offline, through the same chain, and report its loudest sample */
    async render(name,sec){
      const sr=44100,oc=new OfflineAudioContext(1,Math.ceil(sr*(sec||2.5)),sr),n=chain(oc,vol);
      VOICES[name](n,.01);const b=await oc.startRendering(),d=b.getChannelData(0);let peak=0,nan=false;
      for(let i=0;i<d.length;i++){const x=Math.abs(d[i]);if(x!==x)nan=true;else if(x>peak)peak=x;}
      return {peak:+peak.toFixed(3),nan};
    }};
}
