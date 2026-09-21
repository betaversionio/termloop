export interface WallpaperOption {
  id: string;
  label: string;
  type: 'gradient' | 'image';
  value: string;
}

export const DEFAULT_WALLPAPER_ID = 'image-betaversion';

export const WALLPAPERS: WallpaperOption[] = [
  {
    id: 'image-betaversion',
    label: 'BetaVersion',
    type: 'image',
    value: 'https://media.betaversion.io/brand/betaversion-default.png',
  },

  // ── Photos ──
  {
    id: 'photo-northern-lights',
    label: 'Northern Lights',
    type: 'image',
    value:
      'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1920&q=80&fit=crop',
  },
  {
    id: 'photo-mountain-lake',
    label: 'Mountain Lake',
    type: 'image',
    value:
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80&fit=crop',
  },
  {
    id: 'photo-desert-dunes',
    label: 'Desert Dunes',
    type: 'image',
    value:
      'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=1920&q=80&fit=crop',
  },
  {
    id: 'photo-tropical-beach',
    label: 'Tropical Beach',
    type: 'image',
    value:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80&fit=crop',
  },
  {
    id: 'photo-starry-night',
    label: 'Starry Night',
    type: 'image',
    value:
      'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1920&q=80&fit=crop',
  },
  {
    id: 'photo-nebula',
    label: 'Nebula',
    type: 'image',
    value:
      'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1920&q=80&fit=crop',
  },
  {
    id: 'photo-abstract-gradient',
    label: 'Abstract Flow',
    type: 'image',
    value:
      'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1920&q=80&fit=crop',
  },
  {
    id: 'photo-misty-forest',
    label: 'Misty Forest',
    type: 'image',
    value:
      'https://images.unsplash.com/photo-1511497584788-876760111969?w=1920&q=80&fit=crop',
  },
  {
    id: 'photo-cherry-blossoms',
    label: 'Cherry Blossoms',
    type: 'image',
    value:
      'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=1920&q=80&fit=crop',
  },
  {
    id: 'photo-ocean-aerial',
    label: 'Ocean Aerial',
    type: 'image',
    value:
      'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=1920&q=80&fit=crop',
  },
  {
    id: 'photo-autumn-forest',
    label: 'Autumn Forest',
    type: 'image',
    value:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1920&q=80&fit=crop',
  },
  {
    id: 'photo-milky-way',
    label: 'Milky Way',
    type: 'image',
    value:
      'https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?w=1920&q=80&fit=crop',
  },
  {
    id: 'photo-snowy-mountains',
    label: 'Snowy Mountains',
    type: 'image',
    value:
      'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?w=1920&q=80&fit=crop',
  },
  {
    id: 'photo-waterfall',
    label: 'Waterfall',
    type: 'image',
    value:
      'https://images.unsplash.com/photo-1432405972618-c6b0cfba8673?w=1920&q=80&fit=crop',
  },
  {
    id: 'photo-volcano',
    label: 'Volcano',
    type: 'image',
    value:
      'https://images.unsplash.com/photo-1462332420958-a05d1e002413?w=1920&q=80&fit=crop',
  },
  {
    id: 'photo-city-night',
    label: 'City Night',
    type: 'image',
    value:
      'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1920&q=80&fit=crop',
  },
  {
    id: 'photo-coral-reef',
    label: 'Coral Reef',
    type: 'image',
    value:
      'https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=1920&q=80&fit=crop',
  },
  {
    id: 'photo-lavender-field',
    label: 'Lavender Field',
    type: 'image',
    value:
      'https://images.unsplash.com/photo-1499002238440-d264edd596ec?w=1920&q=80&fit=crop',
  },
  {
    id: 'photo-earth-from-space',
    label: 'Earth',
    type: 'image',
    value:
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80&fit=crop',
  },
  {
    id: 'photo-dark-clouds',
    label: 'Storm Clouds',
    type: 'image',
    value:
      'https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=1920&q=80&fit=crop',
  },

  // ── Photos (local) ──
  {
    id: 'photo-red-canyon',
    label: 'Red Canyon',
    type: 'image',
    value: '/wallpapers/wil-stewart-pHANr-CpbYM-unsplash.jpg',
  },
  {
    id: 'photo-coastal-village',
    label: 'Coastal Village',
    type: 'image',
    value: '/wallpapers/anders-jilden-cYrMQA7a3Wc-unsplash.jpg',
  },
  {
    id: 'photo-forest-coastline',
    label: 'Forest Coastline',
    type: 'image',
    value: '/wallpapers/andreas-gucklhorn-mawU2PoJWfU-unsplash.jpg',
  },
  {
    id: 'photo-lightning-storm',
    label: 'Lightning Storm',
    type: 'image',
    value: '/wallpapers/breno-machado-in9-n0JwgZ0-unsplash.jpg',
  },
  {
    id: 'photo-misty-peaks',
    label: 'Misty Peaks',
    type: 'image',
    value: '/wallpapers/urban-vintage-78A265wPiO4-unsplash.jpg',
  },
  {
    id: 'photo-harbor-sunset',
    label: 'Harbor Sunset',
    type: 'image',
    value: '/wallpapers/wade-meng-LgCj9qcrfhI-unsplash.jpg',
  },
];
