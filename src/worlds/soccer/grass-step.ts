/** Procedural footstep on turf, fitted to a recorded walk on grass.
 *
 * `refs/walk-on-grass.wav` is not shipped or played. It was measured once,
 * offline, into two small tables:
 * - per step, a spectro-temporal envelope: RMS level in nine octave bands
 *   (40 Hz–20 kHz) over 52 frames of 8 ms, holding the heel strike, roll,
 *   push-off and tail of every band;
 * - one long-term spectrum at 1/6-octave resolution, the fine shape inside
 *   each octave (e.g. the 50 Hz weight thump against the 80 Hz dip).
 * Each band is synthesized in the frequency domain with the same brick-wall
 * edges used for the measurement, shaped by the fine spectrum, then follows its
 * measured envelope. Bands above 2.8 kHz are driven by dense sub-millisecond
 * grains instead of smooth noise: the blade crackle (high-band kurtosis ≈4.5).
 * Variants pair each measured step with different noise seeds.
 */
const BANDS:readonly [number,number][]=[[40,90],[90,180],[180,355],[355,710],[710,1400],[1400,2800],[2800,5600],[5600,11200],[11200,20000]];
const FRAME=.008;
const FRAMES=52;
/** First band driven by crackle grains instead of smooth noise. */
const GRAIN_BAND=6;
const GRAIN_RATE=14000;
/** Bands narrow enough that their own random swells need flattening. */
const SMOOTHED_BANDS=3;
/** Amplitude of the loudest measured band-frame (0 dB in the table). */
const PEAK_BAND_LEVEL=.2;
/** Long-term spectrum: dB below its peak at 31.25 Hz · 2^(k/6), char code − 48. */
const FINE_SPECTRUM="E;08?>BDGIILKNQRPSQPQMMQOPOMNNPOQRUUVWXXXXWVWVUUTTVXZ\\]^bvv";
const STEP_ENVELOPES:readonly string[]=[
  ">84347?A;<==C@<=;8:><=>@FD@BBBGDACB?@BBCBBC?>A@BECDBKDFMOQKIDCC?@GMJMOQHLOMWWMMNMR[`XXUMJOWXUXUMPTVOOQMPJE@DCHEHEBIKGJGINKUHO[TPQQQPVVXUTVVTRURTTT`ZTUX]\\Y\\X@?>?<AD@?CDB@JHHHKIKQOROOQUORWRTYZYYXXWWZ\\]]WZWXX\\\\X@=A;:959:9;BCAFJJLIGKKQPOMVPROPSSWWTTWXTVZWWY[WZZYY]AAB>@@?B<>EFHFIKFKEFLOOTQRSRMQPOSWUXY[[[ZYXYY[[]]\\Y]@>>;=>?>?>BBDFGHHJHJKJMNQPOONNPRPRUUUXXUYWYYYYZYZZYZ;99:9::99;=>AAAEEHIIHIIJLLJKKKKMLPQQQSRQTTVVWWVVUVVW@=@@@@?@@@@BCCDGHKLLMMPQNMMNOOPOQRSPRWYWYZ[]Z[[[[\\[\\",
  "?A>@?=<;=535526:5588>>98558:9><;>65;;<L<?B<E?=@<=G?@NSPMLA@CHENIGBFHFAELMPQHJKSUQYPPYRPOQQMLNQUYWV]W[QMSOPNOGAJCCHCLIGEFJGPHLBGMKPNMMRVPWSTUSRUZUYX\\WUVXRZ[\\RSJIIBC;><>EEICBDCCG@>DGGKMOQQOORRUTTPTXTWU\\VU[UWZXWQQKHEAD?=>:;EBCG??;EA:EHJKJQNMOPSTUNMQVXYZYZXZ[Y[XWWQPOLGHBA?>=@DHBEADBHEFLNLINMNOQPSTRQMOWXXY[YX[[][\\[ZQOMKGCA<;<=?@A@AAABCCBFFFFGIJJLNOONLNORSTVXXYXXYZYXYJHFDA><8767;<><>>>@AAAABBBEFFHHJKLMNNOQRSSUUVVVVVVVUJKJHDC@?<;=@AABAAADFFEGGIIIIIIKMMOPPQRWZZ[[[[[[]\\[[[",
  "><=@C;644578:89B88=9::7;=8988<>=D?<>=?B<=?<@@=B>=F@>F?CHGDJRSIFCACDKMD@EOQMTOLMSY^X^YQMOSQUQ[PKOLMOJPOMMKGEC<@BELGCBCHGNGIE?HLPPPPQONOMPTRNMSTRTUZWZbWTQTTXXI@?F?CAFEDF;=<=E@BBBILPNPQOPUQSLSONRURKOUVWXVSTXWVRULEDB==B@AA>7@C<FEF>=MKGGGJOJNOQIPPRPRTNOQWWXTSUXVXVSMDCAA<C@DB?>B>=BHIA?OPJMNNONOOUPSQSRWUNUVVXTUTUVUSRQMC?<==@?A@@@D>@EGHHFKIJGIKJHJNOPOLQQRSPRSTTUUTUTSRQQH?<999<>>==<<;;?CCDCGGFGEFHGHJMMLLKMQRNQRSSSSTSSRPOPJD?>>>@CBBA@???BDGHIKKIHHHIJKNOPQNOQTVTUWYYY[ZYYYWTS",
  "GGCA93004:@<9;;;G;9AA>HCC?=FB>BDCFAEI@BDADCCD@BD@DBAGA>CFBGRC==>HIPLIELCCIJHENIKKLNVTNKSVTXTRWXUKLSRX[XZGFD@;@??AC=CEEHMEHHOHMNMMRPWTUXRSKNRWUYZYVWRZ[WVUX\\[GIED88?=?G;==A:?>=E@BDIGMGJLURRQRPTWVSSTY\\ZW^[W\\Y^aZLHEF??:?@?B>=:7;7;ABDGGFFILOMRPRQSTSPOKSUZVZ\\]YXZ_`^NIEB>?9BBB@?A@>A=?AEEGGIHHKLMKTPSQTSQLMTXX[Y\\\\\\\\_`__KEC@=<9?=<<<======>>BBDCEEFHJLLPRPONLMNSTUUWY[W[\\[\\^IC>=975::99:89777867:=<@AA@DGIKKLNIINNNPONTUWXUX[ZZ]NHDA@>>>???>>>==<<<<>@@ADEFHILLOQRONNOPSSSXYZ[[[^^_`"
];

