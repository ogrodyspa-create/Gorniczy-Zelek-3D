import * as THREE from 'three/webgpu';
import { FaceSkin } from './face-skin.ts';
import type { SoftBody } from '../../physics/soft-body.js';

/** A closed, shallow relief sampled from the supplied school emblem, not a decal.
 * Raster luminance is an artistic depth estimate, not a recovered CAD model. */
export async function createCopperHeart(body:SoftBody) {
  const texture=await new THREE.TextureLoader().loadAsync(`${import.meta.env.BASE_URL}school-emblem.png`);
  texture.colorSpace=THREE.SRGBColorSpace;
  const canvas=document.createElement('canvas');canvas.width=100;canvas.height=140;
  const ctx=canvas.getContext('2d')!;ctx.drawImage(texture.image,0,0,100,140);
  const pixels=ctx.getImageData(0,0,100,140).data;
  const solid=(x:number,y:number)=>x>=0&&x<100&&y>=0&&y<140&&pixels[(y*100+x)*4+3]>128;
  const positions:number[]=[],uvs:number[]=[];
  const vertex=(x:number,y:number,z:number)=>{positions.push((x-50)*.00016,(70-y)*.00016,z);uvs.push(x/100,1-y/140);};
  const quad=(corners:number[][])=>{for(const i of [0,1,2,0,2,3])vertex(corners[i][0],corners[i][1],corners[i][2]);};
  for(let y=0;y<140;y++)for(let x=0;x<100;x++)if(solid(x,y)){
    const p=(y*100+x)*4,z=.00045+pixels[p]/255*.00055,b=-.0004;
    quad([[x,y,z],[x,y+1,z],[x+1,y+1,z],[x+1,y,z]]);
    quad([[x,y,b],[x+1,y,b],[x+1,y+1,b],[x,y+1,b]]);
    // Each cell has side walls: this also closes luminance steps in the relief.
    quad([[x,y,b],[x,y+1,b],[x,y+1,z],[x,y,z]]);
    quad([[x+1,y,z],[x+1,y+1,z],[x+1,y+1,b],[x+1,y,b]]);
    quad([[x,y,z],[x+1,y,z],[x+1,y,b],[x,y,b]]);
    quad([[x,y+1,b],[x+1,y+1,b],[x+1,y+1,z],[x,y+1,z]]);
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.computeVertexNormals();
  const material=new THREE.MeshPhysicalNodeMaterial({map:texture,color:'#eeb78b',metalness:.7,roughness:.32,emissive:'#b95821',emissiveIntensity:.08});
  const mesh=new THREE.Mesh(geometry,material);mesh.frustumCulled=false;
  const skin=new FaceSkin(body),sample=new Float64Array(6),upSample=new Float64Array(6);
  const normal=new THREE.Vector3(),up=new THREE.Vector3(),right=new THREE.Vector3(),matrix=new THREE.Matrix4();
  let time=0;
  return {mesh,update(dt:number){
    time+=dt;skin.sample(-.003,.032,-.0016,sample);skin.sample(-.003,.037,-.0016,upSample);
    normal.set(sample[3],sample[4],sample[5]);up.set(upSample[0]-sample[0],upSample[1]-sample[1],upSample[2]-sample[2]);
    right.crossVectors(up,normal).normalize();up.crossVectors(normal,right).normalize();
    matrix.makeBasis(right,up,normal);mesh.quaternion.setFromRotationMatrix(matrix);
    mesh.position.set(sample[0],sample[1],sample[2]);
    mesh.scale.setScalar(1+.018*Math.sin(time*6.8));
    material.emissiveIntensity=.08+.025*Math.sin(time*6.8);
  },dispose(){texture.dispose();}};
}
