import assert from 'node:assert/strict';
import { FacilityAudio, FacilityMotionSound, makeFacilitySample } from '../src/facilities/sound.ts';
import { makeTricycleRollSample, makeTricycleSqueakSample, TricycleRollAudio } from '../src/worlds/toy-track/facilities/tricycle/sound.ts';
import { SpatialAudio } from '../src/app/spatial-audio.ts';
import { GRASS_STEP_DURATION, GRASS_STEP_VARIANTS, makeGrassStepSample } from '../src/worlds/soccer/grass-step.ts';
import { SoccerAudio } from '../src/worlds/soccer/sound.ts';

// Minimal Web Audio graph: parameters record their latest scheduled value.
const audioParam=value=>({value,setTargetAtTime(next){this.value=next;},setValueAtTime(next){this.value=next;},cancelScheduledValues(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}});
const graphNode=()=>({connect(target){return target??this;},disconnect(){}});
const spatialNodes=context=>Object.assign(context,{
  listener:{positionX:audioParam(0),positionY:audioParam(0),positionZ:audioParam(0),forwardX:audioParam(0),forwardY:audioParam(0),forwardZ:audioParam(-1),upX:audioParam(0),upY:audioParam(1),upZ:audioParam(0)},
  createPanner(){return {...graphNode(),positionX:audioParam(0),positionY:audioParam(0),positionZ:audioParam(0)};},
  createBiquadFilter:context.createBiquadFilter??(()=>({...graphNode(),type:'lowpass',frequency:audioParam(350),Q:audioParam(1),gain:audioParam(0)})),
});
const identityCamera={matrixWorldInverse:{elements:[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]}};

const events=[],motion=new FacilityMotionSound(event=>events.push(event),{x:0,y:0,z:0});
for(let i=0;i<240;i++)motion.swing(1/240,0,0,false);
assert.equal(events.length,0,'stationary equipment is silent');
motion.reset();events.length=0;
for(let i=0;i<240*2;i++)motion.swing(1/240,.8,.018*Math.sin(i/240*8),false);
assert.equal(events.length,0,'a high seat held against the swing does not creak from speed jitter');
for(let i=0;i<240*6;i++) {
  const t=i/240;
  motion.swing(1/240,.7*Math.sin(4*t),2.8*Math.cos(4*t),true);
  const event=events.at(-1);
  if(event&&events.length!==motion.lastCount) {
    if(event.kind==='swing-creak')assert(Math.abs(Math.cos(4*t))<.025,'hinge sound coincides with a reversal');
    if(event.kind==='swing-air')assert(Math.abs(Math.sin(4*t))<.025,'air sound coincides with the fast bottom crossing');
    motion.lastCount=events.length;
  }
}
assert(events.filter(event=>event.kind==='swing-creak').length>=6);
assert(events.filter(event=>event.kind==='swing-air').length>=6);
assert(events.length<20,'no per-frame sound flood');
motion.reset();events.length=0;
motion.trampoline(.1,false,-.5,0,true);
motion.trampoline(.1,true,-.6,-.001,true);
motion.trampoline(.04,true,-.2,-.020,true);
motion.trampoline(.04,true,.1,-.018,true);
assert.deepEqual(events.map(event=>event.kind),['trampoline-land','trampoline-spring']);
for(let i=0;i<50;i++)motion.trampoline(1/240,true,0,-.01,false);
assert.equal(events.length,2,'empty trampoline does not generate landing sounds');

for(const kind of ['swing-creak','swing-air','trampoline-land','trampoline-spring']) {
  for(const sampleRate of [44100,48000]) {
    const data=makeFacilitySample(kind,0,sampleRate);
    assert(data.every(Number.isFinite));assert.equal(data[0],0);
    assert(Math.abs(data.at(-1))<.001,'tail fades without a click');
    assert.deepEqual(data,makeFacilitySample(kind,0,sampleRate),'samples are reproducible');
    assert.notDeepEqual(data,makeFacilitySample(kind,1,sampleRate),'variants avoid identical repetition');
    const peak=data.reduce((max,value)=>Math.max(max,Math.abs(value)),0);
    const mean=data.reduce((sum,value)=>sum+value,0)/data.length;
    assert(peak>.001&&peak<=.65,'bounded audible sample');assert(Math.abs(mean)<.01,'no significant DC offset');
  }
}

