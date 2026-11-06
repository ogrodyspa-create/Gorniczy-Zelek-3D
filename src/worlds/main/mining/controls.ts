import type { WearableFacility } from '../facilities/wearable/facility.ts';
import type { MiningWorkshop } from './workshop.ts';
import type { HeadWearableIndex } from '../facilities/wearable/physics.ts';

export class MiningControls {
  private lastState=-1;
  private readonly panel=document.createElement('section');private readonly abort=new AbortController();
  private readonly wear:WearableFacility;private readonly workshop:MiningWorkshop;
  constructor(wear:WearableFacility,workshop:MiningWorkshop){
    this.wear=wear;this.workshop=workshop;
    this.panel.className='mining-controls';this.panel.setAttribute('aria-label','Wyposażenie Górniczej');
    this.panel.innerHTML='<span class="mining-panel-label">WYPOSAŻENIE PRACOWNI</span><div><button data-hat="0">Czako</button><button data-hat="1">Kask</button><button data-hat="2">Przyłbica</button><button data-remove>Zdejmij</button></div><div><button data-lamp aria-pressed="true">Lampa kasku</button><button data-weld aria-pressed="false">Spawanie · 8 s</button></div><small>WASD / strzałki · ruch &nbsp; Spacja · skok &nbsp; E · interakcja</small>';
    document.querySelector('#app')!.append(this.panel);
    this.panel.addEventListener('click',e=>{const button=(e.target as HTMLElement).closest('button');if(!button)return;
      if(button.dataset.hat!==undefined)this.wear.selectEquipment(Number(button.dataset.hat) as HeadWearableIndex);
      if(button.hasAttribute('data-remove'))this.wear.selectEquipment(null);
      if(button.hasAttribute('data-lamp'))this.wear.visual.setLamp(!this.wear.visual.lampEnabled);
      if(button.hasAttribute('data-weld'))this.workshop.interact();button.blur();this.update();
    },{signal:this.abort.signal});this.update();
  }
  update(){const state=(this.wear.physics.wornIndex??3)+(this.wear.visual.lampEnabled?4:0)+(this.workshop.welding?8:0);if(state===this.lastState)return;this.lastState=state;this.panel.querySelectorAll<HTMLButtonElement>('[data-hat]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.hat)===this.wear.physics.wornIndex)));this.panel.querySelector('[data-lamp]')!.setAttribute('aria-pressed',String(this.wear.visual.lampEnabled));this.panel.querySelector('[data-weld]')!.setAttribute('aria-pressed',String(this.workshop.welding));}
  dispose(){this.abort.abort();this.panel.remove();}
}
