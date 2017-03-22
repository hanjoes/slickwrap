'use babel';

import Wrapper from '../lib/wrapper';

describe('Wrapper', () => {
  let workspaceElement;

  describe('When wrapRow is called on some text.', () => {
    it('no instruction generated on empty text', () => {
      expect(Wrapper.wrapRow(0, '', 80)).toEqual([]);
    });

    it('does not wrap when guide is longer', () => {
      var text = 'Hello World!\n';
      expect(Wrapper.wrapRow(0, text, 80)).toEqual([]);
    });

    it('can correctly insert newline on the left of the guide', () => {
      var text = 'Hello World !\n';
      expect(Wrapper.wrapRow(0, text, 10)).toEqual([
        {row: 0, from: 5, to: 6}
      ]);
    });

    it('can correctly insert newline on the right of the guide', () => {
      var text = 'Hello Hello\n';
      expect(Wrapper.wrapRow(0, text, 4)).toEqual([
        {row: 0, from: 5, to: 6}
      ]);
    });

    it('can correctly insert newline when guide is on WS', () => {
      var text = 'Hello   Hello ';
      expect(Wrapper.wrapRow(0, text, 7)).toEqual([
        {row: 0, from: 5, to: 8}
      ]);
    });

    it('has no effect when there is only one long word', () => {
      var text = 'HelloHello';
      expect(Wrapper.wrapRow(0, text, 4)).toEqual([]);
    });

    it('has no effect when there is only one word to the left', () => {
      var text = '        HelloHello';
      expect(Wrapper.wrapRow(0, text, 5)).toEqual([]);
    });

    it('can correctly insert wrap when 2 words are to the left', () => {
      var text = '        Hello  Hello';
      expect(Wrapper.wrapRow(0, text, 5)).toEqual([
        {row: 0, from: 13, to: 15}
      ]);
    });

    it('will not insert wrap when the last letter is not exceeding', () => {
      var text = 'Hello  Hello\n';
      expect(Wrapper.wrapRow(0, text, 12)).toEqual([]);
    });

    it('can wrap long rows to multiple lines', () => {
      var text = 'Hello  Hello  Hello  Hello  Hello  Hello\n';
      expect(Wrapper.wrapRow(0, text, 3)).toEqual([
        {row: 0, from: 5, to: 7},
        {row: 1, from: 5, to: 7},
        {row: 2, from: 5, to: 7},
        {row: 3, from: 5, to: 7},
        {row: 4, from: 5, to: 7},
      ]);
    });

    it('can handle cases when text is null or undefined', () => {
      var text = 'Hello  Hello  Hello  Hello  Hello  Hello\n';
      expect(Wrapper.wrapRow(0, null, 3)).toEqual([]);
      expect(Wrapper.wrapRow(0, undefined, 3)).toEqual([]);
    });
  });
});
