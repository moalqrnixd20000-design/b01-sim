/* B01 sound: natural beds only, no tones, beeps or melodies.
   Off by default. While it is off no audio context exists, so the browser never opens the sound output:
   an open output, even a silent one, made the speakers of a team laptop hiss.
   When it is on, the output opens with the first click or key (browsers allow sound only after one),
   sleeps after two seconds with nothing to hear or while the page is hidden, and closes completely when
   sound is turned off.
   - The sea is a natural recording (sounds/sea.wav; source and licence in sounds/CREDITS.md).
   - Underwater, the same recording plays slower and muffled.
   - The motor is a low, steady electric hum made here, because B01 surveys on quiet hybrid propulsion.
   The team asked for no musical sounds, so there are no sonar pings, alerts or button tones: a detection
   shows on screen only. A missing recording is simply silent. */

const SEA='sounds/sea.wav';
const SLEEP_MS=2000;

/* the output chain for one audio context: a gentle compressor and a limiter, so nothing can come out harsh */
function chain(c,vol){
  const out=c.createGain();out.gain.value=vol*.9;
  const comp=c.createDynamicsCompressor();comp.threshold.value=-20;comp.knee.value=10;comp.ratio.value=6;comp.attack.value=.004;comp.release.value=.25;
  const lim=c.createDynamicsCompressor();lim.threshold.value=-4;lim.knee.value=0;lim.ratio.value=20;lim.attack.value=.001;lim.release.value=.1;
  /* underwater, a low-pass filter muffles everything, the way sound reaches you under the surface */
  const muffle=c.createBiquadFilter();muffle.type='lowpass';muffle.frequency.value=16000;muffle.Q.value=.5;
  muffle.connect(comp);comp.connect(lim);lim.connect(out);out.connect(c.destination);
  /* the motor comes from the vessel: a panner placed where B01 is, seen from the camera */
  const pan=c.createPanner();pan.panningModel='equalpower';pan.distanceModel='inverse';pan.refDistance=10;pan.rolloffFactor=.7;pan.maxDistance=500;
  pan.connect(muffle);
  /* the sea above water, and the same recording slower and darker underwater */
  const beds={};for(const k of ['sea','under','motor']){const g=c.createGain();g.gain.value=0;beds[k]={g,src:null,level:0};}
  beds.sea.g.connect(muffle);
  const deep=c.createBiquadFilter();deep.type='lowpass';deep.frequency.value=500;deep.Q.value=.4;beds.under.g.connect(deep);deep.connect(muffle);
  /* the motor: a low steady hum and its octave, softened by a low-pass; its pitch rises a little with speed */
  const hum=c.createBiquadFilter();hum.type='lowpass';hum.frequency.value=600;hum.Q.value=.5;hum.connect(beds.motor.g);beds.motor.g.connect(pan);
  const osc=[[1,1],[2,.3]].map(([mul,amp])=>{const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.value=80*mul;g.gain.value=amp;o.connect(g);g.connect(hum);o.start();return {o,mul};});
  beds.motor.osc=osc;beds.motor.src=true;
  return {c,out,muffle,pan,beds};
}
/* how loud each bed is in each part of the game */
function levels(st){
  const inPlay=st.mode==='play',calm=st.mode==='attract'||st.mode==='login'||st.mode==='brief',quiet=!inPlay&&!calm,
    duck=inPlay&&st.paused?.5:1,v=Math.max(0,Math.min(1,st.v||0));
  return {v,L:{sea:quiet?0:(st.uw?.08:calm?.16:.3)*duck,motor:inPlay?(.015+.045*v)*duck*(st.uw?.7:1):0,under:quiet?0:(st.uw?.34:0)*duck}};
}

export function createAudio(){
  let N=null,want=false,vol=.8,quietSince=0,hidden=document.hidden;
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
    else if(N.c.state==='suspended')N.c.resume().catch(()=>{});
    quietSince=0;
  }

  /* called by the game about ten times a second while sound is on */
  function update(st){
    if(!N)return;
    const n=N,t=n.c.currentTime,{v,L}=levels(st);
    for(const k in L){const b=n.beds[k];if(Math.abs(b.level-L[k])>.003){b.g.gain.setTargetAtTime(L[k],t,.4);b.level=L[k];}}
    const f0=74+40*v;n.beds.motor.osc.forEach(x=>x.o.frequency.setTargetAtTime(f0*x.mul,t,.4));
    n.muffle.frequency.setTargetAtTime(st.uw?700:16000,t,.2);
    const p=st.vessel;if(p){const P=n.pan;if(P.positionX){P.positionX.setTargetAtTime(p.x,t,.05);P.positionY.setTargetAtTime(p.y,t,.05);P.positionZ.setTargetAtTime(p.z,t,.05);}else P.setPosition(p.x,p.y,p.z);}
    /* sleep when there has been nothing to hear for two seconds */
    const audible=Object.keys(L).some(k=>L[k]>.001&&n.beds[k].src);
    if(audible){quietSince=0;if(n.c.state==='suspended'&&!hidden)n.c.resume().catch(()=>{});}
    else if(!quietSince)quietSince=performance.now();
    else if(performance.now()-quietSince>SLEEP_MS&&n.c.state==='running')n.c.suspend().catch(()=>{});
  }
  function on(gesture){want=true;if(gesture)ensure();}
  /* off: the output closes completely */
  function off(){
    want=false;if(!N)return;const n=N;N=null;quietSince=0;
    try{n.out.gain.setTargetAtTime(0,n.c.currentTime,.03);}catch(e){}
    setTimeout(()=>{n.c.close().catch(()=>{});},180);
  }
  document.addEventListener('visibilitychange',()=>{hidden=document.hidden;if(!N)return;if(hidden){if(N.c.state==='running')N.c.suspend().catch(()=>{});}else quietSince=0;});
  return {on,off,update,
    gesture(){if(want)ensure();},
    setVolume(x){vol=Math.max(0,Math.min(1,x));if(N)N.out.gain.setTargetAtTime(vol*.9,N.c.currentTime,.05);},
    get active(){return !!N;},
    state(){return {want,ctx:N?N.c.state:'none',loaded:Object.keys(bufs),beds:N?Object.fromEntries(Object.entries(N.beds).map(([k,b])=>[k,+b.level.toFixed(3)])):{},vol};},
    /* for tests: render the motor at a speed (0 to 1) offline, through the same chain, and report its loudest sample */
    async renderMotor(v,sec){
      const sr=44100,oc=new OfflineAudioContext(1,Math.ceil(sr*(sec||1)),sr),n=chain(oc,vol),{L}=levels({mode:'play',v});
      n.beds.motor.g.gain.value=L.motor;n.beds.motor.osc.forEach(x=>x.o.frequency.value=(74+40*v)*x.mul);
      const b=await oc.startRendering(),d=b.getChannelData(0);let peak=0;for(let i=0;i<d.length;i++)peak=Math.max(peak,Math.abs(d[i]));
      return +peak.toFixed(3);
    }};
}
