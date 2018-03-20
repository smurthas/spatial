// import DriveToBox from './DriveToBox';
import HelloDidi from './HelloDidi';
import DidiGoesHome from './DidiGoesHome';
import HelloTopics from './HelloTopics';
import Slalom from './Slalom';

const worlds = [
  {
    name: 'Didi',
    description: 'Meet Didi, the smartest vacuum around!',
    levels: [
      DidiGoesHome,
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
];

export default worlds;
