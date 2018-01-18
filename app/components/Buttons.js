import React from 'react';
import { Component } from 'react';
import styled from 'styled-components';

const BaseButton = styled.button`
  border: none;
  padding-bottom: 2px;
  padding-left: 0px;
  padding-right: 0px;
  margin: 0 4px;
  &:focus {
    outline: 0;
  }
  &:hover {
    padding-bottom: 0px;
    border-bottom: 2px solid #29d;
  }
`;

export {
  BaseButton
};


