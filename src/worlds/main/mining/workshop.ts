import * as T from 'three/webgpu';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { SoftBody } from '../../../physics/soft-body.js';
import { FacilityCollision, type CollisionBox } from '../../../facilities/collision.ts';
import type { Facility } from '../../../facilities/manager.ts';
import type { FacilityShadows } from '../../../facilities/shadows.ts';

function finish(c:string,metalness=.0,roughness=.5){return new T.MeshStandardNodeMaterial({color:c,metalness,roughness});}
function label(text:string,sub:string,w:number,h:number){
  const c=document.createElement('canvas');c.width=1024;c.height=256;const ctx=c.getContext('2d')!;
  ctx.fillStyle='#152927';ctx.fillRect(0,0,1024,256);ctx.strokeStyle='#bd8657';ctx.lineWidth=5;ctx.strokeRect(12,12,1000,232);
  ctx.textAlign='center';ctx.fillStyle='#f0d2a2';ctx.font='600 106px Georgia';ctx.fillText(text,512,135);ctx.fillStyle='#acbcb4';ctx.font='24px sans-serif';ctx.fillText(sub,512,205);
  const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;
  return new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshStandardNodeMaterial({map,emissive:'#d8bb8b',emissiveMap:map,emissiveIntensity:.22,roughness:.55}));
}

