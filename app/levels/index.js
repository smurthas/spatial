// import DriveToBox from './DriveToBox';
import HelloDidi from './HelloDidi';
import HelloTopics from './HelloTopics';
import Slalom from './Slalom';

const worlds = [
  {
    name: 'Didi',
    description: 'Meet Didi, the smartest vacuum around!',
    levels: [
      HelloDidi,
    ],
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
