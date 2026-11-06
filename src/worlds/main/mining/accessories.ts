import * as T from 'three/webgpu';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { positionLocal, sin, vec3 } from 'three/tsl';

const gold=()=>new T.MeshStandardNodeMaterial({color:'#c8a45c',metalness:.88,roughness:.28});
function mesh(parent:T.Group,g:T.BufferGeometry,m:T.Material,x=0,y=0,z=0){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;parent.add(o);return o;}
function tube(points:T.Vector3[],r:number,segments=24){return new T.TubeGeometry(new T.CatmullRomCurve3(points),segments,r,5,false);}
function solid(points:number[][],depth:number){const s=new T.Shape();points.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();return new T.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelSegments:2,bevelSize:.012,bevelThickness:.012,steps:1});}

/** Asymmetric flat hammer and pointed iron, surrounded by a relief leaf wreath.
 * Proportions traced from the user's first three video seconds. */
export function miningBadge(){
  const g=new T.Group(),m=gold();
  for(const side of [-1,1]){
    const tool=new T.Group();tool.rotation.z=side*.75;g.add(tool);
    mesh(tool,new T.CapsuleGeometry(.035,.65,4,8),m,0,-.08,0);
    const head=side<0?[[-.22,.23],[.22,.23],[.22,.39],[-.22,.39]]:[[-.23,.23],[.12,.23],[.26,.08],[.23,.37],[-.23,.39]];
    mesh(tool,solid(head,.055),m,0,0,-.025);
    const branch:T.Vector3[]=[];
    for(let i=0;i<19;i++){const a=-Math.PI/2+i/18*Math.PI*.88;branch.push(new T.Vector3(side*Math.cos(a)*.53,Math.sin(a)*.53,0));}
    mesh(g,tube(branch,.018),m);
    for(let i=0;i<11;i++){
      const a=-1.3+i*.23,x=side*Math.cos(a)*.53,y=Math.sin(a)*.53;
      for(const outward of [-1,1]){
        const leaf=mesh(g,solid([[0,0],[-.045,.07],[-.025,.15],[0,.20],[.034,.12],[.04,.06]],.018),m,x,y,.015);
        leaf.rotation.z=-side*(a+.5)+outward*.4;
        const vein=mesh(leaf.parent as T.Group,tube([new T.Vector3(0,0,.04),new T.Vector3(0,.1,.06),new T.Vector3(0,.18,.04)],.005,8),m,x,y,.015);vein.rotation.copy(leaf.rotation);
      }
    }
  }
  return g;
}

/** Solid tubular rachises and thousands of tapered 3D barbs; no feather cards. */
function featherVane(curve:T.CatmullRomCurve3,side:T.Vector3){
  const vertices:number[]=[],indices:number[]=[],rings=24,sides=12;
  for(let j=0;j<=rings;j++){
    const t=j/rings,p=curve.getPoint(t),normal=new T.Vector3().crossVectors(curve.getTangent(t),side).normalize();
    const shape=Math.max(.008,Math.sin(Math.PI*t)**.75),width=.205*shape,depth=.018*shape;
    for(let k=0;k<sides;k++){
      const a=k/sides*Math.PI*2,point=p.clone().addScaledVector(side,Math.cos(a)*width).addScaledVector(normal,Math.sin(a)*depth+Math.abs(Math.cos(a))*.025*shape);
      vertices.push(point.x,point.y,point.z);
      if(j<rings){const q=j*sides+k,r=j*sides+(k+1)%sides;indices.push(q,r,q+sides,r,r+sides,q+sides);}
    }
  }
  for(let k=1;k<sides-1;k++){indices.push(0,k+1,k);const end=rings*sides;indices.push(end,end+k,end+k+1);}
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(vertices.length/3*2),2));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
}

function plume(){
  const g=new T.Group(),m=new T.MeshPhysicalNodeMaterial({color:'#f7f4eb',roughness:.65,sheen:.8,sheenColor:'#fffef8',sheenRoughness:.75});
  let seed=76;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  for(let bundle=0;bundle<10;bundle++){
    const parts:T.BufferGeometry[]=[];
    for(let f=0;f<6;f++){
      const a=(bundle+(f-.5)*.16)/10*Math.PI*2,spread=.44+rnd()*.55,height=1.5+rnd()*.55;
      const radial=new T.Vector3(Math.cos(a),0,Math.sin(a)),side=new T.Vector3(-Math.sin(a),0,Math.cos(a));
      const curve=new T.CatmullRomCurve3([new T.Vector3(0,0,0),radial.clone().multiplyScalar(.18).setY(height*.65),radial.clone().multiplyScalar(spread*.68).setY(height),radial.clone().multiplyScalar(spread).setY(.08+rnd()*.10)]);
      parts.push(featherVane(curve,side));
      parts.push(new T.TubeGeometry(curve,24,.005,5,false));
      for(let j=2;j<40;j++){
        const t=j/41,p=curve.getPoint(t),tangent=curve.getTangent(t),width=Math.sin(Math.PI*t)**.8*(.23+rnd()*.06);
        for(const s of [-1,1]){
          const end=p.clone().addScaledVector(side,s*width).addScaledVector(tangent,.10).addScaledVector(radial,.025);
          const mid=p.clone().lerp(end,.5).addScaledVector(radial,.018);
          const geo=tube([p,mid,end],.004,4),pos=geo.attributes.position;
          // Taper each barb towards its tip, retaining a volumetric cross-section.
          for(let k=0;k<pos.count;k++){const ring=Math.floor(k/6),u=Math.min(1,ring/4),center=new T.CatmullRomCurve3([p,mid,end]).getPointAt(u);pos.setXYZ(k,center.x+(pos.getX(k)-center.x)*(1-u*.8),center.y+(pos.getY(k)-center.y)*(1-u*.8),center.z+(pos.getZ(k)-center.z)*(1-u*.8));}
          geo.computeVertexNormals();parts.push(geo);
        }
      }
    }
    const merged=mergeGeometries(parts);parts.forEach(p=>p.dispose());
    const feather=mesh(g,merged,m);feather.name=`plume-fibres-${bundle}`;feather.userData.phase=bundle*.63;
  }
  g.position.y=.93;g.name='white-feather-plume';return g;
}

