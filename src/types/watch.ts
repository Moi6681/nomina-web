export interface WatchPart {
  id: string;
  name: string;
  description: string;
  price: number;
  color: string; // CSS color for preview
  accentColor?: string;
  specs: string[];
}

export interface WatchCategory {
  id: 'mecanismo' | 'esfera' | 'caja';
  label: string;
  icon: string;
  parts: WatchPart[];
}

export interface WatchConfig {
  mecanismo: WatchPart | null;
  esfera: WatchPart | null;
  caja: WatchPart | null;
}
