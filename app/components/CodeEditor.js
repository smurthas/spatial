import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { Controlled as CodeMirror } from 'react-codemirror2';
import 'codemirror/mode/javascript/javascript';

const codeMirrorOptions = {
  lineNumbers: true,
  mode: 'javascript',
  theme: 'base16-dark',
  viewportMargin: Infinity,
  lineWrapping: true,
  gutters: ['CodeMirror-syntax-errors-gutter'],
};

const makeMarker = () => {
  const marker = document.createElement('div');
  marker.style.color = '#F00';
  marker.innerHTML = '●';
  return marker;
};

export default class CodeEditor extends Component {
  constructor(props) {
    super(props);

    this.onChange = this.onChange.bind(this);
    this.setEditor = this.setEditor.bind(this);
  }

  shouldComponentUpdate(nextProps) {
    const codeChanged = this.props.code !== nextProps.code;
    if (codeChanged) {
      return true;
    }

    const hadSyntaxError = this.props.syntaxError;
    const hasSyntaxError = nextProps.syntaxError;
    const addRemoveSyntaxError = (!hadSyntaxError && hasSyntaxError) ||
                                 (hadSyntaxError && !hasSyntaxError);
    if (addRemoveSyntaxError) {
      return true;
    }

    if (!hasSyntaxError) {
      return false;
    }

    if (this.props.syntaxError.index !== nextProps.syntaxError.index) {
      return true;
    }
    const descriptionChanged = this.props.syntaxError.description !==
                               nextProps.syntaxError.description;
    if (descriptionChanged) {
      return true;
    }

    return false;
  }

  componentDidUpdate() {
    const { editor } = this;
    if (!editor) {
      return;
    }
    editor.clearGutter('CodeMirror-syntax-errors-gutter');
    editor.getAllMarks().forEach(m => m.clear());
    const { syntaxError } = this.props;
    if (syntaxError) {
      const { lineNumber, column } = syntaxError;
      const line = lineNumber - 1;
      editor.addLineClass(line, 'text', 'CodeMirror-syntax-error');
      editor.setGutterMarker(line, 'CodeMirror-syntax-errors-gutter', makeMarker());
      const ch = column - 1;
      editor.markText({ line, ch }, { line, ch: ch + 1 }, { className: 'CodeMirror-syntax-error-background' });
    }
  }

  onChange(e, d, value) {
    this.props.onCodeChange(value);
  }

  setEditor(editor) {
    this.editor = editor;
  }


  render() {
    const { code } = this.props;
    return (
      <CodeMirror
        value={code}
        onBeforeChange={this.onChange}
        options={codeMirrorOptions}
        editorDidMount={this.setEditor}
      />
    );
  }
}

CodeEditor.propTypes = {
  onCodeChange: PropTypes.func.isRequired,
  code: PropTypes.string.isRequired,
  syntaxError: PropTypes.object,
};

