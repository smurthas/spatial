import styled from 'styled-components';

const BaseButton = styled.button`
  border: none;
  padding-left: 0px;
  padding-right: 0px;
  margin: 0 4px;
  padding-bottom: 1px;
  border-bottom: 1px solid #245;
  line-height: 1.1em;
  &:focus {
    outline: 0;
  }
  &:hover:not(:disabled) {
    padding-bottom: 0px;
    border-bottom: 2px solid #29d;
  }
  &:disabled {
    border: none;
    color: #777;
  }
`;

export {
  BaseButton,
};

