'use babel';

import { CompositeDisposable, Disposable, Point, Range } from 'atom';
import Wrapper from './wrapper';

export default {
  subscriptions: null,

  config: {
    autoHardWrap: {
      type: 'boolean',
      default: true
    },
    maxRowLength: {
      description: 'only used when Wrap Guide package is not installed',
      type: 'integer',
      default: 80
    },
    supportedFiles: {
      title: 'Supported File Extensions',
      description: 'separated by ,',
      type: 'array',
      default: ['md'],
      items: {
        type: 'string'
      }
    }
  },

  newline: undefined,

  activate(state) {
    // initialize newline
    if (this.newline === undefined) {
      this.newline = this.getDefaultLineEnding();
    }

    // Events subscribed to in atom's system can be
    // easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Using observeTextEditors can make sure all future
    // editors are getting this event subscription.
    atom.workspace.observeTextEditors((editor) => {
      // Register command that wraps the current buffer
      this.subscriptions.add(atom.commands.add('atom-text-editor', {
        'slickwrap:wrap-buffer': () => this.wrapBuffer()
      }));

      var editorView = atom.views.getView(editor);
      this.subscribeEvent(editorView, 'keyup', (event) => {
        // keycode: 32 -> space, 13 -> enter, 9 -> tab
        var code = event.keyCode;
        var path = editor.getPath();
        if ((code == 32 || code == 13 || code == 9) && this.isSupported(path)) {
          if (atom.config.get('slickwrap.autoHardWrap')) {
            this.wrap(code);
          }
        }
      });
    });
  },

  subscribeEvent(observed, type, callback) {
    observed.addEventListener(type, callback);
    this.subscriptions.add(new Disposable(() => {
      observed.removeEventListener(type, callback)}));
  },

  isSupported(path) {
    var editor = atom.workspace.getActiveTextEditor();
    var path = editor.getPath();
    var ext = path === undefined ? '' : path.substr((~-path.lastIndexOf(".") >>> 0) + 2);
    var supportedExts = atom.config.get('slickwrap.supportedFiles');
    return (supportedExts.indexOf(ext) != -1);
  },

  execute(instructions) {
    // FIXME: use editor's setTextInBufferRange
    var editor = atom.workspace.getActiveTextEditor();
    var buffer = editor.getBuffer();
    instructions.map((inst) => {
      var l = [inst.row, inst.from];
      var r = [inst.row, inst.to];
      buffer.setTextInRange(new Range(l, r), this.newline);
    });
  },

  deactivate() {
    this.subscriptions.dispose();
  },

  wrapBuffer() {
    var editor = atom.workspace.getActiveTextEditor();

    var path = editor.getPath();
    var maxLen = this.getMaxLen();
    if (this.isSupported(path)) {
      var buffer = editor.getBuffer();
      var instructions = [];
      buffer.getLines().map((t, row) => {
        var currentRow = row + instructions.length;
        var currentInstructions = Wrapper.wrapRow(currentRow, t, maxLen)
        instructions = instructions.concat(currentInstructions);
      });
      this.execute(instructions);
    }
  },

  // Adjust the current line and set cursor to the end.
  // mimicing the emacs behavior.
  wrap(code) {
    var editor = atom.workspace.getActiveTextEditor();
    var buffer = editor.getBuffer();
    var cursor = editor.getCursorBufferPosition();

    // if it's enter, we look at the previous row
    var row = (code == 13) ? cursor.row - 1 : cursor.row;
    var text = buffer.lineForRow(row);
    var maxLen = this.getMaxLen();
    var instructions = Wrapper.wrapRow(row, text, maxLen);
    this.execute(instructions);
  },

  getDefaultLineEnding() {
    switch (atom.config.get('line-ending-selector.defaultLineEnding')) {
      case 'LF':
        return '\n'
      case 'CRLF':
        return '\r\n'
      case 'OS Default':
      default:
        var platform = process.platform;
        return (platform === 'win32') ? '\r\n' : '\n'
    }
  },

  getMaxLen() {
    var maxLen = atom.config.get('editor.preferredLineLength');
    if (maxLen === undefined) {
      maxLen = atom.config.get('editor.maxRowLength');
    }
    return maxLen;
  },

};
