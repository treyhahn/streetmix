export const DEFAULT_SEGMENTS = {
  'false': [ // Right-hand traffic
    { type: 'sidewalk', variant: { 'sidewalk-density': 'dense' }, width: 6 },
    { type: 'sidewalk-lamp', variant: { 'lamp-orientation': 'right', 'lamp-type': 'modern' }, width: 3 },
    { type: 'sidewalk-wayfinding', variant: { 'wayfinding-type': 'large' }, width: 5.5 },
    { type: 'parklet', variant: { 'orientation': 'left' }, width: 8 },
    { type: 'drive-lane', variant: { 'direction': 'outbound', 'car-type': 'truck' }, width: 10 },
    { type: 'parking-lane', variant: { 'parking-lane-direction': 'outbound', 'parking-lane-orientation': 'right' }, width: 8 },
    { type: 'divider', variant: { 'divider-type': 'flowers' }, width: 4.5 },
    { type: 'bike-lane', variant: { 'direction': 'inbound', 'bike-asphalt': 'colored' }, width: 6 },
    { type: 'bike-lane', variant: { 'direction': 'outbound', 'bike-asphalt': 'colored' }, width: 6 },
    { type: 'sidewalk-tree', variant: { 'tree-type': 'big' }, width: 2 },
    { type: 'bike-rack', variant: { 'orientation': 'left', 'bike-rack-elevation': 'sidewalk-parallel' }, width: 3 },
    { type: 'sidewalk-bench', variant: { 'bench-orientation': 'left' }, width: 6 }
    { type: 'sidewalk', variant: { 'sidewalk-density': 'normal' }, width: 6 }
  ],
  'true': [ // Left-hand traffic
    { type: 'sidewalk', variant: { 'sidewalk-density': 'normal' }, width: 6 },
    { type: 'sidewalk-bench', variant: { 'bench-orientation': 'left' }, width: 6 }
    { type: 'bike-rack', variant: { 'orientation': 'left', 'bike-rack-elevation': 'sidewalk-parallel' }, width: 3 },
    { type: 'sidewalk-tree', variant: { 'tree-type': 'big' }, width: 2 },
    { type: 'bike-lane', variant: { 'direction': 'outbound', 'bike-asphalt': 'colored' }, width: 6 },
    { type: 'bike-lane', variant: { 'direction': 'inbound', 'bike-asphalt': 'colored' }, width: 6 },
    { type: 'divider', variant: { 'divider-type': 'flowers' }, width: 4.5 },
    { type: 'parking-lane', variant: { 'parking-lane-direction': 'outbound', 'parking-lane-orientation': 'right' }, width: 8 },
    { type: 'drive-lane', variant: { 'direction': 'outbound', 'car-type': 'truck' }, width: 10 },
    { type: 'parklet', variant: { 'orientation': 'left' }, width: 8 },
    { type: 'sidewalk-wayfinding', variant: { 'wayfinding-type': 'large' }, width: 5.5 },
    { type: 'sidewalk-lamp', variant: { 'lamp-orientation': 'right', 'lamp-type': 'modern' }, width: 3 },
    { type: 'sidewalk', variant: { 'sidewalk-density': 'dense' }, width: 6 }
  ]
}
