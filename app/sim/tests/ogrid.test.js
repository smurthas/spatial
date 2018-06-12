import OGrid from '../OGrid';
import Pose from '../Pose';

const origin = { x: 10, y: 15 };
const resolution = 0.1;

const build = () => new OGrid({
  origin,
  rows: 5,
  cols: 7,
  resolution,
});

describe('ogrid', () => {
  it('should getCenterOfCell', () => {
    const g = build();

    const zeroZero = g.getCenterOfCell(0, 0);
    expect(zeroZero.x).toBeCloseTo(origin.x, 5);
    expect(zeroZero.y).toBeCloseTo(origin.y, 5);
  });

  it('should {set,get}ValueForCellAtPose', () => {
    const g = build();

    // each increment of size resolution moves a cell
    const pose = new Pose({
      position: {
        x: origin.x + resolution*3,
        y: origin.y - resolution*2,
      },
    });
    const setValue = 0.5;
    g.setValueForCellAtPose(pose, setValue);
    const getValue = g.getCell(-2, 3);
    expect(getValue).toBeCloseTo(setValue, 5);
    expect(g.getValueForCellAtPose(new Pose({ position: origin }))).toBe(-1);

    // out of bound is undefined
    const oob = g.getCell(-20, 30);
    expect(oob).toBeUndefined();
  });

  it('should getNeighborsOfRowCol', () => {
    const g = build();

    const n = g.getNeighborsOfRowCol(2, 3);
    expect(n.length).toEqual(2);
    expect(n).toContainEqual([1, 3]);
    expect(n).toContainEqual([2, 2]);

    const n2 = g.getNeighborsOfRowCol(1, 3);
    expect(n2.length).toEqual(3);
    expect(n2).toContainEqual([2, 3]);
    expect(n2).toContainEqual([1, 2]);
    expect(n2).toContainEqual([0, 3]);

    const n3 = g.getNeighborsOfRowCol(1, 2);
    expect(n3.length).toEqual(4);
    expect(n3).toContainEqual([2, 2]);
    expect(n3).toContainEqual([1, 1]);
    expect(n3).toContainEqual([0, 2]);
    expect(n3).toContainEqual([1, 3]);
  });
});
