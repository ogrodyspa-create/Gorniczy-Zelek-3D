import * as T from 'three/webgpu';
import { FIELD, ENTRANCE, WELCOME_DESK } from './layout.ts';

export const ZAGLEBIE={orange:0xe77927,green:0x17513d,white:0xf4f5ec,copper:0xbc713f,dark:0x102b23} as const;
export const CLUB_WORDMARK='ZAGŁĘBIE LUBIN';

/** Text-only fan identity. No crest, sponsor marks or partnership claims. */
export function wordmark(width:number,height:number,title=CLUB_WORDMARK,subtitle='MIEDZIANE SERCE · PIŁKARSKA PASJA') {
  let map:T.Texture;
  const canvas=typeof document!=='undefined'?document.createElement('canvas'):undefined;
  const ctx=typeof canvas?.getContext==='function'?canvas.getContext('2d'):null;
  if(canvas&&ctx){
    canvas.width=1536;canvas.height=256;
    ctx.fillStyle='#123c2e';ctx.fillRect(0,0,1536,256);
    ctx.fillStyle='#e77927';ctx.fillRect(0,0,1536,12);ctx.fillRect(0,224,1536,16);
    ctx.fillStyle='#f4f5ec';ctx.fillRect(0,240,1536,8);ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.font='800 108px "Segoe UI",sans-serif';ctx.fillText(title,768,105,1450);
    ctx.font='500 29px "Segoe UI",sans-serif';ctx.fillStyle='#e1b487';ctx.fillText(subtitle,768,187,1450);
    map=new T.CanvasTexture(canvas);
  }else{map=new T.DataTexture(new Uint8Array([18,60,46,255]),1,1,T.RGBAFormat);map.needsUpdate=true;}
  map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
  const material=new T.MeshStandardNodeMaterial({map,roughness:.45,emissive:'#ffffff',emissiveMap:map,emissiveIntensity:.32});
  material.userData.zaglebieSign=true;
  const sign=new T.Mesh(new T.PlaneGeometry(width,height),material);sign.name=`wordmark-${title}`;
  sign.userData.wordmark=title;sign.castShadow=sign.receiveShadow=true;return sign;
}

export function stadiumBranding(root:T.Group){
  const group=new T.Group();group.name='zaglebie-lubin-identity';root.add(group);
  const board=wordmark(.285,.059);
  // Inset face positions clear the existing molded boards and their trim.
  for(const side of [-1,1])for(let i=0;i<8;i++){
    const sign=new T.Mesh(board.geometry,board.material);sign.name=`zaglebie-side-board-${side}-${i}`;
    sign.position.set(side*1.006,.078,-1.30+i*.37);sign.rotation.y=-side*Math.PI/2;sign.castShadow=sign.receiveShadow=true;group.add(sign);
  }
  for(const [x,end] of [[-.70,-1],[.70,-1],[-.70,1]]){
    const sign=new T.Mesh(board.geometry,board.material);sign.name=`zaglebie-end-board-${end}-${x}`;sign.position.set(x,.078,end*1.548);sign.rotation.y=end===1?Math.PI:0;sign.castShadow=sign.receiveShadow=true;group.add(sign);
  }
  // Name panels occupy the fascia beside the existing scoreboard, not the aisles.
  for(const x of [-.92,.92]){const sign=wordmark(.65,.105);sign.position.set(x,.218,-1.876);group.add(sign);}
  const entrance=wordmark(.26,.043,CLUB_WORDMARK,'WEJŚCIE NA BOISKO');entrance.position.set(WELCOME_DESK.x,.10,WELCOME_DESK.z+.055);group.add(entrance);
  const score=wordmark(.37,.023,'TWOJE GOLE','');score.position.set(0,.477,-1.883);group.add(score);
  const note=wordmark(.33,.039,'STREFA KIBICA','PROJEKT SZKOLNY · BEZ OFICJALNEJ WSPÓŁPRACY Z KLUBEM');note.position.set(ENTRANCE.x-.30,.025,ENTRANCE.z+.04);group.add(note);
  // Real stadium illumination complements the existing HDRI and projected shadows.
  for(const x of [-.52,.52]){
    const light=new T.SpotLight('#fff4de',.7,5,Math.PI/5,.6,2);light.position.set(x,.45,-1.89);light.target.position.set(-x*.3,FIELD.y,.2);group.add(light,light.target);
  }
  return group;
}

/** Added to a portal's own group: no change to placement, aperture or collision. */
export function footballPortalBranding(root:T.Group,returning=false){
  const group=new T.Group();group.name='zaglebie-portal-identity';root.add(group);
  for(let i=0;i<3;i++){
    const color=[ZAGLEBIE.orange,ZAGLEBIE.white,ZAGLEBIE.green][i];
    const material=new T.MeshStandardNodeMaterial({color,emissive:color,emissiveIntensity:.7,metalness:.35,roughness:.3});
    for(const side of [-1,1]){
      const arc=new T.Mesh(new T.TorusGeometry(.070,.0011,6,48,Math.PI*2/3-.04),material);arc.position.z=side*.017;arc.rotation.z=i*Math.PI*2/3;arc.castShadow=arc.receiveShadow=true;group.add(arc);
    }
  }
  for(const side of [-1,1]){
    const sign=wordmark(.113,.020,CLUB_WORDMARK,returning?'PORTAL POWROTNY · GÓRNICZA':'PORTAL PIŁKARSKI');sign.position.set(0,.028,side*.017);sign.rotation.y=side<0?Math.PI:0;group.add(sign);
  }
  return group;
}

export function disposeBrandingTextures(root:T.Object3D){
  const maps=new Set<T.Texture>();root.traverse(o=>{if(o instanceof T.Mesh)for(const m of Array.isArray(o.material)?o.material:[o.material])if(m.userData.zaglebieSign){const map=(m as T.MeshStandardNodeMaterial).map;if(map)maps.add(map);}});maps.forEach(map=>map.dispose());
}
