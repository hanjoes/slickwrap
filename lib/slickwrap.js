'use babel';

import { CompositeDisposable, Disposable, Point, Range } from 'atom';

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

  isSupported(path) {
    var editor = atom.workspace.getActiveTextEditor();
    var path = editor.getPath();
    var ext = path === undefined ? '' : path.substr((~-path.lastIndexOf(".") >>> 0) + 2);
    var supportedExts = atom.config.get('slickwrap.supportedFiles');
    return (supportedExts.indexOf(ext) != -1);
  },

  subscribeEvent(observed, type, callback) {
    observed.addEventListener(type, callback);
    this.subscriptions.add(new Disposable(() => {
      observed.removeEventListener(type, callback)}));
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
        instructions = instructions.concat(this.wrapRow(currentRow, t, maxLen));
      });
      this.execute(instructions);
    }
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
    var instructions = this.wrapRow(row, text, maxLen);
    this.execute(instructions);
  },

  calculateRange(text, row) {
    var lbound = new Point(row, 0);
    var rbound = new Point(row, text.length);
    return new Range(lbound, rbound);
  },

  // side-effects free method to adjust text within
  // wrap guide
  wrapRow(row, text, guide) {
    // |i am a cake
    // |l         r
    var l = 0;
    var r = text.length - 1;
    var limit = guide;
    var incr = 0;
    var wrapInstructions = [];

    // skip white spaces
    while (this.isWS(text[l]) && l < r) ++l;
    while (this.isWS(text[r]) && l < r) --r;

    // text is longer than our column guide
    // adjust the currentline by inserting newline character(s).
    while (r >= limit) {
      var currentInst;
      var currentRow = row + incr;
      if (l < limit) {
        var li = limit;
        while (!this.isWS(text[li]) && li > l) --li;
        if (li == l) {
          var ri = l;
          while (!this.isWS(text[ri]) && ri < r) ++ri;
          if (ri == r) break;
          var rl = ri;
          while (this.isWS(text[rl])) --rl;
          var rr = ri;
          while (this.isWS(text[rr])) ++rr;
          currentInst = {
            row: currentRow,
            from: rl+1,
            to: rr
          };
        }
        else {
          var ll = li;
          while (this.isWS(text[ll])) --ll;
          var lr = li;
          while (this.isWS(text[lr])) ++lr;
          currentInst = {
            row: currentRow,
            from: ll+1,
            to: lr
          };
        }
      }
      else {
        var ri = l;
        while (!this.isWS(text[ri]) && ri < r) ++ri;
        if (ri == r) break;
        var rl = ri;
        while (this.isWS(text[rl])) --rl;
        var rr = ri;
        while (this.isWS(text[rr])) ++rr;
        currentInst = {
          row: currentRow,
          from: rl+1,
          to: rr
        };
      }
      wrapInstructions.push(currentInst);
      text = text.substr(currentInst.to);
      l = 0;
      r = text.length - 1;
      incr += 1;
    }
    return wrapInstructions;
  },

  replace(s, from, to, substitute) {
    return s.substring(0, from) + substitute + s.substring(to);
  },

  isWS(ch) {
    return ch == ' ' || ch == '\t' || ch == '\n';
  },

  getDefaultLineEnding () {
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
