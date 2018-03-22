/* setup.js */
import React from 'react';
import { mount } from 'enzyme';

import CompletedPage from '../index';

describe('<CompletedPage />', () => {
  it('should render the completed page', () => {
    const renderedComponent = mount(
      <CompletedPage />
    );
    const txt = renderedComponent.text();
    expect(txt.includes('completed')).toEqual(true);
  });
});