// Camera-relative spatialization shared by every effect.
{
  const context=spatialNodes({state:'running',currentTime:0,createGain:()=>({...graphNode(),gain:audioParam(1)})});
  const spatial=new SpatialAudio(context,graphNode());spatial.listen(identityCamera);
  const near=spatial.emitter({reference:.35}),normalized=spatial.emitter({reference:.35,normalizeAt:.3,maxGain:1.5});
  assert(Math.abs(near.gainAt(.35)-.5)<1e-9,'reference distance is the half-power point');
  assert(Math.abs(normalized.gainAt(.3)-1)<1e-9,'previously unattenuated sources keep unit gain at the default orbit');
  assert.equal(normalized.gainAt(0),1.5,'close-up boost is bounded');
  assert(normalized.gainAt(.42)<normalized.gainAt(.3)&&normalized.gainAt(1)<normalized.gainAt(.42),'gain falls monotonically with distance');
  const cutoff=emitter=>emitter.filter.frequency.value,pan=emitter=>emitter.panner.positionX.value;
  spatial.place(near,.2,0,0);assert(pan(near)>.5&&pan(near)<.95,'a source to the right pans right, softened');
  spatial.place(near,-.2,0,0);assert(pan(near)<-.5,'a source to the left pans left');
  spatial.place(near,0,0,-.3);const front=cutoff(near);
  spatial.place(near,0,0,.3);const rear=cutoff(near);
  assert(rear<front*.4,'sources behind the camera are head-shadowed');
  spatial.place(near,0,0,-2);assert(cutoff(near)<front*.65,'distant sources lose air');
  assert(spatial.distanceTo(0,.3,-.4)>.49&&spatial.distanceTo(0,.3,-.4)<.51);
  spatial.dispose();
}

let starts=0,stops=0,buffers=0;
const node=()=>({connect(target){return target??this;},disconnect(){},gain:audioParam(0),pan:audioParam(0)});
const ctx=spatialNodes({state:'running',currentTime:0,sampleRate:48000,
  createBuffer(_channels,length){buffers++;return {length,copyToChannel(){}};},
  createBufferSource(){return {...node(),start(){starts++;},stop(){stops++;this.onended?.();}};},
  createGain:node,
});
const facilitySpatial=new SpatialAudio(ctx,node());facilitySpatial.listen(identityCamera);
const audio=new FacilityAudio(ctx,facilitySpatial),event={kind:'trampoline-land',strength:.8,x:0,y:0,z:-.2};
audio.play(event);audio.play(event);assert.equal(starts,1,'catch-up substeps cannot stack the same sound');
audio.play({...event,kind:'swing-creak',z:-2});assert.equal(starts,1,'distant facilities are silent');
ctx.state='suspended';ctx.currentTime+=1;audio.play(event);assert.equal(starts,1,'suspended audio does not queue stale sounds');
ctx.state='running';
for(let i=0;i<20;i++){ctx.currentTime+=.2;audio.play(event);}
assert.equal(starts,6,'voice count is bounded');assert.equal(buffers,3,'PCM variants are cached');
audio.stop();assert.equal(stops,6,'mute/reset cleanup stops every active voice');
audio.dispose();

for(const sampleRate of [44100,48000]) {
  const data=makeTricycleRollSample(sampleRate),again=makeTricycleRollSample(sampleRate);
  assert.deepEqual(data,again,'tricycle rolling texture is deterministic');
  assert(data.every(Number.isFinite));
  const peak=data.reduce((max,value)=>Math.max(max,Math.abs(value)),0),mean=data.reduce((sum,value)=>sum+value,0)/data.length;
  assert(peak>.05&&peak<.4,'rolling source stays bounded before its quiet output gain');
  assert(Math.abs(mean)<.01,'rolling source has no meaningful DC offset');
  const squeak=makeTricycleSqueakSample(sampleRate);
  assert.equal(squeak.length,data.length);
  assert(squeak.every(Number.isFinite));
  assert(squeak.some(value=>Math.abs(value)>.01),'squeak has an audible source signal');
  assert(squeak.every(value=>Math.abs(value)<.19),'squeak source remains bounded before its quiet output gain');
  assert.equal(squeak[0],0);assert.equal(squeak.at(-1),0);
  assert(squeak.filter(value=>value===0).length>squeak.length*.75,'chirps leave generous silent gaps');
}

let rollStarts=0,rollStops=0,rollBuffers=0,sourceCalls=0,filterCalls=0,gainCalls=0,lastGain,lastSqueakGain,lastFilter,lastSqueakFilter,lastSource,lastSqueakSource;
const rollCtx=spatialNodes({state:'running',currentTime:0,sampleRate:48000,
  createBuffer(_channels,length){rollBuffers++;return {length,copyToChannel(){}};},
  createBufferSource(){sourceCalls++;const source={...graphNode(),buffer:null,loop:false,playbackRate:audioParam(1),start(){rollStarts++;},stop(){rollStops++;}};if(sourceCalls%2===1)lastSource=source;else lastSqueakSource=source;return source;},
  createGain(){gainCalls++;const gain={...graphNode(),gain:audioParam(0)};if(gainCalls%2===1)lastGain=gain;else lastSqueakGain=gain;return gain;},
});
const rollSpatial=new SpatialAudio(rollCtx,graphNode());
// The emitter's own input/filter/gain are created first; count only the loop layers.
filterCalls=0;gainCalls=0;
rollCtx.createBiquadFilter=()=>{filterCalls++;const filter={...graphNode(),type:'lowpass',frequency:audioParam(0),Q:audioParam(0)};if(filterCalls%2===1)lastFilter=filter;else lastSqueakFilter=filter;return filter;};
const roll=new TricycleRollAudio(rollCtx,rollSpatial);
gainCalls=0;filterCalls=0;
roll.update(0,0,0,-.2);assert.equal(rollStarts,0,'stationary tricycle does not start a loop');
roll.update(.17,0,0,-.2);assert.equal(rollStarts,2,'meaningful tricycle motion starts rolling and squeak loops together');
assert(lastGain.gain.value>0&&lastGain.gain.value<.05,'rolling layer remains intentionally quiet');
assert(lastSqueakGain.gain.value>0&&lastSqueakGain.gain.value<.11,'squeak layer is audible but subordinate');
const midRate=lastSource.playbackRate.value,midFrequency=lastFilter.frequency.value;
const midSqueakRate=lastSqueakSource.playbackRate.value,midSqueakFrequency=lastSqueakFilter.frequency.value;
rollCtx.currentTime+=.1;roll.update(.34,0,0,-.2);
assert(lastSource.playbackRate.value>midRate&&lastFilter.frequency.value>midFrequency,'speed raises rolling rate and spectral center');
assert(lastSqueakSource.playbackRate.value>midSqueakRate&&lastSqueakFilter.frequency.value>midSqueakFrequency,'speed raises squeak rate and spectral center');
roll.update(0,0,0,-.2);assert.equal(lastGain.gain.value,0,'stopped tricycle fades the persistent loop to silence');
assert.equal(lastSqueakGain.gain.value,0,'stopped tricycle fades the squeak loop to silence');
roll.stop();assert.equal(rollStops,2);roll.update(.1,0,0,-.2);assert.equal(rollStarts,4,'rolling and squeak loops can restart after reset/world cleanup');assert.equal(rollBuffers,2,'restart reuses both cached PCM layers');
roll.dispose();assert.equal(rollStops,4);

