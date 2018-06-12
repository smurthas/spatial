// const OCCUPIED = 1;
const UNKNOWN = -1;
// const FREE = 0;

class OGrid {
  constructor({ origin, rows, cols, resolution }) {
    this.origin = origin;
    this.rows = rows;
    this.cols = cols;
    this.resolution = resolution;
    this.maxRow = (this.rows - 1) / 2;
    this.maxCol = (this.cols - 1) / 2;

    this.reset();
  }

  reset() {
    this.grid = [];
    for (let i = 0; i < this.rows*this.cols; i++) {
      this.grid[i] = UNKNOWN;
    }
  }

  cellToIndex(row, col) {
    if (Math.abs(row) > this.maxRow || Math.abs(col) > this.maxCol) {
      return -1;
    }
    const r = row + this.maxRow;
    const c = col + this.maxCol;
    return r * this.cols + c;
  }

  getCell(row, col) {
    return this.grid[this.cellToIndex(row, col)];
  }

  setCell(row, col, value) {
    this.grid[this.cellToIndex(row, col)] = value;
  }

  getRowColForPose(pose) {
    const { x, y } = pose.position;
    const row = Math.round((y - this.origin.y) / this.resolution);
    const col = Math.round((x - this.origin.x) / this.resolution);
    return { row, col };
  }

  getCenterOfCell(row, col) {
    return {
      x: this.origin.x + (col * this.resolution),
      y: this.origin.y + (row * this.resolution),
    };
  }

  getValueForCellAtPose(pose) {
    const { row, col } = this.getRowColForPose(pose);
    return this.getCell(row, col);
  }

  setValueForCellAtPose(pose, value) {
    const { row, col } = this.getRowColForPose(pose);
    this.setCell(row, col, value);
  }

  isInBounds(row, col) {
    return Math.abs(row) <= this.maxRow && Math.abs(col) <= this.maxCol;
  }

  getNeighborsOfRowCol(row, col) {
    return [[1, 0], [0, -1], [-1, 0], [0, 1]]
      .map(([r, c]) => [row + r, col + c])
      .filter(([r, c]) => this.isInBounds(r, c));
  }
}

export default OGrid;