export const GRASS_STEP_VARIANTS=8;
export const GRASS_STEP_DURATION=FRAMES*FRAME+.012;

/** In-place iterative radix-2 FFT (inverse when `inverse`). */
function fft(re:Float64Array,im:Float64Array,inverse:boolean) {
  const n=re.length;
  for(let i=1,j=0;i<n;i++){let bit=n>>1;for(;j&bit;bit>>=1)j^=bit;j^=bit;if(i<j){[re[i],re[j]]=[re[j],re[i]];[im[i],im[j]]=[im[j],im[i]];}}
  for(let size=2;size<=n;size<<=1) {
    const angle=(inverse?2:-2)*Math.PI/size,wr=Math.cos(angle),wi=Math.sin(angle),half=size>>1;
    for(let start=0;start<n;start+=size) {
      let cr=1,ci=0;
      for(let k=0;k<half;k++) {
        const a=start+k,b=a+half,tr=re[b]*cr-im[b]*ci,ti=re[b]*ci+im[b]*cr;
        re[b]=re[a]-tr;im[b]=im[a]-ti;re[a]+=tr;im[a]+=ti;
        const nr=cr*wr-ci*wi;ci=cr*wi+ci*wr;cr=nr;
      }
    }
  }
}

function fineGain(frequency:number) {
  const k=Math.max(0,Math.min(FINE_SPECTRUM.length-1.001,6*Math.log2(Math.max(frequency,31.25)/31.25))),i=Math.floor(k),u=k-i;
  const db=(FINE_SPECTRUM.charCodeAt(i)-48)*(1-u)+(FINE_SPECTRUM.charCodeAt(i+1)-48)*u;
  return 10**(-db/20);
}

