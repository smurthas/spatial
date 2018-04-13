/* setup.js */

import fs from 'fs';
import path from 'path';

import { Image } from 'canvas';
import { mount } from 'enzyme';
import React from 'react';
import sinon from 'sinon';
import { Provider } from 'react-redux';
import { browserHistory } from 'react-router';

// must be set before imports
/* eslint import/first: 0 */
global.window.localStorage = {
  setItem() {},
  getItem() {},
};

global.window.requestAnimationFrame = () => {};

import configureStore from '../../../store';
import ConnectedHomePage, { HomePage } from '../index';
import assets from '../../../assets';

import { setCollisionPolysM } from '../../../assets/utils';

const patchImgsInDir = (dir) => {
  fs.readdirSync(dir).forEach(fn => {
    if (!fn.endsWith('.png')) {
      return;
    }
    const assetName = fn.slice(0, -4);
    if (!assets[assetName]) {
      return;
    }
    const img = new Image();
    img.src = fs.readFileSync(path.join(dir, fn));
    const { width, height } = img;
    assets[assetName].width = width;
    assets[assetName].height = height;
    assets[assetName].img = img;
    setCollisionPolysM(assets[assetName]);
  });
};

const patchImgs = () => {
  const assetsDir = path.join(__dirname, '..', '..', '..', 'assets');
  patchImgsInDir(assetsDir);
  const furnitureDir = path.join(assetsDir, 'furniture');
  patchImgsInDir(furnitureDir);
};

expect.extend({
  toBeNearlyEqualTo(actual, expected, tol = 0.001) {
    if (Math.abs(actual - expected) > tol) {
      return {
        message: () => `Expected ${expected} to be nearly equal to ${actual} (within ${tol})`,
        pass: false,
      };
    }

    return { pass: true };
  },
});

describe('<HomePage />', () => {
  let store;
  let createPage;
  beforeAll((done) => {
    store = configureStore({}, browserHistory);
    assets.setLoadedCallback(() => {
      // patch in the img data from disk
      patchImgs();
      global.document.body.createTextRange = () => ({
        getBoundingClientRect: () => ({ left: 0, right: 0, top: 0, bottom: 0 }),
        getClientRects: () => ({ left: 0, right: 0, top: 0, bottom: 0 }),
      });
      sinon.spy(ConnectedHomePage.prototype, 'render');
      createPage = ({ world, level }) => {
        const wrapper = mount(
          <Provider store={store}>
            <ConnectedHomePage params={{ world, level }} />
          </Provider>
        );
        const homePage = wrapper.find(HomePage);
        return {
          homePage,
          step: () => homePage.find('button[value="Step"]').simulate('click'),
          reset: () => homePage.find('button[value="Reset"]').simulate('click'),
          assertTime: t => {
            const text = homePage.find('#sim-time').text().replace(/[^0-9]/g, '');
            expect(parseInt(text, 10) / 100).toBeNearlyEqualTo(t);
          },
          assertPose: ({ x, y, yaw }) => {
            const xVal = parseFloat(homePage.find('#sim-pose').find('.sim-pose-x').text());
            const yVal = parseFloat(homePage.find('#sim-pose').find('.sim-pose-y').text());
            const yawVal = parseFloat(homePage.find('#sim-pose').find('.sim-pose-yaw').text());
            expect(xVal).toBeNearlyEqualTo(x);
            expect(yVal).toBeNearlyEqualTo(y);
            expect(yawVal).toBeNearlyEqualTo(yaw);
          },
          replaceInCode: (toFind, replaceWith) =>
            homePage.props().onSetCode(homePage.prop('level').code.replace(toFind, replaceWith)),
        };
      };
      done();
    });
  });

  it('should pass the first level', () => {
    const { homePage, step, assertTime, replaceInCode } = createPage({ world: 0, level: 1 });
    // once to start, then once to set the level
    expect(ConnectedHomePage.prototype.render.callCount).toEqual(2);

    homePage.props().onSetLevel({ world: 0, level: 0 });

    // Move forward on first level
    replaceInCode('TURN_LEFT_UNTIL_X = 0.7', 'TURN_LEFT_UNTIL_X = 0.3');
    replaceInCode(`const TURN_LEFT = {
  wheelSpeeds: { left: 0.2, right: 1.0`, `const TURN_LEFT = {
  wheelSpeeds: { left: 0.78, right: 1.55`);
    replaceInCode('right: 1.0', 'right: 1.0065');
    assertTime(0);
    for (let i = 0; i < 29; i++) {
      step();
      assertTime((i+1) * 0.1);
    }

    expect(!!homePage.prop('level').passed).toEqual(true);
    expect(!!homePage.prop('level').failed).toEqual(false);
  });

  it('should stop when it collides', () => {
    const { homePage, step, assertTime, assertPose, replaceInCode } = createPage({ world: 0, level: 1 });
    // once to start, then once to set the level
    // expect(ConnectedHomePage.prototype.render.callCount).toEqual(2);

    homePage.props().onSetLevel({ world: 0, level: 1 });

    // Move forward on first level
    replaceInCode('right: 1.0,', 'right: 0.98,');
    assertTime(0);
    for (let i = 0; i < 38; i++) {
      step();
      assertTime((i+1) * 0.1);
    }

    assertPose({ x: 0.6, y: 3.7, yaw: 1.25 });
    step();
    assertPose({ x: 0.62, y: 3.74, yaw: 1.24 });
    step();
    // check that it has collided and won't continue to move
    assertPose({ x: 0.62, y: 3.74, yaw: 1.24 });
  });

  it('should fail the first Ego level by default and then pass with greater A', () => {
    const { homePage, step, reset, assertTime } = createPage({ world: 1, level: 0 });

    assertTime(0);

    step();
    assertTime(0.1);

    for (let i = 0; i < 149; i++) {
      step();
    }
    assertTime(15);

    expect(homePage.prop('level').passed).toEqual(false);
    expect(!!homePage.prop('level').failed).toEqual(true);

    step();
    // assert that button is not clickable
    assertTime(15);

    expect(homePage.prop('level').passed).toEqual(false);
    expect(!!homePage.prop('level').failed).toEqual(true);

    reset();
    assertTime(0);

    expect(homePage.prop('level').passed).toEqual(false);
    expect(homePage.prop('level').failed).toEqual(false);

    // set accel to be higher, actually pass level
    const { code } = homePage.prop('level');
    homePage.props().onSetCode(code.replace('0.2', '2.2'));
    assertTime(0);
    step();
    assertTime(0.1);
    for (let i = 0; i < 68; i++) {
      step();
    }
    expect(!!homePage.prop('level').passed).toEqual(true);
    expect(homePage.prop('level').failed).toEqual(false);
  });
});
