'use strict';

// Utilities
import Copy from '@nycopportunity/pttrn-scripts/src/copy/copy';
import Forms from '@nycopportunity/pttrn-scripts/src/forms/forms';
import Icons from '@nycopportunity/pttrn-scripts/src/icons/icons';
import Newsletter from '@nycopportunity/pttrn-scripts/src/newsletter/newsletter';
import Toggle from '@nycopportunity/pttrn-scripts/src/toggle/toggle';
import Track from '@nycopportunity/pttrn-scripts/src/track/track';
import WebShare from '@nycopportunity/pttrn-scripts/src/web-share/web-share';
import WindowVh from '@nycopportunity/pttrn-scripts/src/window-vh/window-vh';

// Elements
// import ... from '../elements/...';

// Components
import Accordion from '../components/accordion/accordion';
import Dropdown from '../components/dropdown/dropdown';
// import ... from '../components/...';

// Objects
import MobileMenu from '../objects/mobile-menu/mobile-menu';
import Search from '../objects/search/search';
// import ... from '../objects/...';
/** import modules here as they are written. */

import serialize from 'for-cerial';

/**
 * @class  Main pattern module
 */
class main {
  /**
   * @constructor  Modules to be executed on main pattern instantiation here
   */
  constructor() {
    new WindowVh();
  }

  /**
   * An API for the Icons Utility
   *
   * @param   {String}  path  The path of the icon file
   *
   * @return  {Object}        Instance of Icons
   */
  icons(path = 'svg/icons.svg') {
    return new Icons(path);
  }

  /**
   * An API for the Toggle Utility
   *
   * @param   {Object}  settings  Settings for the Toggle Class
   *
   * @return  {Object}            Instance of Toggle
   */
  toggle(settings = false) {
    return (settings) ? new Toggle(settings) : new Toggle();
  }

  /**
   * API for validating a form.
   *
   * @param  {String}    selector  A custom selector for a form
   * @param  {Function}  submit    A custom event handler for a form
   */
  validate(selector = '[data-js="validate"]', submit = false) {
    if (document.querySelector(selector)) {
      let form = new Forms(document.querySelector(selector));

      form.submit = (submit) ? submit : (event) => {
        event.target.submit();
      };

      form.selectors.ERROR_MESSAGE_PARENT = '.c-question__container';

      form.watch();
    }
  }

  /**
   * Validates a form and builds a URL search query on the action based on data.
   *
   * @param  {String}  selector  A custom selector for a form
   */
  validateAndQuery(selector = '[data-js="validate-and-query"]') {
    let element = document.querySelector(selector);

    if (element) {
      let form = new Forms(element);

      form.submit = event => {
        let data = serialize(event.target, {hash: true});

        window.location = `${event.target.action}?` + Object.keys(data)
          .map(k => `${k}=${encodeURI(data[k])}`).join('&');
      };

      form.selectors.ERROR_MESSAGE_PARENT = '.c-question__container';

      form.watch();
    }
  }

  /**
   * An API for the Accordion Component
   *
   * @return  {Object}  Instance of Accordion
   */
  accordion() {
    return new Accordion();
  }

  /**
   * An API for the Dropdown Component
   *
   * @return  {Object}  Instance of Dropdown
   */
  dropdown() {
    return new Dropdown();
  }

  /**
   * An API for the Copy Utility
   *
   * @return  {Object}  Instance of Copy
   */
  copy() {
    return new Copy();
  }

  /**
   * An API for the Track Object
   *
   * @return  {Object}  Instance of Track
   */
  track() {
    return new Track();
  }

  /**
   * An API for the Newsletter Object
   *
   * @return  {Object}  Instance of Newsletter
   */
  newsletter(endpoint = '') {
    let element = document.querySelector(Newsletter.selector);

    if (element) {
      let newsletter = new Newsletter(element);

      newsletter.form.selectors.ERROR_MESSAGE_PARENT = '.c-question__container';

      window[newsletter.callback] = data => {
        data.response = true;

        data.email = element.querySelector('input[name="EMAIL"]').value;

        window.location = `${endpoint}?` + Object.keys(data)
          .map(k => `${k}=${encodeURI(data[k])}`).join('&');
      };

      return newsletter;
    }
  }

  /**
   * An API for the Newsletter Object
   *
   * @return  {Object}  Instance of Newsletter
   */
  newsletterForm(element = document.querySelector('[data-js="newsletter-form"]')) {
    let params = new URLSearchParams(window.location.search);
    let response = params.get('response');
    let newsletter = null;

    if (element) {
      newsletter = new Newsletter(element);
      newsletter.form.selectors.ERROR_MESSAGE_PARENT = '.c-question__container';
    }

    if (response && newsletter) {
      let email = params.get('email');
      let input = element.querySelector('input[name="EMAIL"]');

      input.value = email;

      newsletter._data = {
        'result': params.get('result'),
        'msg': params.get('msg'),
        'EMAIL': email
      };

      newsletter._callback(newsletter._data);
    }

    return newsletter;
  }

  // /**
  //  * An API for the TextController Object
  //  *
  //  * @return  {Object}  Instance of TextController
  //  */
  // textController(element = document.querySelector(TextController.selector)) {
  //   return (element) ? new TextController(element) : null;
  // }

  /**
   * An API for the Mobile Nav
   *
   * @return  {Object}  Instance of MobileMenu
   */
  mobileMenu() {
    return new MobileMenu();
  }

  /**
   * An API for the Search
   *
   * @return  {Object}  Instance of Search
   */
  search() {
    return new Search();
  }

  /**
   * An API for Web Share
   *
   * @return  {Object}  Instance of WebShare
   */
  webShare() {
    return new WebShare({
      fallback: () => {
        new Toggle({
          selector: WebShare.selector
        });
      }
    });
  }
}

export default main;
