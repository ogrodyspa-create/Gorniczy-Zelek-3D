import * as T from 'three/webgpu';
import type { SoftBody } from '../../physics/soft-body.js';
import { WearablePhysics } from '../main/facilities/wearable/physics.ts';
import { ZAGLEBIE } from './branding.ts';

/** Cosmetic headband samples the existing head frame; never writes cage state. */
export class SupporterBand {
  readonly group=new T.Group();
  private readonly attachment:WearablePhysics;
  private readonly position=new T.Vector3();private readonly rotation=new T.Quaternion();
  private readonly offset=new T.Vector3(0,-.009,0);
  private readonly button:HTMLButtonElement|undefined;
  private readonly abort=new AbortController();private selected=false;private active=false;
  constructor(body:SoftBody){
    // Soccer loads lazily while the player is already at the school portal.
    // Build the anchor lookup in rest space without moving the live body.
    const restPositions=new Float32Array(body.surface.positions.length);
    for(let v=0;v<restPositions.length/3;v++)for(let k=0;k<4;k++){
      const id=body.surface.bindingIds[v*4+k]*3,w=body.surface.bindingWeights[v*4+k];
      for(let axis=0;axis<3;axis++)restPositions[v*3+axis]+=body.rest[id+axis]*w;
    }
    const reference=Object.create(body) as SoftBody;
    reference.surface={...body.surface,positions:restPositions};
    this.attachment=new WearablePhysics(reference);this.group.name='supporter-headband';this.group.visible=false;
    for(let i=0;i<3;i++){
      const ring=new T.Mesh(new T.TorusGeometry(.0258,.00065,6,64),new T.MeshStandardNodeMaterial({color:[ZAGLEBIE.orange,ZAGLEBIE.white,ZAGLEBIE.green][i],roughness:.85}));
      ring.rotation.x=Math.PI/2;ring.position.y=(i-1)*.00105;ring.scale.z=.93;ring.castShadow=ring.receiveShadow=true;this.group.add(ring);
    }
    if(typeof document!=='undefined'&&typeof document.createElementNS==='function'){
      this.button=document.createElement('button');this.button.textContent='Opaska kibica';this.button.hidden=true;this.button.setAttribute('aria-pressed','false');
      this.button.style.cssText='position:fixed;right:24px;top:140px;padding:10px 14px;border-radius:9px;border:1px solid #e77927;background:#174c38;color:white;font-size:12px;z-index:3';
      this.button.addEventListener('click',()=>{this.selected=!this.selected;this.updateVisibility();this.button?.blur();},{signal:this.abort.signal});document.querySelector('#app')!.append(this.button);
    }
  }
  setActive(active:boolean){this.active=active;if(this.button)this.button.hidden=!active;this.updateVisibility();}
  private updateVisibility(){this.group.visible=this.active&&this.selected;this.button?.setAttribute('aria-pressed',String(this.selected));}
  update(){if(!this.group.visible)return;this.attachment.headPlacement(0,this.position,this.rotation);this.group.position.copy(this.offset).applyQuaternion(this.rotation).add(this.position);this.group.quaternion.copy(this.rotation);this.group.updateWorldMatrix(true,true);}
  dispose(){this.abort.abort();this.button?.remove();this.group.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();(o.material as T.Material).dispose();}});this.group.removeFromParent();}
}
