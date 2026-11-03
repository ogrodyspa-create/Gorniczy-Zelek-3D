import type { Camera } from 'three/webgpu';

export type SpatialProfile={
  /** Distance (m) where a source falls to half power: gain = 1 / (1 + (d / reference)²). */
  reference:number;
  /** Optional listening distance with unit gain, for sources that were previously unattenuated. */
  normalizeAt?:number;
  /** Upper gain bound when the camera is closer than `normalizeAt`. */
  maxGain?:number;
};

/** Direction cues lean this far toward straight ahead, so a source beside the
 * camera never collapses into one ear (≈67° instead of 90° azimuth). */
const FORWARD_BIAS=.3;
/** Low-pass cutoff of a source directly in front of / behind the camera, before air loss. */
const FRONT_CUTOFF=20000;
const REAR_CUTOFF=5200;
/** Scene-scaled air absorption: cutoff halves at this distance. */
const AIR_DISTANCE=2.4;
/** Parameter smoothing; long enough to hide per-frame steps, short enough to track a fast orbit. */
const SMOOTHING=.025;

/**
 * One persistent sound origin. Voices connect to `input`; the emitter owns the
 * HRTF direction, distance gain and direction/distance-dependent low-pass, so
 * the number of HRTF panners is bounded by emitters, never by voice count.
 */
export class SpatialEmitter {
  readonly input:GainNode;
  private readonly filter:BiquadFilterNode;
  private readonly panner:PannerNode;
  private readonly distanceGain:GainNode;
  private readonly profile:Required<SpatialProfile>;
  private readonly normalization:number;
  readonly position={x:0,y:0,z:0};
  distance=0;
  constructor(context:AudioContext,output:AudioNode,profile:SpatialProfile) {
    this.profile={normalizeAt:0,maxGain:1,...profile};
    this.normalization=this.profile.normalizeAt>0?1+(this.profile.normalizeAt/profile.reference)**2:1;
    this.input=context.createGain();
    this.filter=context.createBiquadFilter();this.filter.type='lowpass';this.filter.frequency.value=FRONT_CUTOFF;this.filter.Q.value=.5;
    this.panner=context.createPanner();
    // Distance is modelled below; the panner only supplies direction cues.
    this.panner.panningModel='HRTF';this.panner.distanceModel='linear';this.panner.rolloffFactor=0;
    this.panner.refDistance=1;this.panner.maxDistance=10000;
    this.distanceGain=context.createGain();
    this.input.connect(this.filter).connect(this.panner).connect(this.distanceGain).connect(output);
  }
  set(x:number,y:number,z:number) {this.position.x=x;this.position.y=y;this.position.z=z;}
  /** Gain from distance alone, for callers that cull or budget quiet voices. */
  gainAt(distance:number) {return Math.min(this.profile.maxGain,this.normalization/(1+(distance/this.profile.reference)**2));}
  /** `local` is the source in camera space (camera looks down -Z). */
  apply(localX:number,localY:number,localZ:number,time:number,immediate:boolean) {
    const distance=Math.hypot(localX,localY,localZ);this.distance=distance;
    const inverse=distance>1e-6?1/distance:0;
    const forward=distance>1e-6?localZ*inverse:-1;
    // Rear sources are shadowed by the head; distant ones lose air.
    const behind=Math.max(0,forward);
    let x=localX*inverse*(1-FORWARD_BIAS),y=localY*inverse*(1-FORWARD_BIAS),z=forward*(1-FORWARD_BIAS)-FORWARD_BIAS;
    const length=Math.hypot(x,y,z)||1;x/=length;y/=length;z/=length;
    const cutoff=(FRONT_CUTOFF+(REAR_CUTOFF-FRONT_CUTOFF)*behind)/(1+distance/AIR_DISTANCE);
    const gain=this.gainAt(distance);
    const p=this.panner;
    if(immediate) {
      // A new voice must start at its true position, not glide in from the last one.
      for(const [param,value] of [[p.positionX,x],[p.positionY,y],[p.positionZ,z],[this.filter.frequency,cutoff],[this.distanceGain.gain,gain]] as const) {
        if(!param)continue;param.cancelScheduledValues(time);param.setValueAtTime(value,time);
      }
    } else {
      if(p.positionX){p.positionX.setTargetAtTime(x,time,SMOOTHING);p.positionY.setTargetAtTime(y,time,SMOOTHING);p.positionZ.setTargetAtTime(z,time,SMOOTHING);}
      this.filter.frequency.setTargetAtTime(cutoff,time,SMOOTHING);
      this.distanceGain.gain.setTargetAtTime(gain,time,SMOOTHING);
    }
    if(!p.positionX)p.setPosition(x,y,z);
  }
  dispose() {this.input.disconnect();this.filter.disconnect();this.panner.disconnect();this.distanceGain.disconnect();}
}

/**
 * Camera-relative spatialization for every sound effect. The Web Audio listener
 * stays at the origin facing -Z; each emitter receives its source transformed
 * into camera space. That keeps behaviour identical on implementations with
 * only the legacy listener API and lets direction cues be softened per emitter.
 */
export class SpatialAudio {
  private readonly context:AudioContext;
  private readonly output:AudioNode;
  private readonly emitters=new Set<SpatialEmitter>();
  private readonly view=new Float64Array(16);
  private hasView=false;
  constructor(context:AudioContext,output:AudioNode) {
    this.context=context;this.output=output;
    // Explicitly pin the default listener frame for implementations that drift.
    const listener=context.listener;
    if(listener.positionX){listener.positionX.value=0;listener.positionY.value=0;listener.positionZ.value=0;
      listener.forwardX.value=0;listener.forwardY.value=0;listener.forwardZ.value=-1;listener.upX.value=0;listener.upY.value=1;listener.upZ.value=0;}
    else {listener.setPosition(0,0,0);listener.setOrientation(0,0,-1,0,1,0);}
  }
  emitter(profile:SpatialProfile) {
    const emitter=new SpatialEmitter(this.context,this.output,profile);this.emitters.add(emitter);return emitter;
  }
  /** Refresh the camera frame and every emitter once per rendered frame. */
  listen(camera:Camera) {
    this.view.set(camera.matrixWorldInverse.elements);this.hasView=true;
    if(this.context.state!=='running')return;
    const time=this.context.currentTime;
    for(const emitter of this.emitters)this.update(emitter,time,false);
  }
  /** Place an emitter and apply it without smoothing, for a voice that starts now. */
  place(emitter:SpatialEmitter,x:number,y:number,z:number) {
    emitter.set(x,y,z);this.update(emitter,this.context.currentTime,true);return emitter.distance;
  }
  /** Distance from the camera without touching the audio graph. */
  distanceTo(x:number,y:number,z:number) {
    const [lx,ly,lz]=this.local(x,y,z);return Math.hypot(lx,ly,lz);
  }
  private local(x:number,y:number,z:number):[number,number,number] {
    if(!this.hasView)return [x,y,z];
    const e=this.view;
    return [e[0]*x+e[4]*y+e[8]*z+e[12],e[1]*x+e[5]*y+e[9]*z+e[13],e[2]*x+e[6]*y+e[10]*z+e[14]];
  }
  private update(emitter:SpatialEmitter,time:number,immediate:boolean) {
    const p=emitter.position,[x,y,z]=this.local(p.x,p.y,p.z);emitter.apply(x,y,z,time,immediate);
  }
  dispose() {for(const emitter of this.emitters)emitter.dispose();this.emitters.clear();}
}
