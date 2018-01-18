import React from 'react';
import { Component } from 'react';
import styled from 'styled-components';
import { BaseButton } from  './Buttons';

export default class ScenarioInfo extends Component {
  constructor() {
    super();
    this.state = {
      showDescription: true,
    };
  }

  render() {
    const { showDescription } = this.state;
    const { description, name } = this.props.info;
    const buttonText = (showDescription ? 'hide' : 'show') + ' desc';
    const showHide = () => this.setState({ showDescription: !showDescription });
    return (
      <div>
        <span style={{ fontWeight: 'bold' }}>{name}</span>
        <BaseButton style={{ marginLeft: 12}} onClick={showHide}>{buttonText}</BaseButton>
        {showDescription && (
          <div>{description}</div>
        )}
      </div>
    )
  }
}
