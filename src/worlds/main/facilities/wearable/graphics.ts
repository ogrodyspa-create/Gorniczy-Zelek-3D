import * as T from 'three/webgpu';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { CollisionBox } from '../../../../facilities/collision.ts';
import { HEAD_WEARABLES, WEARABLE_TABLE, type HeadWearableIndex } from './physics.ts';
import { animatePlume, buildCzako, buildHelmet, buildWeldingMask } from '../../mining/accessories.ts';

type WearableItem={root:T.Group;index:HeadWearableIndex};
export class WearableTable {
  readonly group=new T.Group();
  readonly collisionBoxes:CollisionBox[]=[];
  readonly items:readonly WearableItem[];
  private readonly previous=new T.Vector3();
  private time=0;
  private sway=0;
  private lastTime=0;
  lampEnabled=true;
  constructor(){
    this.group.name='head-wearable-table';this.group.position.set(WEARABLE_TABLE.x,0,WEARABLE_TABLE.z);
    const steel=new T.MeshStandardNodeMaterial({color:'#263b39',metalness:.78,roughness:.34});
    const copper=new T.MeshStandardNodeMaterial({color:'#a6653c',metalness:.8,roughness:.3});
    const top=new T.MeshStandardNodeMaterial({color:'#574538',metalness:.12,roughness:.53});
    const box=(w:number,h:number,d:number,x:number,y:number,z:number,m:T.Material,collide=true)=>{
      const o=new T.Mesh(new RoundedBoxGeometry(w,h,d,2,.0012),m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;this.group.add(o);
      if(collide)this.collisionBoxes.push({center:new T.Vector3(x+WEARABLE_TABLE.x,y,z+WEARABLE_TABLE.z),halfSize:new T.Vector3(w/2,h/2,d/2),xAxis:new T.Vector3(1,0,0),yAxis:new T.Vector3(0,1,0),zAxis:new T.Vector3(0,0,1)});
    };
    box(WEARABLE_TABLE.width,.008,WEARABLE_TABLE.depth,0,WEARABLE_TABLE.top-.004,0,top);
    for(const x of [-1,1])for(const z of [-1,1])box(.009,.057,.009,x*(WEARABLE_TABLE.width/2-.012),.0285,z*(WEARABLE_TABLE.depth/2-.012),steel);
    for(const z of [-1,1])box(WEARABLE_TABLE.width,.002,.002,0,WEARABLE_TABLE.top,z*WEARABLE_TABLE.depth/2,copper,false);
    this.items=[buildCzako(),buildHelmet(),buildWeldingMask()].map((content,i)=>{const root=new T.Group();root.name=HEAD_WEARABLES[i].id;root.add(content);this.group.add(root);return {root,index:i as HeadWearableIndex};});
    this.reset();
  }
  setWorn(index:HeadWearableIndex,parent:T.Group){parent.attach(this.items[index].root);this.items[index].root.scale.setScalar(HEAD_WEARABLES[index].scale);this.previous.set(0,0,0);this.lastTime=0;}
  updateWorn(index:HeadWearableIndex,position:T.Vector3,orientation:T.Quaternion){
    const now=performance.now()/1000,dt=this.lastTime?Math.min(.05,now-this.lastTime):0;this.lastTime=now;this.time+=dt;
    const speed=dt>0?Math.min(1,this.previous.distanceTo(position)/dt):0;this.previous.copy(position);
    this.sway+=(Math.min(.13,speed*.35)-this.sway)*(1-Math.exp(-dt*8));
    const root=this.items[index].root;root.position.copy(position);root.quaternion.copy(orientation);root.scale.setScalar(HEAD_WEARABLES[index].scale);root.visible=true;
    animatePlume(root,this.time,this.sway);root.updateWorldMatrix(true,true);
    this.setLamp(this.lampEnabled);
  }
  setLamp(on:boolean){this.lampEnabled=on;for(const item of this.items){const light=item.root.getObjectByName('helmet-light');if(light)light.visible=on&&item.root.parent!==this.group;}}
  setOnTable(index:HeadWearableIndex){const item=this.items[index],fit=HEAD_WEARABLES[index];this.group.attach(item.root);item.root.position.set(fit.slotX,WEARABLE_TABLE.top+fit.tableLift,0);item.root.rotation.set(0,fit.rotationY,0);item.root.scale.setScalar(fit.scale);item.root.updateWorldMatrix(true,true);this.setLamp(this.lampEnabled);}
  reset(){for(const item of this.items)this.setOnTable(item.index);}
  dispose(){const mats=new Set<T.Material>(),seen=new Set<T.Object3D>();for(const root of [this.group,...this.items.map(i=>i.root)])root.traverse(o=>{if(seen.has(o))return;seen.add(o);if(o instanceof T.Mesh){o.geometry.dispose();(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>mats.add(m));}});mats.forEach(m=>m.dispose());this.items.forEach(i=>i.root.removeFromParent());this.group.removeFromParent();}
}
