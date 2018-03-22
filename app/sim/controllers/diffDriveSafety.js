
/*
 * A differential drive "safety controller" that ensures a front bumper
 * collision results in reversing instead of listening to the input command
 */

export default class DiffDriveSafetyController {
  constructor(options, topics) {
    const {
      poseTopic,
      cmdTopic,
      publishControlsTopic,
      collisionTopic,
      trackWidth,
    } = options;

    // on collision, maintain a counter of backup poses
    let backupSteps = 0;
    topics.on(collisionTopic, () => { backupSteps = 15; });

    // when a pose is published, decrement the counter, w min of zero
    topics.on(poseTopic, () => {
      backupSteps = Math.max(0, backupSteps - 1);
    });

    topics.on(cmdTopic, ({ linear = 0, angular = 0 }) => {
      // if we are still backing up, do that, don't listen to command
      if (backupSteps > 0) {
        topics.emit(publishControlsTopic, {
          wheelSpeeds: {
            left: -0.1,
            right: -0.1,
          },
        });
        return;
      }

      // otherwise, calculate wheel speeds from angular and linear speeds
      const dv = angular * trackWidth / 2;
      const controls = {
        wheelSpeeds: {
          left: linear - dv,
          right: linear + dv,
        },
      };
      topics.emit(publishControlsTopic, controls);
    });
  }
}
