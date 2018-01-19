import React, { Component } from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';

import { Position } from './TextDisplay';


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

const AxesLabel = styled.div`
  font-size: 8px;
  position: absolute;
`;


export default class WorldView extends Component {
  constructor() {
    super();
    this.scale = 5.0;
    this.shift = { x: 0, y: 0 };
    this.state = {
      showHUD: false,
      mouse: { x: 0, y: 0 },
    };
  }

  componentDidMount() {
    this.drawState(this.props);
    window.addEventListener('resize', () => this.drawState(this.props));
  }

  componentDidUpdate() {
    this.drawState(this.props);
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
  }

  drawCircle({ context, fillColor, x, y, radius }) {
    context.fillStyle = fillColor;
    const ctr = this.worldToCanvas({ x, y });
    const radCanvas = radius * this.scale;
    context.beginPath();
    context.arc(ctr.x, ctr.y, radCanvas, 0, Math.PI * 2);
    context.fill();
  }

  drawLine({ ctx, x1, y1, x2, y2, color }) {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  drawAxes() {
    const { canvas } = this;
    const { height } = canvas;
    const ctx = canvas.getContext('2d');
    const x0 = 10;
    const y0 = height - 10;
    const l = 20;
    this.drawLine({ ctx, x1: x0 + l, y1: y0, x2: x0, y2: y0, color: '#F00' });
    this.drawLine({ ctx, x1: x0, y1: y0, x2: x0, y2: y0 - l, color: '#0F0' });
  }

  drawState({ width, objects=[], center }) {
    this.canvas.height = this.div.clientHeight;
    const height = this.canvas.height;
    const { canvas } = this;
    if (center) {
      this.shift.x = -1.0 * (center.x - (width/this.scale/2));
      this.shift.y = -1.0 * (center.y - (height/this.scale/2));
    }
    canvas.getContext('2d').clearRect(0, 0, width, height);
    objects.forEach(object => {
      const ctx = canvas.getContext('2d');
      ctx.save();
      if (object.type === 'rect') {
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
      ctx.restore();
    });
    this.drawAxes();
  }

  worldToCanvas({ x, y }) {
    const scale = this.scale;
    const shiftX = this.shift.x;
    const shiftY = this.shift.y;
    const { height } = this.canvas;
    return {
      x: scale * (x+shiftX),
      y: height - (scale * (y+shiftY)),
    };
  }

  canvasToWorld({ x, y }) {
    const { height } = this.canvas;
    const scale = this.scale;
    const shiftX = this.shift.x;
    const shiftY = this.shift.y;
    return {
      x: x / scale - shiftX,
      y: (height - y) / scale - shiftY,
    };
  }


  render() {
    const { showHUD } = this.state;
    const setShowHUD = () => this.setState({ showHUD: true });
    const setHideHUD = () => this.setState({ showHUD: false });
    const setMouseLocation = ({ clientX, clientY }) => {
      const { top, left } = this.canvas.getBoundingClientRect();
      const x = clientX - left - 0;
      const y = clientY - top;
      const mouse = this.canvasToWorld({ x, y });
      this.setState({ mouse });
    };

    return (
      <div
        ref={div => { this.div = div; }}
        style={{ display: 'flex', flexFlow: 'column', height: '100%' }}
        onMouseEnter={setShowHUD}
        onMouseOver={setShowHUD}
        onMouseLeave={setHideHUD}
        onMouseOut={setHideHUD}
        onMouseMove={setMouseLocation}
      >
        <div
          style={{
            display: showHUD ? 'block': 'none',
            position: 'absolute',
            bottom: 2,
            right: 10,
          }}
        >
          <Position x={this.state.mouse.x} y={this.state.mouse.y} />
        </div>
        <AxesLabel style={{ bottom: 1, left: 32 }}>x</AxesLabel>
        <AxesLabel style={{ bottom: 29, left: 7 }}>y</AxesLabel>
        <canvas
          width={this.props.width}
          ref={canvas => { this.canvas = canvas; }}
        />
      </div>
    );
  }
}

WorldView.propTypes = {
  width: PropTypes.number.isRequired,
};

