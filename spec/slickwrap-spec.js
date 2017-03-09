'use babel';

import Slickwrap from '../lib/slickwrap';

// Use the command `window:run-package-specs` (cmd-alt-ctrl-p) to run specs.
//
// To run a specific `it` or `describe` block add an `f` to the front (e.g. `fit`
// or `fdescribe`). Remove the `f` to unfocus the block.

describe('Slickwrap', () => {
  let workspaceElement, activationPromise;

  beforeEach(() => {
    workspaceElement = atom.views.getView(atom.workspace);
    activationPromise = atom.packages.activatePackage('slickwrap');
  });

  describe('when the slickwrap:toggle event is triggered', () => {
    it('hides and shows the modal panel', () => {
      // Before the activation event the view is not on the DOM, and no panel
      // has been created
      expect(workspaceElement.querySelector('.slickwrap')).not.toExist();

      // This is an activation event, triggering it will cause the package to be
      // activated.
      atom.commands.dispatch(workspaceElement, 'slickwrap:toggle');

      waitsForPromise(() => {
        return activationPromise;
      });

      runs(() => {
        expect(workspaceElement.querySelector('.slickwrap')).toExist();

        let slickwrapElement = workspaceElement.querySelector('.slickwrap');
        expect(slickwrapElement).toExist();

        let slickwrapPanel = atom.workspace.panelForItem(slickwrapElement);
        expect(slickwrapPanel.isVisible()).toBe(true);
        atom.commands.dispatch(workspaceElement, 'slickwrap:toggle');
        expect(slickwrapPanel.isVisible()).toBe(false);
      });
    });

    it('hides and shows the view', () => {
      // This test shows you an integration test testing at the view level.

      // Attaching the workspaceElement to the DOM is required to allow the
      // `toBeVisible()` matchers to work. Anything testing visibility or focus
      // requires that the workspaceElement is on the DOM. Tests that attach the
      // workspaceElement to the DOM are generally slower than those off DOM.
      jasmine.attachToDOM(workspaceElement);

      expect(workspaceElement.querySelector('.slickwrap')).not.toExist();

      // This is an activation event, triggering it causes the package to be
      // activated.
      atom.commands.dispatch(workspaceElement, 'slickwrap:toggle');

      waitsForPromise(() => {
        return activationPromise;
      });

      runs(() => {
        // Now we can test for view visibility
        let slickwrapElement = workspaceElement.querySelector('.slickwrap');
        expect(slickwrapElement).toBeVisible();
        atom.commands.dispatch(workspaceElement, 'slickwrap:toggle');
        expect(slickwrapElement).not.toBeVisible();
      });
    });
  });
});
