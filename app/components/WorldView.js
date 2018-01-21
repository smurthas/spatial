import React, { Component } from 'react';
import styled from 'styled-components';

import { Position } from './TextDisplay';

import assets from '../assets';


const AxesLabel = styled.div`
  font-size: 8px;
  position: absolute;
`;

const ZoomButton = styled.button`
  border: none;
  padding: 0;
  margin: 0;
  &:focus {
    outline: 0;
  }
  user-select: none;
`;


export default class WorldView extends Component {
  constructor() {
    super();
    this.shift = { x: 0, y: 0 };
    this.state = {
      scale: 8.0,
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


  drawImage({ context, asset }) {
    const { width: tw, height: th, scale, img } = assets[asset];
    const w = tw * this.state.scale / scale;
    const h = th * this.state.scale / scale;
    context.drawImage(img, -w/2, -h/2, w, h);
  }

  drawRectangle({ context, width, length, asset }) {
    const l2 = length/2 * this.state.scale;
    const w2 = width/2 * this.state.scale;
    context.beginPath();
    context.moveTo(l2, w2);
    context.lineTo(l2, -w2);
    context.lineTo(-l2, -w2);
    context.lineTo(-l2, w2);
    context.closePath();
    if (!asset) {
      context.fill();
    } else {
      context.clip();
      const t = assets[asset];
      const dx = t.width * this.state.scale / t.scale;
      const dy = t.height * this.state.scale / t.scale;
      for (let x = -l2; x <= l2; x += dx) {
        for (let y = w2; y >= -w2-dy; y -= dy) {
          const { img } = t;
          context.drawImage(img, x, y, dx, dy);
        }
      }
    }
  }

  drawCar({ context, x, y, width, length, heading }) {
    const l2 = length/2 * this.state.scale;
    const w2 = width/2 * this.state.scale;
    const r = 0.3 * this.state.scale;
    context.beginPath();
    const { x: xPx, y: yPx } = this.worldToCanvas({ x, y });
    context.translate(xPx, yPx);
    context.rotate(-heading);
    context.moveTo(l2 - r, w2);
    context.lineTo(l2, w2 - r);

    context.lineTo(l2, -w2 + r);
    context.lineTo(l2 - r, -w2);

    context.lineTo(-l2 + r, -w2);
    context.lineTo(-l2, -w2 + r);

    context.lineTo(-l2, w2 - r);
    context.lineTo(-l2 + r, w2);
    context.closePath();
    context.fill();

    context.fillStyle = '#000'; /* eslint no-param-reassign: 0 */

    // windshield
    context.beginPath();
    context.moveTo(l2*0.4, w2*0.6);
    context.lineTo(l2*0.5, 0);
    context.lineTo(l2*0.4, -w2*0.6);
    context.lineTo(l2*0.0, -w2*0.5);
    context.lineTo(l2*0.0, w2*0.5);
    context.closePath();
    context.fill();

    // rear window
    context.beginPath();
    context.moveTo(-l2*0.8, w2*0.4);
    context.lineTo(-l2*0.8, -w2*0.4);
    context.lineTo(-l2*0.6, -w2*0.5);
    context.lineTo(-l2*0.6, w2*0.5);
    context.closePath();
    context.fill();

    // left window
    context.beginPath();
    context.moveTo(l2*0.2, -w2*0.7);
    context.lineTo(l2*0.2, -w2*0.8);
    context.lineTo(-l2*0.4, -w2*0.8);
    context.lineTo(-l2*0.4, -w2*0.6);
    context.closePath();
    context.fill();

    // left window
    context.beginPath();
    context.moveTo(l2*0.2, w2*0.7);
    context.lineTo(l2*0.2, w2*0.8);
    context.lineTo(-l2*0.4, w2*0.8);
    context.lineTo(-l2*0.4, w2*0.6);
    context.closePath();
    context.fill();
  }

  drawCircle({ context, x, y, radius }) {
    const ctr = this.worldToCanvas({ x, y });
    const radCanvas = radius * this.state.scale;
    context.beginPath();
    context.arc(ctr.x, ctr.y, radCanvas, 0, Math.PI * 2);
    context.fill();
  }

  drawLine({ ctx, x1, y1, x2, y2 }) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  drawAxes() {
    const { canvas } = this;
    const { height } = canvas;
    const ctx = canvas.getContext('2d');
    const x0 = 20;
    const y0 = height - 20;
    const l = 40;
    ctx.strokeStyle = '#F00';
    this.drawLine({ ctx, x1: x0 + l, y1: y0, x2: x0, y2: y0 });
    ctx.strokeStyle = '#0F0';
    this.drawLine({ ctx, x1: x0, y1: y0, x2: x0, y2: y0 - l });
  }

  drawState({ objects=[], center }) {
    this.canvas.style.height = `${this.div.clientHeight}px`;
    this.canvas.style.width = `${this.div.clientWidth}px`;
    this.canvas.height = this.div.clientHeight * 2;
    this.canvas.width = this.div.clientWidth * 2;
    const { canvas } = this;
    const { width, height } = canvas;
    if (center) {
      this.shift.x = -1.0 * (center.x - (width/this.state.scale/4));
      this.shift.y = -1.0 * (center.y - (height/this.state.scale/4));
    }
    canvas.getContext('2d').clearRect(0, 0, width/2, height/2);
    objects.forEach(object => {
      const ctx = canvas.getContext('2d');
      ctx.save();
      ctx.scale(2, 2);
      if (object.fillColor) {
        ctx.fillStyle = object.fillColor;
      }
      if (object.type === 'rect') {
        const { x: xPx, y: yPx } = this.worldToCanvas(object);
        ctx.translate(xPx, yPx);
        if (object.heading) {
          ctx.rotate(-object.heading);
        }
        this.drawRectangle({
          ...object,
          context: ctx,
        });
      } else if (object.type === 'img') {
        const { x: xPx, y: yPx } = this.worldToCanvas(object);
        ctx.translate(xPx, yPx);
        if (object.heading) {
          ctx.rotate(-object.heading);
        }
        this.drawImage({
          ...object,
          context: ctx,
        });
      } else if (object.type === 'car') {
        this.drawCar({
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
    const { scale } = this.state;
    const shiftX = this.shift.x;
    const shiftY = this.shift.y;
    const { height } = this.canvas;
    return {
      x: scale * (x+shiftX),
      y: (height/2) - (scale * (y+shiftY)),
    };
  }

  canvasToWorld({ x, y }) {
    const { height } = this.canvas;
    const { scale } = this.state;
    const shiftX = this.shift.x;
    const shiftY = this.shift.y;
    return {
      x: x / scale - shiftX,
      y: (height/2 - y) / scale - shiftY,
    };
  }

  zoomIn() {
    this.setState({
      scale: this.state.scale * 1.1,
    });
  }

  zoomOut() {
    this.setState({
      scale: this.state.scale / 1.1,
    });
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
        onFocus={setShowHUD}
        onMouseLeave={setHideHUD}
        onMouseOut={setHideHUD}
        onBlur={setHideHUD}
        onMouseMove={setMouseLocation}
      >
        <div
          style={{
            display: showHUD ? 'block': 'none',
            position: 'absolute',
            top: 10,
            right: 10,
          }}
        >
          <div><ZoomButton onClick={() => this.zoomIn()}>[+]</ZoomButton></div>
          <div><ZoomButton onClick={() => this.zoomOut()}>[-]</ZoomButton></div>
        </div>
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
          ref={canvas => { this.canvas = canvas; }}
        />
      </div>
    );
  }
}

