/* setup.js */
import React from 'react';
import { mount } from 'enzyme';

import HomePage from '../index';

describe('<TitlePage />', () => {
  it('should render the title and start button', () => {
    const renderedComponent = mount(
      <HomePage />
    );
    const txt = renderedComponent.text();
    expect(txt.includes('SPATIAL')).toEqual(true);
    expect(txt.includes('START')).toEqual(true);
  });
});

