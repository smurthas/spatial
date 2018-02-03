import React from 'react';
import PropTypes from 'prop-types';
import ReactModal from 'react-modal';
import Markdown from 'react-markdown';

import { BaseButton } from './Buttons';

const modalMargin = 100;
const LevelModal = ({ name, description, show, onDone }) => (
  <ReactModal
    isOpen={show}
    onRequestClose={onDone}
    style={{
      overlay: { zIndex: 10 },
      content: {
        background: '#151515',
        top: modalMargin,
        left: modalMargin*2,
        right: modalMargin*2,
        bottom: modalMargin,
        paddingLeft: 40,
        paddingRight: 40,
      },
    }}
    ariaHideApp={false}
  >
    <BaseButton style={{ float: 'right', marginTop: 19 }} onClick={onDone}>done</BaseButton>
    <h2>{name}</h2>
    <Markdown
      className="modalMarkdown"
      source={description}
    />
  </ReactModal>
);

LevelModal.propTypes = {
  name: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  show: PropTypes.bool.isRequired,
  onDone: PropTypes.func.isRequired,
};

export default LevelModal;
