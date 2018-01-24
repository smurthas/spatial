/* setup.js */

import fs from 'fs';
import path from 'path';

import { Image } from 'canvas';
import { mount } from 'enzyme';
import React from 'react';
import sinon from 'sinon';

import HomePage from '../index';
import assets from '../../../assets';

const patchImgs = () => {
  const dir = path.join(__dirname, '..', '..', '..', 'assets');
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
    assets[assetName].img = img;
  });
};

describe('<HomePage />', () => {
  it('should render the page message', (done) => {
    const test = () => {
      // patch in the img data from disk
      patchImgs();

      sinon.spy(HomePage.prototype, 'render');
      global.document.body.createTextRange = () => ({
        getBoundingClientRect: () => ({ left: 0, right: 0, top: 0, bottom: 0 }),
        getClientRects: () => ({ left: 0, right: 0, top: 0, bottom: 0 }),
      });
      const homePage = mount(<HomePage />);

      const step = () => homePage.find('button[value="Step"]').simulate('click');
      const reset = () => homePage.find('button[value="Reset"]').simulate('click');
      const assertTime = t => {
        const text = homePage.find('#sim-time').text().replace(/[^0-9]/g, '');
        expect(parseInt(text, 10) / 1000).toEqual(t);
      };

      expect(HomePage.prototype.render.callCount).toEqual(1);

      assertTime(0);

      step();
      assertTime(0.1);

      for (let i = 0; i < 149; i++) {
        step();
      }
      assertTime(15);

      expect(homePage.state('passed')).toEqual(false);
      expect(homePage.state('failed')).toEqual(false);

      step();
      assertTime(15.1);

      expect(homePage.state('passed')).toEqual(false);
      expect(homePage.state('failed')).toEqual(true);

      step();
      // asser that button is not clickable
      assertTime(15.1);

      expect(homePage.state('passed')).toEqual(false);
      expect(homePage.state('failed')).toEqual(true);

      reset();
      assertTime(0);

      expect(homePage.state('passed')).toEqual(false);
      expect(homePage.state('failed')).toEqual(false);

      done();
    };
    assets.setLoadedCallback(test);
  });
});
