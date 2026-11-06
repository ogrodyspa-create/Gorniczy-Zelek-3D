import * as THREE from 'three/webgpu';

/** Background display only; outside the original facility play area. */
export function createMiningDisplay() {
  const group=new THREE.Group();group.position.set(0,0,-.28);
  const copper=new THREE.MeshStandardNodeMaterial({color:'#b36c3c',metalness:.85,roughness:.32});
  const dark=new THREE.MeshStandardNodeMaterial({color:'#24312f',metalness:.5,roughness:.45});
  const box=(w:number,h:number,d:number,x:number,y:number,z:number,material:THREE.Material)=>{
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);group.add(mesh);
  };
  box(.32,.004,.055,0,.018,0,dark);
  for(const x of [-.15,.15])box(.005,.12,.005,x,.06,-.012,copper);
  box(.32,.055,.004,0,.105,-.012,copper);
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=192;
  const ctx=canvas.getContext('2d')!;ctx.fillStyle='#20302c';ctx.fillRect(0,0,1024,192);
  ctx.fillStyle='#efbe91';ctx.textAlign='center';ctx.font='bold 76px Georgia';ctx.fillText('GÓRNICZA',512,95);
  ctx.fillStyle='#eee3d4';ctx.font='24px sans-serif';ctx.fillText('LUBIN  ·  MIEDŹ  ·  WIEDZA  ·  PRZYSZŁOŚĆ',512,150);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const sign=new THREE.Mesh(new THREE.PlaneGeometry(.31,.05),new THREE.MeshStandardNodeMaterial({map:texture,roughness:.6}));
  sign.position.set(0,.105,-.0095);group.add(sign);
  for(let i=0;i<3;i++){
    box(.045,.003,.035,(i-1)*.09,.022,0,copper);
    const sample=new THREE.Mesh(new THREE.DodecahedronGeometry(.012,1),new THREE.MeshStandardNodeMaterial({color:['#ac693c','#3f8065','#a49b75'][i],metalness:.55,roughness:.36}));
    sample.position.set((i-1)*.09,.034,0);sample.rotation.set(.3,i*.7,.4);sample.scale.set(1, .8, .7);group.add(sample);
  }
  return {group,dispose(){texture.dispose();group.traverse(object=>{if(object instanceof THREE.Mesh){object.geometry.dispose();const materials=Array.isArray(object.material)?object.material:[object.material];materials.forEach(m=>m.dispose());}});}};
}