export function makeGrassStepSample(variant:number,sampleRate:number) {
  const length=Math.ceil(GRASS_STEP_DURATION*sampleRate),out=new Float32Array(length);
  const table=STEP_ENVELOPES[variant%STEP_ENVELOPES.length];
  let seed=(0x2f6b1d3+variant*0x9e3779b1)>>>0;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  let size=1;while(size<length)size<<=1;
  const re=new Float64Array(size),im=new Float64Array(size),binHz=sampleRate/size;
  for(let band=0;band<BANDS.length;band++) {
    const [low,high]=BANDS[band];
    re.fill(0);im.fill(0);
    if(band<GRAIN_BAND) {
      // Random-phase noise built directly in the band.
      for(let b=1;b<size/2;b++){const f=b*binHz;if(f<low||f>=high)continue;const a=2*Math.PI*random();re[b]=Math.cos(a);im[b]=Math.sin(a);}
    } else {
      for(let t=0;;) {
        t+=-Math.log(1-random())/GRAIN_RATE;
        const start=Math.floor(t*sampleRate);if(start>=length)break;
        const width=(.00008+.0003*random())*sampleRate,amplitude=(random()<.5?-1:1)*(.3+random());
        for(let k=0,end=Math.min(length-start,Math.ceil(width*5));k<end;k++)re[start+k]+=amplitude*(random()*2-1)*Math.exp(-k/width);
      }
      fft(re,im,false);
      for(let b=0;b<size;b++){const f=Math.min(b,size-b)*binHz;if(f<low||f>=high){re[b]=0;im[b]=0;}}
      for(let b=size/2+1;b<size;b++){re[b]=0;im[b]=0;}
    }
    for(let b=1;b<size/2;b++){const g=fineGain(b*binHz);re[b]*=g;im[b]*=g;}
    // Real signal from the positive half-spectrum.
    for(let b=size/2+1;b<size;b++){re[b]=re[size-b];im[b]=-im[size-b];}
    fft(re,im,true);
    if(band<SMOOTHED_BANDS) {
      // A band only tens of Hz wide swells randomly over tens of milliseconds,
      // which would blur its measured envelope. Divide out its own local RMS
      // (two periods of the band's low edge) so the step's weight follows the
      // recording frame by frame.
      const window=Math.ceil(2*sampleRate/low),half=window>>1;let sum=0;
      const local=new Float32Array(length);
      for(let i=-half;i<length+half;i++){const add=i+half<size?re[Math.min(size-1,Math.max(0,i+half))]**2:0,drop=i-half-1>=0?re[i-half-1]**2:0;sum+=add-drop;if(i>=0&&i<length)local[i]=Math.sqrt(Math.max(1e-24,sum/window));}
      for(let i=0;i<length;i++)re[i]/=local[i];
    }
    let energy=0;for(let i=0;i<length;i++)energy+=re[i]*re[i];
    const unit=PEAK_BAND_LEVEL/Math.sqrt(Math.max(1e-24,energy/length));
    // Follow the measured dB envelope, interpolated between frame centres.
    for(let i=0;i<length;i++) {
      const f=Math.min(FRAMES-1,Math.max(0,i/sampleRate/FRAME-.5)),k=Math.floor(f),n=Math.min(FRAMES-1,k+1),u=f-k;
      const db=(table.charCodeAt(band*FRAMES+k)-48)*(1-u)+(table.charCodeAt(band*FRAMES+n)-48)*u;
      out[i]+=re[i]*unit*10**(-db/20);
    }
  }
  const fadeIn=Math.ceil(.001*sampleRate),fadeOut=Math.ceil(.012*sampleRate);
  for(let i=0;i<length;i++)out[i]=Math.max(-.95,Math.min(.95,out[i]))*Math.min(1,i/fadeIn,(length-1-i)/fadeOut);
  out[0]=0;out[length-1]=0;
  return out;
}
