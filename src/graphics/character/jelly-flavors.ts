export type JellyFlavor = {
  readonly surface:string;
  readonly absorption:readonly [number,number,number];
};

export const JELLY_FLAVORS={
  lime:{surface:'#eaffd4',absorption:[48,3.2,85]},
  copper:{surface:'#ffe2ca',absorption:[4,24,42]},
  crystal:{surface:'#f5faff',absorption:[2,1.5,1]},
  ruby:{surface:'#ffd5dd',absorption:[3,60,45]},
} as const satisfies Record<string,JellyFlavor>;

export type JellyFlavorName=keyof typeof JELLY_FLAVORS;
export const DEFAULT_JELLY_FLAVOR:JellyFlavorName='copper';
export const FLAVOR_LABELS:Record<JellyFlavorName,string>={lime:'Oryginalny Zielony',copper:'Ceglasta Miedź',crystal:'Kryształowa Biel',ruby:'Rubinowy Górniczy'};
