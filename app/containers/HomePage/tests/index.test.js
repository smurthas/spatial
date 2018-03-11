/* setup.js */

import fs from 'fs';
import path from 'path';

import { Image } from 'canvas';
import { mount } from 'enzyme';
import React from 'react';
import sinon from 'sinon';
import { Provider } from 'react-redux';
import { browserHistory } from 'react-router';

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
  beforeAll(() => {
    store = configureStore({}, browserHistory);
  });

  it('should render the page message', (done) => {
    const test = () => {
      // patch in the img data from disk
      patchImgs();

      sinon.spy(ConnectedHomePage.prototype, 'render');
      global.document.body.createTextRange = () => ({
        getBoundingClientRect: () => ({ left: 0, right: 0, top: 0, bottom: 0 }),
        getClientRects: () => ({ left: 0, right: 0, top: 0, bottom: 0 }),
      });
      const wrapper = mount(
        <Provider store={store}>
          <ConnectedHomePage />
        </Provider>
      );
      const homePage = wrapper.find(HomePage);
      // once to start, then once to set the level
      expect(ConnectedHomePage.prototype.render.callCount).toEqual(2);

      const step = () => homePage.find('button[value="Step"]').simulate('click');
      const reset = () => homePage.find('button[value="Reset"]').simulate('click');
      const assertTime = t => {
        const text = homePage.find('#sim-time').text().replace(/[^0-9]/g, '');
        expect(Math.abs((parseInt(text, 10) / 1000) - t)).toBeLessThan(0.001);
      };

      const assertPose = ({ x, y, yaw }) => {
        const xVal = parseFloat(homePage.find('#sim-pose').find('.sim-pose-x').text());
        const yVal = parseFloat(homePage.find('#sim-pose').find('.sim-pose-y').text());
        const yawVal = parseFloat(homePage.find('#sim-pose').find('.sim-pose-yaw').text());
        expect(xVal).toBeNearlyEqualTo(x);
        expect(yVal).toBeNearlyEqualTo(y);
        expect(yawVal).toBeNearlyEqualTo(yaw);
      };

      const replaceInCode = (toFind, replaceWith) =>
        homePage.props().onSetCode(homePage.prop('level').code.replace(toFind, replaceWith));

      // Move forward on first level
      replaceInCode('vLeft: 0.2,', 'vLeft: 1,');
      replaceInCode('vRight: 0.185,', 'vRight: 0.98,');
      assertTime(0);
      for (let i = 0; i < 38; i++) {
        step();
        assertTime((i+1) * 0.1);
      }

      assertPose({ x: 50.6, y: 53.7, yaw: 1.25 });
      step();
      assertPose({ x: 50.62, y: 53.74, yaw: 1.24 });
      step();
      // check that it has collided and won't continue to move
      assertPose({ x: 50.62, y: 53.74, yaw: 1.24 });

      homePage.props().onNextLevel();

      // then again for onNextLevel

      assertTime(0);

      step();
      assertTime(0.1);

      for (let i = 0; i < 149; i++) {
        step();
      }
      assertTime(15);

      expect(homePage.prop('level').passed).toEqual(false);
      expect(homePage.prop('level').failed).toEqual(false);

      step();
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

      done();
    };
    assets.setLoadedCallback(test);
  });
});