/** Workshop set, collision boundaries and bounded welding simulation. */
export class MiningWorkshop implements Facility {
  readonly id='mining-workshop';readonly label='Stanowisko spawalnicze';readonly active=false;
  readonly group=new T.Group();readonly collision:FacilityCollision;
  readonly boxes:CollisionBox[]=[];
  private readonly body:SoftBody;
  private elapsed=0;private remaining=0;private emit=0;private cursor=0;
  private readonly arc:T.Mesh;private readonly weldLight:T.PointLight;private readonly hot:T.Mesh;
  private readonly sparks:T.LineSegments;
  private readonly positions=new Float32Array(300*6);private readonly colors=new Float32Array(300*6);
  private readonly particles=new Float32Array(300*8);
  private readonly weld=new T.Vector3(.28,.079,-.205);
  private readonly materials=new Set<T.Material>();
  constructor(scene:T.Scene,body:SoftBody,shadows:FacilityShadows){
    this.body=body;this.collision=new FacilityCollision(body);this.group.name='gornicza-workshop';scene.add(this.group);
    const steel=finish('#243d3b',.78,.32),copper=finish('#af6d43',.85,.3),black=finish('#182425',.45,.48),mortar=finish('#6a5d50',0,.95);
    const add=(g:T.BufferGeometry,m:T.Material,x:number,y:number,z:number)=>{const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;this.group.add(o);return o;};
    const box=(w:number,h:number,d:number,x:number,y:number,z:number,m:T.Material,collide=false)=>{const o=add(new RoundedBoxGeometry(w,h,d,2,Math.min(.0015,w/5,h/5,d/5)),m,x,y,z);if(collide)this.boxes.push({center:new T.Vector3(x,y,z),halfSize:new T.Vector3(w/2,h/2,d/2),xAxis:new T.Vector3(1,0,0),yAxis:new T.Vector3(0,1,0),zAxis:new T.Vector3(0,0,1)});return o;};
    // Actual brick relief and recessed mortar; one instanced draw for the back wall.
    box(.94,.31,.012,0,.155,-.36,mortar,true);
    const bricks=new T.InstancedMesh(new T.BoxGeometry(.045,.018,.008),finish('#8d4e36',.04,.86),20*15),dummy=new T.Object3D();
    for(let row=0;row<15;row++)for(let col=0;col<20;col++){const i=row*20+col;dummy.position.set(-.464+col*.047+(row%2)*.0235,.011+row*.020,-.350);dummy.updateMatrix();bricks.setMatrixAt(i,dummy.matrix);bricks.setColorAt(i,new T.Color().setHSL(.045+(i%7)*.003,.32,.25+(i%11)*.012));}this.group.add(bricks);
    // Side walls form a cutaway room rather than an infinite tabletop.
    for(const x of [-.47,.47]){box(.012,.21,.88,x,.105,.075,steel,true);for(let z=-.35;z<.5;z+=.055)box(.004,.19,.003,x+(x<0?.008:-.008),.095,z,copper);}
    box(.94,.015,.014,0,.0075,.51,steel,true);
    for(const x of [-.45,-.225,0,.225,.45]){box(.012,.31,.018,x,.155,-.335,steel);box(.025,.008,.025,x,.004,-.33,copper);}
    box(.94,.018,.024,0,.295,-.33,steel);
    const sign=label('GÓRNICZA','ZESPÓŁ SZKÓŁ NR 1 W LUBINIE  /  PRACOWNIA MIEDZI',.42,.105);sign.position.set(0,.222,-.319);this.group.add(sign);
    // Copper utility pipes, brackets and overhead luminaires.
    for(const y of [.155,.17]){const pipe=add(new T.CylinderGeometry(.0022,.0022,.9,12),copper,0,y,-.326);pipe.rotation.z=Math.PI/2;}
    const glow=new T.MeshStandardNodeMaterial({color:'#fff0cf',emissive:'#ffe5b5',emissiveIntensity:3});
    for(const x of [-.31,.31]){
      box(.16,.009,.025,x,.272,-.30,black);box(.145,.002,.018,x,.266,-.299,glow);
      const light=new T.PointLight('#ffe4bc',.018,.65,2);light.position.set(x,.25,-.24);this.group.add(light);
    }
    // Mineral cabinets with metal mullions, glass side panels and lit shelves.
    for(const x of [-.32,.32]){
      box(.16,.018,.065,x,.012,-.29,black,true);box(.16,.11,.009,x,.075,-.323,steel,true);
      for(const dx of [-.077,.077])box(.004,.125,.065,x+dx,.075,-.29,copper);
      box(.16,.005,.065,x,.137,-.29,steel);box(.145,.002,.05,x,.132,-.285,glow);
      const glass=new T.MeshPhysicalNodeMaterial({color:'#b4e0d8',transparent:true,opacity:.13,roughness:.08,metalness:.1,depthWrite:false});
      for(const dx of [-.078,.078])box(.001,.11,.06,x+dx,.075,-.29,glass);
      for(let row=0;row<2;row++){
        const y=.035+row*.047;box(.151,.003,.06,x,y,-.29,steel);
        for(let i=0;i<3;i++){const geometry=new T.IcosahedronGeometry(.013,1).toNonIndexed();const positions=geometry.attributes.position;for(let v=0;v<positions.count;v++){const px=positions.getX(v),py=positions.getY(v),pz=positions.getZ(v),r=1+.22*Math.sin(px*823+py*541+pz*1239);positions.setXYZ(v,px*r,py*r,pz*r);}geometry.computeVertexNormals();const mineral=finish(['#b87645','#398b72','#c1c4b5'][i],.42,.55);mineral.flatShading=true;const rock=add(geometry,mineral,x+(i-1)*.045,y+.014,-.28);rock.scale.set(1,.75+(i%2)*.4,.8);rock.rotation.set(i*.7,.3,i*.4);}
      }
      const light=new T.PointLight('#c9eeeb',.004,.24,2);light.position.set(x,.12,-.26);this.group.add(light);
    }
    // Industrial walking strips flank the original physically shaded wooden floor.
    for(const x of [-.405,.405]){
      box(.075,.001,.80,x,.0001,.07,steel);
      for(let i=0;i<48;i++)box(.065,.0005,.002,x,.001,-.32+i*.016,copper);
    }
    // Welding bench: plate, steel legs, vice, inverter, vents and flexible cable.
    box(.17,.008,.09,.28,.066,-.185,steel,true);
    for(const x of [.207,.353])for(const z of [-.22,-.15])box(.007,.062,.007,x,.031,z,black,true);
    box(.072,.004,.054,.28,.073,-.195,finish('#7c9292',.9,.24));
    box(.03,.014,.02,.23,.078,-.18,black);box(.034,.004,.009,.23,.087,-.18,copper);
    box(.065,.05,.075,.37,.026,-.13,black,true);box(.061,.04,.002,.37,.029,-.091,copper);
    for(let i=0;i<7;i++)box(.031,.0016,.001,.375,.014+i*.004,-.089,black);
    const display=label('160 A','MIG / MAG',.025,.009);display.position.set(.353,.043,-.089);this.group.add(display);
    const cable=new T.CatmullRomCurve3([new T.Vector3(.347,.015,-.09),new T.Vector3(.30,.003,-.07),new T.Vector3(.245,.012,-.11),new T.Vector3(.28,.085,-.18)]);
    add(new T.TubeGeometry(cable,48,.0016,6,false),black,0,0,0);
    const torch=add(new T.CylinderGeometry(.003,.004,.023,12),black,.285,.088,-.184);torch.rotation.x=-.7;
    const tip=add(new T.CylinderGeometry(.0016,.002,.012,12),copper,.281,.08,-.198);tip.rotation.x=-.7;
    const station=label('SPAWALNIA','ŁUK ELEKTRYCZNY / SYMULACJA',.13,.033);station.position.set(.28,.12,-.245);this.group.add(station);
    this.arc=add(new T.SphereGeometry(.0018,12,8),new T.MeshBasicNodeMaterial({color:new T.Color(12,18,25)}),...this.weld.toArray() as [number,number,number]);
    this.weldLight=new T.PointLight('#b9deff',0,.5,2);this.weldLight.position.copy(this.weld).add(new T.Vector3(0,.006,0));this.group.add(this.weldLight);
    this.hot=add(new T.SphereGeometry(.003,12,8),new T.MeshStandardNodeMaterial({color:'#b83b0c',emissive:'#ff4a0c',emissiveIntensity:0}),this.weld.x,this.weld.y-.003,this.weld.z);this.hot.scale.y=.15;
    const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(this.positions,3).setUsage(T.DynamicDrawUsage));geometry.setAttribute('color',new T.BufferAttribute(this.colors,3).setUsage(T.DynamicDrawUsage));
    this.sparks=new T.LineSegments(geometry,new T.LineBasicNodeMaterial({vertexColors:true,transparent:true,blending:T.AdditiveBlending,depthWrite:false}));this.sparks.frustumCulled=false;this.group.add(this.sparks);this.arc.visible=false;
    this.collision.registerBoxes(this.boxes);shadows.add(this.group,new T.Box3(new T.Vector3(-.49,0,-.38),new T.Vector3(.49,.32,.53)));
  }
  get interactionDistance(){return Math.hypot(this.body.center.x-.28,this.body.center.z+.18)<.14?.01:Infinity;}
  get action(){return this.remaining>0?'Zatrzymaj spawanie':'Uruchom spawanie';}
  get mobileAction(){return this.action;}
  get welding(){return this.remaining>0;}
  interact(){this.remaining=this.remaining>0?0:8;return true;}
  step(h:number){
    this.elapsed+=h;this.remaining=Math.max(0,this.remaining-h);this.emit+=this.remaining>0?h*260:0;
    while(this.emit>=1){this.emit--;const p=this.cursor*8;this.cursor=(this.cursor+1)%300;const a=Math.random()*Math.PI*2,s=.07+Math.random()*.23;
      this.particles.set([this.weld.x,this.weld.y,this.weld.z,Math.cos(a)*s,.08+Math.random()*.25,Math.sin(a)*s,.25+Math.random()*.5,1],p);
    }
    for(let i=0;i<300;i++){const p=i*8;if(this.particles[p+6]<=0)continue;this.particles[p+6]-=h;this.particles[p+4]-=h*.65;for(let a=0;a<3;a++)this.particles[p+a]+=this.particles[p+3+a]*h;}
  }
  afterStep(){this.collision.resolveBoxes(this.boxes);}
  warmupCollision(){this.collision.warmupBoxes(this.boxes);}
  update(){
    const on=this.remaining>0,flicker=.75+.25*Math.sin(this.elapsed*143);this.arc.visible=on;this.weldLight.intensity=on?.012*flicker:0;
    (this.hot.material as T.MeshStandardNodeMaterial).emissiveIntensity=on?2:Math.max(0,(this.hot.material as T.MeshStandardNodeMaterial).emissiveIntensity-.025);
    for(let i=0;i<300;i++){const p=i*8,k=i*6,life=Math.max(0,this.particles[p+6]);for(let a=0;a<3;a++){this.positions[k+a]=this.particles[p+a];this.positions[k+3+a]=this.particles[p+a]-this.particles[p+3+a]*.018;}
      const fade=life>0&&this.particles[p+1]>0?Math.min(1,life*4):0;this.colors.set([fade*5,fade*2.4,fade*.6,fade*2,fade*.45,0],k);
    }
    this.sparks.geometry.attributes.position.needsUpdate=true;this.sparks.geometry.attributes.color.needsUpdate=true;
  }
  reset(){this.remaining=0;this.particles.fill(0);this.emit=0;}
  dispose(){this.collision.dispose();this.group.traverse(o=>{if(o instanceof T.Mesh||o instanceof T.LineSegments){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material]){this.materials.add(m);const map=(m as T.MeshStandardNodeMaterial).map;map?.dispose();}}});this.materials.forEach(m=>m.dispose());this.group.removeFromParent();}
}
