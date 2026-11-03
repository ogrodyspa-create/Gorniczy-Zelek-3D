import type { SoccerEvent } from './physics.ts';
import type { SpatialAudio, SpatialEmitter } from '../../app/spatial-audio.ts';
import { GRASS_STEP_VARIANTS, makeGrassStepSample } from './grass-step.ts';

export type GrassContactType='takeoff'|'land';

const GRASS_PRESENCE=.82;
const GRASS_SOFTNESS=.78;
const GRASS_MOISTURE=.58;
const GRASS_DRAG=.72;
const GRASS_RUN_CADENCE=3.55;
const GRASS_VOLUME=.60;
/** Run-step level for the reference-fitted PCM step (normalized to .12 RMS). */
const GRASS_STEP_LEVEL=.085;
/** Audio-clock lookahead for scheduling run steps from the frame loop. */
const STEP_LOOKAHEAD=.12;

/** The soccer-ball event texture. Takeoff/landing use the sound-lab graph below; run steps use grass-step.ts. */
export function soccerSample(kind:SoccerEvent,sampleRate:number) {
  const duration=kind==='goal'?.75:.20,data=new Float32Array(Math.ceil(duration*sampleRate));
  let seed=53817,low=0;
  for(let i=0;i<data.length;i++) {
    seed=(Math.imul(seed,1664525)+1013904223)>>>0;const noise=seed/2147483648-1,t=i/sampleRate;low+=(noise-low)*.075;
    if(kind==='goal') {
      for(const [start,pitch] of [[0,523],[.10,659],[.20,784]]){const age=t-start;if(age>=0)data[i]+=.09*Math.sin(2*Math.PI*pitch*age)*(1-Math.exp(-age*150))*Math.exp(-age*9);}
    } else {
      const pitch=kind==='post'?710:kind==='save'?125:240;data[i]=(.23*Math.sin(t*pitch*Math.PI*2)*Math.exp(-t*35)+low*.4*Math.exp(-t*65))*(1-Math.exp(-t*800));
    }
  }
  data[0]=data[data.length-1]=0;
  return data;
}

type GrassVoice={source:AudioBufferSourceNode;nodes:AudioNode[]};

