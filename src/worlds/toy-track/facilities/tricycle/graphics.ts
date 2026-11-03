import * as T from 'three/webgpu';
import { batch, disposeParts, enamel, part, rod, rounded, tube } from '../../../../graphics/shared/toy-parts.ts';
import { closedTube, solidLoft, wheelFender, turned } from '../../../../graphics/shared/manufactured-geometry.ts';
import { DEFAULT_GRIPS, SEAT_HEIGHT, type GripFit } from './fit.ts';

/** A closed section revolved about the local X axle. `profile` is [radial, axial],
 * traced inner face → +axial → outer face → −axial (outward winding). */
function axleRing(profile:number[][],segments:number) {
  return solidLoft(Array.from({length:segments},(_,i)=>{const a=i*Math.PI*2/segments;return profile.map(([r,x])=>[x,r*Math.cos(a),r*Math.sin(a)]);}),true);
}
/** Rounded-rectangle (superellipse) section, traced clockwise from the inner face. */
function roundedSection(center:number,halfRadial:number,halfAxial:number,exponent:number,steps=28,relief?:(radial:number,axial:number)=>number) {
  return Array.from({length:steps},(_,i)=>{
    const phi=Math.PI-i*Math.PI*2/steps,c=Math.cos(phi),s=Math.sin(phi);
    const radial=center+halfRadial*Math.sign(c)*Math.abs(c)**(2/exponent),axial=halfAxial*Math.sign(s)*Math.abs(s)**(2/exponent);
    return [radial-(relief?.(radial,axial)??0),axial];
  });
}
/** Turned parts author along Y; wheels and pedals spin about X. */
function alongX(mesh:T.Mesh) {mesh.rotation.z=Math.PI/2;return mesh;}