export function buildCzako(){
  const g=new T.Group();g.name='czako';
  const felt=new T.MeshPhysicalNodeMaterial({color:'#151918',roughness:.86,sheen:.55,sheenColor:'#42433c'});
  const weave=sin(positionLocal.x.add(positionLocal.y).mul(580)).mul(.025).add(.975);
  felt.colorNode=vec3(.035,.042,.038).mul(weave);
  const metal=gold();
  mesh(g,new T.CylinderGeometry(.97,.95,.92,80),felt,0,.46,0).scale.z=.87;
  for(const y of [.035,.90]){const ring=mesh(g,new T.TorusGeometry(.965,.018,6,96),metal,0,y,0);ring.rotation.x=Math.PI/2;ring.scale.y=.87;}
  for(let b=0;b<2;b++){
    const pts:T.Vector3[]=[];for(let i=0;i<=240;i++){const a=i/240*Math.PI*2;pts.push(new T.Vector3(Math.cos(a)*.98,.84+Math.sin(a*32+b*Math.PI)*.022,Math.sin(a)*.855));}
    mesh(g,tube(pts,.012,240),metal);
  }
  const badge=miningBadge();badge.scale.setScalar(.62);badge.position.set(0,.46,.85);g.add(badge);
  g.add(plume());return g;
}

export function buildHelmet(){
  const g=new T.Group();g.name='mining-helmet';
  const shell=new T.MeshPhysicalNodeMaterial({color:'#dfb44c',roughness:.3,clearcoat:.6});
  const black=new T.MeshStandardNodeMaterial({color:'#202c2b',roughness:.5,metalness:.3});
  const metal=new T.MeshStandardNodeMaterial({color:'#bec6c5',metalness:.95,roughness:.22});
  mesh(g,new T.SphereGeometry(1,48,24,0,Math.PI*2,0,Math.PI/2),shell,0,.02,0).scale.set(1,.72,1.04);
  const rim=mesh(g,new T.CylinderGeometry(1.08,1.08,.055,64),shell,0,.02,.08);rim.scale.z=1.14;
  for(const x of [-.36,0,.36])mesh(g,tube([new T.Vector3(x,.12,-.94),new T.Vector3(x,.68,-.25),new T.Vector3(x,.64,.48),new T.Vector3(x,.22,.96)],.025),shell);
  const housing=mesh(g,new T.CylinderGeometry(.22,.23,.23,32),black,0,.32,1.03);housing.rotation.x=Math.PI/2;
  const bezel=mesh(g,new T.TorusGeometry(.185,.028,8,32),metal,0,.32,1.16);void bezel;
  const lens=new T.MeshStandardNodeMaterial({color:'#e7f8ff',emissive:'#b5e1ff',emissiveIntensity:2});
  mesh(g,new T.CircleGeometry(.16,32),lens,0,.32,1.17).name='lamp-lens';
  const light=new T.SpotLight('#d8eeff',.035,.9,.42,.55,1.6);light.name='helmet-light';light.position.set(0,.32,1.18);light.target.position.set(0,-2.2,13);g.add(light,light.target);
  mesh(g,tube([new T.Vector3(.20,.32,1),new T.Vector3(.82,.25,.5),new T.Vector3(.8,.15,-.65)],.025),black);
  return g;
}

export function buildWeldingMask(){
  const g=new T.Group(),black=new T.MeshStandardNodeMaterial({color:'#263432',roughness:.5,metalness:.3});
  mesh(g,new T.SphereGeometry(1,32,20,0,Math.PI,0,Math.PI*.7),black,0,.12,0).scale.set(1,.95,.75);
  mesh(g,new T.BoxGeometry(1.2,.5,.08),new T.MeshPhysicalNodeMaterial({color:'#124c45',metalness:.5,roughness:.14}),0,.25,.77);
  return g;
}

export function animatePlume(root:T.Group,time:number,sway:number){
  const plumeRoot=root.getObjectByName('white-feather-plume');if(!plumeRoot)return;
  plumeRoot.children.forEach((o,i)=>{o.rotation.z=Math.sin(time*2.5+i*.63)*.018+sway*Math.sin(i*.63);o.rotation.x=Math.cos(time*2+i*.5)*.012+sway*.65;});
}
