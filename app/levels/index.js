// import DriveToBox from './DriveToBox';
import HelloTopics from './HelloTopics';
import Slalom from './Slalom';

const worlds = [
  {
    name: 'Holo',
    description: 'Meet Holo, the smartest vacuum around!',
    levels: [],
  },
  {
    name: 'Ego',
    description: 'Meet Ego, the smartest car in town!',
    levels: [
      HelloTopics,
      Slalom,
    ],
  },
  {
    name: 'Artie',
    description: 'Meet Artie, the smartest arm in reach!',
    levels: [],
  },
];

export default worlds;
