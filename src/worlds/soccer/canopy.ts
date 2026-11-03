import * as T from 'three/webgpu';
import { part } from '../../graphics/shared/toy-parts.ts';
import { closedTube, solidLoft } from '../../graphics/shared/manufactured-geometry.ts';

/**
 * A cantilevered stand roof. It leaves the back wall at `wallTop`, sweeps up
 * toward the pitch on a parabola and thins to a rolled leading edge, so the
 * stands read as one molded roof instead of a flat slab. Ribs, corbels and the
 * fascia are all placed from these same curves.
 *
 * `back` and `front` are positions on the axis across the roof (X for side
 * stands, Z for end stands); the roof runs along the other axis from `from` to `to`.
 */
export type CanopySpec={across:'x'|'z';back:number;front:number;from:number;to:number;wallTop:number;rise:number;backThickness:number;frontThickness:number};

const SAMPLES=18;

/** Side stands: from the outer wall's outer face to just over the top seat row. */
export function sideCanopy(side:number):CanopySpec {
  return {across:'x',back:side*1.4155,front:side*1.190,from:-1.77,to:1.77,wallTop:.301,rise:.03,backThickness:.014,frontThickness:.008};
}
/** End stands: `back` is the end wall's outer face, `front` the roof's pitch-side edge. */
export function endCanopy(back:number,front:number,from:number,to:number):CanopySpec {
  return {across:'z',back,front,from,to,wallTop:.301,rise:.010,backThickness:.014,frontThickness:.008};
}

export function canopyUnderside(spec:CanopySpec,u:number) {return spec.wallTop+spec.rise*u*u;}
export function canopyThickness(spec:CanopySpec,u:number) {return spec.backThickness+(spec.frontThickness-spec.backThickness)*u;}
export function canopyTop(spec:CanopySpec,u:number) {return canopyUnderside(spec,u)+canopyThickness(spec,u);}
export function canopyAt(spec:CanopySpec,u:number) {return spec.back+(spec.front-spec.back)*u;}
/** Fraction along the roof (0 at the wall, 1 at the leading edge) for an across-axis position. */
export function canopyFraction(spec:CanopySpec,position:number) {return Math.max(0,Math.min(1,(position-spec.back)/(spec.front-spec.back)));}

/** World point for an across-axis position `p`, height `y` and along-axis position `s`. */
function point(spec:CanopySpec,p:number,y:number,s:number):[number,number,number] {
  return spec.across==='x'?[p,y,s]:[s,y,p];
}

export function canopyShell(root:T.Group,spec:CanopySpec,material:T.Material,name:string) {
  const section:[number,number][]=[];
  for(let i=SAMPLES;i>=0;i--){const u=i/SAMPLES;section.push([canopyAt(spec,u),canopyUnderside(spec,u)]);}
  for(let i=0;i<=SAMPLES;i++){const u=i/SAMPLES;section.push([canopyAt(spec,u),canopyTop(spec,u)]);}
  // Round the thin leading edge into the underside.
  const direction=Math.sign(spec.front-spec.back),radius=spec.frontThickness/2,centerY=canopyUnderside(spec,1)+radius;
  for(let i=1;i<8;i++){const a=Math.PI/2-i*Math.PI/8;section.push([spec.front+direction*radius*Math.cos(a)*.9,centerY+radius*Math.sin(a)]);}
  // Loft winding: CCW in (x, y) when extruded along +Z; CW in (z, y) when extruded along +X.
  let area=0;for(let i=0;i<section.length;i++){const [a,b]=section[i],[c,d]=section[(i+1)%section.length];area+=a*d-c*b;}
  if((spec.across==='x')!==(area>0))section.reverse();
  const rings=[spec.from,spec.to].map(s=>section.map(([p,y])=>point(spec,p,y,s)));
  const mesh=part(root,solidLoft(rings),material);mesh.name=name;return mesh;
}

/** A rolled bead that owns the roof's leading edge. */
export function canopyBead(root:T.Group,spec:CanopySpec,material:T.Material,name:string,radius=.0055) {
  const y=canopyUnderside(spec,1)+spec.frontThickness/2,p=spec.front+Math.sign(spec.front-spec.back)*.0015;
  const mesh=part(root,closedTube([new T.Vector3(...point(spec,p,y,spec.from+.004)),new T.Vector3(...point(spec,p,y,spec.to-.004))],radius,16),material);
  mesh.name=name;return mesh;
}

/** A rib riding the roof's upper surface from the wall to just short of the bead. */
export function canopyRib(root:T.Group,spec:CanopySpec,s:number,material:T.Material,name:string,radius=.0028) {
  const points=Array.from({length:9},(_,i)=>{const u=.02+.9*i/8;return new T.Vector3(...point(spec,canopyAt(spec,u),canopyTop(spec,u)+radius*.62,s));});
  const mesh=part(root,closedTube(points,radius,10),material);mesh.name=name;return mesh;
}

/** A triangular corbel from the wall face up to the underside; `reach` is its across-axis length. */
export function canopyCorbel(root:T.Group,spec:CanopySpec,s:number,low:number,reach:number,width:number,material:T.Material,name:string) {
  const direction=Math.sign(spec.front-spec.back),wall=spec.back+direction*.0442,tip=wall+direction*reach;
  const under=(p:number)=>canopyUnderside(spec,canopyFraction(spec,p))+.0008;
  const profile:[number,number][]=[[wall,low],[wall,under(wall)],[tip,under(tip)]];
  const rings=[s-width/2,s+width/2].map(depth=>profile.map(([p,y])=>point(spec,p,y,depth)));
  // Match the shell's winding convention for a flat three-point profile.
  let area=0;for(let i=0;i<3;i++){const [a,b]=profile[i],[c,d]=profile[(i+1)%3];area+=a*d-c*b;}
  if((spec.across==='x')!==(area>0))rings.forEach(ring=>ring.reverse());
  const mesh=part(root,solidLoft(rings),material);mesh.name=name;return mesh;
}
