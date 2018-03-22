import { injectGlobal } from 'styled-components';

/* eslint no-unused-expressions: 0 */
injectGlobal`
  @import url('https://fonts.googleapis.com/css?family=Inconsolata');

  html,
  body {
    height: 100%;
    width: 100%;
    overflow: hidden;
  }

   body, .modalMarkdown>p {
    font-family: 'Inconsolata', 'Courier New', monospace, sans-serif;
    background: #151515;
    color: #EBEBEB;
  }

  [data-reactroot] {
    height: 100%;
  }

  #app {
    height: 100%;
    min-height: 100%;
    min-width: 100%;
  }

  p,
  label {
    font-family: Georgia, Times, 'Times New Roman', serif;
    line-height: 1.5em;
  }

  .CodeMirror {
    font-family: 'Inconsolata', 'Courier New', monospace, sans-serif;
    height: 100%;
  }
  .CodeMirror-syntax-error {
    background-color: rgba(255, 255, 0, 0.8);
  }
  .CodeMirror-syntax-errors-gutter {
    width: 1px;
  }
  .CodeMirror-syntax-error-background {
    border-bottom: 2px solid red;
  }

  .Resizer {
    -moz-box-sizing: border-box;
    -webkit-box-sizing: border-box;
    box-sizing: border-box;
    background: #eee;
    z-index: 1;
    -moz-background-clip: padding;
    -webkit-background-clip: padding;
    background-clip: padding-box;
  }

  .Resizer.horizontal {
    height: 11px;
    margin: -5px 0;
    border-top: 5px solid rgba(255, 255, 255, 0);
    border-bottom: 5px solid rgba(255, 255, 255, 0);
    cursor: row-resize;
    width: 100%;
  }

  .Resizer.vertical {
    margin: 0 -5px;
    display: inline-block;
    background-color: #333;
    flex: 0 0 11px;
    border-left: 5px solid rgba(255, 255, 255, 0);
    border-right: 5px solid rgba(255, 255, 255, 0);
    cursor: col-resize;
  }

`;
