// TODO This may be better if merged directly with segments,
// but different segments may refer to the same variants (e.g. orientation)
// Also this includes building variants, which are its own types of things
export const VARIANT_ICONS = {
  'building': {
    'waterfront': {
      'id': 'waterfront',
      'title': 'Waterfront'
    },
    'grass': {
      'id': 'grass',
      'title': 'Grass'
    },
    'fence': {
      'id': 'fence',
      'title': 'Empty lot'
    },
    'parking-lot': {
      'id': 'car',
      'title': 'Parking lot'
    },
    'residential': {
      'id': 'residential',
      'title': 'Home'
    },
    'narrow': {
      'id': 'building-thin',
      'title': 'Narrow building'
    },
    'wide': {
      'id': 'building-wide',
      'title': 'Wide building'
    }
  },
  'direction': {
    'inbound': {
      'id': 'direction-inbound',
      'title': 'Inbound'
    },
    'outbound': {
      'id': 'direction-outbound',
      'title': 'Outbound'
    }
  },
  'parking-lane-direction': {
    'inbound': {
      'id': 'direction-inbound',
      'title': 'Inbound'
    },
    'outbound': {
      'id': 'direction-outbound',
      'title': 'Outbound'
    },
    'sideways': {
      'id': 'direction-both',
      'title': 'Perpendicular'
    }
  },
  'tree-type': {
    'big': {
      'id': 'tree',
      'title': 'Tree'
    },
    'palm-tree': {
      'id': 'palm-tree',
      'title': 'Palm tree'
    }
  },
  'lamp-orientation': {
    'left': {
      'id': 'direction-left',
      'title': 'Left'
    },
    'both': {
      'id': 'direction-both',
      'title': 'Both'
    },
    'right': {
      'id': 'direction-right',
      'title': 'Right'
    }
  },
  'lamp-type': {
    'modern': {
      'id': 'lamp-modern',
      'title': 'Modern'
    },
    'traditional': {
      'id': 'lamp-traditional-right',
      'title': 'Traditional'
    },
    'pride': {
      'id': 'rainbow',
      'title': 'Modern with pride banner'
    }
  },
  'bench-orientation': {
    'left': {
      'id': 'direction-left',
      'title': 'Left'
    },
    'center': {
      'id': 'direction-both',
      'title': 'Center'
    },
    'right': {
      'id': 'direction-right',
      'title': 'Right'
    }
  },
  'turn-lane-orientation': {
    'left': {
      'id': 'turn-lane-left',
      'title': 'Left'
    },
    'left-straight': {
      'id': 'turn-lane-left-straight',
      'title': 'Left and straight'
    },
    'straight': {
      'id': 'turn-lane-straight',
      'title': 'Straight'
    },
    'right-straight': {
      'id': 'turn-lane-right-straight',
      'title': 'Right and straight'
    },
    'right': {
      'id': 'turn-lane-right',
      'title': 'Right'
    },
    'both': {
      'id': 'turn-lane-both',
      'title': 'Both'
    },
    'shared': {
      'id': 'turn-lane-shared',
      'title': 'Shared'
    }
  },
  'divider-type': {
    'median': {
      'id': 'median',
      'title': 'Median'
    },
    'striped-buffer': {
      'id': 'buffer',
      'title': 'Striped buffer'
    },
    'planting-strip': {
      'id': 'grass',
      'title': 'Greenstreet Planting'
    },
    'planter-box': {
      'id': 'planter-box',
      'title': 'Planter box'
    },
    'bush': {
      'id': 'bush',
      'title': 'Greenstreet Planting'
    },
    'flowers': {
      'id': 'flowers',
      'title': 'Greenstreet Planting'
    },
    'big-tree': {
      'id': 'tree',
      'title': 'Greenstreet Planting'
    },
    'palm-tree': {
      'id': 'palm-tree',
      'title': 'Greenstreet Planting'
    },
    'bollard': {
      'id': 'bollard',
      'title': 'Bollard'
    },
    'dome': {
      'id': 'dome',
      'title': 'Traffic exclusion dome'
    }
  },
  'orientation': {
    'left': {
      'id': 'orientation-left',
      'title': 'Left'
    },
    'right': {
      'id': 'orientation-right',
      'title': 'Right'
    }
  },
  'public-transit-asphalt': {
    'regular': {
      'id': 'asphalt',
      'color': '#292a29',
      'title': 'Asphalt'
    },
    'colored': {
      'id': 'asphalt',
      'color': '#9b1f22',
      'title': 'Red lane'
    }
  },
  'bus-asphalt': {
    'regular': {
      'id': 'asphalt',
      'color': '#292a29',
      'title': 'Asphalt'
    },
    'colored': {
      'id': 'asphalt',
      'color': '#9b1f22',
      'title': 'Red lane'
    },
    'shared': {
      'id': 'sharrow',
      'title': 'Shared bus/bike lane'
    }
  },
  'bike-asphalt': {
    'regular': {
      'id': 'asphalt',
      'color': '#292a29',
      'title': 'Asphalt'
    },
    'colored': {
      'id': 'asphalt',
      'color': '#2b6750',
      'title': 'Green lane'
    }
  },
  'transit-shelter-elevation': {
    'street-level': {
      'id': 'elevation-lower',
      'title': 'Street level'
    },
    'light-rail': {
      'id': 'elevation-higher',
      'title': 'Light rail platform'
    }
  },
  'bike-rack-elevation': {
    'sidewalk-parallel': {
      'id': 'direction-both',
      'title': 'Parallel parking, sidewalk level'
    },
    'sidewalk': {
      'id': 'elevation-higher',
      'title': 'Perpendicular parking, sidewalk level'
    },
    'road': {
      'id': 'elevation-lower',
      'title': 'CityRack Bike Corral'
    }
  },
  'car-type': {
    'car': {
      'id': 'car',
      'title': 'Car'
    },
    'sharrow': {
      'id': 'sharrow',
      'title': 'Sharrow'
    },
    'truck': {
      'id': 'truck',
      'title': 'Truck'
    }
  },
  'sidewalk-density': {
    'dense': {
      'id': 'sidewalk-density-dense',
      'title': 'Dense'
    },
    'normal': {
      'id': 'sidewalk-density-normal',
      'title': 'Normal'
    },
    'sparse': {
      'id': 'sidewalk-density-sparse',
      'title': 'Sparse'
    },
    'empty': {
      'id': '',
      'title': 'Empty'
    }
  },
  'parking-lane-orientation': {
    'left': {
      'id': 'orientation-left',
      'title': 'Left'
    },
    'right': {
      'id': 'orientation-right',
      'title': 'Right'
    }
  },
  'wayfinding-type': {
    'large': {
      'id': 'wayfinding-large',
      'title': 'Large'
    },
    'medium': {
      'id': 'wayfinding-medium',
      'title': 'Medium'
    },
    'small': {
      'id': 'wayfinding-small',
      'title': 'Small'
    }
  }
}
