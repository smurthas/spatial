import PropTypes from 'prop-types';
import styled from 'styled-components';

import { BaseButton } from './Buttons';

const FlashMessage = styled.div`
  opacity: ${props => props.level ? 1 : 0};
  display: ${props => props.level ? 'block' : 'none'};
  padding: 10px;
  background: ${({ level }) => {
    switch (level) {
      case 'error':
        return '#FFEBEB';
      default:
        return '#2C9ADA';
    }
  }};
  color: ${({ level }) => {
    switch (level) {
      case 'error':
        return '#C71F24';
      default:
        return 'white';
    }
  }};
  width: 100%;
  z-index: 100;
`;

FlashMessage.propTypes = {
  level: PropTypes.string.isRequired,
};

const FlashButton = styled(BaseButton)`
  &:hover:not(:disabled) {
    border-bottom: 2px solid #eee;
  }
`;

export {
  FlashMessage,
  FlashButton,
};