export class SoccerAudio {
  private readonly context:AudioContext;
  private readonly spatial:SpatialAudio;
  /** Footsteps and jumps originate at the jelly; ball events at the ball. */
  private readonly body:SpatialEmitter;
  private readonly ball:SpatialEmitter;
  private readonly buffers=new Map<string,AudioBuffer>();
  private readonly steps:AudioBuffer[]=[];
  private stepTask:ReturnType<typeof setTimeout>|null=null;
  private readonly voices=new Set<AudioBufferSourceNode>();
  private readonly grassVoices=new Set<GrassVoice>();
  private noise:AudioBuffer|null=null;
  private running=false;
  private nextStep=0;
  private lastVariant=-1;
  private lastEvent=-1;
  constructor(context:AudioContext,spatial:SpatialAudio,body:SpatialEmitter){
    this.context=context;this.spatial=spatial;this.body=body;this.ball=spatial.emitter({reference:1.7});
  }
  private buffer(kind:SoccerEvent) {
    let buffer=this.buffers.get(kind);if(!buffer){const data=soccerSample(kind,this.context.sampleRate);buffer=this.context.createBuffer(1,data.length,this.context.sampleRate);buffer.copyToChannel(data,0);this.buffers.set(kind,buffer);}return buffer;
  }
  private addStepVariant() {
    const rate=this.context.sampleRate,data=makeGrassStepSample(this.steps.length,rate),buffer=this.context.createBuffer(1,data.length,rate);
    buffer.copyToChannel(data,0);this.steps.push(buffer);
  }
  private stepBuffers() {
    if(!this.steps.length)this.addStepVariant();
    return this.steps;
  }
  /** Synthesize the remaining step variants one per task (~30 ms each), never as one long block. */
  private prepareSteps() {
    if(this.stepTask!==null)return;
    const next=()=>{this.stepTask=null;if(this.steps.length>=GRASS_STEP_VARIANTS)return;this.addStepVariant();this.stepTask=setTimeout(next,0);};
    next();
  }
  private noiseBuffer() {
    if(this.noise)return this.noise;
    // All grass voices draw different slices from one long noise bed. The
    // spectral process is unchanged, but steps no longer allocate/fill a fresh
    // AudioBuffer (and thousands of random samples) during gameplay.
    const seconds=4.5,n=Math.ceil(this.context.sampleRate*seconds),buffer=this.context.createBuffer(1,n,this.context.sampleRate),data=buffer.getChannelData(0);
    let brown=0,last=0;
    for(let i=0;i<n;i++) {
      const white=Math.random()*2-1;brown=brown*.985+white*.015;
      const smooth=white*.63+last*.37;last=smooth;data[i]=smooth*.78+brown*.9;
    }
    this.noise=buffer;return buffer;
  }
  private noiseOffset(seconds:number) {return Math.random()*Math.max(0,this.noiseBuffer().duration-seconds-.001);}
  prepare() {
    this.noiseBuffer();this.prepareSteps();
    for(const kind of ['bump','save','post','goal'] as const)this.buffer(kind);
  }
  private scheduleGrassVoice(source:AudioBufferSourceNode,nodes:AudioNode[],start:number,stop:number,offset:number) {
    const voice={source,nodes};this.grassVoices.add(voice);
    source.onended=()=>{if(!this.grassVoices.delete(voice))return;source.disconnect();for(const node of nodes)node.disconnect();};
    source.start(start,offset);source.stop(stop);
  }
  /** The broad friction-like takeoff/landing contact from grass_movement_sound_lab_v2.html. */
  private grassContact(type:'takeoff'|'land',strength:number) {
    const ctx=this.context;if(ctx.state!=='running'||this.grassVoices.size>=24)return;
    const t=ctx.currentTime+.008,grass=GRASS_PRESENCE,soft=GRASS_SOFTNESS,moist=GRASS_MOISTURE,drag=GRASS_DRAG,out=this.body.input;
    const dur=type==='takeoff'?.24:.38,peak=type==='takeoff'?.105:.165,attack=type==='takeoff'?.025:.018,release=type==='takeoff'?.19:.32;
    this.spatial.place(this.body,this.body.position.x,this.body.position.y,this.body.position.z);

    const source=ctx.createBufferSource();source.buffer=this.noiseBuffer();
    const highpass=ctx.createBiquadFilter();highpass.type='highpass';highpass.frequency.value=260+soft*160;
    const body=ctx.createBiquadFilter();body.type='bandpass';body.frequency.value=820+(1-moist)*520+drag*260;body.Q.value=.42+soft*.18;
    const air=ctx.createBiquadFilter();air.type='highshelf';air.frequency.value=2300;air.gain.value=-7+grass*5-moist*3;
    const gain=ctx.createGain(),amount=peak*strength*(.55+grass*.55)*GRASS_VOLUME;
    gain.gain.setValueAtTime(.0001,t);gain.gain.linearRampToValueAtTime(amount,t+attack);
    gain.gain.setValueAtTime(amount*(.86+Math.random()*.08),t+attack+dur*.24);gain.gain.exponentialRampToValueAtTime(.0001,t+release);
    body.frequency.setValueAtTime(body.frequency.value*.82,t);body.frequency.exponentialRampToValueAtTime(body.frequency.value*1.08,t+dur*.45);body.frequency.exponentialRampToValueAtTime(body.frequency.value*.72,t+dur);
    source.connect(highpass).connect(body).connect(air).connect(gain).connect(out);this.scheduleGrassVoice(source,[highpass,body,air,gain],t,t+dur,this.noiseOffset(dur));

    const lowDur=Math.min(.20,dur),low=ctx.createBufferSource();low.buffer=this.noiseBuffer();
    const lowpass=ctx.createBiquadFilter();lowpass.type='lowpass';lowpass.frequency.value=260+soft*120;
    const lowGain=ctx.createGain(),lowAmount=(type==='land'?.036:.018)*strength*(.45+soft*.45)*GRASS_VOLUME;
    lowGain.gain.setValueAtTime(.0001,t);lowGain.gain.linearRampToValueAtTime(lowAmount,t+.018);lowGain.gain.exponentialRampToValueAtTime(.0001,t+(type==='land'?.18:.11));
    low.connect(lowpass).connect(lowGain).connect(out);this.scheduleGrassVoice(low,[lowpass,lowGain],t,t+lowDur,this.noiseOffset(lowDur));

    if(type==='land') {
      const trail=ctx.createBufferSource();trail.buffer=this.noiseBuffer();
      const trailBand=ctx.createBiquadFilter();trailBand.type='bandpass';trailBand.frequency.value=1200+(1-moist)*500;trailBand.Q.value=.35;
      const trailGain=ctx.createGain();trailGain.gain.setValueAtTime(.0001,t+.055);trailGain.gain.linearRampToValueAtTime(.045*grass*strength*GRASS_VOLUME,t+.095);trailGain.gain.exponentialRampToValueAtTime(.0001,t+.34);
      trail.connect(trailBand).connect(trailGain).connect(out);this.scheduleGrassVoice(trail,[trailBand,trailGain],t+.055,t+.375,this.noiseOffset(.32));
    }
  }
  /** One reference-fitted run step: a cached PCM variant and a gain, nothing else per step. */
  private grassStep(at:number) {
    const ctx=this.context;if(this.grassVoices.size>=24)return;
    const steps=this.stepBuffers();
    // Never repeat the previous variant; consecutive identical crackle reads as a loop.
    let variant=0;
    if(steps.length>1){variant=Math.floor(Math.random()*(steps.length-1));if(variant>=this.lastVariant)variant++;}
    this.lastVariant=variant;
    const source=ctx.createBufferSource(),gain=ctx.createGain();
    source.buffer=steps[variant];source.playbackRate.value=.96+Math.random()*.08;
    gain.gain.value=GRASS_STEP_LEVEL*(.9+Math.random()*.2);
    source.connect(gain).connect(this.body.input);
    this.scheduleGrassVoice(source,[gain],at,at+source.buffer.duration/source.playbackRate.value,0);
  }
  /** Run steps at the field's fixed cadence, scheduled ahead on the audio clock (no timers). */
  motion(speed:number) {
    const ctx=this.context;if(ctx.state!=='running')return;
    const moving=speed>.012;
    if(!moving){this.running=false;return;}
    const now=ctx.currentTime;
    if(!this.running){this.running=true;this.nextStep=Math.max(this.nextStep,now+.01);}
    while(this.nextStep<now+STEP_LOOKAHEAD) {
      this.grassStep(this.nextStep);
      this.nextStep+=1/GRASS_RUN_CADENCE*(.97+Math.random()*.06);
    }
  }
  grassJump(type:'takeoff'|'land') {this.grassContact(type,type==='land'?1.04:1);}
  play(kind:SoccerEvent,strength:number,p:{x:number;y:number;z:number}) {
    const ctx=this.context;if(ctx.state!=='running'||this.voices.size>=8||(kind!=='goal'&&ctx.currentTime-this.lastEvent<.055))return;
    this.lastEvent=ctx.currentTime;const source=ctx.createBufferSource(),gain=ctx.createGain();source.buffer=this.buffer(kind);
    gain.gain.value=(kind==='goal'?.7:.65)*Math.min(1,strength);this.spatial.place(this.ball,p.x,p.y,p.z);
    source.connect(gain).connect(this.ball.input);this.voices.add(source);source.onended=()=>{this.voices.delete(source);source.disconnect();gain.disconnect();};source.start();
  }
  stop() {
    this.running=false;this.nextStep=0;
    for(const voice of this.grassVoices){try{voice.source.stop();}catch{voice.source.disconnect();}voice.source.disconnect();for(const node of voice.nodes)node.disconnect();}this.grassVoices.clear();
    for(const voice of this.voices){try{voice.stop();}catch{voice.disconnect();}voice.disconnect();}this.voices.clear();this.lastEvent=-1;
  }
  dispose(){this.stop();if(this.stepTask!==null){clearTimeout(this.stepTask);this.stepTask=null;}this.buffers.clear();this.steps.length=0;this.noise=null;}
}
