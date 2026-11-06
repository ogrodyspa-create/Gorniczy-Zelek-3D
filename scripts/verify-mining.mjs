import assert from 'node:assert/strict';
import { Scene, Group, Box3 } from 'three/webgpu';
import { loadModel } from './load-model.mjs';
import { SoftBody } from '../src/physics/soft-body.js';
import { Locomotion } from '../src/app/locomotion.ts';
import { MiningWorkshop } from '../src/worlds/main/mining/workshop.ts';
import { WearableFacility } from '../src/worlds/main/facilities/wearable/facility.ts';

// Labels are tested as scene geometry here; real CanvasTexture rendering is
// checked in the browser. No GPU context is substituted by this test.
globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>({fillRect(){},strokeRect(){},fillText(){}})})};
const body=new SoftBody(loadModel()),scene=new Scene(),baby=new Group();scene.add(baby);
const shadows={add(){}};
const workshop=new MiningWorkshop(scene,body,shadows);
assert(workshop.boxes.length>=10,'walls and welding bench have real colliders');
workshop.interact();assert(workshop.welding);
for(let i=0;i<240;i++)workshop.step(1/240);
workshop.update();
const sparks=workshop.group.children.find(o=>o.isLineSegments);
assert.equal(sparks.geometry.attributes.position.count,600,'particle pool stays bounded at 300 streaks');
assert(sparks.geometry.attributes.color.array.some(v=>v>1),'hot sparks carry HDR intensity');
assert([...sparks.geometry.attributes.position.array].every(Number.isFinite));
assert(workshop.group.children.some(o=>o.isPointLight&&o.intensity>0),'arc illuminates the scene');
for(let i=0;i<2400;i++)workshop.step(1/240);
workshop.update();assert(!workshop.welding,'timed cycle stops without a second click');
assert([...sparks.geometry.attributes.color.array].every(v=>v===0),'particles expire completely');
const wear=new WearableFacility(scene,body,baby,new Locomotion(body),shadows);
assert(wear.selectEquipment(0));wear.update();
const czako=wear.visual.items[0].root,plume=czako.getObjectByName('white-feather-plume');
assert.equal(plume.children.length,10,'plume batched into ten fibre bundles');
let triangles=0;plume.traverse(o=>{if(o.isMesh){assert(!o.geometry.type.includes('Plane'));triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;}});
assert(triangles>10000&&triangles<250000,`bounded volumetric plumage: ${triangles} triangles`);
assert(new Box3().setFromObject(czako).getSize(new (await import('three/webgpu')).Vector3()).y<.07,'headwear is proportioned to 7cm mascot');
assert(wear.selectEquipment(1));wear.update();
const lamp=wear.visual.items[1].root.getObjectByName('helmet-light');assert(lamp.isSpotLight&&lamp.visible);
wear.visual.setLamp(false);assert(!lamp.visible);
wear.selectEquipment(null);assert.equal(wear.physics.wornIndex,null);
wear.dispose();workshop.dispose();
console.log('PASS mining: bounded volumetric feathers, equipment switching, working spotlight, weld timing/expiry, HDR streaks and colliders.',{triangles});
