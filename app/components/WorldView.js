import React from 'react';
import { Component } from 'react';

const rotatePoint = (x0, y0, x1, y1, angle = 0) => {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const sin = Math.sin(angle);
  const cos = Math.cos(angle);

  const dx2 = dx * cos - dy * sin;
  const dy2 = dx * sin + dy * cos;

  return {
    x: x0+ dx2,
    y: y0 + dy2,
  };
};

export default class WorldView extends Component {
  constructor() {
    super();
    this.scale = 5.0;
    this.shift = { x: 0, y: -50 };
  }

  worldToCanvas({x, y}) {
    const scale = this.scale;
    const shiftX = this.shift.x;
    const shiftY = this.shift.y;
    const { width, height } = this.canvas;
    return {
      x: scale * (x+shiftX),
      y: height - (scale * (y+shiftY)),
    };
  }

  drawRectangle({ context, fillColor, x, y, width, length, heading }) {
    const l2 = length/2;
    const w2 = width/2;
    context.fillStyle = fillColor;
    context.beginPath();
    const p1 = this.worldToCanvas(rotatePoint(x, y, x + l2, y + w2, heading));
    const p2 = this.worldToCanvas(rotatePoint(x, y, x - l2, y + w2, heading));
    const p3 = this.worldToCanvas(rotatePoint(x, y, x - l2, y - w2, heading));
    const p4 = this.worldToCanvas(rotatePoint(x, y, x + l2, y - w2, heading));
    context.moveTo(p1.x, p1.y);
    context.lineTo(p2.x, p2.y);
    context.lineTo(p3.x, p3.y);
    context.lineTo(p4.x, p4.y);
    context.closePath();
    context.fill();
  };

  drawCircle({ context, fillColor, x, y, radius }) {
    context.fillStyle = fillColor;
    const ctr = this.worldToCanvas({ x, y });
    const radCanvas = radius * this.scale;
    context.beginPath();
    context.arc(ctr.x, ctr.y, radCanvas, 0, Math.PI * 2);
    context.fill();
  };

  drawState(objects=[], center) {
    const { canvas } = this;
    const { width, height } = canvas;
    if (center) {
      this.shift.x = -1.0 * (center.x - (width/this.scale/2));
      this.shift.y = -1.0 * (center.y - (height/this.scale/2));
    }
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    objects.forEach(object => {
      if (object.type === 'rectangle') {
      } else if (object.type === 'rect') {
        this.drawRectangle({
          ...object,
          context: ctx,
        });
      } else if (object.type === 'circle') {
        this.drawCircle({
          ...object,
          context: ctx,
        });
      }
    });
  }

  componentWillUpdate(newProps, newState) {
    this.drawState(newProps.objects, newProps.center);
  }

  componentDidMount() {
    this.drawState(this.props.objects);
  }

  render() {
    return <canvas
      style={{border: '1px solid black'}}
      width={this.props.width}
      height={this.props.height}
      ref={(canvas) => { this.canvas = canvas; }} />
  }
}