// Reference-fitted grass run steps: deterministic, bounded, distinct, and crunchy.
for(const sampleRate of [44100,48000]) {
  const variants=Array.from({length:GRASS_STEP_VARIANTS},(_,i)=>makeGrassStepSample(i,sampleRate));
  for(const [i,data] of variants.entries()) {
    assert.equal(data.length,Math.ceil(GRASS_STEP_DURATION*sampleRate));
    assert(data.every(Number.isFinite));assert.equal(data[0],0);assert(Math.abs(data.at(-1))<1e-6,'step tail fades without a click');
    assert.deepEqual(data,makeGrassStepSample(i,sampleRate),'step variants are reproducible');
    const peak=data.reduce((max,value)=>Math.max(max,Math.abs(value)),0),mean=data.reduce((sum,value)=>sum+value,0)/data.length;
    assert(peak>.2&&peak<=.95,'step stays bounded');assert(Math.abs(mean)<.01,'step has no DC offset');
    const window=(from,to)=>{let e=0;for(let k=Math.floor(from*sampleRate);k<to*sampleRate;k++)e+=data[k]*data[k];return e/((to-from)*sampleRate);};
    // The recording's crunch decays ~10 dB by 200–300 ms and fades into its tail.
    assert(window(0,.12)>window(.2,.3),'step body is louder than its roll-off');
    assert(window(0,.12)>window(.36,.41)*5,'step fades into a quiet tail');
    // High-band crackle: impulsive grains (kurtosis above Gaussian) but not isolated clicks.
    let m2=0,m4=0;const n=Math.floor(.12*sampleRate);
    for(let k=1;k<n;k++){const d=data[k]-data[k-1];m2+=d*d;m4+=d**4;}
    const kurtosis=m4*n/(m2*m2);assert(kurtosis>3.5&&kurtosis<12,`step crackle density matches the reference (kurtosis ${kurtosis.toFixed(1)})`);
  }
  assert.notDeepEqual(variants[0],variants[1],'variants avoid identical repetition');
}

// Run steps are scheduled ahead on the audio clock at the fixed field cadence.
{
  const scheduled=[];
  const context=spatialNodes({state:'running',currentTime:0,sampleRate:48000,
    createBuffer(_channels,length){return {length,duration:length/48000,copyToChannel(){},getChannelData(){return new Float32Array(length);}};},
    createBufferSource(){return {...graphNode(),buffer:null,playbackRate:audioParam(1),start(at){scheduled.push(at);},stop(){}};},
    createGain:()=>({...graphNode(),gain:audioParam(0)}),
  });
  const spatial=new SpatialAudio(context,graphNode()),body=spatial.emitter({reference:.35,normalizeAt:.3}),soccer=new SoccerAudio(context,spatial,body);
  soccer.prepare();
  for(let frame=0;frame<120;frame++){context.currentTime=frame/60;soccer.motion(.2);}
  assert(scheduled.length>=7&&scheduled.length<=8,`two seconds of running schedules ~3.55 steps/s (${scheduled.length})`);
  for(let i=1;i<scheduled.length;i++){const gap=scheduled[i]-scheduled[i-1];assert(gap>.27&&gap<.3,'steps keep the fixed cadence with small jitter');}
  const count=scheduled.length;context.currentTime=3;soccer.motion(0);context.currentTime=3.5;soccer.motion(0);
  assert.equal(scheduled.length,count,'standing still schedules no steps');
  soccer.dispose();spatial.dispose();
}
console.log('Motion timing, spatial attenuation/direction, silence at rest, sample bounds, tricycle rolling loop, grass steps, audio caching, voice limits and cleanup passed');
