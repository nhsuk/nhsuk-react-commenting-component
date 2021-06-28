/**
 * Entry point for the wagtail package.
 * Re-exports components and other modules via a cleaner API.
 */

import Button from './components/Button/Button';
import Icon from './components/Icon/Icon';
import { initFocusOutline } from './utils/focus';
import { initIE11Warning } from './includes/initIE11Warning';

export {
  Button,
  Icon,
  initFocusOutline,
  initIE11Warning,
};