/** Seat and front fork are equal crank arms on a visible parallel four-bar linkage. */
export class Tricycle {
  readonly group=new T.Group();
  readonly seat=new T.Group();
  readonly fork=new T.Group();
  private readonly wheels:T.Group[]=[];
  private readonly links:T.Mesh[]=[];
  private readonly cranks:T.Group[]=[];
  constructor(grips:GripFit[]=DEFAULT_GRIPS,keepParts=false) {
    this.group.name='tricycle';this.seat.name='rotating-saddle';this.fork.name='steering-fork';
    const coral=enamel(0xec9588),ivory=enamel(0xffedc9),teal=enamel(0x589f98),tire=enamel(0x435c60,.65);
    const brass=new T.MeshPhysicalNodeMaterial({color:0xdab56a,metalness:.7,roughness:.26});
    const frame=new T.Group();frame.name='chassis';this.group.add(frame);
    tube(frame,[[0,.026,-.037],[0,.029,-.005],[0,.051,.030],[0,.057,.056]],.004,coral).name='continuous-spine';
    rod(frame,new T.Vector3(-.040,.015,-.034),new T.Vector3(.040,.015,-.034),.003,brass).name='rear-axle';
    tube(frame,[[-.032,.016,-.034],[-.020,.027,-.018],[0,.032,0],[.020,.027,-.018],[.032,.016,-.034]],.003,ivory).name='rear-cradle';
    part(frame,new T.CylinderGeometry(.009,.011,.009,24),brass,0,.034,0).name='seat-bearing';
    this.seat.position.y=.039;this.group.add(this.seat);
    const oval=(rx:number,rz:number,y:number)=>Array.from({length:48},(_,i)=>{const a=i*Math.PI/24;return [rx*Math.cos(a),y,rz*Math.sin(a)-.002];});
    part(this.seat,solidLoft([oval(.028,.020,-.005),oval(.031,.023,-.0035),oval(.032,.024,-.001),oval(.031,.023,.001)]),coral).name='molded-seat-pan';
    part(this.seat,solidLoft([oval(.028,.020,.001),oval(.028,.020,.0025),oval(.026,.018,.005)]),ivory).name='inset-seat-pad';
    tube(this.seat,[[-.024,.003,-.018],[-.023,.014,-.025],[0,.019,-.027],[.023,.014,-.025],[.024,.003,-.018]],.0027,coral);
    for(const [index,side] of [-1,1].entries()) {
      const grip=grips[index],y=SEAT_HEIGHT+grip.y-this.seat.position.y-.0025;
      tube(this.seat,[[side*.024,-.002,0],[side*.034,.006,grip.z],[grip.x,y-.002,grip.z]],.0025,brass).name=`grip-riser-${side}`;
      const handle=rounded(this.seat,[.012,.005,.010],teal,grip.x,y,grip.z,.002);handle.name=`arm-grip-${side}`;
      handle.userData.contactTop=[grip.x,SEAT_HEIGHT+grip.y,grip.z];
      // End ferrules are proud of the grip sides; no applied stripes overlap its top.
      for(const end of [-1,1])rounded(this.seat,[.001,.0048,.0098],brass,grip.x+end*.006,y,grip.z,.0008);
      rod(frame,new T.Vector3(0,.029,-.005),new T.Vector3(side*.025,.012,.025),.0024,coral).name=`footrest-bracket-${side}`;
      rounded(frame,[.013,.0036,.022],ivory,side*.025,.012,.025,.0016).name=`footrest-${side}`;
      for(let rib=0;rib<4;rib++)rounded(frame,[.0105,.0009,.0022],teal,side*.025,.0139,.0175+rib*.005,.0004).name=`footrest-tread-${side}-${rib}`;
    }
    this.fork.position.set(0,0,.056);this.group.add(this.fork);
    // Turned head tube: flared headset, waisted barrel, collar and domed cap.
    part(this.fork,turned([[0,-.006],[.0056,-.006],[.0058,-.0050],[.0047,-.0038],[.0045,.0040],[.0055,.0052],[.0057,.0066],[.0052,.0080],[.0039,.0093],[.0021,.0100],[0,.0102]],32),brass,0,.057,0).name='steering-spindle';
    for(const side of [-1,1])tube(this.fork,[[0,.057,0],[side*.014,.047,0],[side*.014,.023,0]],.0026,coral).name=`fork-blade-${side}`;
    // A molded crown ties both blades under the headset; the mudguard bolts to it.
    rounded(this.fork,[.024,.0036,.0078],coral,0,.0505,0,.0015).name='fork-crown';
    rod(this.fork,new T.Vector3(-.019,.023,0),new T.Vector3(.019,.023,0),.002,brass).name='front-axle';
    part(this.fork,wheelFender(.0262,.011,.0012),ivory,0,.023,0).name='formed-front-mudguard';
    // Rolled coral beads finish both mudguard edges.
    for(const side of [-1,1]) {
      const arc=Array.from({length:25},(_,i)=>{const a=-.18+(Math.PI+.36)*i/24;return new T.Vector3(side*.0055,.023+.0268*Math.sin(a),.0268*Math.cos(a));});
      part(this.fork,closedTube(arc,.0007,8),coral).name=`mudguard-bead-${side}`;
    }
    for(const side of [-1,1])rod(this.fork,new T.Vector3(side*.014,.025,0),new T.Vector3(side*.0045,.041,.020),.001,brass).name=`mudguard-stay-${side}`;
    const wheel=(root:T.Group,x:number,y:number,z:number,r:number,width:number)=>{
      const g=new T.Group();g.name=`wheel-${this.wheels.length}`;g.position.set(x,y,z);root.add(g);this.wheels.push(g);
      // Balloon tyre: a crowned superellipse section with two shallow
      // circumferential tread grooves, seated on a channelled rim.
      const tyreDepth=Math.min(.0058,r*.36),rimRadius=r-tyreDepth,half=width/2;
      const tread=(radial:number,axial:number)=>radial>r-.0012?.00045*Math.max(0,1-Math.abs(Math.abs(axial)-half*.36)/(half*.13)):0;
      part(g,axleRing(roundedSection(r-tyreDepth/2,tyreDepth/2,half,2.6,36,tread),48),tire).name='rubber-tyre';
      part(g,axleRing(roundedSection(rimRadius-.0004,.0012,half*.86,4,20),48),ivory).name='wheel-rim';
      const disc=rimRadius-.0012;
      alongX(part(g,turned([[0,-.0011],[disc-.0008,-.0011],[disc,-.0004],[disc,.0004],[disc-.0008,.0011],[0,.0011]],40),teal)).name='molded-wheel-hub';
      alongX(part(g,turned([[0,-.0042],[.0026,-.0042],[.0034,-.0032],[.0034,.0032],[.0026,.0042],[0,.0042]],24),brass)).name='hub-barrel';
      for(const side of [-1,1]) {
        // Domed axle nut on each outer face (turned +Y, then pointed outward).
        const cap=part(g,turned([[0,.0042],[.0033,.0042],[.0031,.0048],[.0022,.0054],[0,.0057]],24),brass);cap.rotation.z=-side*Math.PI/2;cap.name=`axle-cap-${side}`;
        for(let i=0;i<6;i++){const a=i*Math.PI/3+(side>0?Math.PI/6:0);rod(g,new T.Vector3(side*.0013,Math.cos(a)*.0036,Math.sin(a)*.0036),new T.Vector3(side*.0013,Math.cos(a)*(disc-.0006),Math.sin(a)*(disc-.0006)),.0008,ivory).name=`raised-spoke-${side}-${i}`;}
      }
      return g;
    };
    wheel(this.fork,0,.023,0,.023,.0068);
    for(const side of [-1,1])wheel(this.group,side*.036,.015,-.034,.015,.0058);
    for(const side of [-1,1]) {
      const crank=new T.Group();crank.name=`pedal-crank-${side}`;crank.position.set(side*.019,.023,0);this.fork.add(crank);this.cranks.push(crank);
      rod(crank,new T.Vector3(),new T.Vector3(0,side*.010,0),.0015,brass).name=`crank-arm-${side}`;
      rod(crank,new T.Vector3(0,side*.010,0),new T.Vector3(side*.0072,side*.010,0),.0008,brass).name=`pedal-spindle-${side}`;
      rounded(crank,[.0080,.0034,.0070],coral,side*.0048,side*.010,0,.0013).name=`pedal-block-${side}`;
      // Rubber tread bars on both faces: the pedal is visible from above at every crank angle.
      for(const face of [-1,1])for(let bar=0;bar<3;bar++)rounded(crank,[.0068,.0007,.0011],ivory,side*.0048,side*.010+face*.0017,-.0022+bar*.0022,.0003).name=`pedal-tread-${side}-${face}-${bar}`;
      rod(this.seat,new T.Vector3(0,-.009,0),new T.Vector3(side*.018,-.009,0),.0015,brass).name=`seat-steering-crank-${side}`;
      rod(this.fork,new T.Vector3(0,.054,0),new T.Vector3(side*.018,.054,0),.0015,brass).name=`fork-steering-crank-${side}`;
      part(this.seat,new T.SphereGeometry(.0022,12,8),brass,side*.018,-.009,0).name=`seat-link-bearing-${side}`;
      part(this.fork,new T.SphereGeometry(.0022,12,8),brass,side*.018,.054,0).name=`fork-link-bearing-${side}`;
      const link=part(this.group,new T.CylinderGeometry(.0012,.0012,1,10),brass);link.name=`steering-link-${side}`;this.links.push(link);
    }
    for(const root of [frame,this.seat,...this.wheels,...this.cranks]){root.userData.keepParts=keepParts;batch(root);}
    const forkShell=new T.Group();this.fork.add(forkShell);
    for(const child of [...this.fork.children])if(child instanceof T.Mesh)forkShell.add(child);
    forkShell.userData.keepParts=keepParts;batch(forkShell);
    let index=0;this.group.traverse(o=>{if(o instanceof T.Mesh&&!o.name)o.name=`fitting-${index++}`;});this.update(0,0);
  }
  update(steer:number,travel:number) {
    this.seat.rotation.y=this.fork.rotation.y=steer;
    this.wheels.forEach((wheel,i)=>wheel.rotation.x=travel/(i===0?.023:.015));
    this.cranks.forEach(crank=>crank.rotation.x=travel/.023);
    for(let i=0;i<2;i++) {
      const side=i===0?-1:1,x=side*.018*Math.cos(steer),z=-side*.018*Math.sin(steer);
      const a=new T.Vector3(x,.030,z),b=new T.Vector3(x,.054,z+.056),link=this.links[i];
      link.position.copy(a).add(b).multiplyScalar(.5);link.scale.y=a.distanceTo(b);
      link.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),b.sub(a).normalize());
    }
  }
  dispose(){disposeParts(this.group);}
}
