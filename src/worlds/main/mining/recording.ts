/** Local canvas-only recording for reviewing the moving character. */
export class WorkshopRecording {
  private readonly root=document.createElement('div');
  private readonly button=document.createElement('button');
  private readonly link=document.createElement('a');
  private readonly abort=new AbortController();
  private recorder:MediaRecorder|undefined;private stream:MediaStream|undefined;
  private timer=0;private url='';
  constructor(canvas:HTMLCanvasElement){
    this.root.className='workshop-recording';this.button.textContent='Nagraj pokaz · 12 s';this.link.hidden=true;
    this.root.append(this.button,this.link);document.querySelector('#app')!.append(this.root);
    if(typeof MediaRecorder==='undefined'||!canvas.captureStream){this.root.hidden=true;return;}
    this.button.addEventListener('click',()=>{
      if(this.recorder?.state==='recording')return;
      this.stream=canvas.captureStream(24);const chunks:BlobPart[]=[];
      const mime=MediaRecorder.isTypeSupported('video/webm;codecs=vp9')?'video/webm;codecs=vp9':'video/webm';
      try{this.recorder=new MediaRecorder(this.stream,{mimeType:mime,videoBitsPerSecond:6000000});}catch{this.stream.getTracks().forEach(t=>t.stop());this.button.textContent='Nagrywanie niedostępne';return;}
      this.recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
      this.recorder.onstop=()=>{
        this.stream?.getTracks().forEach(t=>t.stop());if(this.url)URL.revokeObjectURL(this.url);
        this.url=URL.createObjectURL(new Blob(chunks,{type:mime}));this.link.href=this.url;this.link.download='Gorniczy-Zelek-pokaz.webm';this.link.textContent='Zapisz nagranie';this.link.hidden=false;
        this.button.disabled=false;this.button.textContent='Nagraj pokaz · 12 s';
      };
      this.link.hidden=true;this.button.disabled=true;this.button.textContent='Nagrywanie… poruszaj Żelkiem';this.recorder.start();this.timer=window.setTimeout(()=>this.recorder?.stop(),12000);
    },{signal:this.abort.signal});
  }
  dispose(){this.abort.abort();clearTimeout(this.timer);if(this.recorder){this.recorder.onstop=null;if(this.recorder.state==='recording')this.recorder.stop();}this.stream?.getTracks().forEach(t=>t.stop());if(this.url)URL.revokeObjectURL(this.url);this.root.remove();}
}
