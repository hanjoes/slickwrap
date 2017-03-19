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
            this.adjust(code);
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
    if (this.isSupported(path)) {
      var buffer = editor.getBuffer();
      var incr = 0;
      buffer.getLines().map((t, i) => {
        incr += this.adjustRow(i + incr);
      });
    }
  },

  adjustRow(row) {
    var editor = atom.workspace.getActiveTextEditor();
    var buffer = editor.getBuffer();

    // FIXME: Factor out so called only once.
    var maxLen = atom.config.get('editor.preferredLineLength');
    if (maxLen === undefined) {
      maxLen = atom.config.get('editor.maxRowLength');
    }

    // if the line that contains cursor is longer than our limitation,
    // wrap the line at the closest whitespace before the limitation column.
    var text = buffer.lineForRow(row);

    // |i am a cake
    // |l         r
    var l = 0;
    var r = text.length - 1;
    var incr = 0;
    var guide = maxLen;

    // skip white spaces
    while (this.isWS(text[l]) && l < r) ++l;
    while (this.isWS(text[r]) && l < r) --r;

    // text is longer than our column guide
    // adjust the currentline by inserting newline character(s).
    while (r >= guide) {
      var currentRow = row + incr;
      // find left "gap", if we can find any, wrap.
      if (l < guide) {
        var li = guide;
        while (!this.isWS(text[li]) && li > l) --li;
        if (li == l) {
          var ri = l;
          while (!this.isWS(text[ri]) && ri < r) ++ri;
          if (ri == r) break;
          var rl = ri;
          while (this.isWS(text[rl])) --rl;
          var rr = ri;
          while (this.isWS(text[rr])) ++rr;
          this.replaceWithNewline(currentRow, rl+1, rr);
          r -= rr;
          text = text.substr(rr);
        }
        else {
          var ll = li;
          while (this.isWS(text[ll])) --ll;
          var lr = li;
          while (this.isWS(text[lr])) ++lr;
          this.replaceWithNewline(currentRow, ll+1, lr);
          r -= lr;
          text = text.substr(lr);
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
        this.replaceWithNewline(currentRow, rl+1, rr);
        r -= rr;
        text = text.substr(rr);
      }
      l = 0;
      incr += 1;
    }
    return incr;
  },

  replaceWithNewline(row, left, right) {
    var editor = atom.workspace.getActiveTextEditor();
    var buffer = editor.getBuffer();
    var lbound = new Point(row, left);
    var rbound = new Point(row, right);
    if (this.newline === undefined) {
      this.newline = this.getDefaultLineEnding();
    }
    buffer.setTextInRange(new Range(lbound, rbound), this.newline);
  },

  // Adjust the current line and set cursor to the end.
  // mimicing the emacs behavior.
  adjust(code) {
    var editor = atom.workspace.getActiveTextEditor();
    var cursor = editor.getCursorBufferPosition();

    // if it's enter, we look at the previous row
    var row = (code == 13) ? cursor.row - 1 : cursor.row;

    this.adjustRow(row);
  },

  isWS(ch) {
    return ch == ' ' || ch == '\t';
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

};
