const wall = ({ width, length, fillColor, name, state }) => ({
  name,
  draw: { type: 'rect', fillColor, width, length },
  asset: {
    collisionPolysM: [
      [
        { x: -length/2, y: -width/2 },
        { x: length/2, y: -width/2 },
        { x: length/2, y: width/2 },
        { x: -length/2, y: width/2 },
      ],
    ],
  },
  physics: { name: 'static' },
  state,
});

export default wall;
