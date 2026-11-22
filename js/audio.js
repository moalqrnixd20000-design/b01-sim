/* B01 simulator sound: plays the team's own recordings from sounds/ (see sounds/README.md).
   A missing file is simply silent, so the game works the same before the recordings arrive.
   Browsers allow sound only after the first click or key on the page; the game creates this then. */

/* looping beds: they never stop, only their levels move with speed, depth and the screen */
const LOOPS=['sea-waves','wind','motor','hull-water','underwater'];
/* one-shot sounds */
const SHOTS=['sonar-ping','bubbles','alert','click','confirm'];
const SHOT_GAIN={'sonar-ping':.8,bubbles:.6,alert:.7,click:.25,confirm:.5};

export function createAudio(base){
  const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return null;
  const ctx=new AC(),master=ctx.createGain(),lowpass=ctx.createBiquadFilter();
  lowpass.type='lowpass';lowpass.frequency.value=18000;master.gain.value=0;master.connect(lowpass);lowpass.connect(ctx.destination);
  /* the sonar's echo: a short feedback delay, stronger underwater */
  const delay=ctx.createDelay(1.5),fb=ctx.createGain(),wet=ctx.createGain();
  delay.delayTime.value=.42;fb.gain.value=.32;wet.gain.value=.12;delay.connect(fb);fb.connect(delay);delay.connect(wet);wet.connect(master);
  const buf={},loops={};let muted=false,vol=.8,uw=false,levels={};

  const load=async n=>{try{const r=await fetch(base+n+'.mp3');if(!r.ok)return null;return await ctx.decodeAudioData(await r.arrayBuffer());}catch(e){return null;}};
  LOOPS.forEach(n=>load(n).then(b=>{if(!b)return;buf[n]=b;const s=ctx.createBufferSource(),g=ctx.createGain();s.buffer=b;s.loop=true;g.gain.value=0;s.connect(g);g.connect(master);s.start();loops[n]={s,g};}));
  SHOTS.forEach(n=>load(n).then(b=>{if(b)buf[n]=b;}));

  function play(name,o){
    o=o||{};const n=name==='ping'?'sonar-ping':name,b=buf[n];if(!b||ctx.state!=='running')return;
    const s=ctx.createBufferSource(),g=ctx.createGain();s.buffer=b;g.gain.value=(SHOT_GAIN[n]||.6)*(o.soft?.4:1);s.connect(g);g.connect(master);if(n==='sonar-ping')g.connect(delay);s.start();
  }
  /* called every frame by the game: v = speed 0..1, uw = camera underwater, mode and paused from the game */
  function update(st){
    const t=ctx.currentTime,calm=st.mode==='attract'||st.mode==='login'||st.mode==='brief',v=Math.max(0,Math.min(1,st.v||0));
    if(st.uw!==uw){uw=st.uw;if(uw)play('bubbles');}
    master.gain.setTargetAtTime(muted?0:vol*(calm?.5:1),t,.25);
    lowpass.frequency.setTargetAtTime(uw?650:18000,t,.25);
    wet.gain.setTargetAtTime(uw?.45:.12,t,.3);
    levels={'sea-waves':uw?.22:.55,wind:uw?0:.22,motor:(.1+.4*v)*(st.paused?.6:1)*(uw?.7:1),'hull-water':(uw?.25:.55)*v,underwater:uw?.6:0};
    for(const n in loops){loops[n].g.gain.setTargetAtTime(levels[n],t,.35);if(n==='motor')loops[n].s.playbackRate.setTargetAtTime(.8+.5*v,t,.3);}
  }
  return {play,update,
    resume(){if(ctx.state!=='running')ctx.resume();},
    setMuted(m){muted=!!m;},get muted(){return muted;},
    setVolume(x){vol=Math.max(0,Math.min(1,x));},
    loaded(){return Object.keys(buf);},levels(){return levels;}};
}
