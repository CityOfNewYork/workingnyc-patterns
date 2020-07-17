var WorkingNyc = (function () {
  'use strict';

  /**
   * Copy to Clipboard Helper
   */
  var Copy = function Copy() {
    var this$1 = this;

    // Set attributes
    this.selector = Copy.selector;

    this.aria = Copy.aria;

    this.notifyTimeout = Copy.notifyTimeout;

    // Select the entire text when it's focused on
    document.querySelectorAll(Copy.selectors.TARGETS).forEach(function (item) {
      item.addEventListener('focus', function () { return this$1.select(item); });
      item.addEventListener('click', function () { return this$1.select(item); });
    });

    // The main click event for the class
    document.querySelector('body').addEventListener('click', function (event) {
      if (!event.target.matches(this$1.selector))
        { return; }

      this$1.element = event.target;

      this$1.element.setAttribute(this$1.aria, false);

      this$1.target = this$1.element.dataset.copy;

      if (this$1.copy(this$1.target)) {
        this$1.element.setAttribute(this$1.aria, true);

        clearTimeout(this$1.element['timeout']);

        this$1.element['timeout'] = setTimeout(function () {
          this$1.element.setAttribute(this$1.aria, false);
        }, this$1.notifyTimeout);
      }
    });

    return this;
  };

  /**
   * The click event handler
   *
   * @param {String}targetContent of target data attribute
   *
   * @return{Boolean}       Wether copy was successful or not
   */
  Copy.prototype.copy = function copy (target) {
    var selector = Copy.selectors.TARGETS.replace(']', ("=\"" + target + "\"]"));

    var input = document.querySelector(selector);

    this.select(input);

    if (navigator.clipboard && navigator.clipboard.writeText)
      { navigator.clipboard.writeText(input.value); }
    else if (document.execCommand)
      { document.execCommand('copy'); }
    else
      { return false; }

    return true;
  };

  /**
   * Handler for the text selection method
   *
   * @param {Object}inputThe input with content to select
   */
  Copy.prototype.select = function select (input) {
    input.select();

    input.setSelectionRange(0, 99999);
  };

  /** The main element selector */
  Copy.selector = '[data-js*="copy"]';

  /** Class selectors */
  Copy.selectors = {
    TARGETS: '[data-copy-target]'
  };

  /** Button aria role to toggle */
  Copy.aria = 'aria-pressed';

  /** Timeout for the "Copied!" notification */
  Copy.notifyTimeout = 1500;

  /**
   * Utilities for Form components
   * @class
   */
  var Forms = function Forms(form) {
    if ( form === void 0 ) form = false;

    this.FORM = form;

    this.strings = Forms.strings;

    this.submit = Forms.submit;

    this.classes = Forms.classes;

    this.markup = Forms.markup;

    this.selectors = Forms.selectors;

    this.attrs = Forms.attrs;

    this.FORM.setAttribute('novalidate', true);

    return this;
  };

  /**
   * Map toggled checkbox values to an input.
   * @param{Object} event The parent click event.
   * @return {Element}    The target element.
   */
  Forms.prototype.joinValues = function joinValues (event) {
    if (!event.target.matches('input[type="checkbox"]'))
      { return; }

    if (!event.target.closest('[data-js-join-values]'))
      { return; }

    var el = event.target.closest('[data-js-join-values]');
    var target = document.querySelector(el.dataset.jsJoinValues);

    target.value = Array.from(
        el.querySelectorAll('input[type="checkbox"]')
      )
      .filter(function (e) { return (e.value && e.checked); })
      .map(function (e) { return e.value; })
      .join(', ');

    return target;
  };

  /**
   * A simple form validation class that uses native form validation. It will
   * add appropriate form feedback for each input that is invalid and native
   * localized browser messaging.
   *
   * See https://developer.mozilla.org/en-US/docs/Learn/HTML/Forms/Form_validation
   * See https://caniuse.com/#feat=form-validation for support
   *
   * @param{Event}       event The form submission event
   * @return {Class/Boolean}     The form class or false if invalid
   */
  Forms.prototype.valid = function valid (event) {
    var validity = event.target.checkValidity();
    var elements = event.target.querySelectorAll(this.selectors.REQUIRED);

    for (var i = 0; i < elements.length; i++) {
      // Remove old messaging if it exists
      var el = elements[i];

      this.reset(el);

      // If this input valid, skip messaging
      if (el.validity.valid) { continue; }

      this.highlight(el);
    }

    return (validity) ? this : validity;
  };

  /**
   * Adds focus and blur events to inputs with required attributes
   * @param {object}formPassing a form is possible, otherwise it will use
   *                        the form passed to the constructor.
   * @return{class}       The form class
   */
  Forms.prototype.watch = function watch (form) {
      var this$1 = this;
      if ( form === void 0 ) form = false;

    this.FORM = (form) ? form : this.FORM;

    var elements = this.FORM.querySelectorAll(this.selectors.REQUIRED);

    /** Watch Individual Inputs */
    var loop = function ( i ) {
      // Remove old messaging if it exists
      var el = elements[i];

      el.addEventListener('focus', function () {
        this$1.reset(el);
      });

      el.addEventListener('blur', function () {
        if (!el.validity.valid)
          { this$1.highlight(el); }
      });
    };

      for (var i = 0; i < elements.length; i++) loop( i );

    /** Submit Event */
    this.FORM.addEventListener('submit', function (event) {
      event.preventDefault();

      if (this$1.valid(event) === false)
        { return false; }

      this$1.submit(event);
    });

    return this;
  };

  /**
   * Removes the validity message and classes from the message.
   * @param {object}elThe input element
   * @return{class}     The form class
   */
  Forms.prototype.reset = function reset (el) {
    var container = (this.selectors.ERROR_MESSAGE_PARENT)
      ? el.closest(this.selectors.ERROR_MESSAGE_PARENT) : el.parentNode;

    var message = container.querySelector('.' + this.classes.ERROR_MESSAGE);

    // Remove old messaging if it exists
    container.classList.remove(this.classes.ERROR_CONTAINER);
    if (message) { message.remove(); }

    // Remove error class from the form
    container.closest('form').classList.remove(this.classes.ERROR_CONTAINER);

    // Remove dynamic attributes from the input
    el.removeAttribute(this.attrs.ERROR_INPUT[0]);
    el.removeAttribute(this.attrs.ERROR_LABEL);

    return this;
  };

  /**
   * Displays a validity message to the user. It will first use any localized
   * string passed to the class for required fields missing input. If the
   * input is filled in but doesn't match the required pattern, it will use
   * a localized string set for the specific input type. If one isn't provided
   * it will use the default browser provided message.
   * @param {object}elThe invalid input element
   * @return{class}     The form class
   */
  Forms.prototype.highlight = function highlight (el) {
    var container = (this.selectors.ERROR_MESSAGE_PARENT)
      ? el.closest(this.selectors.ERROR_MESSAGE_PARENT) : el.parentNode;

    // Create the new error message.
    var message = document.createElement(this.markup.ERROR_MESSAGE);
    var id = (el.getAttribute('id')) + "-" + (this.classes.ERROR_MESSAGE);

    // Get the error message from localized strings (if set).
    if (el.validity.valueMissing && this.strings.VALID_REQUIRED)
      { message.innerHTML = this.strings.VALID_REQUIRED; }
    else if (!el.validity.valid &&
      this.strings[("VALID_" + (el.type.toUpperCase()) + "_INVALID")]) {
      var stringKey = "VALID_" + (el.type.toUpperCase()) + "_INVALID";
      message.innerHTML = this.strings[stringKey];
    } else
      { message.innerHTML = el.validationMessage; }

    // Set aria attributes and css classes to the message
    message.setAttribute('id', id);
    message.setAttribute(this.attrs.ERROR_MESSAGE[0],
      this.attrs.ERROR_MESSAGE[1]);
    message.classList.add(this.classes.ERROR_MESSAGE);

    // Add the error class and error message to the dom.
    container.classList.add(this.classes.ERROR_CONTAINER);
    container.insertBefore(message, container.childNodes[0]);

    // Add the error class to the form
    container.closest('form').classList.add(this.classes.ERROR_CONTAINER);

    // Add dynamic attributes to the input
    el.setAttribute(this.attrs.ERROR_INPUT[0], this.attrs.ERROR_INPUT[1]);
    el.setAttribute(this.attrs.ERROR_LABEL, id);

    return this;
  };

  /**
   * A dictionairy of strings in the format.
   * {
   *   'VALID_REQUIRED': 'This is required',
   *   'VALID_{{ TYPE }}_INVALID': 'Invalid'
   * }
   */
  Forms.strings = {};

  /** Placeholder for the submit function */
  Forms.submit = function() {};

  /** Classes for various containers */
  Forms.classes = {
    'ERROR_MESSAGE': 'error-message', // error class for the validity message
    'ERROR_CONTAINER': 'error', // class for the validity message parent
    'ERROR_FORM': 'error'
  };

  /** HTML tags and markup for various elements */
  Forms.markup = {
    'ERROR_MESSAGE': 'div',
  };

  /** DOM Selectors for various elements */
  Forms.selectors = {
    'REQUIRED': '[required="true"]', // Selector for required input elements
    'ERROR_MESSAGE_PARENT': false
  };

  /** Attributes for various elements */
  Forms.attrs = {
    'ERROR_MESSAGE': ['aria-live', 'polite'], // Attribute for valid error message
    'ERROR_INPUT': ['aria-invalid', 'true'],
    'ERROR_LABEL': 'aria-describedby'
  };

  /**
   * The Icon module
   * @class
   */
  var Icons = function Icons(path) {
    path = (path) ? path : Icons.path;

    fetch(path)
      .then(function (response) {
        if (response.ok)
          { return response.text(); }
        else
          // eslint-disable-next-line no-console
          { console.dir(response); }
      })
      .catch(function (error) {
        // eslint-disable-next-line no-console
        { console.dir(error); }
      })
      .then(function (data) {
        var sprite = document.createElement('div');
        sprite.innerHTML = data;
        sprite.setAttribute('aria-hidden', true);
        sprite.setAttribute('style', 'display: none;');
        document.body.appendChild(sprite);
      });

    return this;
  };

  /** @type {String} The path of the icon file */
  Icons.path = 'svg/icons.svg';

  var e=/^(?:submit|button|image|reset|file)$/i,t=/^(?:input|select|textarea|keygen)/i,n=/(\[[^\[\]]*\])/g;function a(e,t,a){if(t.match(n)){ !function e(t,n,a){if(0===n.length){ return a; }var r=n.shift(),i=r.match(/^\[(.+?)\]$/);if("[]"===r){ return t=t||[],Array.isArray(t)?t.push(e(null,n,a)):(t._values=t._values||[],t._values.push(e(null,n,a))),t; }if(i){var l=i[1],u=+l;isNaN(u)?(t=t||{})[l]=e(t[l],n,a):(t=t||[])[u]=e(t[u],n,a);}else { t[r]=e(t[r],n,a); }return t}(e,function(e){var t=[],a=new RegExp(n),r=/^([^\[\]]*)/.exec(e);for(r[1]&&t.push(r[1]);null!==(r=a.exec(e));){ t.push(r[1]); }return t}(t),a); }else {var r=e[t];r?(Array.isArray(r)||(e[t]=[r]),e[t].push(a)):e[t]=a;}return e}function r(e,t,n){return n=(n=String(n)).replace(/(\r)?\n/g,"\r\n"),n=(n=encodeURIComponent(n)).replace(/%20/g,"+"),e+(e?"&":"")+encodeURIComponent(t)+"="+n}function serialize(n,i){"object"!=typeof i?i={hash:!!i}:void 0===i.hash&&(i.hash=!0);for(var l=i.hash?{}:"",u=i.serializer||(i.hash?a:r),s=n&&n.elements?n.elements:[],c=Object.create(null),o=0;o<s.length;++o){var h=s[o];if((i.disabled||!h.disabled)&&h.name&&t.test(h.nodeName)&&!e.test(h.type)){var p=h.name,f=h.value;if("checkbox"!==h.type&&"radio"!==h.type||h.checked||(f=void 0),i.empty){if("checkbox"!==h.type||h.checked||(f=!1),"radio"===h.type&&(c[h.name]||h.checked?h.checked&&(c[h.name]=!0):c[h.name]=!1),null==f&&"radio"==h.type){ continue }}else if(!f){ continue; }if("select-multiple"!==h.type){ l=u(l,p,f); }else {f=[];for(var v=h.options,m=!1,d=0;d<v.length;++d){var y=v[d];y.selected&&(y.value||i.empty&&!y.value)&&(m=!0,l=i.hash&&"[]"!==p.slice(p.length-2)?u(l,p+"[]",y.value):u(l,p,y.value));}!m&&i.empty&&(l=u(l,p,""));}}}if(i.empty){ for(var p in c){ c[p]||(l=u(l,p,"")); } }return l}

  /**
   * @class  The Newsletter module
   */
  var Newsletter = function Newsletter(element) {
    var this$1 = this;

    this._el = element;

    this.keys = Newsletter.keys;

    this.endpoints = Newsletter.endpoints;

    this.selectors = Newsletter.selectors;

    this.selector = Newsletter.selector;

    this.stringKeys = Newsletter.stringKeys;

    this.strings = Newsletter.strings;

    this.templates = Newsletter.templates;

    this.classes = Newsletter.classes;

    this.callback = [
      Newsletter.callback,
      Math.random().toString().replace('0.', '')
    ].join('');

    // This sets the script callback function to a global function that
    // can be accessed by the the requested script.
    window[this.callback] = function (data) {
      this$1._callback(data);
    };

    this.form = new Forms(this._el.querySelector('form'));

    this.form.strings = this.strings;

    this.form.submit = function (event) {
      event.preventDefault();

      this$1._submit(event)
        .then(this$1._onload)
        .catch(this$1._onerror);
    };

    this.form.watch();

    return this;
  };

  /**
   * The form submission method. Requests a script with a callback function
   * to be executed on our page. The callback function will be passed the
   * response as a JSON object (function parameter).
   *
   * @param {Event}  eventThe form submission event
   *
   * @return{Promise}       A promise containing the new script call
   */
  Newsletter.prototype._submit = function _submit (event) {
    event.preventDefault();

    // Serialize the data
    this._data = serialize(event.target, {hash: true});

    // Switch the action to post-json. This creates an endpoint for mailchimp
    // that acts as a script that can be loaded onto our page.
    var action = event.target.action.replace(
      ((this.endpoints.MAIN) + "?"), ((this.endpoints.MAIN_JSON) + "?")
    );

    // Add our params to the action
    action = action + serialize(event.target, {serializer: function () {
        var params = [], len = arguments.length;
        while ( len-- ) params[ len ] = arguments[ len ];

      var prev = (typeof params[0] === 'string') ? params[0] : '';

      return (prev + "&" + (params[1]) + "=" + (params[2]));
    }});

    // Append the callback reference. Mailchimp will wrap the JSON response in
    // our callback method. Once we load the script the callback will execute.
    action = action + "&c=window." + (this.callback);

    // Create a promise that appends the script response of the post-json method
    return new Promise(function (resolve, reject) {
      var script = document.createElement('script');

      document.body.appendChild(script);
      script.onload = resolve;
      script.onerror = reject;
      script.async = true;
      script.src = encodeURI(action);
    });
  };

  /**
   * The script onload resolution
   *
   * @param {Event}eventThe script on load event
   *
   * @return{Class}       The Newsletter class
   */
  Newsletter.prototype._onload = function _onload (event) {
    event.path[0].remove();

    return this;
  };

  /**
   * The script on error resolution
   *
   * @param {Object}errorThe script on error load event
   *
   * @return{Class}        The Newsletter class
   */
  Newsletter.prototype._onerror = function _onerror (error) {
    // eslint-disable-next-line no-console
    { console.dir(error); }

    return this;
  };

  /**
   * The callback function for the MailChimp Script call
   *
   * @param {Object}dataThe success/error message from MailChimp
   *
   * @return{Class}      The Newsletter class
   */
  Newsletter.prototype._callback = function _callback (data) {
    if (this[("_" + (data[this._key('MC_RESULT')]))]) {
      this[("_" + (data[this._key('MC_RESULT')]))](data.msg);
    } else {
      // eslint-disable-next-line no-console
      { console.dir(data); }
    }

    return this;
  };

  /**
   * Submission error handler
   *
   * @param {string}msgThe error message
   *
   * @return{Class}      The Newsletter class
   */
  Newsletter.prototype._error = function _error (msg) {
    this._elementsReset();
    this._messaging('WARNING', msg);

    return this;
  };

  /**
   * Submission success handler
   *
   * @param {string}msgThe success message
   *
   * @return{Class}      The Newsletter class
   */
  Newsletter.prototype._success = function _success (msg) {
    this._elementsReset();
    this._messaging('SUCCESS', msg);

    return this;
  };

  /**
   * Present the response message to the user
   *
   * @param {String}typeThe message type
   * @param {String}msg The message
   *
   * @return{Class}       Newsletter
   */
  Newsletter.prototype._messaging = function _messaging (type, msg) {
      var this$1 = this;
      if ( msg === void 0 ) msg = 'no message';

    var strings = Object.keys(this.stringKeys);
    var handled = false;

    var alertBox = this._el.querySelector(this.selectors[type]);

    var alertBoxMsg = alertBox.querySelector(
      this.selectors.ALERT_TEXT
    );

    // Get the localized string, these should be written to the DOM already.
    // The utility contains a global method for retrieving them.
    var stringKeys = strings.filter(function (s) { return msg.includes(this$1.stringKeys[s]); });
    msg = (stringKeys.length) ? this.strings[stringKeys[0]] : msg;
    handled = (stringKeys.length) ? true : false;

    // Replace string templates with values from either our form data or
    // the Newsletter strings object.
    for (var x = 0; x < this.templates.length; x++) {
      var template = this.templates[x];
      var key = template.replace('{{ ', '').replace(' }}', '');
      var value = this._data[key] || this.strings[key];
      var reg = new RegExp(template, 'gi');

      msg = msg.replace(reg, (value) ? value : '');
    }

    if (handled) {
      alertBoxMsg.innerHTML = msg;
    } else if (type === 'ERROR') {
      alertBoxMsg.innerHTML = this.strings.ERR_PLEASE_TRY_LATER;
    }

    if (alertBox) { this._elementShow(alertBox, alertBoxMsg); }

    return this;
  };

  /**
   * The main toggling method
   *
   * @return{Class}Newsletter
   */
  Newsletter.prototype._elementsReset = function _elementsReset () {
      var this$1 = this;

    var targets = this._el.querySelectorAll(this.selectors.ALERTS);

    var loop = function ( i ) {
        if (!targets[i].classList.contains(this$1.classes.HIDDEN)) {
        targets[i].classList.add(this$1.classes.HIDDEN);

        this$1.classes.ANIMATE.split(' ').forEach(function (item) { return targets[i].classList.remove(item); }
        );

        // Screen Readers
        targets[i].setAttribute('aria-hidden', 'true');
        targets[i].querySelector(this$1.selectors.ALERT_TEXT)
          .setAttribute('aria-live', 'off');
      }
      };

      for (var i = 0; i < targets.length; i++)
      loop( i );

    return this;
  };

  /**
   * The main toggling method
   *
   * @param {object}target Message container
   * @param {object}contentContent that changes dynamically that should
   *                           be announced to screen readers.
   *
   * @return{Class}          Newsletter
   */
  Newsletter.prototype._elementShow = function _elementShow (target, content) {
    target.classList.toggle(this.classes.HIDDEN);

    this.classes.ANIMATE.split(' ').forEach(function (item) { return target.classList.toggle(item); }
    );

    // Screen Readers
    target.setAttribute('aria-hidden', 'true');

    if (content) {
      content.setAttribute('aria-live', 'polite');
    }

    return this;
  };

  /**
   * A proxy function for retrieving the proper key
   *
   * @param {string}keyThe reference for the stored keys.
   *
   * @return{string}     The desired key.
   */
  Newsletter.prototype._key = function _key (key) {
    return this.keys[key];
  };

  /** @type  {Object}  API data keys */
  Newsletter.keys = {
    MC_RESULT: 'result',
    MC_MSG: 'msg'
  };

  /** @type  {Object}  API endpoints */
  Newsletter.endpoints = {
    MAIN: '/post',
    MAIN_JSON: '/post-json'
  };

  /** @type  {String}  The Mailchimp callback reference. */
  Newsletter.callback = 'NewsletterCallback';

  /** @type  {Object}  DOM selectors for the instance's concerns */
  Newsletter.selectors = {
    ELEMENT: '[data-js="newsletter"]',
    ALERTS: '[data-js*="alert"]',
    WARNING: '[data-js="alert-warning"]',
    SUCCESS: '[data-js="alert-success"]',
    ALERT_TEXT: '[data-js-alert="text"]'
  };

  /** @type  {String}  The main DOM selector for the instance */
  Newsletter.selector = Newsletter.selectors.ELEMENT;

  /** @type  {Object}  String references for the instance */
  Newsletter.stringKeys = {
    SUCCESS_CONFIRM_EMAIL: 'Almost finished...',
    ERR_PLEASE_ENTER_VALUE: 'Please enter a value',
    ERR_TOO_MANY_RECENT: 'too many',
    ERR_ALREADY_SUBSCRIBED: 'is already subscribed',
    ERR_INVALID_EMAIL: 'looks fake or invalid'
  };

  /** @type  {Object}  Available strings */
  Newsletter.strings = {
    VALID_REQUIRED: 'This field is required.',
    VALID_EMAIL_REQUIRED: 'Email is required.',
    VALID_EMAIL_INVALID: 'Please enter a valid email.',
    VALID_CHECKBOX_BOROUGH: 'Please select a borough.',
    ERR_PLEASE_TRY_LATER: 'There was an error with your submission. ' +
                          'Please try again later.',
    SUCCESS_CONFIRM_EMAIL: 'Almost finished... We need to confirm your email ' +
                           'address. To complete the subscription process, ' +
                           'please click the link in the email we just sent you.',
    ERR_PLEASE_ENTER_VALUE: 'Please enter a value',
    ERR_TOO_MANY_RECENT: 'Recipient "{{ EMAIL }}" has too ' +
                         'many recent signup requests',
    ERR_ALREADY_SUBSCRIBED: '{{ EMAIL }} is already subscribed ' +
                            'to list {{ LIST_NAME }}.',
    ERR_INVALID_EMAIL: 'This email address looks fake or invalid. ' +
                       'Please enter a real email address.',
    LIST_NAME: 'Newsletter'
  };

  /** @type  {Array}  Placeholders that will be replaced in message strings */
  Newsletter.templates = [
    '{{ EMAIL }}',
    '{{ LIST_NAME }}'
  ];

  Newsletter.classes = {
    ANIMATE: 'animated fadeInUp',
    HIDDEN: 'hidden'
  };

  /**
   * The Simple Toggle class. This will toggle the class 'active' and 'hidden'
   * on target elements, determined by a click event on a selected link or
   * element. This will also toggle the aria-hidden attribute for targeted
   * elements to support screen readers. Target settings and other functionality
   * can be controlled through data attributes.
   *
   * This uses the .matches() method which will require a polyfill for IE
   * https://polyfill.io/v2/docs/features/#Element_prototype_matches
   *
   * @class
   */
  var Toggle = function Toggle(s) {
    var this$1 = this;

    // Create an object to store existing toggle listeners (if it doesn't exist)
    if (!window.hasOwnProperty('ACCESS_TOGGLES'))
      { window.ACCESS_TOGGLES = []; }

    s = (!s) ? {} : s;

    this.settings = {
      selector: (s.selector) ? s.selector : Toggle.selector,
      namespace: (s.namespace) ? s.namespace : Toggle.namespace,
      inactiveClass: (s.inactiveClass) ? s.inactiveClass : Toggle.inactiveClass,
      activeClass: (s.activeClass) ? s.activeClass : Toggle.activeClass,
      before: (s.before) ? s.before : false,
      after: (s.after) ? s.after : false
    };

    // Store the element for potential use in callbacks
    this.element = (s.element) ? s.element : false;

    if (this.element)
      { this.element.addEventListener('click', function (event) {
        this$1.toggle(event);
      }); }
    else
      // If there isn't an existing instantiated toggle, add the event listener.
      if (!window.ACCESS_TOGGLES.hasOwnProperty(this.settings.selector))
        { document.querySelector('body').addEventListener('click', function (event) {
          if (!event.target.matches(this$1.settings.selector))
            { return; }

          // Store the event for potential use in callbacks
          this$1.event = event;

          this$1.toggle(event);
        }); }

    // Record that a toggle using this selector has been instantiated. This
    // prevents double toggling.
    window.ACCESS_TOGGLES[this.settings.selector] = true;

    return this;
  };

  /**
   * Logs constants to the debugger
   *
   * @param{Object}eventThe main click event
   *
   * @return {Object}       The class
   */
  Toggle.prototype.toggle = function toggle (event) {
      var this$1 = this;

    var el = event.target;
    var target = false;
    var focusable = [];

    event.preventDefault();

    /** Anchor Links */
    target = (el.hasAttribute('href')) ?
      document.querySelector(el.getAttribute('href')) : target;

    /** Toggle Controls */
    target = (el.hasAttribute('aria-controls')) ?
      document.querySelector(("#" + (el.getAttribute('aria-controls')))) : target;

    /** Focusable Children */
    focusable = (target) ?
      target.querySelectorAll(Toggle.elFocusable.join(', ')) : focusable;

    /** Main Functionality */
    if (!target) { return this; }
    this.elementToggle(el, target, focusable);

    /** Undo */
    if (el.dataset[((this.settings.namespace) + "Undo")]) {
      var undo = document.querySelector(
        el.dataset[((this.settings.namespace) + "Undo")]
      );

      undo.addEventListener('click', function (event) {
        event.preventDefault();
        this$1.elementToggle(el, target);
        undo.removeEventListener('click');
      });
    }

    return this;
  };

  /**
   * The main toggling method
   *
   * @param{Object}  el       The current element to toggle active
   * @param{Object}  target   The target element to toggle active/hidden
   * @param{NodeList}focusableAny focusable children in the target
   *
   * @return {Object}        The class
   */
  Toggle.prototype.elementToggle = function elementToggle (el, target, focusable) {
      var this$1 = this;
      if ( focusable === void 0 ) focusable = [];

    var i = 0;
    var attr = '';
    var value = '';

    // Get other toggles that might control the same element
    var others = document.querySelectorAll(
      ("[aria-controls=\"" + (el.getAttribute('aria-controls')) + "\"]"));

    // Store elements for potential use in callbacks
    this.element = el;
    this.target = target;
    this.others = others;
    this.focusable = focusable;

    /**
     * Toggling before hook
     */
    if (this.settings.before) { this.settings.before(this); }

    /**
     * Toggle Element and Target classes
     */
    if (this.settings.activeClass) {
      el.classList.toggle(this.settings.activeClass);
      target.classList.toggle(this.settings.activeClass);

      // If there are other toggles that control the same element
      if (others) { others.forEach(function (other) {
        if (other !== el) { other.classList.toggle(this$1.settings.activeClass); }
      }); }
    }

    if (this.settings.inactiveClass)
      { target.classList.toggle(this.settings.inactiveClass); }

    /**
     * Target Element Aria Attributes
     */
    for (i = 0; i < Toggle.targetAriaRoles.length; i++) {
      attr = Toggle.targetAriaRoles[i];
      value = target.getAttribute(attr);

      if (value != '' && value)
        { target.setAttribute(attr, (value === 'true') ? 'false' : 'true'); }
    }

    /**
     * Hide the Toggle Target's focusable children from focus.
     * If an element has the data-attribute 'data-toggle-tabindex', use that
     * as the default tab index of the element.
     */
    focusable.forEach(function (el) {
      var tabindex = el.getAttribute('tabindex');

      if (tabindex === '-1') {
        var dataDefault = el.getAttribute(("data-" + (Toggle.namespace) + "-tabindex"));

        if (dataDefault) {
          el.setAttribute('tabindex', dataDefault);
        } else {
          el.removeAttribute('tabindex');
        }
      } else {
        el.setAttribute('tabindex', '-1');
      }
    });

    /**
     * Jump to Target Element (if Toggle Element is an anchor link).
     */
    if (el.hasAttribute('href')) {
      // Reset the history state, this will clear out
      // the hash when the jump item is toggled closed.
      history.pushState('', '',
        window.location.pathname + window.location.search);

      // Target element toggle.
      if (target.classList.contains(this.settings.activeClass)) {
        window.location.hash = el.getAttribute('href');

        target.setAttribute('tabindex', '-1');
        target.focus({preventScroll: true});
      } else
        { target.removeAttribute('tabindex'); }
    }

    /**
     * Toggle Element (including multi toggles) Aria Attributes
     */
    for (i = 0; i < Toggle.elAriaRoles.length; i++) {
      attr = Toggle.elAriaRoles[i];
      value = el.getAttribute(attr);

      if (value != '' && value)
        { el.setAttribute(attr, (value === 'true') ? 'false' : 'true'); }

      // If there are other toggles that control the same element
      if (others) { others.forEach(function (other) {
        if (other !== el && other.getAttribute(attr))
          { other.setAttribute(attr, (value === 'true') ? 'false' : 'true'); }
      }); }
    }

    /**
     * Toggling complete hook.
     */
    if (this.settings.after) { this.settings.after(this); }

    return this;
  };

  /** @type {String} The main selector to add the toggling function to */
  Toggle.selector = '[data-js*="toggle"]';

  /** @type  {String}  The namespace for our data attribute settings */
  Toggle.namespace = 'toggle';

  /** @type  {String}  The hide class */
  Toggle.inactiveClass = 'hidden';

  /** @type  {String}  The active class */
  Toggle.activeClass = 'active';

  /** @type  {Array}  Aria roles to toggle true/false on the toggling element */
  Toggle.elAriaRoles = ['aria-pressed', 'aria-expanded'];

  /** @type  {Array}  Aria roles to toggle true/false on the target element */
  Toggle.targetAriaRoles = ['aria-hidden'];

  /** @type  {Array}  Focusable elements to hide within the hidden target element */
  Toggle.elFocusable = [
    'a', 'button', 'input', 'select', 'textarea', 'object', 'embed', 'form',
    'fieldset', 'legend', 'label', 'area', 'audio', 'video', 'iframe', 'svg',
    'details', 'table', '[tabindex]', '[contenteditable]', '[usemap]'
  ];

  /**
   * Tracking bus for Google analytics and Webtrends.
   */
  var Track = function Track(s) {
    var this$1 = this;

    var body = document.querySelector('body');

    s = (!s) ? {} : s;

    this._settings = {
      selector: (s.selector) ? s.selector : Track.selector,
    };

    this.desinations = Track.destinations;

    body.addEventListener('click', function (event) {
      if (!event.target.matches(this$1._settings.selector))
        { return; }

      var key = event.target.dataset.trackKey;
      var data = JSON.parse(event.target.dataset.trackData);

      this$1.track(key, data);
    });

    return this;
  };

  /**
   * Tracking function wrapper
   *
   * @param{String}    key The key or event of the data
   * @param{Collection}dataThe data to track
   *
   * @return {Object}          The final data object
   */
  Track.prototype.track = function track (key, data) {
    // Set the path name based on the location
    var d = data.map(function (el) {
        if (el.hasOwnProperty(Track.key))
          { el[Track.key] = (window.location.pathname) + "/" + (el[Track.key]); }
        return el;
      });

    var wt = this.webtrends(key, d);
    var ga = this.gtag(key, d);

    /* eslint-disable no-console */
    { console.dir({'Track': [wt, ga]}); }
    /* eslint-enable no-console */

    return d;
  };
  /**
   * Data bus for tracking views in Webtrends and Google Analytics
   *
   * @param{String}    app The name of the Single Page Application to track
   * @param{String}    key The key or event of the data
   * @param{Collection}dataThe data to track
   */
  Track.prototype.view = function view (app, key, data) {
    var wt = this.webtrends(key, data);
    var ga = this.gtagView(app, key);

    /* eslint-disable no-console */
    { console.dir({'Track': [wt, ga]}); }
    /* eslint-enable no-console */
  };
  /**
   * Push Events to Webtrends
   *
   * @param{String}    key The key or event of the data
   * @param{Collection}dataThe data to track
   */
  Track.prototype.webtrends = function webtrends (key, data) {
    if (
      typeof Webtrends === 'undefined' ||
      typeof data === 'undefined' ||
      !this.desinations.includes('webtrends')
    )
      { return false; }

    var event = [{
      'WT.ti': key
    }];

    if (data[0] && data[0].hasOwnProperty(Track.key))
      { event.push({
        'DCS.dcsuri': data[0][Track.key]
      }); }
    else
      { Object.assign(event, data); }

    // Format data for Webtrends
    var wtd = {argsa: event.flatMap(function (e) {
      return Object.keys(e).flatMap(function (k) { return [k, e[k]]; });
    })};

    // If 'action' is used as the key (for gtag.js), switch it to Webtrends
    var action = data.argsa.indexOf('action');

    if (action) { data.argsa[action] = 'DCS.dcsuri'; }

    // Webtrends doesn't send the page view for MultiTrack, add path to url
    var dcsuri = data.argsa.indexOf('DCS.dcsuri');

    if (dcsuri)
      { data.argsa[dcsuri + 1] = window.location.pathname + data.argsa[dcsuri + 1]; }

    /* eslint-disable no-undef */
    if (typeof Webtrends !== 'undefined')
      { Webtrends.multiTrack(wtd); }
    /* eslint-disable no-undef */

    return ['Webtrends', wtd];
  };
  /**
   * Push Click Events to Google Analytics
   *
   * @param{String}    key The key or event of the data
   * @param{Collection}dataThe data to track
   */
  Track.prototype.gtag = function gtag$1 (key, data) {
    if (
      typeof gtag === 'undefined' ||
      typeof data === 'undefined' ||
      !this.desinations.includes('gtag')
    )
      { return false; }

    var uri = data.find(function (element) { return element.hasOwnProperty(Track.key); });

    var event = {
      'event_category': key
    };

    /* eslint-disable no-undef */
    gtag(Track.key, uri[Track.key], event);
    /* eslint-enable no-undef */

    return ['gtag', Track.key, uri[Track.key], event];
  };
  /**
   * Push Screen View Events to Google Analytics
   *
   * @param{String}appThe name of the application
   * @param{String}keyThe key or event of the data
   */
  Track.prototype.gtagView = function gtagView (app, key) {
    if (
      typeof gtag === 'undefined' ||
      typeof data === 'undefined' ||
      !this.desinations.includes('gtag')
    )
      { return false; }

    var view = {
      app_name: app,
      screen_name: key
    };

    /* eslint-disable no-undef */
    gtag('event', 'screen_view', view);
    /* eslint-enable no-undef */

    return ['gtag', Track.key, 'screen_view', view];
  };

  /** @type {String} The main selector to add the tracking function to */
  Track.selector = '[data-js*="track"]';

  /** @type {String} The main event tracking key to map to Webtrends DCS.uri */
  Track.key = 'event';

  /** @type {Array} What destinations to push data to */
  Track.destinations = [
    'webtrends',
    'gtag'
  ];

  /**
   * Uses the Share API to t
   */
  var WebShare = function WebShare(s) {
    var this$1 = this;
    if ( s === void 0 ) s = {};

    this.selector = (s.selector) ? s.selector : WebShare.selector;

    this.callback = (s.callback) ? s.callback : WebShare.callback;

    this.fallback = (s.fallback) ? s.fallback : WebShare.fallback;

    if (navigator.share) {
      // Remove fallback aria toggling attributes
      document.querySelectorAll(this.selector).forEach(function (item) {
        item.removeAttribute('aria-controls');
        item.removeAttribute('aria-expanded');
      });

      // Add event listener for the share click
      document.querySelector('body').addEventListener('click', function (event) {
        if (!event.target.matches(this$1.selector))
          { return; }

        this$1.element = event.target;

        this$1.data = JSON.parse(this$1.element.dataset.webShare);

        this$1.share(this$1.data);
      });
    } else
      { this.fallback(); } // Execute the fallback

    return this;
  };

  /**
   * Web Share API handler
   *
   * @param {Object}dataAn object containing title, url, and text.
   *
   * @return{Promise}     The response of the .share() method.
   */
  WebShare.prototype.share = function share (data) {
      var this$1 = this;
      if ( data === void 0 ) data = {};

    return navigator.share(data)
      .then(function (res) {
        this$1.callback(data);
      }).catch(function (err) {
        { console.dir(err); }
      });
  };

  /** The html selector for the component */
  WebShare.selector = '[data-js*="web-share"]';

  /** Placeholder callback for a successful send */
  WebShare.callback = function () {
    { console.dir('Success!'); }
  };

  /** Placeholder for the WebShare fallback */
  WebShare.fallback = function () {
    { console.dir('Fallback!'); }
  };

  /**
   * @class  Set the the css variable '--100vh' to the size of the Window's inner height.
   */
  var WindowVh = function WindowVh(s) {
    var this$1 = this;
    if ( s === void 0 ) s = {};

    this.property = (s.property) ? s.property : WindowVh.property;

    window.addEventListener('load', function () {this$1.set();});

    window.addEventListener('resize', function () {this$1.set();});

    return this;
  };

  /**
   * Sets the css variable property
   */
  WindowVh.prototype.set = function set () {
    document.documentElement.style
      .setProperty(this.property, ((window.innerHeight) + "px"));
  };

  /** @param  {String}  property  The css variable string to set */
  WindowVh.property = '--100vh';

  /**
   * The Accordion module
   * @class
   */

  var Accordion = function Accordion() {
    this._toggle = new Toggle({
      selector: Accordion.selector
    });
    return this;
  };
  /**
   * The dom selector for the module
   * @type {String}
   */


  Accordion.selector = '[data-js*="accordion"]';

  /**
   * @class  Dropdown
   *
   * Usage
   *
   * Element Attributes. Either <a> or <button>
   *
   * @attr  data-js="dropdown"         Instantiates the toggling method
   * @attr  aria-controls=""           Targets the id of the dropdown
   * @attr  aria-expanded="false"      Declares target closed/open when toggled
   * @attr  data-dropdown="open"       Designates the primary opening element of the dropdown
   * @attr  data-dropdown="close"      Designates the primary closing element of the dropdown
   * @attr  data-dropdown-lock="true"  Wether to lock screen scrolling when drodown is open
   *
   * Target Attributes. Any <element>
   *
   * @attr  id=""               Matches aria-controls attr of Element
   * @attr  class="hidden"      Hidden class
   * @attr  aria-hidden="true"  Declares target open/closed when toggled
   */

  var Dropdown = function Dropdown() {
    var this$1 = this;

    this.selector = Dropdown.selector;
    this.selectors = Dropdown.selectors;
    this.classes = Dropdown.classes;
    this.dataAttrs = Dropdown.dataAttrs;
    this.toggle = new Toggle({
      selector: this.selector,
      after: function (toggle) {
        var active = toggle.target.classList.contains(Toggle.activeClass); // Lock the body from scrolling if lock attribute is present

        if (active && toggle.element.dataset[this$1.dataAttrs.LOCK] === 'true') {
          // Scroll to the top of the page
          window.scroll(0, 0); // Prevent scrolling on the body

          document.querySelector('body').classList.add(this$1.classes.OVERFLOW); // When the last focusable item in the list looses focus loop to the first

          toggle.focusable.item(toggle.focusable.length - 1).addEventListener('blur', function () {
            toggle.focusable.item(0).focus();
          });
        } else {
          // Remove if all other dropdown body locks are inactive
          var locks = document.querySelectorAll([this$1.selector, this$1.selectors.locks, ("." + (Toggle.activeClass))].join(''));

          if (locks.length === 0) {
            document.querySelector('body').classList.remove(this$1.classes.OVERFLOW);
          }
        } // Focus on the close or open button if present


        var id = "[aria-controls=\"" + (toggle.target.getAttribute('id')) + "\"]";
        var close = document.querySelector(this$1.selectors.CLOSE + id);
        var open = document.querySelector(this$1.selectors.OPEN + id);

        if (active && close) {
          close.focus();
        } else if (open) {
          open.focus();
        }
      }
    });
    return this;
  };
  /** @type  {String}  Main DOM selector */


  Dropdown.selector = '[data-js*=\"dropdown\"]';
  /** @type  {Object}  Additional selectors used by the script */

  Dropdown.selectors = {
    CLOSE: '[data-dropdown*="close"]',
    OPEN: '[data-dropdown*="open"]',
    LOCKS: '[data-dropdown-lock="true"]'
  };
  /** @type  {Object}  Data attribute namespaces */

  Dropdown.dataAttrs = {
    LOCK: 'dropdownLock'
  };
  /** @type  {Object}  Various classes used by the script */

  Dropdown.classes = {
    OVERFLOW: 'overflow-hidden'
  };

  /**
   * The Mobile Nav module
   *
   * @class
   */

  var MobileMenu = function MobileMenu() {
    var this$1 = this;

    this.selector = MobileMenu.selector;
    this.selectors = MobileMenu.selectors;
    this.toggle = new Toggle({
      selector: this.selector,
      after: function (toggle) {
        // Shift focus from the open to the close button in the Mobile Menu when toggled
        if (toggle.target.classList.contains(Toggle.activeClass)) {
          toggle.target.querySelector(this$1.selectors.CLOSE).focus(); // When the last focusable item in the list looses focus loop to the first

          toggle.focusable.item(toggle.focusable.length - 1).addEventListener('blur', function () {
            toggle.focusable.item(0).focus();
          });
        } else {
          document.querySelector(this$1.selectors.OPEN).focus();
        }
      }
    });
    return this;
  };
  /** @type  {String}  The dom selector for the module */


  MobileMenu.selector = '[data-js*="mobile-menu"]';
  /** @type  {Object}  Additional selectors used by the script */

  MobileMenu.selectors = {
    CLOSE: '[data-js-mobile-menu*="close"]',
    OPEN: '[data-js-mobile-menu*="open"]'
  };

  /**
   * The Search module
   *
   * @class
   */

  var Search = function Search() {
    this._toggle = new Toggle({
      selector: Search.selector,
      after: function (toggle) {
        var el = document.querySelector(Search.selector);
        var input = document.querySelector(Search.selectors.input);

        if (el.className.includes('active') && input) {
          input.focus();
        }
      }
    });
    return this;
  };
  /**
   * The dom selector for the module
   * @type {String}
   */


  Search.selector = '[data-js*="search"]';
  Search.selectors = {
    input: '[data-js*="search__input"]'
  };

  /** import modules here as they are written. */

  /**
   * @class  Main pattern module
   */

  var main = function main() {
    new WindowVh();
  };
  /**
   * An API for the Icons Utility
   *
   * @param {String}pathThe path of the icon file
   *
   * @return{Object}      Instance of Icons
   */


  main.prototype.icons = function icons (path) {
      if ( path === void 0 ) path = 'svg/icons.svg';

    return new Icons(path);
  };
  /**
   * An API for the Toggle Utility
   *
   * @param {Object}settingsSettings for the Toggle Class
   *
   * @return{Object}          Instance of Toggle
   */


  main.prototype.toggle = function toggle (settings) {
      if ( settings === void 0 ) settings = false;

    return settings ? new Toggle(settings) : new Toggle();
  };
  /**
   * API for validating a form.
   *
   * @param{string}  selector
   * @param{function}submit
   */


  main.prototype.valid = function valid (selector, submit) {
      if ( submit === void 0 ) submit = false;

    if (document.querySelector(selector)) {
      var form = new Forms(document.querySelector(selector));
      form.submit = submit ? submit : function (event) {
        event.target.submit();
      };
      form.selectors.ERROR_MESSAGE_PARENT = '.c-question__container';
      form.watch();
    }
  };
  /**
   * An API for the Accordion Component
   *
   * @return{Object}Instance of Accordion
   */


  main.prototype.accordion = function accordion () {
    return new Accordion();
  };
  /**
   * An API for the Dropdown Component
   *
   * @return{Object}Instance of Dropdown
   */


  main.prototype.dropdown = function dropdown () {
    return new Dropdown();
  };
  /**
   * An API for the Copy Utility
   *
   * @return{Object}Instance of Copy
   */


  main.prototype.copy = function copy () {
    return new Copy();
  };
  /**
   * An API for the Track Object
   *
   * @return{Object}Instance of Track
   */


  main.prototype.track = function track () {
    return new Track();
  };
  /**
   * An API for the Newsletter Object
   *
   * @return{Object}Instance of Newsletter
   */


  main.prototype.newsletter = function newsletter (endpoint) {
      if ( endpoint === void 0 ) endpoint = '';

    var element = document.querySelector(Newsletter.selector);

    if (element) {
      var newsletter = new Newsletter(element);
      newsletter.form.selectors.ERROR_MESSAGE_PARENT = '.c-question__container';

      window[newsletter.callback] = function (data) {
        data.response = true;
        data.email = element.querySelector('input[name="EMAIL"]').value;
        window.location = endpoint + "?" + Object.keys(data).map(function (k) { return (k + "=" + (encodeURI(data[k]))); }).join('&');
      };

      return newsletter;
    }
  };
  /**
   * An API for the Newsletter Object
   *
   * @return{Object}Instance of Newsletter
   */


  main.prototype.newsletterForm = function newsletterForm (element) {
      if ( element === void 0 ) element = document.querySelector('[data-js="newsletter-form"]');

    var params = new URLSearchParams(window.location.search);
    var response = params.get('response');
    var newsletter = null;

    if (element) {
      newsletter = new Newsletter(element);
      newsletter.form.selectors.ERROR_MESSAGE_PARENT = '.c-question__container';
    }

    if (response && newsletter) {
      var email = params.get('email');
      var input = element.querySelector('input[name="EMAIL"]');
      input.value = email;
      newsletter._data = {
        'result': params.get('result'),
        'msg': params.get('msg'),
        'EMAIL': email
      };

      newsletter._callback(newsletter._data);
    }

    return newsletter;
  }; // /**
  //* An API for the TextController Object
  //*
  //* @return{Object}Instance of TextController
  //*/
  // textController(element = document.querySelector(TextController.selector)) {
  // return (element) ? new TextController(element) : null;
  // }

  /**
   * An API for the Mobile Nav
   *
   * @return{Object}Instance of MobileMenu
   */


  main.prototype.mobileMenu = function mobileMenu () {
    return new MobileMenu();
  };
  /**
   * An API for the Search
   *
   * @return{Object}Instance of Search
   */


  main.prototype.search = function search () {
    return new Search();
  };
  /**
   * An API for Web Share
   *
   * @return{Object}Instance of WebShare
   */


  main.prototype.webShare = function webShare () {
    return new WebShare({
      fallback: function () {
        new Toggle({
          selector: WebShare.selector
        });
      }
    });
  };

  return main;

}());
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXMiOlsiLi4vLi4vbm9kZV9tb2R1bGVzL0BueWNvcHBvcnR1bml0eS9wYXR0ZXJucy1mcmFtZXdvcmsvc3JjL3V0aWxpdGllcy9jb3B5L2NvcHkuanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvQG55Y29wcG9ydHVuaXR5L3BhdHRlcm5zLWZyYW1ld29yay9zcmMvdXRpbGl0aWVzL2Zvcm1zL2Zvcm1zLmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL0BueWNvcHBvcnR1bml0eS9wYXR0ZXJucy1mcmFtZXdvcmsvc3JjL3V0aWxpdGllcy9pY29ucy9pY29ucy5qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy9mb3ItY2VyaWFsL2Rpc3QvaW5kZXgubWpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL0BueWNvcHBvcnR1bml0eS9wYXR0ZXJucy1mcmFtZXdvcmsvc3JjL3V0aWxpdGllcy9uZXdzbGV0dGVyL25ld3NsZXR0ZXIuanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvQG55Y29wcG9ydHVuaXR5L3BhdHRlcm5zLWZyYW1ld29yay9zcmMvdXRpbGl0aWVzL3RvZ2dsZS90b2dnbGUuanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvQG55Y29wcG9ydHVuaXR5L3BhdHRlcm5zLWZyYW1ld29yay9zcmMvdXRpbGl0aWVzL3RyYWNrL3RyYWNrLmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL0BueWNvcHBvcnR1bml0eS9wYXR0ZXJucy1mcmFtZXdvcmsvc3JjL3V0aWxpdGllcy93ZWItc2hhcmUvd2ViLXNoYXJlLmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL0BueWNvcHBvcnR1bml0eS9wYXR0ZXJucy1mcmFtZXdvcmsvc3JjL3V0aWxpdGllcy93aW5kb3ctdmgvd2luZG93LXZoLmpzIiwiLi4vLi4vc3JjL2NvbXBvbmVudHMvYWNjb3JkaW9uL2FjY29yZGlvbi5qcyIsIi4uLy4uL3NyYy9jb21wb25lbnRzL2Ryb3Bkb3duL2Ryb3Bkb3duLmpzIiwiLi4vLi4vc3JjL29iamVjdHMvbW9iaWxlLW1lbnUvbW9iaWxlLW1lbnUuanMiLCIuLi8uLi9zcmMvb2JqZWN0cy9zZWFyY2gvc2VhcmNoLmpzIiwiLi4vLi4vc3JjL2pzL21haW4uanMiXSwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIENvcHkgdG8gQ2xpcGJvYXJkIEhlbHBlclxuICovXG5jbGFzcyBDb3B5IHtcbiAgLyoqXG4gICAqIEFkZCBldmVudCBsaXN0ZW5lcnNcbiAgICpcbiAgICogQGNvbnN0cnVjdG9yXG4gICAqL1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICAvLyBTZXQgYXR0cmlidXRlc1xuICAgIHRoaXMuc2VsZWN0b3IgPSBDb3B5LnNlbGVjdG9yO1xuXG4gICAgdGhpcy5hcmlhID0gQ29weS5hcmlhO1xuXG4gICAgdGhpcy5ub3RpZnlUaW1lb3V0ID0gQ29weS5ub3RpZnlUaW1lb3V0O1xuXG4gICAgLy8gU2VsZWN0IHRoZSBlbnRpcmUgdGV4dCB3aGVuIGl0J3MgZm9jdXNlZCBvblxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoQ29weS5zZWxlY3RvcnMuVEFSR0VUUykuZm9yRWFjaChpdGVtID0+IHtcbiAgICAgIGl0ZW0uYWRkRXZlbnRMaXN0ZW5lcignZm9jdXMnLCAoKSA9PiB0aGlzLnNlbGVjdChpdGVtKSk7XG4gICAgICBpdGVtLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy5zZWxlY3QoaXRlbSkpO1xuICAgIH0pO1xuXG4gICAgLy8gVGhlIG1haW4gY2xpY2sgZXZlbnQgZm9yIHRoZSBjbGFzc1xuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2JvZHknKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGV2ZW50ID0+IHtcbiAgICAgIGlmICghZXZlbnQudGFyZ2V0Lm1hdGNoZXModGhpcy5zZWxlY3RvcikpXG4gICAgICAgIHJldHVybjtcblxuICAgICAgdGhpcy5lbGVtZW50ID0gZXZlbnQudGFyZ2V0O1xuXG4gICAgICB0aGlzLmVsZW1lbnQuc2V0QXR0cmlidXRlKHRoaXMuYXJpYSwgZmFsc2UpO1xuXG4gICAgICB0aGlzLnRhcmdldCA9IHRoaXMuZWxlbWVudC5kYXRhc2V0LmNvcHk7XG5cbiAgICAgIGlmICh0aGlzLmNvcHkodGhpcy50YXJnZXQpKSB7XG4gICAgICAgIHRoaXMuZWxlbWVudC5zZXRBdHRyaWJ1dGUodGhpcy5hcmlhLCB0cnVlKTtcblxuICAgICAgICBjbGVhclRpbWVvdXQodGhpcy5lbGVtZW50Wyd0aW1lb3V0J10pO1xuXG4gICAgICAgIHRoaXMuZWxlbWVudFsndGltZW91dCddID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgdGhpcy5lbGVtZW50LnNldEF0dHJpYnV0ZSh0aGlzLmFyaWEsIGZhbHNlKTtcbiAgICAgICAgfSwgdGhpcy5ub3RpZnlUaW1lb3V0KTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBjbGljayBldmVudCBoYW5kbGVyXG4gICAqXG4gICAqIEBwYXJhbSAgIHtTdHJpbmd9ICB0YXJnZXQgIENvbnRlbnQgb2YgdGFyZ2V0IGRhdGEgYXR0cmlidXRlXG4gICAqXG4gICAqIEByZXR1cm4gIHtCb29sZWFufSAgICAgICAgIFdldGhlciBjb3B5IHdhcyBzdWNjZXNzZnVsIG9yIG5vdFxuICAgKi9cbiAgY29weSh0YXJnZXQpIHtcbiAgICBsZXQgc2VsZWN0b3IgPSBDb3B5LnNlbGVjdG9ycy5UQVJHRVRTLnJlcGxhY2UoJ10nLCBgPVwiJHt0YXJnZXR9XCJdYCk7XG5cbiAgICBsZXQgaW5wdXQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHNlbGVjdG9yKTtcblxuICAgIHRoaXMuc2VsZWN0KGlucHV0KTtcblxuICAgIGlmIChuYXZpZ2F0b3IuY2xpcGJvYXJkICYmIG5hdmlnYXRvci5jbGlwYm9hcmQud3JpdGVUZXh0KVxuICAgICAgbmF2aWdhdG9yLmNsaXBib2FyZC53cml0ZVRleHQoaW5wdXQudmFsdWUpO1xuICAgIGVsc2UgaWYgKGRvY3VtZW50LmV4ZWNDb21tYW5kKVxuICAgICAgZG9jdW1lbnQuZXhlY0NvbW1hbmQoJ2NvcHknKTtcbiAgICBlbHNlXG4gICAgICByZXR1cm4gZmFsc2U7XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBIYW5kbGVyIGZvciB0aGUgdGV4dCBzZWxlY3Rpb24gbWV0aG9kXG4gICAqXG4gICAqIEBwYXJhbSAgIHtPYmplY3R9ICBpbnB1dCAgVGhlIGlucHV0IHdpdGggY29udGVudCB0byBzZWxlY3RcbiAgICovXG4gIHNlbGVjdChpbnB1dCkge1xuICAgIGlucHV0LnNlbGVjdCgpO1xuXG4gICAgaW5wdXQuc2V0U2VsZWN0aW9uUmFuZ2UoMCwgOTk5OTkpO1xuICB9XG59XG5cbi8qKiBUaGUgbWFpbiBlbGVtZW50IHNlbGVjdG9yICovXG5Db3B5LnNlbGVjdG9yID0gJ1tkYXRhLWpzKj1cImNvcHlcIl0nO1xuXG4vKiogQ2xhc3Mgc2VsZWN0b3JzICovXG5Db3B5LnNlbGVjdG9ycyA9IHtcbiAgVEFSR0VUUzogJ1tkYXRhLWNvcHktdGFyZ2V0XSdcbn07XG5cbi8qKiBCdXR0b24gYXJpYSByb2xlIHRvIHRvZ2dsZSAqL1xuQ29weS5hcmlhID0gJ2FyaWEtcHJlc3NlZCc7XG5cbi8qKiBUaW1lb3V0IGZvciB0aGUgXCJDb3BpZWQhXCIgbm90aWZpY2F0aW9uICovXG5Db3B5Lm5vdGlmeVRpbWVvdXQgPSAxNTAwO1xuXG5leHBvcnQgZGVmYXVsdCBDb3B5O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIFV0aWxpdGllcyBmb3IgRm9ybSBjb21wb25lbnRzXG4gKiBAY2xhc3NcbiAqL1xuY2xhc3MgRm9ybXMge1xuICAvKipcbiAgICogVGhlIEZvcm0gY29uc3RydWN0b3JcbiAgICogQHBhcmFtICB7T2JqZWN0fSBmb3JtIFRoZSBmb3JtIERPTSBlbGVtZW50XG4gICAqL1xuICBjb25zdHJ1Y3Rvcihmb3JtID0gZmFsc2UpIHtcbiAgICB0aGlzLkZPUk0gPSBmb3JtO1xuXG4gICAgdGhpcy5zdHJpbmdzID0gRm9ybXMuc3RyaW5ncztcblxuICAgIHRoaXMuc3VibWl0ID0gRm9ybXMuc3VibWl0O1xuXG4gICAgdGhpcy5jbGFzc2VzID0gRm9ybXMuY2xhc3NlcztcblxuICAgIHRoaXMubWFya3VwID0gRm9ybXMubWFya3VwO1xuXG4gICAgdGhpcy5zZWxlY3RvcnMgPSBGb3Jtcy5zZWxlY3RvcnM7XG5cbiAgICB0aGlzLmF0dHJzID0gRm9ybXMuYXR0cnM7XG5cbiAgICB0aGlzLkZPUk0uc2V0QXR0cmlidXRlKCdub3ZhbGlkYXRlJywgdHJ1ZSk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBNYXAgdG9nZ2xlZCBjaGVja2JveCB2YWx1ZXMgdG8gYW4gaW5wdXQuXG4gICAqIEBwYXJhbSAge09iamVjdH0gZXZlbnQgVGhlIHBhcmVudCBjbGljayBldmVudC5cbiAgICogQHJldHVybiB7RWxlbWVudH0gICAgICBUaGUgdGFyZ2V0IGVsZW1lbnQuXG4gICAqL1xuICBqb2luVmFsdWVzKGV2ZW50KSB7XG4gICAgaWYgKCFldmVudC50YXJnZXQubWF0Y2hlcygnaW5wdXRbdHlwZT1cImNoZWNrYm94XCJdJykpXG4gICAgICByZXR1cm47XG5cbiAgICBpZiAoIWV2ZW50LnRhcmdldC5jbG9zZXN0KCdbZGF0YS1qcy1qb2luLXZhbHVlc10nKSlcbiAgICAgIHJldHVybjtcblxuICAgIGxldCBlbCA9IGV2ZW50LnRhcmdldC5jbG9zZXN0KCdbZGF0YS1qcy1qb2luLXZhbHVlc10nKTtcbiAgICBsZXQgdGFyZ2V0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihlbC5kYXRhc2V0LmpzSm9pblZhbHVlcyk7XG5cbiAgICB0YXJnZXQudmFsdWUgPSBBcnJheS5mcm9tKFxuICAgICAgICBlbC5xdWVyeVNlbGVjdG9yQWxsKCdpbnB1dFt0eXBlPVwiY2hlY2tib3hcIl0nKVxuICAgICAgKVxuICAgICAgLmZpbHRlcigoZSkgPT4gKGUudmFsdWUgJiYgZS5jaGVja2VkKSlcbiAgICAgIC5tYXAoKGUpID0+IGUudmFsdWUpXG4gICAgICAuam9pbignLCAnKTtcblxuICAgIHJldHVybiB0YXJnZXQ7XG4gIH1cblxuICAvKipcbiAgICogQSBzaW1wbGUgZm9ybSB2YWxpZGF0aW9uIGNsYXNzIHRoYXQgdXNlcyBuYXRpdmUgZm9ybSB2YWxpZGF0aW9uLiBJdCB3aWxsXG4gICAqIGFkZCBhcHByb3ByaWF0ZSBmb3JtIGZlZWRiYWNrIGZvciBlYWNoIGlucHV0IHRoYXQgaXMgaW52YWxpZCBhbmQgbmF0aXZlXG4gICAqIGxvY2FsaXplZCBicm93c2VyIG1lc3NhZ2luZy5cbiAgICpcbiAgICogU2VlIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvTGVhcm4vSFRNTC9Gb3Jtcy9Gb3JtX3ZhbGlkYXRpb25cbiAgICogU2VlIGh0dHBzOi8vY2FuaXVzZS5jb20vI2ZlYXQ9Zm9ybS12YWxpZGF0aW9uIGZvciBzdXBwb3J0XG4gICAqXG4gICAqIEBwYXJhbSAge0V2ZW50fSAgICAgICAgIGV2ZW50IFRoZSBmb3JtIHN1Ym1pc3Npb24gZXZlbnRcbiAgICogQHJldHVybiB7Q2xhc3MvQm9vbGVhbn0gICAgICAgVGhlIGZvcm0gY2xhc3Mgb3IgZmFsc2UgaWYgaW52YWxpZFxuICAgKi9cbiAgdmFsaWQoZXZlbnQpIHtcbiAgICBsZXQgdmFsaWRpdHkgPSBldmVudC50YXJnZXQuY2hlY2tWYWxpZGl0eSgpO1xuICAgIGxldCBlbGVtZW50cyA9IGV2ZW50LnRhcmdldC5xdWVyeVNlbGVjdG9yQWxsKHRoaXMuc2VsZWN0b3JzLlJFUVVJUkVEKTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZWxlbWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIC8vIFJlbW92ZSBvbGQgbWVzc2FnaW5nIGlmIGl0IGV4aXN0c1xuICAgICAgbGV0IGVsID0gZWxlbWVudHNbaV07XG5cbiAgICAgIHRoaXMucmVzZXQoZWwpO1xuXG4gICAgICAvLyBJZiB0aGlzIGlucHV0IHZhbGlkLCBza2lwIG1lc3NhZ2luZ1xuICAgICAgaWYgKGVsLnZhbGlkaXR5LnZhbGlkKSBjb250aW51ZTtcblxuICAgICAgdGhpcy5oaWdobGlnaHQoZWwpO1xuICAgIH1cblxuICAgIHJldHVybiAodmFsaWRpdHkpID8gdGhpcyA6IHZhbGlkaXR5O1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgZm9jdXMgYW5kIGJsdXIgZXZlbnRzIHRvIGlucHV0cyB3aXRoIHJlcXVpcmVkIGF0dHJpYnV0ZXNcbiAgICogQHBhcmFtICAge29iamVjdH0gIGZvcm0gIFBhc3NpbmcgYSBmb3JtIGlzIHBvc3NpYmxlLCBvdGhlcndpc2UgaXQgd2lsbCB1c2VcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgIHRoZSBmb3JtIHBhc3NlZCB0byB0aGUgY29uc3RydWN0b3IuXG4gICAqIEByZXR1cm4gIHtjbGFzc30gICAgICAgICBUaGUgZm9ybSBjbGFzc1xuICAgKi9cbiAgd2F0Y2goZm9ybSA9IGZhbHNlKSB7XG4gICAgdGhpcy5GT1JNID0gKGZvcm0pID8gZm9ybSA6IHRoaXMuRk9STTtcblxuICAgIGxldCBlbGVtZW50cyA9IHRoaXMuRk9STS5xdWVyeVNlbGVjdG9yQWxsKHRoaXMuc2VsZWN0b3JzLlJFUVVJUkVEKTtcblxuICAgIC8qKiBXYXRjaCBJbmRpdmlkdWFsIElucHV0cyAqL1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZWxlbWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIC8vIFJlbW92ZSBvbGQgbWVzc2FnaW5nIGlmIGl0IGV4aXN0c1xuICAgICAgbGV0IGVsID0gZWxlbWVudHNbaV07XG5cbiAgICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ2ZvY3VzJywgKCkgPT4ge1xuICAgICAgICB0aGlzLnJlc2V0KGVsKTtcbiAgICAgIH0pO1xuXG4gICAgICBlbC5hZGRFdmVudExpc3RlbmVyKCdibHVyJywgKCkgPT4ge1xuICAgICAgICBpZiAoIWVsLnZhbGlkaXR5LnZhbGlkKVxuICAgICAgICAgIHRoaXMuaGlnaGxpZ2h0KGVsKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKiBTdWJtaXQgRXZlbnQgKi9cbiAgICB0aGlzLkZPUk0uYWRkRXZlbnRMaXN0ZW5lcignc3VibWl0JywgKGV2ZW50KSA9PiB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICBpZiAodGhpcy52YWxpZChldmVudCkgPT09IGZhbHNlKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG5cbiAgICAgIHRoaXMuc3VibWl0KGV2ZW50KTtcbiAgICB9KTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgdGhlIHZhbGlkaXR5IG1lc3NhZ2UgYW5kIGNsYXNzZXMgZnJvbSB0aGUgbWVzc2FnZS5cbiAgICogQHBhcmFtICAge29iamVjdH0gIGVsICBUaGUgaW5wdXQgZWxlbWVudFxuICAgKiBAcmV0dXJuICB7Y2xhc3N9ICAgICAgIFRoZSBmb3JtIGNsYXNzXG4gICAqL1xuICByZXNldChlbCkge1xuICAgIGxldCBjb250YWluZXIgPSAodGhpcy5zZWxlY3RvcnMuRVJST1JfTUVTU0FHRV9QQVJFTlQpXG4gICAgICA/IGVsLmNsb3Nlc3QodGhpcy5zZWxlY3RvcnMuRVJST1JfTUVTU0FHRV9QQVJFTlQpIDogZWwucGFyZW50Tm9kZTtcblxuICAgIGxldCBtZXNzYWdlID0gY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJy4nICsgdGhpcy5jbGFzc2VzLkVSUk9SX01FU1NBR0UpO1xuXG4gICAgLy8gUmVtb3ZlIG9sZCBtZXNzYWdpbmcgaWYgaXQgZXhpc3RzXG4gICAgY29udGFpbmVyLmNsYXNzTGlzdC5yZW1vdmUodGhpcy5jbGFzc2VzLkVSUk9SX0NPTlRBSU5FUik7XG4gICAgaWYgKG1lc3NhZ2UpIG1lc3NhZ2UucmVtb3ZlKCk7XG5cbiAgICAvLyBSZW1vdmUgZXJyb3IgY2xhc3MgZnJvbSB0aGUgZm9ybVxuICAgIGNvbnRhaW5lci5jbG9zZXN0KCdmb3JtJykuY2xhc3NMaXN0LnJlbW92ZSh0aGlzLmNsYXNzZXMuRVJST1JfQ09OVEFJTkVSKTtcblxuICAgIC8vIFJlbW92ZSBkeW5hbWljIGF0dHJpYnV0ZXMgZnJvbSB0aGUgaW5wdXRcbiAgICBlbC5yZW1vdmVBdHRyaWJ1dGUodGhpcy5hdHRycy5FUlJPUl9JTlBVVFswXSk7XG4gICAgZWwucmVtb3ZlQXR0cmlidXRlKHRoaXMuYXR0cnMuRVJST1JfTEFCRUwpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogRGlzcGxheXMgYSB2YWxpZGl0eSBtZXNzYWdlIHRvIHRoZSB1c2VyLiBJdCB3aWxsIGZpcnN0IHVzZSBhbnkgbG9jYWxpemVkXG4gICAqIHN0cmluZyBwYXNzZWQgdG8gdGhlIGNsYXNzIGZvciByZXF1aXJlZCBmaWVsZHMgbWlzc2luZyBpbnB1dC4gSWYgdGhlXG4gICAqIGlucHV0IGlzIGZpbGxlZCBpbiBidXQgZG9lc24ndCBtYXRjaCB0aGUgcmVxdWlyZWQgcGF0dGVybiwgaXQgd2lsbCB1c2VcbiAgICogYSBsb2NhbGl6ZWQgc3RyaW5nIHNldCBmb3IgdGhlIHNwZWNpZmljIGlucHV0IHR5cGUuIElmIG9uZSBpc24ndCBwcm92aWRlZFxuICAgKiBpdCB3aWxsIHVzZSB0aGUgZGVmYXVsdCBicm93c2VyIHByb3ZpZGVkIG1lc3NhZ2UuXG4gICAqIEBwYXJhbSAgIHtvYmplY3R9ICBlbCAgVGhlIGludmFsaWQgaW5wdXQgZWxlbWVudFxuICAgKiBAcmV0dXJuICB7Y2xhc3N9ICAgICAgIFRoZSBmb3JtIGNsYXNzXG4gICAqL1xuICBoaWdobGlnaHQoZWwpIHtcbiAgICBsZXQgY29udGFpbmVyID0gKHRoaXMuc2VsZWN0b3JzLkVSUk9SX01FU1NBR0VfUEFSRU5UKVxuICAgICAgPyBlbC5jbG9zZXN0KHRoaXMuc2VsZWN0b3JzLkVSUk9SX01FU1NBR0VfUEFSRU5UKSA6IGVsLnBhcmVudE5vZGU7XG5cbiAgICAvLyBDcmVhdGUgdGhlIG5ldyBlcnJvciBtZXNzYWdlLlxuICAgIGxldCBtZXNzYWdlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0aGlzLm1hcmt1cC5FUlJPUl9NRVNTQUdFKTtcbiAgICBsZXQgaWQgPSBgJHtlbC5nZXRBdHRyaWJ1dGUoJ2lkJyl9LSR7dGhpcy5jbGFzc2VzLkVSUk9SX01FU1NBR0V9YDtcblxuICAgIC8vIEdldCB0aGUgZXJyb3IgbWVzc2FnZSBmcm9tIGxvY2FsaXplZCBzdHJpbmdzIChpZiBzZXQpLlxuICAgIGlmIChlbC52YWxpZGl0eS52YWx1ZU1pc3NpbmcgJiYgdGhpcy5zdHJpbmdzLlZBTElEX1JFUVVJUkVEKVxuICAgICAgbWVzc2FnZS5pbm5lckhUTUwgPSB0aGlzLnN0cmluZ3MuVkFMSURfUkVRVUlSRUQ7XG4gICAgZWxzZSBpZiAoIWVsLnZhbGlkaXR5LnZhbGlkICYmXG4gICAgICB0aGlzLnN0cmluZ3NbYFZBTElEXyR7ZWwudHlwZS50b1VwcGVyQ2FzZSgpfV9JTlZBTElEYF0pIHtcbiAgICAgIGxldCBzdHJpbmdLZXkgPSBgVkFMSURfJHtlbC50eXBlLnRvVXBwZXJDYXNlKCl9X0lOVkFMSURgO1xuICAgICAgbWVzc2FnZS5pbm5lckhUTUwgPSB0aGlzLnN0cmluZ3Nbc3RyaW5nS2V5XTtcbiAgICB9IGVsc2VcbiAgICAgIG1lc3NhZ2UuaW5uZXJIVE1MID0gZWwudmFsaWRhdGlvbk1lc3NhZ2U7XG5cbiAgICAvLyBTZXQgYXJpYSBhdHRyaWJ1dGVzIGFuZCBjc3MgY2xhc3NlcyB0byB0aGUgbWVzc2FnZVxuICAgIG1lc3NhZ2Uuc2V0QXR0cmlidXRlKCdpZCcsIGlkKTtcbiAgICBtZXNzYWdlLnNldEF0dHJpYnV0ZSh0aGlzLmF0dHJzLkVSUk9SX01FU1NBR0VbMF0sXG4gICAgICB0aGlzLmF0dHJzLkVSUk9SX01FU1NBR0VbMV0pO1xuICAgIG1lc3NhZ2UuY2xhc3NMaXN0LmFkZCh0aGlzLmNsYXNzZXMuRVJST1JfTUVTU0FHRSk7XG5cbiAgICAvLyBBZGQgdGhlIGVycm9yIGNsYXNzIGFuZCBlcnJvciBtZXNzYWdlIHRvIHRoZSBkb20uXG4gICAgY29udGFpbmVyLmNsYXNzTGlzdC5hZGQodGhpcy5jbGFzc2VzLkVSUk9SX0NPTlRBSU5FUik7XG4gICAgY29udGFpbmVyLmluc2VydEJlZm9yZShtZXNzYWdlLCBjb250YWluZXIuY2hpbGROb2Rlc1swXSk7XG5cbiAgICAvLyBBZGQgdGhlIGVycm9yIGNsYXNzIHRvIHRoZSBmb3JtXG4gICAgY29udGFpbmVyLmNsb3Nlc3QoJ2Zvcm0nKS5jbGFzc0xpc3QuYWRkKHRoaXMuY2xhc3Nlcy5FUlJPUl9DT05UQUlORVIpO1xuXG4gICAgLy8gQWRkIGR5bmFtaWMgYXR0cmlidXRlcyB0byB0aGUgaW5wdXRcbiAgICBlbC5zZXRBdHRyaWJ1dGUodGhpcy5hdHRycy5FUlJPUl9JTlBVVFswXSwgdGhpcy5hdHRycy5FUlJPUl9JTlBVVFsxXSk7XG4gICAgZWwuc2V0QXR0cmlidXRlKHRoaXMuYXR0cnMuRVJST1JfTEFCRUwsIGlkKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG59XG5cbi8qKlxuICogQSBkaWN0aW9uYWlyeSBvZiBzdHJpbmdzIGluIHRoZSBmb3JtYXQuXG4gKiB7XG4gKiAgICdWQUxJRF9SRVFVSVJFRCc6ICdUaGlzIGlzIHJlcXVpcmVkJyxcbiAqICAgJ1ZBTElEX3t7IFRZUEUgfX1fSU5WQUxJRCc6ICdJbnZhbGlkJ1xuICogfVxuICovXG5Gb3Jtcy5zdHJpbmdzID0ge307XG5cbi8qKiBQbGFjZWhvbGRlciBmb3IgdGhlIHN1Ym1pdCBmdW5jdGlvbiAqL1xuRm9ybXMuc3VibWl0ID0gZnVuY3Rpb24oKSB7fTtcblxuLyoqIENsYXNzZXMgZm9yIHZhcmlvdXMgY29udGFpbmVycyAqL1xuRm9ybXMuY2xhc3NlcyA9IHtcbiAgJ0VSUk9SX01FU1NBR0UnOiAnZXJyb3ItbWVzc2FnZScsIC8vIGVycm9yIGNsYXNzIGZvciB0aGUgdmFsaWRpdHkgbWVzc2FnZVxuICAnRVJST1JfQ09OVEFJTkVSJzogJ2Vycm9yJywgLy8gY2xhc3MgZm9yIHRoZSB2YWxpZGl0eSBtZXNzYWdlIHBhcmVudFxuICAnRVJST1JfRk9STSc6ICdlcnJvcidcbn07XG5cbi8qKiBIVE1MIHRhZ3MgYW5kIG1hcmt1cCBmb3IgdmFyaW91cyBlbGVtZW50cyAqL1xuRm9ybXMubWFya3VwID0ge1xuICAnRVJST1JfTUVTU0FHRSc6ICdkaXYnLFxufTtcblxuLyoqIERPTSBTZWxlY3RvcnMgZm9yIHZhcmlvdXMgZWxlbWVudHMgKi9cbkZvcm1zLnNlbGVjdG9ycyA9IHtcbiAgJ1JFUVVJUkVEJzogJ1tyZXF1aXJlZD1cInRydWVcIl0nLCAvLyBTZWxlY3RvciBmb3IgcmVxdWlyZWQgaW5wdXQgZWxlbWVudHNcbiAgJ0VSUk9SX01FU1NBR0VfUEFSRU5UJzogZmFsc2Vcbn07XG5cbi8qKiBBdHRyaWJ1dGVzIGZvciB2YXJpb3VzIGVsZW1lbnRzICovXG5Gb3Jtcy5hdHRycyA9IHtcbiAgJ0VSUk9SX01FU1NBR0UnOiBbJ2FyaWEtbGl2ZScsICdwb2xpdGUnXSwgLy8gQXR0cmlidXRlIGZvciB2YWxpZCBlcnJvciBtZXNzYWdlXG4gICdFUlJPUl9JTlBVVCc6IFsnYXJpYS1pbnZhbGlkJywgJ3RydWUnXSxcbiAgJ0VSUk9SX0xBQkVMJzogJ2FyaWEtZGVzY3JpYmVkYnknXG59O1xuXG5leHBvcnQgZGVmYXVsdCBGb3JtcztcbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBUaGUgSWNvbiBtb2R1bGVcbiAqIEBjbGFzc1xuICovXG5jbGFzcyBJY29ucyB7XG4gIC8qKlxuICAgKiBAY29uc3RydWN0b3JcbiAgICogQHBhcmFtICB7U3RyaW5nfSBwYXRoIFRoZSBwYXRoIG9mIHRoZSBpY29uIGZpbGVcbiAgICogQHJldHVybiB7b2JqZWN0fSBUaGUgY2xhc3NcbiAgICovXG4gIGNvbnN0cnVjdG9yKHBhdGgpIHtcbiAgICBwYXRoID0gKHBhdGgpID8gcGF0aCA6IEljb25zLnBhdGg7XG5cbiAgICBmZXRjaChwYXRoKVxuICAgICAgLnRoZW4oKHJlc3BvbnNlKSA9PiB7XG4gICAgICAgIGlmIChyZXNwb25zZS5vaylcbiAgICAgICAgICByZXR1cm4gcmVzcG9uc2UudGV4dCgpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnNvbGVcbiAgICAgICAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJylcbiAgICAgICAgICAgIGNvbnNvbGUuZGlyKHJlc3BvbnNlKTtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goKGVycm9yKSA9PiB7XG4gICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXG4gICAgICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKVxuICAgICAgICAgIGNvbnNvbGUuZGlyKGVycm9yKTtcbiAgICAgIH0pXG4gICAgICAudGhlbigoZGF0YSkgPT4ge1xuICAgICAgICBjb25zdCBzcHJpdGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgc3ByaXRlLmlubmVySFRNTCA9IGRhdGE7XG4gICAgICAgIHNwcml0ZS5zZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJywgdHJ1ZSk7XG4gICAgICAgIHNwcml0ZS5zZXRBdHRyaWJ1dGUoJ3N0eWxlJywgJ2Rpc3BsYXk6IG5vbmU7Jyk7XG4gICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoc3ByaXRlKTtcbiAgICAgIH0pO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbn1cblxuLyoqIEB0eXBlIHtTdHJpbmd9IFRoZSBwYXRoIG9mIHRoZSBpY29uIGZpbGUgKi9cbkljb25zLnBhdGggPSAnc3ZnL2ljb25zLnN2Zyc7XG5cbmV4cG9ydCBkZWZhdWx0IEljb25zO1xuIiwidmFyIGU9L14oPzpzdWJtaXR8YnV0dG9ufGltYWdlfHJlc2V0fGZpbGUpJC9pLHQ9L14oPzppbnB1dHxzZWxlY3R8dGV4dGFyZWF8a2V5Z2VuKS9pLG49LyhcXFtbXlxcW1xcXV0qXFxdKS9nO2Z1bmN0aW9uIGEoZSx0LGEpe2lmKHQubWF0Y2gobikpIWZ1bmN0aW9uIGUodCxuLGEpe2lmKDA9PT1uLmxlbmd0aClyZXR1cm4gYTt2YXIgcj1uLnNoaWZ0KCksaT1yLm1hdGNoKC9eXFxbKC4rPylcXF0kLyk7aWYoXCJbXVwiPT09cilyZXR1cm4gdD10fHxbXSxBcnJheS5pc0FycmF5KHQpP3QucHVzaChlKG51bGwsbixhKSk6KHQuX3ZhbHVlcz10Ll92YWx1ZXN8fFtdLHQuX3ZhbHVlcy5wdXNoKGUobnVsbCxuLGEpKSksdDtpZihpKXt2YXIgbD1pWzFdLHU9K2w7aXNOYU4odSk/KHQ9dHx8e30pW2xdPWUodFtsXSxuLGEpOih0PXR8fFtdKVt1XT1lKHRbdV0sbixhKX1lbHNlIHRbcl09ZSh0W3JdLG4sYSk7cmV0dXJuIHR9KGUsZnVuY3Rpb24oZSl7dmFyIHQ9W10sYT1uZXcgUmVnRXhwKG4pLHI9L14oW15cXFtcXF1dKikvLmV4ZWMoZSk7Zm9yKHJbMV0mJnQucHVzaChyWzFdKTtudWxsIT09KHI9YS5leGVjKGUpKTspdC5wdXNoKHJbMV0pO3JldHVybiB0fSh0KSxhKTtlbHNle3ZhciByPWVbdF07cj8oQXJyYXkuaXNBcnJheShyKXx8KGVbdF09W3JdKSxlW3RdLnB1c2goYSkpOmVbdF09YX1yZXR1cm4gZX1mdW5jdGlvbiByKGUsdCxuKXtyZXR1cm4gbj0obj1TdHJpbmcobikpLnJlcGxhY2UoLyhcXHIpP1xcbi9nLFwiXFxyXFxuXCIpLG49KG49ZW5jb2RlVVJJQ29tcG9uZW50KG4pKS5yZXBsYWNlKC8lMjAvZyxcIitcIiksZSsoZT9cIiZcIjpcIlwiKStlbmNvZGVVUklDb21wb25lbnQodCkrXCI9XCIrbn1leHBvcnQgZGVmYXVsdCBmdW5jdGlvbihuLGkpe1wib2JqZWN0XCIhPXR5cGVvZiBpP2k9e2hhc2g6ISFpfTp2b2lkIDA9PT1pLmhhc2gmJihpLmhhc2g9ITApO2Zvcih2YXIgbD1pLmhhc2g/e306XCJcIix1PWkuc2VyaWFsaXplcnx8KGkuaGFzaD9hOnIpLHM9biYmbi5lbGVtZW50cz9uLmVsZW1lbnRzOltdLGM9T2JqZWN0LmNyZWF0ZShudWxsKSxvPTA7bzxzLmxlbmd0aDsrK28pe3ZhciBoPXNbb107aWYoKGkuZGlzYWJsZWR8fCFoLmRpc2FibGVkKSYmaC5uYW1lJiZ0LnRlc3QoaC5ub2RlTmFtZSkmJiFlLnRlc3QoaC50eXBlKSl7dmFyIHA9aC5uYW1lLGY9aC52YWx1ZTtpZihcImNoZWNrYm94XCIhPT1oLnR5cGUmJlwicmFkaW9cIiE9PWgudHlwZXx8aC5jaGVja2VkfHwoZj12b2lkIDApLGkuZW1wdHkpe2lmKFwiY2hlY2tib3hcIiE9PWgudHlwZXx8aC5jaGVja2VkfHwoZj0hMSksXCJyYWRpb1wiPT09aC50eXBlJiYoY1toLm5hbWVdfHxoLmNoZWNrZWQ/aC5jaGVja2VkJiYoY1toLm5hbWVdPSEwKTpjW2gubmFtZV09ITEpLG51bGw9PWYmJlwicmFkaW9cIj09aC50eXBlKWNvbnRpbnVlfWVsc2UgaWYoIWYpY29udGludWU7aWYoXCJzZWxlY3QtbXVsdGlwbGVcIiE9PWgudHlwZSlsPXUobCxwLGYpO2Vsc2V7Zj1bXTtmb3IodmFyIHY9aC5vcHRpb25zLG09ITEsZD0wO2Q8di5sZW5ndGg7KytkKXt2YXIgeT12W2RdO3kuc2VsZWN0ZWQmJih5LnZhbHVlfHxpLmVtcHR5JiYheS52YWx1ZSkmJihtPSEwLGw9aS5oYXNoJiZcIltdXCIhPT1wLnNsaWNlKHAubGVuZ3RoLTIpP3UobCxwK1wiW11cIix5LnZhbHVlKTp1KGwscCx5LnZhbHVlKSl9IW0mJmkuZW1wdHkmJihsPXUobCxwLFwiXCIpKX19fWlmKGkuZW1wdHkpZm9yKHZhciBwIGluIGMpY1twXXx8KGw9dShsLHAsXCJcIikpO3JldHVybiBsfVxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aW5kZXgubWpzLm1hcFxuIiwiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgRm9ybXMgZnJvbSAnQG55Y29wcG9ydHVuaXR5L3BhdHRlcm5zLWZyYW1ld29yay9zcmMvdXRpbGl0aWVzL2Zvcm1zL2Zvcm1zJztcblxuaW1wb3J0IHNlcmlhbGl6ZSBmcm9tICdmb3ItY2VyaWFsJztcblxuLyoqXG4gKiBAY2xhc3MgIFRoZSBOZXdzbGV0dGVyIG1vZHVsZVxuICovXG5jbGFzcyBOZXdzbGV0dGVyIHtcbiAgLyoqXG4gICAqIEBjb25zdHJ1Y3RvclxuICAgKlxuICAgKiBAcGFyYW0gICB7T2JqZWN0fSAgZWxlbWVudCAgVGhlIE5ld3NsZXR0ZXIgRE9NIE9iamVjdFxuICAgKlxuICAgKiBAcmV0dXJuICB7Q2xhc3N9ICAgICAgICAgICAgVGhlIGluc3RhbnRpYXRlZCBOZXdzbGV0dGVyIG9iamVjdFxuICAgKi9cbiAgY29uc3RydWN0b3IoZWxlbWVudCkge1xuICAgIHRoaXMuX2VsID0gZWxlbWVudDtcblxuICAgIHRoaXMua2V5cyA9IE5ld3NsZXR0ZXIua2V5cztcblxuICAgIHRoaXMuZW5kcG9pbnRzID0gTmV3c2xldHRlci5lbmRwb2ludHM7XG5cbiAgICB0aGlzLnNlbGVjdG9ycyA9IE5ld3NsZXR0ZXIuc2VsZWN0b3JzO1xuXG4gICAgdGhpcy5zZWxlY3RvciA9IE5ld3NsZXR0ZXIuc2VsZWN0b3I7XG5cbiAgICB0aGlzLnN0cmluZ0tleXMgPSBOZXdzbGV0dGVyLnN0cmluZ0tleXM7XG5cbiAgICB0aGlzLnN0cmluZ3MgPSBOZXdzbGV0dGVyLnN0cmluZ3M7XG5cbiAgICB0aGlzLnRlbXBsYXRlcyA9IE5ld3NsZXR0ZXIudGVtcGxhdGVzO1xuXG4gICAgdGhpcy5jbGFzc2VzID0gTmV3c2xldHRlci5jbGFzc2VzO1xuXG4gICAgdGhpcy5jYWxsYmFjayA9IFtcbiAgICAgIE5ld3NsZXR0ZXIuY2FsbGJhY2ssXG4gICAgICBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKCkucmVwbGFjZSgnMC4nLCAnJylcbiAgICBdLmpvaW4oJycpO1xuXG4gICAgLy8gVGhpcyBzZXRzIHRoZSBzY3JpcHQgY2FsbGJhY2sgZnVuY3Rpb24gdG8gYSBnbG9iYWwgZnVuY3Rpb24gdGhhdFxuICAgIC8vIGNhbiBiZSBhY2Nlc3NlZCBieSB0aGUgdGhlIHJlcXVlc3RlZCBzY3JpcHQuXG4gICAgd2luZG93W3RoaXMuY2FsbGJhY2tdID0gKGRhdGEpID0+IHtcbiAgICAgIHRoaXMuX2NhbGxiYWNrKGRhdGEpO1xuICAgIH07XG5cbiAgICB0aGlzLmZvcm0gPSBuZXcgRm9ybXModGhpcy5fZWwucXVlcnlTZWxlY3RvcignZm9ybScpKTtcblxuICAgIHRoaXMuZm9ybS5zdHJpbmdzID0gdGhpcy5zdHJpbmdzO1xuXG4gICAgdGhpcy5mb3JtLnN1Ym1pdCA9IChldmVudCkgPT4ge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgdGhpcy5fc3VibWl0KGV2ZW50KVxuICAgICAgICAudGhlbih0aGlzLl9vbmxvYWQpXG4gICAgICAgIC5jYXRjaCh0aGlzLl9vbmVycm9yKTtcbiAgICB9O1xuXG4gICAgdGhpcy5mb3JtLndhdGNoKCk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgZm9ybSBzdWJtaXNzaW9uIG1ldGhvZC4gUmVxdWVzdHMgYSBzY3JpcHQgd2l0aCBhIGNhbGxiYWNrIGZ1bmN0aW9uXG4gICAqIHRvIGJlIGV4ZWN1dGVkIG9uIG91ciBwYWdlLiBUaGUgY2FsbGJhY2sgZnVuY3Rpb24gd2lsbCBiZSBwYXNzZWQgdGhlXG4gICAqIHJlc3BvbnNlIGFzIGEgSlNPTiBvYmplY3QgKGZ1bmN0aW9uIHBhcmFtZXRlcikuXG4gICAqXG4gICAqIEBwYXJhbSAgIHtFdmVudH0gICAgZXZlbnQgIFRoZSBmb3JtIHN1Ym1pc3Npb24gZXZlbnRcbiAgICpcbiAgICogQHJldHVybiAge1Byb21pc2V9ICAgICAgICAgQSBwcm9taXNlIGNvbnRhaW5pbmcgdGhlIG5ldyBzY3JpcHQgY2FsbFxuICAgKi9cbiAgX3N1Ym1pdChldmVudCkge1xuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAvLyBTZXJpYWxpemUgdGhlIGRhdGFcbiAgICB0aGlzLl9kYXRhID0gc2VyaWFsaXplKGV2ZW50LnRhcmdldCwge2hhc2g6IHRydWV9KTtcblxuICAgIC8vIFN3aXRjaCB0aGUgYWN0aW9uIHRvIHBvc3QtanNvbi4gVGhpcyBjcmVhdGVzIGFuIGVuZHBvaW50IGZvciBtYWlsY2hpbXBcbiAgICAvLyB0aGF0IGFjdHMgYXMgYSBzY3JpcHQgdGhhdCBjYW4gYmUgbG9hZGVkIG9udG8gb3VyIHBhZ2UuXG4gICAgbGV0IGFjdGlvbiA9IGV2ZW50LnRhcmdldC5hY3Rpb24ucmVwbGFjZShcbiAgICAgIGAke3RoaXMuZW5kcG9pbnRzLk1BSU59P2AsIGAke3RoaXMuZW5kcG9pbnRzLk1BSU5fSlNPTn0/YFxuICAgICk7XG5cbiAgICAvLyBBZGQgb3VyIHBhcmFtcyB0byB0aGUgYWN0aW9uXG4gICAgYWN0aW9uID0gYWN0aW9uICsgc2VyaWFsaXplKGV2ZW50LnRhcmdldCwge3NlcmlhbGl6ZXI6ICguLi5wYXJhbXMpID0+IHtcbiAgICAgIGxldCBwcmV2ID0gKHR5cGVvZiBwYXJhbXNbMF0gPT09ICdzdHJpbmcnKSA/IHBhcmFtc1swXSA6ICcnO1xuXG4gICAgICByZXR1cm4gYCR7cHJldn0mJHtwYXJhbXNbMV19PSR7cGFyYW1zWzJdfWA7XG4gICAgfX0pO1xuXG4gICAgLy8gQXBwZW5kIHRoZSBjYWxsYmFjayByZWZlcmVuY2UuIE1haWxjaGltcCB3aWxsIHdyYXAgdGhlIEpTT04gcmVzcG9uc2UgaW5cbiAgICAvLyBvdXIgY2FsbGJhY2sgbWV0aG9kLiBPbmNlIHdlIGxvYWQgdGhlIHNjcmlwdCB0aGUgY2FsbGJhY2sgd2lsbCBleGVjdXRlLlxuICAgIGFjdGlvbiA9IGAke2FjdGlvbn0mYz13aW5kb3cuJHt0aGlzLmNhbGxiYWNrfWA7XG5cbiAgICAvLyBDcmVhdGUgYSBwcm9taXNlIHRoYXQgYXBwZW5kcyB0aGUgc2NyaXB0IHJlc3BvbnNlIG9mIHRoZSBwb3N0LWpzb24gbWV0aG9kXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGNvbnN0IHNjcmlwdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xuXG4gICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHNjcmlwdCk7XG4gICAgICBzY3JpcHQub25sb2FkID0gcmVzb2x2ZTtcbiAgICAgIHNjcmlwdC5vbmVycm9yID0gcmVqZWN0O1xuICAgICAgc2NyaXB0LmFzeW5jID0gdHJ1ZTtcbiAgICAgIHNjcmlwdC5zcmMgPSBlbmNvZGVVUkkoYWN0aW9uKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgc2NyaXB0IG9ubG9hZCByZXNvbHV0aW9uXG4gICAqXG4gICAqIEBwYXJhbSAgIHtFdmVudH0gIGV2ZW50ICBUaGUgc2NyaXB0IG9uIGxvYWQgZXZlbnRcbiAgICpcbiAgICogQHJldHVybiAge0NsYXNzfSAgICAgICAgIFRoZSBOZXdzbGV0dGVyIGNsYXNzXG4gICAqL1xuICBfb25sb2FkKGV2ZW50KSB7XG4gICAgZXZlbnQucGF0aFswXS5yZW1vdmUoKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBzY3JpcHQgb24gZXJyb3IgcmVzb2x1dGlvblxuICAgKlxuICAgKiBAcGFyYW0gICB7T2JqZWN0fSAgZXJyb3IgIFRoZSBzY3JpcHQgb24gZXJyb3IgbG9hZCBldmVudFxuICAgKlxuICAgKiBAcmV0dXJuICB7Q2xhc3N9ICAgICAgICAgIFRoZSBOZXdzbGV0dGVyIGNsYXNzXG4gICAqL1xuICBfb25lcnJvcihlcnJvcikge1xuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXG4gICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIGNvbnNvbGUuZGlyKGVycm9yKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBjYWxsYmFjayBmdW5jdGlvbiBmb3IgdGhlIE1haWxDaGltcCBTY3JpcHQgY2FsbFxuICAgKlxuICAgKiBAcGFyYW0gICB7T2JqZWN0fSAgZGF0YSAgVGhlIHN1Y2Nlc3MvZXJyb3IgbWVzc2FnZSBmcm9tIE1haWxDaGltcFxuICAgKlxuICAgKiBAcmV0dXJuICB7Q2xhc3N9ICAgICAgICBUaGUgTmV3c2xldHRlciBjbGFzc1xuICAgKi9cbiAgX2NhbGxiYWNrKGRhdGEpIHtcbiAgICBpZiAodGhpc1tgXyR7ZGF0YVt0aGlzLl9rZXkoJ01DX1JFU1VMVCcpXX1gXSkge1xuICAgICAgdGhpc1tgXyR7ZGF0YVt0aGlzLl9rZXkoJ01DX1JFU1VMVCcpXX1gXShkYXRhLm1zZyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXG4gICAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykgY29uc29sZS5kaXIoZGF0YSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogU3VibWlzc2lvbiBlcnJvciBoYW5kbGVyXG4gICAqXG4gICAqIEBwYXJhbSAgIHtzdHJpbmd9ICBtc2cgIFRoZSBlcnJvciBtZXNzYWdlXG4gICAqXG4gICAqIEByZXR1cm4gIHtDbGFzc30gICAgICAgIFRoZSBOZXdzbGV0dGVyIGNsYXNzXG4gICAqL1xuICBfZXJyb3IobXNnKSB7XG4gICAgdGhpcy5fZWxlbWVudHNSZXNldCgpO1xuICAgIHRoaXMuX21lc3NhZ2luZygnV0FSTklORycsIG1zZyk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBTdWJtaXNzaW9uIHN1Y2Nlc3MgaGFuZGxlclxuICAgKlxuICAgKiBAcGFyYW0gICB7c3RyaW5nfSAgbXNnICBUaGUgc3VjY2VzcyBtZXNzYWdlXG4gICAqXG4gICAqIEByZXR1cm4gIHtDbGFzc30gICAgICAgIFRoZSBOZXdzbGV0dGVyIGNsYXNzXG4gICAqL1xuICBfc3VjY2Vzcyhtc2cpIHtcbiAgICB0aGlzLl9lbGVtZW50c1Jlc2V0KCk7XG4gICAgdGhpcy5fbWVzc2FnaW5nKCdTVUNDRVNTJywgbXNnKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFByZXNlbnQgdGhlIHJlc3BvbnNlIG1lc3NhZ2UgdG8gdGhlIHVzZXJcbiAgICpcbiAgICogQHBhcmFtICAge1N0cmluZ30gIHR5cGUgIFRoZSBtZXNzYWdlIHR5cGVcbiAgICogQHBhcmFtICAge1N0cmluZ30gIG1zZyAgIFRoZSBtZXNzYWdlXG4gICAqXG4gICAqIEByZXR1cm4gIHtDbGFzc30gICAgICAgICBOZXdzbGV0dGVyXG4gICAqL1xuICBfbWVzc2FnaW5nKHR5cGUsIG1zZyA9ICdubyBtZXNzYWdlJykge1xuICAgIGxldCBzdHJpbmdzID0gT2JqZWN0LmtleXModGhpcy5zdHJpbmdLZXlzKTtcbiAgICBsZXQgaGFuZGxlZCA9IGZhbHNlO1xuXG4gICAgbGV0IGFsZXJ0Qm94ID0gdGhpcy5fZWwucXVlcnlTZWxlY3Rvcih0aGlzLnNlbGVjdG9yc1t0eXBlXSk7XG5cbiAgICBsZXQgYWxlcnRCb3hNc2cgPSBhbGVydEJveC5xdWVyeVNlbGVjdG9yKFxuICAgICAgdGhpcy5zZWxlY3RvcnMuQUxFUlRfVEVYVFxuICAgICk7XG5cbiAgICAvLyBHZXQgdGhlIGxvY2FsaXplZCBzdHJpbmcsIHRoZXNlIHNob3VsZCBiZSB3cml0dGVuIHRvIHRoZSBET00gYWxyZWFkeS5cbiAgICAvLyBUaGUgdXRpbGl0eSBjb250YWlucyBhIGdsb2JhbCBtZXRob2QgZm9yIHJldHJpZXZpbmcgdGhlbS5cbiAgICBsZXQgc3RyaW5nS2V5cyA9IHN0cmluZ3MuZmlsdGVyKHMgPT4gbXNnLmluY2x1ZGVzKHRoaXMuc3RyaW5nS2V5c1tzXSkpO1xuICAgIG1zZyA9IChzdHJpbmdLZXlzLmxlbmd0aCkgPyB0aGlzLnN0cmluZ3Nbc3RyaW5nS2V5c1swXV0gOiBtc2c7XG4gICAgaGFuZGxlZCA9IChzdHJpbmdLZXlzLmxlbmd0aCkgPyB0cnVlIDogZmFsc2U7XG5cbiAgICAvLyBSZXBsYWNlIHN0cmluZyB0ZW1wbGF0ZXMgd2l0aCB2YWx1ZXMgZnJvbSBlaXRoZXIgb3VyIGZvcm0gZGF0YSBvclxuICAgIC8vIHRoZSBOZXdzbGV0dGVyIHN0cmluZ3Mgb2JqZWN0LlxuICAgIGZvciAobGV0IHggPSAwOyB4IDwgdGhpcy50ZW1wbGF0ZXMubGVuZ3RoOyB4KyspIHtcbiAgICAgIGxldCB0ZW1wbGF0ZSA9IHRoaXMudGVtcGxhdGVzW3hdO1xuICAgICAgbGV0IGtleSA9IHRlbXBsYXRlLnJlcGxhY2UoJ3t7ICcsICcnKS5yZXBsYWNlKCcgfX0nLCAnJyk7XG4gICAgICBsZXQgdmFsdWUgPSB0aGlzLl9kYXRhW2tleV0gfHwgdGhpcy5zdHJpbmdzW2tleV07XG4gICAgICBsZXQgcmVnID0gbmV3IFJlZ0V4cCh0ZW1wbGF0ZSwgJ2dpJyk7XG5cbiAgICAgIG1zZyA9IG1zZy5yZXBsYWNlKHJlZywgKHZhbHVlKSA/IHZhbHVlIDogJycpO1xuICAgIH1cblxuICAgIGlmIChoYW5kbGVkKSB7XG4gICAgICBhbGVydEJveE1zZy5pbm5lckhUTUwgPSBtc2c7XG4gICAgfSBlbHNlIGlmICh0eXBlID09PSAnRVJST1InKSB7XG4gICAgICBhbGVydEJveE1zZy5pbm5lckhUTUwgPSB0aGlzLnN0cmluZ3MuRVJSX1BMRUFTRV9UUllfTEFURVI7XG4gICAgfVxuXG4gICAgaWYgKGFsZXJ0Qm94KSB0aGlzLl9lbGVtZW50U2hvdyhhbGVydEJveCwgYWxlcnRCb3hNc2cpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogVGhlIG1haW4gdG9nZ2xpbmcgbWV0aG9kXG4gICAqXG4gICAqIEByZXR1cm4gIHtDbGFzc30gIE5ld3NsZXR0ZXJcbiAgICovXG4gIF9lbGVtZW50c1Jlc2V0KCkge1xuICAgIGxldCB0YXJnZXRzID0gdGhpcy5fZWwucXVlcnlTZWxlY3RvckFsbCh0aGlzLnNlbGVjdG9ycy5BTEVSVFMpO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0YXJnZXRzLmxlbmd0aDsgaSsrKVxuICAgICAgaWYgKCF0YXJnZXRzW2ldLmNsYXNzTGlzdC5jb250YWlucyh0aGlzLmNsYXNzZXMuSElEREVOKSkge1xuICAgICAgICB0YXJnZXRzW2ldLmNsYXNzTGlzdC5hZGQodGhpcy5jbGFzc2VzLkhJRERFTik7XG5cbiAgICAgICAgdGhpcy5jbGFzc2VzLkFOSU1BVEUuc3BsaXQoJyAnKS5mb3JFYWNoKChpdGVtKSA9PlxuICAgICAgICAgIHRhcmdldHNbaV0uY2xhc3NMaXN0LnJlbW92ZShpdGVtKVxuICAgICAgICApO1xuXG4gICAgICAgIC8vIFNjcmVlbiBSZWFkZXJzXG4gICAgICAgIHRhcmdldHNbaV0uc2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicsICd0cnVlJyk7XG4gICAgICAgIHRhcmdldHNbaV0ucXVlcnlTZWxlY3Rvcih0aGlzLnNlbGVjdG9ycy5BTEVSVF9URVhUKVxuICAgICAgICAgIC5zZXRBdHRyaWJ1dGUoJ2FyaWEtbGl2ZScsICdvZmYnKTtcbiAgICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBtYWluIHRvZ2dsaW5nIG1ldGhvZFxuICAgKlxuICAgKiBAcGFyYW0gICB7b2JqZWN0fSAgdGFyZ2V0ICAgTWVzc2FnZSBjb250YWluZXJcbiAgICogQHBhcmFtICAge29iamVjdH0gIGNvbnRlbnQgIENvbnRlbnQgdGhhdCBjaGFuZ2VzIGR5bmFtaWNhbGx5IHRoYXQgc2hvdWxkXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICBiZSBhbm5vdW5jZWQgdG8gc2NyZWVuIHJlYWRlcnMuXG4gICAqXG4gICAqIEByZXR1cm4gIHtDbGFzc30gICAgICAgICAgICBOZXdzbGV0dGVyXG4gICAqL1xuICBfZWxlbWVudFNob3codGFyZ2V0LCBjb250ZW50KSB7XG4gICAgdGFyZ2V0LmNsYXNzTGlzdC50b2dnbGUodGhpcy5jbGFzc2VzLkhJRERFTik7XG5cbiAgICB0aGlzLmNsYXNzZXMuQU5JTUFURS5zcGxpdCgnICcpLmZvckVhY2goKGl0ZW0pID0+XG4gICAgICB0YXJnZXQuY2xhc3NMaXN0LnRvZ2dsZShpdGVtKVxuICAgICk7XG5cbiAgICAvLyBTY3JlZW4gUmVhZGVyc1xuICAgIHRhcmdldC5zZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJywgJ3RydWUnKTtcblxuICAgIGlmIChjb250ZW50KSB7XG4gICAgICBjb250ZW50LnNldEF0dHJpYnV0ZSgnYXJpYS1saXZlJywgJ3BvbGl0ZScpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIEEgcHJveHkgZnVuY3Rpb24gZm9yIHJldHJpZXZpbmcgdGhlIHByb3BlciBrZXlcbiAgICpcbiAgICogQHBhcmFtICAge3N0cmluZ30gIGtleSAgVGhlIHJlZmVyZW5jZSBmb3IgdGhlIHN0b3JlZCBrZXlzLlxuICAgKlxuICAgKiBAcmV0dXJuICB7c3RyaW5nfSAgICAgICBUaGUgZGVzaXJlZCBrZXkuXG4gICAqL1xuICBfa2V5KGtleSkge1xuICAgIHJldHVybiB0aGlzLmtleXNba2V5XTtcbiAgfVxufVxuXG4vKiogQHR5cGUgIHtPYmplY3R9ICBBUEkgZGF0YSBrZXlzICovXG5OZXdzbGV0dGVyLmtleXMgPSB7XG4gIE1DX1JFU1VMVDogJ3Jlc3VsdCcsXG4gIE1DX01TRzogJ21zZydcbn07XG5cbi8qKiBAdHlwZSAge09iamVjdH0gIEFQSSBlbmRwb2ludHMgKi9cbk5ld3NsZXR0ZXIuZW5kcG9pbnRzID0ge1xuICBNQUlOOiAnL3Bvc3QnLFxuICBNQUlOX0pTT046ICcvcG9zdC1qc29uJ1xufTtcblxuLyoqIEB0eXBlICB7U3RyaW5nfSAgVGhlIE1haWxjaGltcCBjYWxsYmFjayByZWZlcmVuY2UuICovXG5OZXdzbGV0dGVyLmNhbGxiYWNrID0gJ05ld3NsZXR0ZXJDYWxsYmFjayc7XG5cbi8qKiBAdHlwZSAge09iamVjdH0gIERPTSBzZWxlY3RvcnMgZm9yIHRoZSBpbnN0YW5jZSdzIGNvbmNlcm5zICovXG5OZXdzbGV0dGVyLnNlbGVjdG9ycyA9IHtcbiAgRUxFTUVOVDogJ1tkYXRhLWpzPVwibmV3c2xldHRlclwiXScsXG4gIEFMRVJUUzogJ1tkYXRhLWpzKj1cImFsZXJ0XCJdJyxcbiAgV0FSTklORzogJ1tkYXRhLWpzPVwiYWxlcnQtd2FybmluZ1wiXScsXG4gIFNVQ0NFU1M6ICdbZGF0YS1qcz1cImFsZXJ0LXN1Y2Nlc3NcIl0nLFxuICBBTEVSVF9URVhUOiAnW2RhdGEtanMtYWxlcnQ9XCJ0ZXh0XCJdJ1xufTtcblxuLyoqIEB0eXBlICB7U3RyaW5nfSAgVGhlIG1haW4gRE9NIHNlbGVjdG9yIGZvciB0aGUgaW5zdGFuY2UgKi9cbk5ld3NsZXR0ZXIuc2VsZWN0b3IgPSBOZXdzbGV0dGVyLnNlbGVjdG9ycy5FTEVNRU5UO1xuXG4vKiogQHR5cGUgIHtPYmplY3R9ICBTdHJpbmcgcmVmZXJlbmNlcyBmb3IgdGhlIGluc3RhbmNlICovXG5OZXdzbGV0dGVyLnN0cmluZ0tleXMgPSB7XG4gIFNVQ0NFU1NfQ09ORklSTV9FTUFJTDogJ0FsbW9zdCBmaW5pc2hlZC4uLicsXG4gIEVSUl9QTEVBU0VfRU5URVJfVkFMVUU6ICdQbGVhc2UgZW50ZXIgYSB2YWx1ZScsXG4gIEVSUl9UT09fTUFOWV9SRUNFTlQ6ICd0b28gbWFueScsXG4gIEVSUl9BTFJFQURZX1NVQlNDUklCRUQ6ICdpcyBhbHJlYWR5IHN1YnNjcmliZWQnLFxuICBFUlJfSU5WQUxJRF9FTUFJTDogJ2xvb2tzIGZha2Ugb3IgaW52YWxpZCdcbn07XG5cbi8qKiBAdHlwZSAge09iamVjdH0gIEF2YWlsYWJsZSBzdHJpbmdzICovXG5OZXdzbGV0dGVyLnN0cmluZ3MgPSB7XG4gIFZBTElEX1JFUVVJUkVEOiAnVGhpcyBmaWVsZCBpcyByZXF1aXJlZC4nLFxuICBWQUxJRF9FTUFJTF9SRVFVSVJFRDogJ0VtYWlsIGlzIHJlcXVpcmVkLicsXG4gIFZBTElEX0VNQUlMX0lOVkFMSUQ6ICdQbGVhc2UgZW50ZXIgYSB2YWxpZCBlbWFpbC4nLFxuICBWQUxJRF9DSEVDS0JPWF9CT1JPVUdIOiAnUGxlYXNlIHNlbGVjdCBhIGJvcm91Z2guJyxcbiAgRVJSX1BMRUFTRV9UUllfTEFURVI6ICdUaGVyZSB3YXMgYW4gZXJyb3Igd2l0aCB5b3VyIHN1Ym1pc3Npb24uICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJ1BsZWFzZSB0cnkgYWdhaW4gbGF0ZXIuJyxcbiAgU1VDQ0VTU19DT05GSVJNX0VNQUlMOiAnQWxtb3N0IGZpbmlzaGVkLi4uIFdlIG5lZWQgdG8gY29uZmlybSB5b3VyIGVtYWlsICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICdhZGRyZXNzLiBUbyBjb21wbGV0ZSB0aGUgc3Vic2NyaXB0aW9uIHByb2Nlc3MsICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICdwbGVhc2UgY2xpY2sgdGhlIGxpbmsgaW4gdGhlIGVtYWlsIHdlIGp1c3Qgc2VudCB5b3UuJyxcbiAgRVJSX1BMRUFTRV9FTlRFUl9WQUxVRTogJ1BsZWFzZSBlbnRlciBhIHZhbHVlJyxcbiAgRVJSX1RPT19NQU5ZX1JFQ0VOVDogJ1JlY2lwaWVudCBcInt7IEVNQUlMIH19XCIgaGFzIHRvbyAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgJ21hbnkgcmVjZW50IHNpZ251cCByZXF1ZXN0cycsXG4gIEVSUl9BTFJFQURZX1NVQlNDUklCRUQ6ICd7eyBFTUFJTCB9fSBpcyBhbHJlYWR5IHN1YnNjcmliZWQgJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICd0byBsaXN0IHt7IExJU1RfTkFNRSB9fS4nLFxuICBFUlJfSU5WQUxJRF9FTUFJTDogJ1RoaXMgZW1haWwgYWRkcmVzcyBsb29rcyBmYWtlIG9yIGludmFsaWQuICcgK1xuICAgICAgICAgICAgICAgICAgICAgJ1BsZWFzZSBlbnRlciBhIHJlYWwgZW1haWwgYWRkcmVzcy4nLFxuICBMSVNUX05BTUU6ICdOZXdzbGV0dGVyJ1xufTtcblxuLyoqIEB0eXBlICB7QXJyYXl9ICBQbGFjZWhvbGRlcnMgdGhhdCB3aWxsIGJlIHJlcGxhY2VkIGluIG1lc3NhZ2Ugc3RyaW5ncyAqL1xuTmV3c2xldHRlci50ZW1wbGF0ZXMgPSBbXG4gICd7eyBFTUFJTCB9fScsXG4gICd7eyBMSVNUX05BTUUgfX0nXG5dO1xuXG5OZXdzbGV0dGVyLmNsYXNzZXMgPSB7XG4gIEFOSU1BVEU6ICdhbmltYXRlZCBmYWRlSW5VcCcsXG4gIEhJRERFTjogJ2hpZGRlbidcbn07XG5cbmV4cG9ydCBkZWZhdWx0IE5ld3NsZXR0ZXI7XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICogVGhlIFNpbXBsZSBUb2dnbGUgY2xhc3MuIFRoaXMgd2lsbCB0b2dnbGUgdGhlIGNsYXNzICdhY3RpdmUnIGFuZCAnaGlkZGVuJ1xuICogb24gdGFyZ2V0IGVsZW1lbnRzLCBkZXRlcm1pbmVkIGJ5IGEgY2xpY2sgZXZlbnQgb24gYSBzZWxlY3RlZCBsaW5rIG9yXG4gKiBlbGVtZW50LiBUaGlzIHdpbGwgYWxzbyB0b2dnbGUgdGhlIGFyaWEtaGlkZGVuIGF0dHJpYnV0ZSBmb3IgdGFyZ2V0ZWRcbiAqIGVsZW1lbnRzIHRvIHN1cHBvcnQgc2NyZWVuIHJlYWRlcnMuIFRhcmdldCBzZXR0aW5ncyBhbmQgb3RoZXIgZnVuY3Rpb25hbGl0eVxuICogY2FuIGJlIGNvbnRyb2xsZWQgdGhyb3VnaCBkYXRhIGF0dHJpYnV0ZXMuXG4gKlxuICogVGhpcyB1c2VzIHRoZSAubWF0Y2hlcygpIG1ldGhvZCB3aGljaCB3aWxsIHJlcXVpcmUgYSBwb2x5ZmlsbCBmb3IgSUVcbiAqIGh0dHBzOi8vcG9seWZpbGwuaW8vdjIvZG9jcy9mZWF0dXJlcy8jRWxlbWVudF9wcm90b3R5cGVfbWF0Y2hlc1xuICpcbiAqIEBjbGFzc1xuICovXG5jbGFzcyBUb2dnbGUge1xuICAvKipcbiAgICogQGNvbnN0cnVjdG9yXG4gICAqXG4gICAqIEBwYXJhbSAge09iamVjdH0gIHMgIFNldHRpbmdzIGZvciB0aGlzIFRvZ2dsZSBpbnN0YW5jZVxuICAgKlxuICAgKiBAcmV0dXJuIHtPYmplY3R9ICAgICBUaGUgY2xhc3NcbiAgICovXG4gIGNvbnN0cnVjdG9yKHMpIHtcbiAgICAvLyBDcmVhdGUgYW4gb2JqZWN0IHRvIHN0b3JlIGV4aXN0aW5nIHRvZ2dsZSBsaXN0ZW5lcnMgKGlmIGl0IGRvZXNuJ3QgZXhpc3QpXG4gICAgaWYgKCF3aW5kb3cuaGFzT3duUHJvcGVydHkoJ0FDQ0VTU19UT0dHTEVTJykpXG4gICAgICB3aW5kb3cuQUNDRVNTX1RPR0dMRVMgPSBbXTtcblxuICAgIHMgPSAoIXMpID8ge30gOiBzO1xuXG4gICAgdGhpcy5zZXR0aW5ncyA9IHtcbiAgICAgIHNlbGVjdG9yOiAocy5zZWxlY3RvcikgPyBzLnNlbGVjdG9yIDogVG9nZ2xlLnNlbGVjdG9yLFxuICAgICAgbmFtZXNwYWNlOiAocy5uYW1lc3BhY2UpID8gcy5uYW1lc3BhY2UgOiBUb2dnbGUubmFtZXNwYWNlLFxuICAgICAgaW5hY3RpdmVDbGFzczogKHMuaW5hY3RpdmVDbGFzcykgPyBzLmluYWN0aXZlQ2xhc3MgOiBUb2dnbGUuaW5hY3RpdmVDbGFzcyxcbiAgICAgIGFjdGl2ZUNsYXNzOiAocy5hY3RpdmVDbGFzcykgPyBzLmFjdGl2ZUNsYXNzIDogVG9nZ2xlLmFjdGl2ZUNsYXNzLFxuICAgICAgYmVmb3JlOiAocy5iZWZvcmUpID8gcy5iZWZvcmUgOiBmYWxzZSxcbiAgICAgIGFmdGVyOiAocy5hZnRlcikgPyBzLmFmdGVyIDogZmFsc2VcbiAgICB9O1xuXG4gICAgLy8gU3RvcmUgdGhlIGVsZW1lbnQgZm9yIHBvdGVudGlhbCB1c2UgaW4gY2FsbGJhY2tzXG4gICAgdGhpcy5lbGVtZW50ID0gKHMuZWxlbWVudCkgPyBzLmVsZW1lbnQgOiBmYWxzZTtcblxuICAgIGlmICh0aGlzLmVsZW1lbnQpXG4gICAgICB0aGlzLmVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZXZlbnQpID0+IHtcbiAgICAgICAgdGhpcy50b2dnbGUoZXZlbnQpO1xuICAgICAgfSk7XG4gICAgZWxzZVxuICAgICAgLy8gSWYgdGhlcmUgaXNuJ3QgYW4gZXhpc3RpbmcgaW5zdGFudGlhdGVkIHRvZ2dsZSwgYWRkIHRoZSBldmVudCBsaXN0ZW5lci5cbiAgICAgIGlmICghd2luZG93LkFDQ0VTU19UT0dHTEVTLmhhc093blByb3BlcnR5KHRoaXMuc2V0dGluZ3Muc2VsZWN0b3IpKVxuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdib2R5JykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBldmVudCA9PiB7XG4gICAgICAgICAgaWYgKCFldmVudC50YXJnZXQubWF0Y2hlcyh0aGlzLnNldHRpbmdzLnNlbGVjdG9yKSlcbiAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICAgIC8vIFN0b3JlIHRoZSBldmVudCBmb3IgcG90ZW50aWFsIHVzZSBpbiBjYWxsYmFja3NcbiAgICAgICAgICB0aGlzLmV2ZW50ID0gZXZlbnQ7XG5cbiAgICAgICAgICB0aGlzLnRvZ2dsZShldmVudCk7XG4gICAgICAgIH0pO1xuXG4gICAgLy8gUmVjb3JkIHRoYXQgYSB0b2dnbGUgdXNpbmcgdGhpcyBzZWxlY3RvciBoYXMgYmVlbiBpbnN0YW50aWF0ZWQuIFRoaXNcbiAgICAvLyBwcmV2ZW50cyBkb3VibGUgdG9nZ2xpbmcuXG4gICAgd2luZG93LkFDQ0VTU19UT0dHTEVTW3RoaXMuc2V0dGluZ3Muc2VsZWN0b3JdID0gdHJ1ZTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIExvZ3MgY29uc3RhbnRzIHRvIHRoZSBkZWJ1Z2dlclxuICAgKlxuICAgKiBAcGFyYW0gIHtPYmplY3R9ICBldmVudCAgVGhlIG1haW4gY2xpY2sgZXZlbnRcbiAgICpcbiAgICogQHJldHVybiB7T2JqZWN0fSAgICAgICAgIFRoZSBjbGFzc1xuICAgKi9cbiAgdG9nZ2xlKGV2ZW50KSB7XG4gICAgbGV0IGVsID0gZXZlbnQudGFyZ2V0O1xuICAgIGxldCB0YXJnZXQgPSBmYWxzZTtcbiAgICBsZXQgZm9jdXNhYmxlID0gW107XG5cbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgLyoqIEFuY2hvciBMaW5rcyAqL1xuICAgIHRhcmdldCA9IChlbC5oYXNBdHRyaWJ1dGUoJ2hyZWYnKSkgP1xuICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihlbC5nZXRBdHRyaWJ1dGUoJ2hyZWYnKSkgOiB0YXJnZXQ7XG5cbiAgICAvKiogVG9nZ2xlIENvbnRyb2xzICovXG4gICAgdGFyZ2V0ID0gKGVsLmhhc0F0dHJpYnV0ZSgnYXJpYS1jb250cm9scycpKSA/XG4gICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjJHtlbC5nZXRBdHRyaWJ1dGUoJ2FyaWEtY29udHJvbHMnKX1gKSA6IHRhcmdldDtcblxuICAgIC8qKiBGb2N1c2FibGUgQ2hpbGRyZW4gKi9cbiAgICBmb2N1c2FibGUgPSAodGFyZ2V0KSA/XG4gICAgICB0YXJnZXQucXVlcnlTZWxlY3RvckFsbChUb2dnbGUuZWxGb2N1c2FibGUuam9pbignLCAnKSkgOiBmb2N1c2FibGU7XG5cbiAgICAvKiogTWFpbiBGdW5jdGlvbmFsaXR5ICovXG4gICAgaWYgKCF0YXJnZXQpIHJldHVybiB0aGlzO1xuICAgIHRoaXMuZWxlbWVudFRvZ2dsZShlbCwgdGFyZ2V0LCBmb2N1c2FibGUpO1xuXG4gICAgLyoqIFVuZG8gKi9cbiAgICBpZiAoZWwuZGF0YXNldFtgJHt0aGlzLnNldHRpbmdzLm5hbWVzcGFjZX1VbmRvYF0pIHtcbiAgICAgIGNvbnN0IHVuZG8gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFxuICAgICAgICBlbC5kYXRhc2V0W2Ake3RoaXMuc2V0dGluZ3MubmFtZXNwYWNlfVVuZG9gXVxuICAgICAgKTtcblxuICAgICAgdW5kby5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChldmVudCkgPT4ge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB0aGlzLmVsZW1lbnRUb2dnbGUoZWwsIHRhcmdldCk7XG4gICAgICAgIHVuZG8ucmVtb3ZlRXZlbnRMaXN0ZW5lcignY2xpY2snKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBtYWluIHRvZ2dsaW5nIG1ldGhvZFxuICAgKlxuICAgKiBAcGFyYW0gIHtPYmplY3R9ICAgIGVsICAgICAgICAgVGhlIGN1cnJlbnQgZWxlbWVudCB0byB0b2dnbGUgYWN0aXZlXG4gICAqIEBwYXJhbSAge09iamVjdH0gICAgdGFyZ2V0ICAgICBUaGUgdGFyZ2V0IGVsZW1lbnQgdG8gdG9nZ2xlIGFjdGl2ZS9oaWRkZW5cbiAgICogQHBhcmFtICB7Tm9kZUxpc3R9ICBmb2N1c2FibGUgIEFueSBmb2N1c2FibGUgY2hpbGRyZW4gaW4gdGhlIHRhcmdldFxuICAgKlxuICAgKiBAcmV0dXJuIHtPYmplY3R9ICAgICAgICAgIFRoZSBjbGFzc1xuICAgKi9cbiAgZWxlbWVudFRvZ2dsZShlbCwgdGFyZ2V0LCBmb2N1c2FibGUgPSBbXSkge1xuICAgIGxldCBpID0gMDtcbiAgICBsZXQgYXR0ciA9ICcnO1xuICAgIGxldCB2YWx1ZSA9ICcnO1xuXG4gICAgLy8gR2V0IG90aGVyIHRvZ2dsZXMgdGhhdCBtaWdodCBjb250cm9sIHRoZSBzYW1lIGVsZW1lbnRcbiAgICBsZXQgb3RoZXJzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcbiAgICAgIGBbYXJpYS1jb250cm9scz1cIiR7ZWwuZ2V0QXR0cmlidXRlKCdhcmlhLWNvbnRyb2xzJyl9XCJdYCk7XG5cbiAgICAvLyBTdG9yZSBlbGVtZW50cyBmb3IgcG90ZW50aWFsIHVzZSBpbiBjYWxsYmFja3NcbiAgICB0aGlzLmVsZW1lbnQgPSBlbDtcbiAgICB0aGlzLnRhcmdldCA9IHRhcmdldDtcbiAgICB0aGlzLm90aGVycyA9IG90aGVycztcbiAgICB0aGlzLmZvY3VzYWJsZSA9IGZvY3VzYWJsZTtcblxuICAgIC8qKlxuICAgICAqIFRvZ2dsaW5nIGJlZm9yZSBob29rXG4gICAgICovXG4gICAgaWYgKHRoaXMuc2V0dGluZ3MuYmVmb3JlKSB0aGlzLnNldHRpbmdzLmJlZm9yZSh0aGlzKTtcblxuICAgIC8qKlxuICAgICAqIFRvZ2dsZSBFbGVtZW50IGFuZCBUYXJnZXQgY2xhc3Nlc1xuICAgICAqL1xuICAgIGlmICh0aGlzLnNldHRpbmdzLmFjdGl2ZUNsYXNzKSB7XG4gICAgICBlbC5jbGFzc0xpc3QudG9nZ2xlKHRoaXMuc2V0dGluZ3MuYWN0aXZlQ2xhc3MpO1xuICAgICAgdGFyZ2V0LmNsYXNzTGlzdC50b2dnbGUodGhpcy5zZXR0aW5ncy5hY3RpdmVDbGFzcyk7XG5cbiAgICAgIC8vIElmIHRoZXJlIGFyZSBvdGhlciB0b2dnbGVzIHRoYXQgY29udHJvbCB0aGUgc2FtZSBlbGVtZW50XG4gICAgICBpZiAob3RoZXJzKSBvdGhlcnMuZm9yRWFjaCgob3RoZXIpID0+IHtcbiAgICAgICAgaWYgKG90aGVyICE9PSBlbCkgb3RoZXIuY2xhc3NMaXN0LnRvZ2dsZSh0aGlzLnNldHRpbmdzLmFjdGl2ZUNsYXNzKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmICh0aGlzLnNldHRpbmdzLmluYWN0aXZlQ2xhc3MpXG4gICAgICB0YXJnZXQuY2xhc3NMaXN0LnRvZ2dsZSh0aGlzLnNldHRpbmdzLmluYWN0aXZlQ2xhc3MpO1xuXG4gICAgLyoqXG4gICAgICogVGFyZ2V0IEVsZW1lbnQgQXJpYSBBdHRyaWJ1dGVzXG4gICAgICovXG4gICAgZm9yIChpID0gMDsgaSA8IFRvZ2dsZS50YXJnZXRBcmlhUm9sZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGF0dHIgPSBUb2dnbGUudGFyZ2V0QXJpYVJvbGVzW2ldO1xuICAgICAgdmFsdWUgPSB0YXJnZXQuZ2V0QXR0cmlidXRlKGF0dHIpO1xuXG4gICAgICBpZiAodmFsdWUgIT0gJycgJiYgdmFsdWUpXG4gICAgICAgIHRhcmdldC5zZXRBdHRyaWJ1dGUoYXR0ciwgKHZhbHVlID09PSAndHJ1ZScpID8gJ2ZhbHNlJyA6ICd0cnVlJyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSGlkZSB0aGUgVG9nZ2xlIFRhcmdldCdzIGZvY3VzYWJsZSBjaGlsZHJlbiBmcm9tIGZvY3VzLlxuICAgICAqIElmIGFuIGVsZW1lbnQgaGFzIHRoZSBkYXRhLWF0dHJpYnV0ZSAnZGF0YS10b2dnbGUtdGFiaW5kZXgnLCB1c2UgdGhhdFxuICAgICAqIGFzIHRoZSBkZWZhdWx0IHRhYiBpbmRleCBvZiB0aGUgZWxlbWVudC5cbiAgICAgKi9cbiAgICBmb2N1c2FibGUuZm9yRWFjaChlbCA9PiB7XG4gICAgICBsZXQgdGFiaW5kZXggPSBlbC5nZXRBdHRyaWJ1dGUoJ3RhYmluZGV4Jyk7XG5cbiAgICAgIGlmICh0YWJpbmRleCA9PT0gJy0xJykge1xuICAgICAgICBsZXQgZGF0YURlZmF1bHQgPSBlbC5nZXRBdHRyaWJ1dGUoYGRhdGEtJHtUb2dnbGUubmFtZXNwYWNlfS10YWJpbmRleGApO1xuXG4gICAgICAgIGlmIChkYXRhRGVmYXVsdCkge1xuICAgICAgICAgIGVsLnNldEF0dHJpYnV0ZSgndGFiaW5kZXgnLCBkYXRhRGVmYXVsdCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZWwucmVtb3ZlQXR0cmlidXRlKCd0YWJpbmRleCcpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBlbC5zZXRBdHRyaWJ1dGUoJ3RhYmluZGV4JywgJy0xJyk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBKdW1wIHRvIFRhcmdldCBFbGVtZW50IChpZiBUb2dnbGUgRWxlbWVudCBpcyBhbiBhbmNob3IgbGluaykuXG4gICAgICovXG4gICAgaWYgKGVsLmhhc0F0dHJpYnV0ZSgnaHJlZicpKSB7XG4gICAgICAvLyBSZXNldCB0aGUgaGlzdG9yeSBzdGF0ZSwgdGhpcyB3aWxsIGNsZWFyIG91dFxuICAgICAgLy8gdGhlIGhhc2ggd2hlbiB0aGUganVtcCBpdGVtIGlzIHRvZ2dsZWQgY2xvc2VkLlxuICAgICAgaGlzdG9yeS5wdXNoU3RhdGUoJycsICcnLFxuICAgICAgICB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUgKyB3aW5kb3cubG9jYXRpb24uc2VhcmNoKTtcblxuICAgICAgLy8gVGFyZ2V0IGVsZW1lbnQgdG9nZ2xlLlxuICAgICAgaWYgKHRhcmdldC5jbGFzc0xpc3QuY29udGFpbnModGhpcy5zZXR0aW5ncy5hY3RpdmVDbGFzcykpIHtcbiAgICAgICAgd2luZG93LmxvY2F0aW9uLmhhc2ggPSBlbC5nZXRBdHRyaWJ1dGUoJ2hyZWYnKTtcblxuICAgICAgICB0YXJnZXQuc2V0QXR0cmlidXRlKCd0YWJpbmRleCcsICctMScpO1xuICAgICAgICB0YXJnZXQuZm9jdXMoe3ByZXZlbnRTY3JvbGw6IHRydWV9KTtcbiAgICAgIH0gZWxzZVxuICAgICAgICB0YXJnZXQucmVtb3ZlQXR0cmlidXRlKCd0YWJpbmRleCcpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRvZ2dsZSBFbGVtZW50IChpbmNsdWRpbmcgbXVsdGkgdG9nZ2xlcykgQXJpYSBBdHRyaWJ1dGVzXG4gICAgICovXG4gICAgZm9yIChpID0gMDsgaSA8IFRvZ2dsZS5lbEFyaWFSb2xlcy5sZW5ndGg7IGkrKykge1xuICAgICAgYXR0ciA9IFRvZ2dsZS5lbEFyaWFSb2xlc1tpXTtcbiAgICAgIHZhbHVlID0gZWwuZ2V0QXR0cmlidXRlKGF0dHIpO1xuXG4gICAgICBpZiAodmFsdWUgIT0gJycgJiYgdmFsdWUpXG4gICAgICAgIGVsLnNldEF0dHJpYnV0ZShhdHRyLCAodmFsdWUgPT09ICd0cnVlJykgPyAnZmFsc2UnIDogJ3RydWUnKTtcblxuICAgICAgLy8gSWYgdGhlcmUgYXJlIG90aGVyIHRvZ2dsZXMgdGhhdCBjb250cm9sIHRoZSBzYW1lIGVsZW1lbnRcbiAgICAgIGlmIChvdGhlcnMpIG90aGVycy5mb3JFYWNoKChvdGhlcikgPT4ge1xuICAgICAgICBpZiAob3RoZXIgIT09IGVsICYmIG90aGVyLmdldEF0dHJpYnV0ZShhdHRyKSlcbiAgICAgICAgICBvdGhlci5zZXRBdHRyaWJ1dGUoYXR0ciwgKHZhbHVlID09PSAndHJ1ZScpID8gJ2ZhbHNlJyA6ICd0cnVlJyk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUb2dnbGluZyBjb21wbGV0ZSBob29rLlxuICAgICAqL1xuICAgIGlmICh0aGlzLnNldHRpbmdzLmFmdGVyKSB0aGlzLnNldHRpbmdzLmFmdGVyKHRoaXMpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbn1cblxuLyoqIEB0eXBlIHtTdHJpbmd9IFRoZSBtYWluIHNlbGVjdG9yIHRvIGFkZCB0aGUgdG9nZ2xpbmcgZnVuY3Rpb24gdG8gKi9cblRvZ2dsZS5zZWxlY3RvciA9ICdbZGF0YS1qcyo9XCJ0b2dnbGVcIl0nO1xuXG4vKiogQHR5cGUgIHtTdHJpbmd9ICBUaGUgbmFtZXNwYWNlIGZvciBvdXIgZGF0YSBhdHRyaWJ1dGUgc2V0dGluZ3MgKi9cblRvZ2dsZS5uYW1lc3BhY2UgPSAndG9nZ2xlJztcblxuLyoqIEB0eXBlICB7U3RyaW5nfSAgVGhlIGhpZGUgY2xhc3MgKi9cblRvZ2dsZS5pbmFjdGl2ZUNsYXNzID0gJ2hpZGRlbic7XG5cbi8qKiBAdHlwZSAge1N0cmluZ30gIFRoZSBhY3RpdmUgY2xhc3MgKi9cblRvZ2dsZS5hY3RpdmVDbGFzcyA9ICdhY3RpdmUnO1xuXG4vKiogQHR5cGUgIHtBcnJheX0gIEFyaWEgcm9sZXMgdG8gdG9nZ2xlIHRydWUvZmFsc2Ugb24gdGhlIHRvZ2dsaW5nIGVsZW1lbnQgKi9cblRvZ2dsZS5lbEFyaWFSb2xlcyA9IFsnYXJpYS1wcmVzc2VkJywgJ2FyaWEtZXhwYW5kZWQnXTtcblxuLyoqIEB0eXBlICB7QXJyYXl9ICBBcmlhIHJvbGVzIHRvIHRvZ2dsZSB0cnVlL2ZhbHNlIG9uIHRoZSB0YXJnZXQgZWxlbWVudCAqL1xuVG9nZ2xlLnRhcmdldEFyaWFSb2xlcyA9IFsnYXJpYS1oaWRkZW4nXTtcblxuLyoqIEB0eXBlICB7QXJyYXl9ICBGb2N1c2FibGUgZWxlbWVudHMgdG8gaGlkZSB3aXRoaW4gdGhlIGhpZGRlbiB0YXJnZXQgZWxlbWVudCAqL1xuVG9nZ2xlLmVsRm9jdXNhYmxlID0gW1xuICAnYScsICdidXR0b24nLCAnaW5wdXQnLCAnc2VsZWN0JywgJ3RleHRhcmVhJywgJ29iamVjdCcsICdlbWJlZCcsICdmb3JtJyxcbiAgJ2ZpZWxkc2V0JywgJ2xlZ2VuZCcsICdsYWJlbCcsICdhcmVhJywgJ2F1ZGlvJywgJ3ZpZGVvJywgJ2lmcmFtZScsICdzdmcnLFxuICAnZGV0YWlscycsICd0YWJsZScsICdbdGFiaW5kZXhdJywgJ1tjb250ZW50ZWRpdGFibGVdJywgJ1t1c2VtYXBdJ1xuXTtcblxuZXhwb3J0IGRlZmF1bHQgVG9nZ2xlO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIFRyYWNraW5nIGJ1cyBmb3IgR29vZ2xlIGFuYWx5dGljcyBhbmQgV2VidHJlbmRzLlxuICovXG5jbGFzcyBUcmFjayB7XG4gIGNvbnN0cnVjdG9yKHMpIHtcbiAgICBjb25zdCBib2R5ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignYm9keScpO1xuXG4gICAgcyA9ICghcykgPyB7fSA6IHM7XG5cbiAgICB0aGlzLl9zZXR0aW5ncyA9IHtcbiAgICAgIHNlbGVjdG9yOiAocy5zZWxlY3RvcikgPyBzLnNlbGVjdG9yIDogVHJhY2suc2VsZWN0b3IsXG4gICAgfTtcblxuICAgIHRoaXMuZGVzaW5hdGlvbnMgPSBUcmFjay5kZXN0aW5hdGlvbnM7XG5cbiAgICBib2R5LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGV2ZW50KSA9PiB7XG4gICAgICBpZiAoIWV2ZW50LnRhcmdldC5tYXRjaGVzKHRoaXMuX3NldHRpbmdzLnNlbGVjdG9yKSlcbiAgICAgICAgcmV0dXJuO1xuXG4gICAgICBsZXQga2V5ID0gZXZlbnQudGFyZ2V0LmRhdGFzZXQudHJhY2tLZXk7XG4gICAgICBsZXQgZGF0YSA9IEpTT04ucGFyc2UoZXZlbnQudGFyZ2V0LmRhdGFzZXQudHJhY2tEYXRhKTtcblxuICAgICAgdGhpcy50cmFjayhrZXksIGRhdGEpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogVHJhY2tpbmcgZnVuY3Rpb24gd3JhcHBlclxuICAgKlxuICAgKiBAcGFyYW0gIHtTdHJpbmd9ICAgICAga2V5ICAgVGhlIGtleSBvciBldmVudCBvZiB0aGUgZGF0YVxuICAgKiBAcGFyYW0gIHtDb2xsZWN0aW9ufSAgZGF0YSAgVGhlIGRhdGEgdG8gdHJhY2tcbiAgICpcbiAgICogQHJldHVybiB7T2JqZWN0fSAgICAgICAgICAgIFRoZSBmaW5hbCBkYXRhIG9iamVjdFxuICAgKi9cbiAgdHJhY2soa2V5LCBkYXRhKSB7XG4gICAgLy8gU2V0IHRoZSBwYXRoIG5hbWUgYmFzZWQgb24gdGhlIGxvY2F0aW9uXG4gICAgY29uc3QgZCA9IGRhdGEubWFwKGVsID0+IHtcbiAgICAgICAgaWYgKGVsLmhhc093blByb3BlcnR5KFRyYWNrLmtleSkpXG4gICAgICAgICAgZWxbVHJhY2sua2V5XSA9IGAke3dpbmRvdy5sb2NhdGlvbi5wYXRobmFtZX0vJHtlbFtUcmFjay5rZXldfWBcbiAgICAgICAgcmV0dXJuIGVsO1xuICAgICAgfSk7XG5cbiAgICBsZXQgd3QgPSB0aGlzLndlYnRyZW5kcyhrZXksIGQpO1xuICAgIGxldCBnYSA9IHRoaXMuZ3RhZyhrZXksIGQpO1xuXG4gICAgLyogZXNsaW50LWRpc2FibGUgbm8tY29uc29sZSAqL1xuICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKVxuICAgICAgY29uc29sZS5kaXIoeydUcmFjayc6IFt3dCwgZ2FdfSk7XG4gICAgLyogZXNsaW50LWVuYWJsZSBuby1jb25zb2xlICovXG5cbiAgICByZXR1cm4gZDtcbiAgfTtcblxuICAvKipcbiAgICogRGF0YSBidXMgZm9yIHRyYWNraW5nIHZpZXdzIGluIFdlYnRyZW5kcyBhbmQgR29vZ2xlIEFuYWx5dGljc1xuICAgKlxuICAgKiBAcGFyYW0gIHtTdHJpbmd9ICAgICAgYXBwICAgVGhlIG5hbWUgb2YgdGhlIFNpbmdsZSBQYWdlIEFwcGxpY2F0aW9uIHRvIHRyYWNrXG4gICAqIEBwYXJhbSAge1N0cmluZ30gICAgICBrZXkgICBUaGUga2V5IG9yIGV2ZW50IG9mIHRoZSBkYXRhXG4gICAqIEBwYXJhbSAge0NvbGxlY3Rpb259ICBkYXRhICBUaGUgZGF0YSB0byB0cmFja1xuICAgKi9cbiAgdmlldyhhcHAsIGtleSwgZGF0YSkge1xuICAgIGxldCB3dCA9IHRoaXMud2VidHJlbmRzKGtleSwgZGF0YSk7XG4gICAgbGV0IGdhID0gdGhpcy5ndGFnVmlldyhhcHAsIGtleSk7XG5cbiAgICAvKiBlc2xpbnQtZGlzYWJsZSBuby1jb25zb2xlICovXG4gICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpXG4gICAgICBjb25zb2xlLmRpcih7J1RyYWNrJzogW3d0LCBnYV19KTtcbiAgICAvKiBlc2xpbnQtZW5hYmxlIG5vLWNvbnNvbGUgKi9cbiAgfTtcblxuICAvKipcbiAgICogUHVzaCBFdmVudHMgdG8gV2VidHJlbmRzXG4gICAqXG4gICAqIEBwYXJhbSAge1N0cmluZ30gICAgICBrZXkgICBUaGUga2V5IG9yIGV2ZW50IG9mIHRoZSBkYXRhXG4gICAqIEBwYXJhbSAge0NvbGxlY3Rpb259ICBkYXRhICBUaGUgZGF0YSB0byB0cmFja1xuICAgKi9cbiAgd2VidHJlbmRzKGtleSwgZGF0YSkge1xuICAgIGlmIChcbiAgICAgIHR5cGVvZiBXZWJ0cmVuZHMgPT09ICd1bmRlZmluZWQnIHx8XG4gICAgICB0eXBlb2YgZGF0YSA9PT0gJ3VuZGVmaW5lZCcgfHxcbiAgICAgICF0aGlzLmRlc2luYXRpb25zLmluY2x1ZGVzKCd3ZWJ0cmVuZHMnKVxuICAgIClcbiAgICAgIHJldHVybiBmYWxzZTtcblxuICAgIGxldCBldmVudCA9IFt7XG4gICAgICAnV1QudGknOiBrZXlcbiAgICB9XTtcblxuICAgIGlmIChkYXRhWzBdICYmIGRhdGFbMF0uaGFzT3duUHJvcGVydHkoVHJhY2sua2V5KSlcbiAgICAgIGV2ZW50LnB1c2goe1xuICAgICAgICAnRENTLmRjc3VyaSc6IGRhdGFbMF1bVHJhY2sua2V5XVxuICAgICAgfSk7XG4gICAgZWxzZVxuICAgICAgT2JqZWN0LmFzc2lnbihldmVudCwgZGF0YSk7XG5cbiAgICAvLyBGb3JtYXQgZGF0YSBmb3IgV2VidHJlbmRzXG4gICAgbGV0IHd0ZCA9IHthcmdzYTogZXZlbnQuZmxhdE1hcChlID0+IHtcbiAgICAgIHJldHVybiBPYmplY3Qua2V5cyhlKS5mbGF0TWFwKGsgPT4gW2ssIGVba11dKTtcbiAgICB9KX07XG5cbiAgICAvLyBJZiAnYWN0aW9uJyBpcyB1c2VkIGFzIHRoZSBrZXkgKGZvciBndGFnLmpzKSwgc3dpdGNoIGl0IHRvIFdlYnRyZW5kc1xuICAgIGxldCBhY3Rpb24gPSBkYXRhLmFyZ3NhLmluZGV4T2YoJ2FjdGlvbicpO1xuXG4gICAgaWYgKGFjdGlvbikgZGF0YS5hcmdzYVthY3Rpb25dID0gJ0RDUy5kY3N1cmknO1xuXG4gICAgLy8gV2VidHJlbmRzIGRvZXNuJ3Qgc2VuZCB0aGUgcGFnZSB2aWV3IGZvciBNdWx0aVRyYWNrLCBhZGQgcGF0aCB0byB1cmxcbiAgICBsZXQgZGNzdXJpID0gZGF0YS5hcmdzYS5pbmRleE9mKCdEQ1MuZGNzdXJpJyk7XG5cbiAgICBpZiAoZGNzdXJpKVxuICAgICAgZGF0YS5hcmdzYVtkY3N1cmkgKyAxXSA9IHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZSArIGRhdGEuYXJnc2FbZGNzdXJpICsgMV07XG5cbiAgICAvKiBlc2xpbnQtZGlzYWJsZSBuby11bmRlZiAqL1xuICAgIGlmICh0eXBlb2YgV2VidHJlbmRzICE9PSAndW5kZWZpbmVkJylcbiAgICAgIFdlYnRyZW5kcy5tdWx0aVRyYWNrKHd0ZCk7XG4gICAgLyogZXNsaW50LWRpc2FibGUgbm8tdW5kZWYgKi9cblxuICAgIHJldHVybiBbJ1dlYnRyZW5kcycsIHd0ZF07XG4gIH07XG5cbiAgLyoqXG4gICAqIFB1c2ggQ2xpY2sgRXZlbnRzIHRvIEdvb2dsZSBBbmFseXRpY3NcbiAgICpcbiAgICogQHBhcmFtICB7U3RyaW5nfSAgICAgIGtleSAgIFRoZSBrZXkgb3IgZXZlbnQgb2YgdGhlIGRhdGFcbiAgICogQHBhcmFtICB7Q29sbGVjdGlvbn0gIGRhdGEgIFRoZSBkYXRhIHRvIHRyYWNrXG4gICAqL1xuICBndGFnKGtleSwgZGF0YSkge1xuICAgIGlmIChcbiAgICAgIHR5cGVvZiBndGFnID09PSAndW5kZWZpbmVkJyB8fFxuICAgICAgdHlwZW9mIGRhdGEgPT09ICd1bmRlZmluZWQnIHx8XG4gICAgICAhdGhpcy5kZXNpbmF0aW9ucy5pbmNsdWRlcygnZ3RhZycpXG4gICAgKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuXG4gICAgbGV0IHVyaSA9IGRhdGEuZmluZCgoZWxlbWVudCkgPT4gZWxlbWVudC5oYXNPd25Qcm9wZXJ0eShUcmFjay5rZXkpKTtcblxuICAgIGxldCBldmVudCA9IHtcbiAgICAgICdldmVudF9jYXRlZ29yeSc6IGtleVxuICAgIH07XG5cbiAgICAvKiBlc2xpbnQtZGlzYWJsZSBuby11bmRlZiAqL1xuICAgIGd0YWcoVHJhY2sua2V5LCB1cmlbVHJhY2sua2V5XSwgZXZlbnQpO1xuICAgIC8qIGVzbGludC1lbmFibGUgbm8tdW5kZWYgKi9cblxuICAgIHJldHVybiBbJ2d0YWcnLCBUcmFjay5rZXksIHVyaVtUcmFjay5rZXldLCBldmVudF07XG4gIH07XG5cbiAgLyoqXG4gICAqIFB1c2ggU2NyZWVuIFZpZXcgRXZlbnRzIHRvIEdvb2dsZSBBbmFseXRpY3NcbiAgICpcbiAgICogQHBhcmFtICB7U3RyaW5nfSAgYXBwICBUaGUgbmFtZSBvZiB0aGUgYXBwbGljYXRpb25cbiAgICogQHBhcmFtICB7U3RyaW5nfSAga2V5ICBUaGUga2V5IG9yIGV2ZW50IG9mIHRoZSBkYXRhXG4gICAqL1xuICBndGFnVmlldyhhcHAsIGtleSkge1xuICAgIGlmIChcbiAgICAgIHR5cGVvZiBndGFnID09PSAndW5kZWZpbmVkJyB8fFxuICAgICAgdHlwZW9mIGRhdGEgPT09ICd1bmRlZmluZWQnIHx8XG4gICAgICAhdGhpcy5kZXNpbmF0aW9ucy5pbmNsdWRlcygnZ3RhZycpXG4gICAgKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuXG4gICAgbGV0IHZpZXcgPSB7XG4gICAgICBhcHBfbmFtZTogYXBwLFxuICAgICAgc2NyZWVuX25hbWU6IGtleVxuICAgIH07XG5cbiAgICAvKiBlc2xpbnQtZGlzYWJsZSBuby11bmRlZiAqL1xuICAgIGd0YWcoJ2V2ZW50JywgJ3NjcmVlbl92aWV3Jywgdmlldyk7XG4gICAgLyogZXNsaW50LWVuYWJsZSBuby11bmRlZiAqL1xuXG4gICAgcmV0dXJuIFsnZ3RhZycsIFRyYWNrLmtleSwgJ3NjcmVlbl92aWV3Jywgdmlld107XG4gIH07XG59XG5cbi8qKiBAdHlwZSB7U3RyaW5nfSBUaGUgbWFpbiBzZWxlY3RvciB0byBhZGQgdGhlIHRyYWNraW5nIGZ1bmN0aW9uIHRvICovXG5UcmFjay5zZWxlY3RvciA9ICdbZGF0YS1qcyo9XCJ0cmFja1wiXSc7XG5cbi8qKiBAdHlwZSB7U3RyaW5nfSBUaGUgbWFpbiBldmVudCB0cmFja2luZyBrZXkgdG8gbWFwIHRvIFdlYnRyZW5kcyBEQ1MudXJpICovXG5UcmFjay5rZXkgPSAnZXZlbnQnO1xuXG4vKiogQHR5cGUge0FycmF5fSBXaGF0IGRlc3RpbmF0aW9ucyB0byBwdXNoIGRhdGEgdG8gKi9cblRyYWNrLmRlc3RpbmF0aW9ucyA9IFtcbiAgJ3dlYnRyZW5kcycsXG4gICdndGFnJ1xuXTtcblxuZXhwb3J0IGRlZmF1bHQgVHJhY2s7IiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIFVzZXMgdGhlIFNoYXJlIEFQSSB0byB0XG4gKi9cbmNsYXNzIFdlYlNoYXJlIHtcbiAgLyoqXG4gICAqIEBjb25zdHJ1Y3RvclxuICAgKi9cbiAgY29uc3RydWN0b3IocyA9IHt9KSB7XG4gICAgdGhpcy5zZWxlY3RvciA9IChzLnNlbGVjdG9yKSA/IHMuc2VsZWN0b3IgOiBXZWJTaGFyZS5zZWxlY3RvcjtcblxuICAgIHRoaXMuY2FsbGJhY2sgPSAocy5jYWxsYmFjaykgPyBzLmNhbGxiYWNrIDogV2ViU2hhcmUuY2FsbGJhY2s7XG5cbiAgICB0aGlzLmZhbGxiYWNrID0gKHMuZmFsbGJhY2spID8gcy5mYWxsYmFjayA6IFdlYlNoYXJlLmZhbGxiYWNrO1xuXG4gICAgaWYgKG5hdmlnYXRvci5zaGFyZSkge1xuICAgICAgLy8gUmVtb3ZlIGZhbGxiYWNrIGFyaWEgdG9nZ2xpbmcgYXR0cmlidXRlc1xuICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCh0aGlzLnNlbGVjdG9yKS5mb3JFYWNoKGl0ZW0gPT4ge1xuICAgICAgICBpdGVtLnJlbW92ZUF0dHJpYnV0ZSgnYXJpYS1jb250cm9scycpO1xuICAgICAgICBpdGVtLnJlbW92ZUF0dHJpYnV0ZSgnYXJpYS1leHBhbmRlZCcpO1xuICAgICAgfSk7XG5cbiAgICAgIC8vIEFkZCBldmVudCBsaXN0ZW5lciBmb3IgdGhlIHNoYXJlIGNsaWNrXG4gICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdib2R5JykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBldmVudCA9PiB7XG4gICAgICAgIGlmICghZXZlbnQudGFyZ2V0Lm1hdGNoZXModGhpcy5zZWxlY3RvcikpXG4gICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgIHRoaXMuZWxlbWVudCA9IGV2ZW50LnRhcmdldDtcblxuICAgICAgICB0aGlzLmRhdGEgPSBKU09OLnBhcnNlKHRoaXMuZWxlbWVudC5kYXRhc2V0LndlYlNoYXJlKTtcblxuICAgICAgICB0aGlzLnNoYXJlKHRoaXMuZGF0YSk7XG4gICAgICB9KTtcbiAgICB9IGVsc2VcbiAgICAgIHRoaXMuZmFsbGJhY2soKTsgLy8gRXhlY3V0ZSB0aGUgZmFsbGJhY2tcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFdlYiBTaGFyZSBBUEkgaGFuZGxlclxuICAgKlxuICAgKiBAcGFyYW0gICB7T2JqZWN0fSAgZGF0YSAgQW4gb2JqZWN0IGNvbnRhaW5pbmcgdGl0bGUsIHVybCwgYW5kIHRleHQuXG4gICAqXG4gICAqIEByZXR1cm4gIHtQcm9taXNlfSAgICAgICBUaGUgcmVzcG9uc2Ugb2YgdGhlIC5zaGFyZSgpIG1ldGhvZC5cbiAgICovXG4gIHNoYXJlKGRhdGEgPSB7fSkge1xuICAgIHJldHVybiBuYXZpZ2F0b3Iuc2hhcmUoZGF0YSlcbiAgICAgIC50aGVuKHJlcyA9PiB7XG4gICAgICAgIHRoaXMuY2FsbGJhY2soZGF0YSk7XG4gICAgICB9KS5jYXRjaChlcnIgPT4ge1xuICAgICAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJylcbiAgICAgICAgICBjb25zb2xlLmRpcihlcnIpO1xuICAgICAgfSk7XG4gIH1cbn1cblxuLyoqIFRoZSBodG1sIHNlbGVjdG9yIGZvciB0aGUgY29tcG9uZW50ICovXG5XZWJTaGFyZS5zZWxlY3RvciA9ICdbZGF0YS1qcyo9XCJ3ZWItc2hhcmVcIl0nO1xuXG4vKiogUGxhY2Vob2xkZXIgY2FsbGJhY2sgZm9yIGEgc3VjY2Vzc2Z1bCBzZW5kICovXG5XZWJTaGFyZS5jYWxsYmFjayA9ICgpID0+IHtcbiAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpXG4gICAgY29uc29sZS5kaXIoJ1N1Y2Nlc3MhJyk7XG59O1xuXG4vKiogUGxhY2Vob2xkZXIgZm9yIHRoZSBXZWJTaGFyZSBmYWxsYmFjayAqL1xuV2ViU2hhcmUuZmFsbGJhY2sgPSAoKSA9PiB7XG4gIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKVxuICAgIGNvbnNvbGUuZGlyKCdGYWxsYmFjayEnKTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgV2ViU2hhcmU7XG4iLCIvKipcbiAqIEBjbGFzcyAgU2V0IHRoZSB0aGUgY3NzIHZhcmlhYmxlICctLTEwMHZoJyB0byB0aGUgc2l6ZSBvZiB0aGUgV2luZG93J3MgaW5uZXIgaGVpZ2h0LlxuICovXG5jbGFzcyBXaW5kb3dWaCB7XG4gIC8qKlxuICAgKiBAY29uc3RydWN0b3IgIFNldCBldmVudCBsaXN0ZW5lcnNcbiAgICovXG4gIGNvbnN0cnVjdG9yKHMgPSB7fSkge1xuICAgIHRoaXMucHJvcGVydHkgPSAocy5wcm9wZXJ0eSkgPyBzLnByb3BlcnR5IDogV2luZG93VmgucHJvcGVydHk7XG5cbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsICgpID0+IHt0aGlzLnNldCgpfSk7XG5cbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgKCkgPT4ge3RoaXMuc2V0KCl9KTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGNzcyB2YXJpYWJsZSBwcm9wZXJ0eVxuICAgKi9cbiAgc2V0KCkge1xuICAgIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZVxuICAgICAgLnNldFByb3BlcnR5KHRoaXMucHJvcGVydHksIGAke3dpbmRvdy5pbm5lckhlaWdodH1weGApO1xuICB9XG59XG5cbi8qKiBAcGFyYW0gIHtTdHJpbmd9ICBwcm9wZXJ0eSAgVGhlIGNzcyB2YXJpYWJsZSBzdHJpbmcgdG8gc2V0ICovXG5XaW5kb3dWaC5wcm9wZXJ0eSA9ICctLTEwMHZoJztcblxuZXhwb3J0IGRlZmF1bHQgV2luZG93Vmg7XG4iLCIndXNlIHN0cmljdCc7XG5cbmltcG9ydCBUb2dnbGUgZnJvbSAnQG55Y29wcG9ydHVuaXR5L3BhdHRlcm5zLWZyYW1ld29yay9zcmMvdXRpbGl0aWVzL3RvZ2dsZS90b2dnbGUnO1xuXG4vKipcbiAqIFRoZSBBY2NvcmRpb24gbW9kdWxlXG4gKiBAY2xhc3NcbiAqL1xuY2xhc3MgQWNjb3JkaW9uIHtcbiAgLyoqXG4gICAqIEBjb25zdHJ1Y3RvclxuICAgKiBAcmV0dXJuIHtvYmplY3R9IFRoZSBjbGFzc1xuICAgKi9cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5fdG9nZ2xlID0gbmV3IFRvZ2dsZSh7XG4gICAgICBzZWxlY3RvcjogQWNjb3JkaW9uLnNlbGVjdG9yXG4gICAgfSk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxufVxuXG4vKipcbiAqIFRoZSBkb20gc2VsZWN0b3IgZm9yIHRoZSBtb2R1bGVcbiAqIEB0eXBlIHtTdHJpbmd9XG4gKi9cbkFjY29yZGlvbi5zZWxlY3RvciA9ICdbZGF0YS1qcyo9XCJhY2NvcmRpb25cIl0nO1xuXG5leHBvcnQgZGVmYXVsdCBBY2NvcmRpb247XG4iLCIndXNlIHN0cmljdCc7XG5cbmltcG9ydCBUb2dnbGUgZnJvbSAnQG55Y29wcG9ydHVuaXR5L3BhdHRlcm5zLWZyYW1ld29yay9zcmMvdXRpbGl0aWVzL3RvZ2dsZS90b2dnbGUnO1xuXG4vKipcbiAqIEBjbGFzcyAgRHJvcGRvd25cbiAqXG4gKiBVc2FnZVxuICpcbiAqIEVsZW1lbnQgQXR0cmlidXRlcy4gRWl0aGVyIDxhPiBvciA8YnV0dG9uPlxuICpcbiAqIEBhdHRyICBkYXRhLWpzPVwiZHJvcGRvd25cIiAgICAgICAgIEluc3RhbnRpYXRlcyB0aGUgdG9nZ2xpbmcgbWV0aG9kXG4gKiBAYXR0ciAgYXJpYS1jb250cm9scz1cIlwiICAgICAgICAgICBUYXJnZXRzIHRoZSBpZCBvZiB0aGUgZHJvcGRvd25cbiAqIEBhdHRyICBhcmlhLWV4cGFuZGVkPVwiZmFsc2VcIiAgICAgIERlY2xhcmVzIHRhcmdldCBjbG9zZWQvb3BlbiB3aGVuIHRvZ2dsZWRcbiAqIEBhdHRyICBkYXRhLWRyb3Bkb3duPVwib3BlblwiICAgICAgIERlc2lnbmF0ZXMgdGhlIHByaW1hcnkgb3BlbmluZyBlbGVtZW50IG9mIHRoZSBkcm9wZG93blxuICogQGF0dHIgIGRhdGEtZHJvcGRvd249XCJjbG9zZVwiICAgICAgRGVzaWduYXRlcyB0aGUgcHJpbWFyeSBjbG9zaW5nIGVsZW1lbnQgb2YgdGhlIGRyb3Bkb3duXG4gKiBAYXR0ciAgZGF0YS1kcm9wZG93bi1sb2NrPVwidHJ1ZVwiICBXZXRoZXIgdG8gbG9jayBzY3JlZW4gc2Nyb2xsaW5nIHdoZW4gZHJvZG93biBpcyBvcGVuXG4gKlxuICogVGFyZ2V0IEF0dHJpYnV0ZXMuIEFueSA8ZWxlbWVudD5cbiAqXG4gKiBAYXR0ciAgaWQ9XCJcIiAgICAgICAgICAgICAgIE1hdGNoZXMgYXJpYS1jb250cm9scyBhdHRyIG9mIEVsZW1lbnRcbiAqIEBhdHRyICBjbGFzcz1cImhpZGRlblwiICAgICAgSGlkZGVuIGNsYXNzXG4gKiBAYXR0ciAgYXJpYS1oaWRkZW49XCJ0cnVlXCIgIERlY2xhcmVzIHRhcmdldCBvcGVuL2Nsb3NlZCB3aGVuIHRvZ2dsZWRcbiAqL1xuY2xhc3MgRHJvcGRvd24ge1xuICAvKipcbiAgICogQGNvbnN0cnVjdG9yICBJbnN0YW50aWF0ZXMgZHJvcGRvd24gYW5kIHRvZ2dsZSBtZXRob2RcbiAgICpcbiAgICogQHJldHVybiAge09iamVjdH0gIFRoZSBpbnN0YW50aWF0ZWQgZHJvcGRvd24gd2l0aCBwcm9wZXJ0aWVzXG4gICAqL1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLnNlbGVjdG9yID0gRHJvcGRvd24uc2VsZWN0b3I7XG5cbiAgICB0aGlzLnNlbGVjdG9ycyA9IERyb3Bkb3duLnNlbGVjdG9ycztcblxuICAgIHRoaXMuY2xhc3NlcyA9IERyb3Bkb3duLmNsYXNzZXM7XG5cbiAgICB0aGlzLmRhdGFBdHRycyA9IERyb3Bkb3duLmRhdGFBdHRycztcblxuICAgIHRoaXMudG9nZ2xlID0gbmV3IFRvZ2dsZSh7XG4gICAgICBzZWxlY3RvcjogdGhpcy5zZWxlY3RvcixcbiAgICAgIGFmdGVyOiAodG9nZ2xlKSA9PiB7XG4gICAgICAgIGxldCBhY3RpdmUgPSB0b2dnbGUudGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucyhUb2dnbGUuYWN0aXZlQ2xhc3MpO1xuXG4gICAgICAgIC8vIExvY2sgdGhlIGJvZHkgZnJvbSBzY3JvbGxpbmcgaWYgbG9jayBhdHRyaWJ1dGUgaXMgcHJlc2VudFxuICAgICAgICBpZiAoYWN0aXZlICYmIHRvZ2dsZS5lbGVtZW50LmRhdGFzZXRbdGhpcy5kYXRhQXR0cnMuTE9DS10gPT09ICd0cnVlJykge1xuICAgICAgICAgIC8vIFNjcm9sbCB0byB0aGUgdG9wIG9mIHRoZSBwYWdlXG4gICAgICAgICAgd2luZG93LnNjcm9sbCgwLCAwKTtcblxuICAgICAgICAgIC8vIFByZXZlbnQgc2Nyb2xsaW5nIG9uIHRoZSBib2R5XG4gICAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignYm9keScpLmNsYXNzTGlzdC5hZGQodGhpcy5jbGFzc2VzLk9WRVJGTE9XKTtcblxuICAgICAgICAgIC8vIFdoZW4gdGhlIGxhc3QgZm9jdXNhYmxlIGl0ZW0gaW4gdGhlIGxpc3QgbG9vc2VzIGZvY3VzIGxvb3AgdG8gdGhlIGZpcnN0XG4gICAgICAgICAgdG9nZ2xlLmZvY3VzYWJsZS5pdGVtKHRvZ2dsZS5mb2N1c2FibGUubGVuZ3RoIC0gMSlcbiAgICAgICAgICAgIC5hZGRFdmVudExpc3RlbmVyKCdibHVyJywgKCkgPT4ge1xuICAgICAgICAgICAgICB0b2dnbGUuZm9jdXNhYmxlLml0ZW0oMCkuZm9jdXMoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIFJlbW92ZSBpZiBhbGwgb3RoZXIgZHJvcGRvd24gYm9keSBsb2NrcyBhcmUgaW5hY3RpdmVcbiAgICAgICAgICBsZXQgbG9ja3MgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFtcbiAgICAgICAgICAgICAgdGhpcy5zZWxlY3RvcixcbiAgICAgICAgICAgICAgdGhpcy5zZWxlY3RvcnMubG9ja3MsXG4gICAgICAgICAgICAgIGAuJHtUb2dnbGUuYWN0aXZlQ2xhc3N9YFxuICAgICAgICAgICAgXS5qb2luKCcnKSk7XG5cbiAgICAgICAgICBpZiAobG9ja3MubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdib2R5JykuY2xhc3NMaXN0LnJlbW92ZSh0aGlzLmNsYXNzZXMuT1ZFUkZMT1cpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEZvY3VzIG9uIHRoZSBjbG9zZSBvciBvcGVuIGJ1dHRvbiBpZiBwcmVzZW50XG4gICAgICAgIGxldCBpZCA9IGBbYXJpYS1jb250cm9scz1cIiR7dG9nZ2xlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2lkJyl9XCJdYDtcbiAgICAgICAgbGV0IGNsb3NlID0gZG9jdW1lbnQucXVlcnlTZWxlY3Rvcih0aGlzLnNlbGVjdG9ycy5DTE9TRSArIGlkKTtcbiAgICAgICAgbGV0IG9wZW4gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHRoaXMuc2VsZWN0b3JzLk9QRU4gKyBpZCk7XG5cbiAgICAgICAgaWYgKGFjdGl2ZSAmJiBjbG9zZSkge1xuICAgICAgICAgIGNsb3NlLmZvY3VzKCk7XG4gICAgICAgIH0gZWxzZSBpZiAob3Blbikge1xuICAgICAgICAgIG9wZW4uZm9jdXMoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbn1cblxuLyoqIEB0eXBlICB7U3RyaW5nfSAgTWFpbiBET00gc2VsZWN0b3IgKi9cbkRyb3Bkb3duLnNlbGVjdG9yID0gJ1tkYXRhLWpzKj1cXFwiZHJvcGRvd25cXFwiXSc7XG5cbi8qKiBAdHlwZSAge09iamVjdH0gIEFkZGl0aW9uYWwgc2VsZWN0b3JzIHVzZWQgYnkgdGhlIHNjcmlwdCAqL1xuRHJvcGRvd24uc2VsZWN0b3JzID0ge1xuICBDTE9TRTogJ1tkYXRhLWRyb3Bkb3duKj1cImNsb3NlXCJdJyxcbiAgT1BFTjogJ1tkYXRhLWRyb3Bkb3duKj1cIm9wZW5cIl0nLFxuICBMT0NLUzogJ1tkYXRhLWRyb3Bkb3duLWxvY2s9XCJ0cnVlXCJdJ1xufTtcblxuLyoqIEB0eXBlICB7T2JqZWN0fSAgRGF0YSBhdHRyaWJ1dGUgbmFtZXNwYWNlcyAqL1xuRHJvcGRvd24uZGF0YUF0dHJzID0ge1xuICBMT0NLOiAnZHJvcGRvd25Mb2NrJ1xufTtcblxuLyoqIEB0eXBlICB7T2JqZWN0fSAgVmFyaW91cyBjbGFzc2VzIHVzZWQgYnkgdGhlIHNjcmlwdCAqL1xuRHJvcGRvd24uY2xhc3NlcyA9IHtcbiAgT1ZFUkZMT1c6ICdvdmVyZmxvdy1oaWRkZW4nXG59O1xuXG5leHBvcnQgZGVmYXVsdCBEcm9wZG93bjtcbiIsIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IFRvZ2dsZSBmcm9tICdAbnljb3Bwb3J0dW5pdHkvcGF0dGVybnMtZnJhbWV3b3JrL3NyYy91dGlsaXRpZXMvdG9nZ2xlL3RvZ2dsZSc7XG5cbi8qKlxuICogVGhlIE1vYmlsZSBOYXYgbW9kdWxlXG4gKlxuICogQGNsYXNzXG4gKi9cbmNsYXNzIE1vYmlsZU1lbnUge1xuICAvKipcbiAgICogQGNvbnN0cnVjdG9yXG4gICAqXG4gICAqIEByZXR1cm4gIHtvYmplY3R9ICBUaGUgY2xhc3NcbiAgICovXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuc2VsZWN0b3IgPSBNb2JpbGVNZW51LnNlbGVjdG9yO1xuXG4gICAgdGhpcy5zZWxlY3RvcnMgPSBNb2JpbGVNZW51LnNlbGVjdG9ycztcblxuICAgIHRoaXMudG9nZ2xlID0gbmV3IFRvZ2dsZSh7XG4gICAgICBzZWxlY3RvcjogdGhpcy5zZWxlY3RvcixcbiAgICAgIGFmdGVyOiB0b2dnbGUgPT4ge1xuICAgICAgICAvLyBTaGlmdCBmb2N1cyBmcm9tIHRoZSBvcGVuIHRvIHRoZSBjbG9zZSBidXR0b24gaW4gdGhlIE1vYmlsZSBNZW51IHdoZW4gdG9nZ2xlZFxuICAgICAgICBpZiAodG9nZ2xlLnRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoVG9nZ2xlLmFjdGl2ZUNsYXNzKSkge1xuICAgICAgICAgIHRvZ2dsZS50YXJnZXQucXVlcnlTZWxlY3Rvcih0aGlzLnNlbGVjdG9ycy5DTE9TRSkuZm9jdXMoKTtcblxuICAgICAgICAgIC8vIFdoZW4gdGhlIGxhc3QgZm9jdXNhYmxlIGl0ZW0gaW4gdGhlIGxpc3QgbG9vc2VzIGZvY3VzIGxvb3AgdG8gdGhlIGZpcnN0XG4gICAgICAgICAgdG9nZ2xlLmZvY3VzYWJsZS5pdGVtKHRvZ2dsZS5mb2N1c2FibGUubGVuZ3RoIC0gMSlcbiAgICAgICAgICAgIC5hZGRFdmVudExpc3RlbmVyKCdibHVyJywgKCkgPT4ge1xuICAgICAgICAgICAgICB0b2dnbGUuZm9jdXNhYmxlLml0ZW0oMCkuZm9jdXMoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IodGhpcy5zZWxlY3RvcnMuT1BFTikuZm9jdXMoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbn1cblxuLyoqIEB0eXBlICB7U3RyaW5nfSAgVGhlIGRvbSBzZWxlY3RvciBmb3IgdGhlIG1vZHVsZSAqL1xuTW9iaWxlTWVudS5zZWxlY3RvciA9ICdbZGF0YS1qcyo9XCJtb2JpbGUtbWVudVwiXSc7XG5cbi8qKiBAdHlwZSAge09iamVjdH0gIEFkZGl0aW9uYWwgc2VsZWN0b3JzIHVzZWQgYnkgdGhlIHNjcmlwdCAqL1xuTW9iaWxlTWVudS5zZWxlY3RvcnMgPSB7XG4gIENMT1NFOiAnW2RhdGEtanMtbW9iaWxlLW1lbnUqPVwiY2xvc2VcIl0nLFxuICBPUEVOOiAnW2RhdGEtanMtbW9iaWxlLW1lbnUqPVwib3BlblwiXSdcbn07XG5cbmV4cG9ydCBkZWZhdWx0IE1vYmlsZU1lbnU7XG4iLCIndXNlIHN0cmljdCc7XG5cbmltcG9ydCBUb2dnbGUgZnJvbSAnQG55Y29wcG9ydHVuaXR5L3BhdHRlcm5zLWZyYW1ld29yay9zcmMvdXRpbGl0aWVzL3RvZ2dsZS90b2dnbGUnO1xuXG4vKipcbiAqIFRoZSBTZWFyY2ggbW9kdWxlXG4gKlxuICogQGNsYXNzXG4gKi9cbmNsYXNzIFNlYXJjaCB7XG4gIC8qKlxuICAgKiBAY29uc3RydWN0b3JcbiAgICpcbiAgICogQHJldHVybiB7b2JqZWN0fSBUaGUgY2xhc3NcbiAgICovXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuX3RvZ2dsZSA9IG5ldyBUb2dnbGUoe1xuICAgICAgc2VsZWN0b3I6IFNlYXJjaC5zZWxlY3RvcixcbiAgICAgIGFmdGVyOiAodG9nZ2xlKSA9PiB7XG4gICAgICAgIGxldCBlbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoU2VhcmNoLnNlbGVjdG9yKTtcbiAgICAgICAgbGV0IGlucHV0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihTZWFyY2guc2VsZWN0b3JzLmlucHV0KTtcblxuICAgICAgICBpZiAoZWwuY2xhc3NOYW1lLmluY2x1ZGVzKCdhY3RpdmUnKSAmJiBpbnB1dCkge1xuICAgICAgICAgIGlucHV0LmZvY3VzKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG59XG5cbi8qKlxuICogVGhlIGRvbSBzZWxlY3RvciBmb3IgdGhlIG1vZHVsZVxuICogQHR5cGUge1N0cmluZ31cbiAqL1xuU2VhcmNoLnNlbGVjdG9yID0gJ1tkYXRhLWpzKj1cInNlYXJjaFwiXSc7XG5cblNlYXJjaC5zZWxlY3RvcnMgPSB7XG4gIGlucHV0OiAnW2RhdGEtanMqPVwic2VhcmNoX19pbnB1dFwiXSdcbn07XG5cbmV4cG9ydCBkZWZhdWx0IFNlYXJjaDtcbiIsIid1c2Ugc3RyaWN0JztcblxuLy8gVXRpbGl0aWVzXG5pbXBvcnQgQ29weSBmcm9tICdAbnljb3Bwb3J0dW5pdHkvcGF0dGVybnMtZnJhbWV3b3JrL3NyYy91dGlsaXRpZXMvY29weS9jb3B5JztcbmltcG9ydCBGb3JtcyBmcm9tICdAbnljb3Bwb3J0dW5pdHkvcGF0dGVybnMtZnJhbWV3b3JrL3NyYy91dGlsaXRpZXMvZm9ybXMvZm9ybXMnO1xuaW1wb3J0IEljb25zIGZyb20gJ0BueWNvcHBvcnR1bml0eS9wYXR0ZXJucy1mcmFtZXdvcmsvc3JjL3V0aWxpdGllcy9pY29ucy9pY29ucyc7XG5pbXBvcnQgTmV3c2xldHRlciBmcm9tICdAbnljb3Bwb3J0dW5pdHkvcGF0dGVybnMtZnJhbWV3b3JrL3NyYy91dGlsaXRpZXMvbmV3c2xldHRlci9uZXdzbGV0dGVyJztcbmltcG9ydCBUb2dnbGUgZnJvbSAnQG55Y29wcG9ydHVuaXR5L3BhdHRlcm5zLWZyYW1ld29yay9zcmMvdXRpbGl0aWVzL3RvZ2dsZS90b2dnbGUnO1xuaW1wb3J0IFRyYWNrIGZyb20gJ0BueWNvcHBvcnR1bml0eS9wYXR0ZXJucy1mcmFtZXdvcmsvc3JjL3V0aWxpdGllcy90cmFjay90cmFjayc7XG5pbXBvcnQgV2ViU2hhcmUgZnJvbSAnQG55Y29wcG9ydHVuaXR5L3BhdHRlcm5zLWZyYW1ld29yay9zcmMvdXRpbGl0aWVzL3dlYi1zaGFyZS93ZWItc2hhcmUnO1xuaW1wb3J0IFdpbmRvd1ZoIGZyb20gJ0BueWNvcHBvcnR1bml0eS9wYXR0ZXJucy1mcmFtZXdvcmsvc3JjL3V0aWxpdGllcy93aW5kb3ctdmgvd2luZG93LXZoJztcblxuLy8gRWxlbWVudHNcbi8vIGltcG9ydCAuLi4gZnJvbSAnLi4vZWxlbWVudHMvLi4uJztcblxuLy8gQ29tcG9uZW50c1xuaW1wb3J0IEFjY29yZGlvbiBmcm9tICcuLi9jb21wb25lbnRzL2FjY29yZGlvbi9hY2NvcmRpb24nO1xuaW1wb3J0IERyb3Bkb3duIGZyb20gJy4uL2NvbXBvbmVudHMvZHJvcGRvd24vZHJvcGRvd24nO1xuLy8gaW1wb3J0IC4uLiBmcm9tICcuLi9jb21wb25lbnRzLy4uLic7XG5cbi8vIE9iamVjdHNcbmltcG9ydCBNb2JpbGVNZW51IGZyb20gJy4uL29iamVjdHMvbW9iaWxlLW1lbnUvbW9iaWxlLW1lbnUnO1xuaW1wb3J0IFNlYXJjaCBmcm9tICcuLi9vYmplY3RzL3NlYXJjaC9zZWFyY2gnO1xuLy8gaW1wb3J0IC4uLiBmcm9tICcuLi9vYmplY3RzLy4uLic7XG4vKiogaW1wb3J0IG1vZHVsZXMgaGVyZSBhcyB0aGV5IGFyZSB3cml0dGVuLiAqL1xuXG4vKipcbiAqIEBjbGFzcyAgTWFpbiBwYXR0ZXJuIG1vZHVsZVxuICovXG5jbGFzcyBtYWluIHtcbiAgLyoqXG4gICAqIEBjb25zdHJ1Y3RvciAgTW9kdWxlcyB0byBiZSBleGVjdXRlZCBvbiBtYWluIHBhdHRlcm4gaW5zdGFudGlhdGlvbiBoZXJlXG4gICAqL1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBuZXcgV2luZG93VmgoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBbiBBUEkgZm9yIHRoZSBJY29ucyBVdGlsaXR5XG4gICAqXG4gICAqIEBwYXJhbSAgIHtTdHJpbmd9ICBwYXRoICBUaGUgcGF0aCBvZiB0aGUgaWNvbiBmaWxlXG4gICAqXG4gICAqIEByZXR1cm4gIHtPYmplY3R9ICAgICAgICBJbnN0YW5jZSBvZiBJY29uc1xuICAgKi9cbiAgaWNvbnMocGF0aCA9ICdzdmcvaWNvbnMuc3ZnJykge1xuICAgIHJldHVybiBuZXcgSWNvbnMocGF0aCk7XG4gIH1cblxuICAvKipcbiAgICogQW4gQVBJIGZvciB0aGUgVG9nZ2xlIFV0aWxpdHlcbiAgICpcbiAgICogQHBhcmFtICAge09iamVjdH0gIHNldHRpbmdzICBTZXR0aW5ncyBmb3IgdGhlIFRvZ2dsZSBDbGFzc1xuICAgKlxuICAgKiBAcmV0dXJuICB7T2JqZWN0fSAgICAgICAgICAgIEluc3RhbmNlIG9mIFRvZ2dsZVxuICAgKi9cbiAgdG9nZ2xlKHNldHRpbmdzID0gZmFsc2UpIHtcbiAgICByZXR1cm4gKHNldHRpbmdzKSA/IG5ldyBUb2dnbGUoc2V0dGluZ3MpIDogbmV3IFRvZ2dsZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFQSSBmb3IgdmFsaWRhdGluZyBhIGZvcm0uXG4gICAqXG4gICAqIEBwYXJhbSAge3N0cmluZ30gICAgc2VsZWN0b3JcbiAgICogQHBhcmFtICB7ZnVuY3Rpb259ICBzdWJtaXRcbiAgICovXG4gIHZhbGlkKHNlbGVjdG9yLCBzdWJtaXQgPSBmYWxzZSkge1xuICAgIGlmIChkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHNlbGVjdG9yKSkge1xuICAgICAgbGV0IGZvcm0gPSBuZXcgRm9ybXMoZG9jdW1lbnQucXVlcnlTZWxlY3RvcihzZWxlY3RvcikpO1xuXG4gICAgICBmb3JtLnN1Ym1pdCA9IChzdWJtaXQpID8gc3VibWl0IDogKGV2ZW50KSA9PiB7XG4gICAgICAgIGV2ZW50LnRhcmdldC5zdWJtaXQoKTtcbiAgICAgIH07XG5cbiAgICAgIGZvcm0uc2VsZWN0b3JzLkVSUk9SX01FU1NBR0VfUEFSRU5UID0gJy5jLXF1ZXN0aW9uX19jb250YWluZXInO1xuXG4gICAgICBmb3JtLndhdGNoKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEFuIEFQSSBmb3IgdGhlIEFjY29yZGlvbiBDb21wb25lbnRcbiAgICpcbiAgICogQHJldHVybiAge09iamVjdH0gIEluc3RhbmNlIG9mIEFjY29yZGlvblxuICAgKi9cbiAgYWNjb3JkaW9uKCkge1xuICAgIHJldHVybiBuZXcgQWNjb3JkaW9uKCk7XG4gIH1cblxuICAvKipcbiAgICogQW4gQVBJIGZvciB0aGUgRHJvcGRvd24gQ29tcG9uZW50XG4gICAqXG4gICAqIEByZXR1cm4gIHtPYmplY3R9ICBJbnN0YW5jZSBvZiBEcm9wZG93blxuICAgKi9cbiAgZHJvcGRvd24oKSB7XG4gICAgcmV0dXJuIG5ldyBEcm9wZG93bigpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFuIEFQSSBmb3IgdGhlIENvcHkgVXRpbGl0eVxuICAgKlxuICAgKiBAcmV0dXJuICB7T2JqZWN0fSAgSW5zdGFuY2Ugb2YgQ29weVxuICAgKi9cbiAgY29weSgpIHtcbiAgICByZXR1cm4gbmV3IENvcHkoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBbiBBUEkgZm9yIHRoZSBUcmFjayBPYmplY3RcbiAgICpcbiAgICogQHJldHVybiAge09iamVjdH0gIEluc3RhbmNlIG9mIFRyYWNrXG4gICAqL1xuICB0cmFjaygpIHtcbiAgICByZXR1cm4gbmV3IFRyYWNrKCk7XG4gIH1cblxuICAvKipcbiAgICogQW4gQVBJIGZvciB0aGUgTmV3c2xldHRlciBPYmplY3RcbiAgICpcbiAgICogQHJldHVybiAge09iamVjdH0gIEluc3RhbmNlIG9mIE5ld3NsZXR0ZXJcbiAgICovXG4gIG5ld3NsZXR0ZXIoZW5kcG9pbnQgPSAnJykge1xuICAgIGxldCBlbGVtZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihOZXdzbGV0dGVyLnNlbGVjdG9yKTtcblxuICAgIGlmIChlbGVtZW50KSB7XG4gICAgICBsZXQgbmV3c2xldHRlciA9IG5ldyBOZXdzbGV0dGVyKGVsZW1lbnQpO1xuXG4gICAgICBuZXdzbGV0dGVyLmZvcm0uc2VsZWN0b3JzLkVSUk9SX01FU1NBR0VfUEFSRU5UID0gJy5jLXF1ZXN0aW9uX19jb250YWluZXInO1xuXG4gICAgICB3aW5kb3dbbmV3c2xldHRlci5jYWxsYmFja10gPSBkYXRhID0+IHtcbiAgICAgICAgZGF0YS5yZXNwb25zZSA9IHRydWU7XG5cbiAgICAgICAgZGF0YS5lbWFpbCA9IGVsZW1lbnQucXVlcnlTZWxlY3RvcignaW5wdXRbbmFtZT1cIkVNQUlMXCJdJykudmFsdWU7XG5cbiAgICAgICAgd2luZG93LmxvY2F0aW9uID0gYCR7ZW5kcG9pbnR9P2AgKyBPYmplY3Qua2V5cyhkYXRhKVxuICAgICAgICAgIC5tYXAoayA9PiBgJHtrfT0ke2VuY29kZVVSSShkYXRhW2tdKX1gKS5qb2luKCcmJyk7XG4gICAgICB9O1xuXG4gICAgICByZXR1cm4gbmV3c2xldHRlcjtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQW4gQVBJIGZvciB0aGUgTmV3c2xldHRlciBPYmplY3RcbiAgICpcbiAgICogQHJldHVybiAge09iamVjdH0gIEluc3RhbmNlIG9mIE5ld3NsZXR0ZXJcbiAgICovXG4gIG5ld3NsZXR0ZXJGb3JtKGVsZW1lbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdbZGF0YS1qcz1cIm5ld3NsZXR0ZXItZm9ybVwiXScpKSB7XG4gICAgbGV0IHBhcmFtcyA9IG5ldyBVUkxTZWFyY2hQYXJhbXMod2luZG93LmxvY2F0aW9uLnNlYXJjaCk7XG4gICAgbGV0IHJlc3BvbnNlID0gcGFyYW1zLmdldCgncmVzcG9uc2UnKTtcbiAgICBsZXQgbmV3c2xldHRlciA9IG51bGw7XG5cbiAgICBpZiAoZWxlbWVudCkge1xuICAgICAgbmV3c2xldHRlciA9IG5ldyBOZXdzbGV0dGVyKGVsZW1lbnQpO1xuICAgICAgbmV3c2xldHRlci5mb3JtLnNlbGVjdG9ycy5FUlJPUl9NRVNTQUdFX1BBUkVOVCA9ICcuYy1xdWVzdGlvbl9fY29udGFpbmVyJztcbiAgICB9XG5cbiAgICBpZiAocmVzcG9uc2UgJiYgbmV3c2xldHRlcikge1xuICAgICAgbGV0IGVtYWlsID0gcGFyYW1zLmdldCgnZW1haWwnKTtcbiAgICAgIGxldCBpbnB1dCA9IGVsZW1lbnQucXVlcnlTZWxlY3RvcignaW5wdXRbbmFtZT1cIkVNQUlMXCJdJyk7XG5cbiAgICAgIGlucHV0LnZhbHVlID0gZW1haWw7XG5cbiAgICAgIG5ld3NsZXR0ZXIuX2RhdGEgPSB7XG4gICAgICAgICdyZXN1bHQnOiBwYXJhbXMuZ2V0KCdyZXN1bHQnKSxcbiAgICAgICAgJ21zZyc6IHBhcmFtcy5nZXQoJ21zZycpLFxuICAgICAgICAnRU1BSUwnOiBlbWFpbFxuICAgICAgfTtcblxuICAgICAgbmV3c2xldHRlci5fY2FsbGJhY2sobmV3c2xldHRlci5fZGF0YSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ld3NsZXR0ZXI7XG4gIH1cblxuICAvLyAvKipcbiAgLy8gICogQW4gQVBJIGZvciB0aGUgVGV4dENvbnRyb2xsZXIgT2JqZWN0XG4gIC8vICAqXG4gIC8vICAqIEByZXR1cm4gIHtPYmplY3R9ICBJbnN0YW5jZSBvZiBUZXh0Q29udHJvbGxlclxuICAvLyAgKi9cbiAgLy8gdGV4dENvbnRyb2xsZXIoZWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoVGV4dENvbnRyb2xsZXIuc2VsZWN0b3IpKSB7XG4gIC8vICAgcmV0dXJuIChlbGVtZW50KSA/IG5ldyBUZXh0Q29udHJvbGxlcihlbGVtZW50KSA6IG51bGw7XG4gIC8vIH1cblxuICAvKipcbiAgICogQW4gQVBJIGZvciB0aGUgTW9iaWxlIE5hdlxuICAgKlxuICAgKiBAcmV0dXJuICB7T2JqZWN0fSAgSW5zdGFuY2Ugb2YgTW9iaWxlTWVudVxuICAgKi9cbiAgbW9iaWxlTWVudSgpIHtcbiAgICByZXR1cm4gbmV3IE1vYmlsZU1lbnUoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBbiBBUEkgZm9yIHRoZSBTZWFyY2hcbiAgICpcbiAgICogQHJldHVybiAge09iamVjdH0gIEluc3RhbmNlIG9mIFNlYXJjaFxuICAgKi9cbiAgc2VhcmNoKCkge1xuICAgIHJldHVybiBuZXcgU2VhcmNoKCk7XG4gIH1cblxuICAvKipcbiAgICogQW4gQVBJIGZvciBXZWIgU2hhcmVcbiAgICpcbiAgICogQHJldHVybiAge09iamVjdH0gIEluc3RhbmNlIG9mIFdlYlNoYXJlXG4gICAqL1xuICB3ZWJTaGFyZSgpIHtcbiAgICByZXR1cm4gbmV3IFdlYlNoYXJlKHtcbiAgICAgIGZhbGxiYWNrOiAoKSA9PiB7XG4gICAgICAgIG5ldyBUb2dnbGUoe1xuICAgICAgICAgIHNlbGVjdG9yOiBXZWJTaGFyZS5zZWxlY3RvclxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBtYWluO1xuIl0sIm5hbWVzIjpbInRoaXMiLCJsZXQiLCJpIiwiY29uc3QiLCJBY2NvcmRpb24iLCJjb25zdHJ1Y3RvciIsIl90b2dnbGUiLCJUb2dnbGUiLCJzZWxlY3RvciIsIkRyb3Bkb3duIiwic2VsZWN0b3JzIiwiY2xhc3NlcyIsImRhdGFBdHRycyIsInRvZ2dsZSIsImFmdGVyIiwiYWN0aXZlIiwidGFyZ2V0IiwiY2xhc3NMaXN0IiwiY29udGFpbnMiLCJhY3RpdmVDbGFzcyIsImVsZW1lbnQiLCJkYXRhc2V0IiwiTE9DSyIsIndpbmRvdyIsInNjcm9sbCIsImRvY3VtZW50IiwicXVlcnlTZWxlY3RvciIsImFkZCIsIk9WRVJGTE9XIiwiZm9jdXNhYmxlIiwiaXRlbSIsImxlbmd0aCIsImFkZEV2ZW50TGlzdGVuZXIiLCJmb2N1cyIsImxvY2tzIiwicXVlcnlTZWxlY3RvckFsbCIsImpvaW4iLCJyZW1vdmUiLCJpZCIsImdldEF0dHJpYnV0ZSIsImNsb3NlIiwiQ0xPU0UiLCJvcGVuIiwiT1BFTiIsIkxPQ0tTIiwiTW9iaWxlTWVudSIsIlNlYXJjaCIsImVsIiwiaW5wdXQiLCJjbGFzc05hbWUiLCJpbmNsdWRlcyIsIm1haW4iLCJXaW5kb3dWaCIsImljb25zIiwicGF0aCIsIkljb25zIiwic2V0dGluZ3MiLCJ2YWxpZCIsInN1Ym1pdCIsImZvcm0iLCJGb3JtcyIsImV2ZW50IiwiRVJST1JfTUVTU0FHRV9QQVJFTlQiLCJ3YXRjaCIsImFjY29yZGlvbiIsImRyb3Bkb3duIiwiY29weSIsIkNvcHkiLCJ0cmFjayIsIlRyYWNrIiwibmV3c2xldHRlciIsImVuZHBvaW50IiwiTmV3c2xldHRlciIsImNhbGxiYWNrIiwiZGF0YSIsInJlc3BvbnNlIiwiZW1haWwiLCJ2YWx1ZSIsImxvY2F0aW9uIiwiT2JqZWN0Iiwia2V5cyIsIm1hcCIsImsiLCJlbmNvZGVVUkkiLCJuZXdzbGV0dGVyRm9ybSIsInBhcmFtcyIsIlVSTFNlYXJjaFBhcmFtcyIsInNlYXJjaCIsImdldCIsIl9kYXRhIiwiX2NhbGxiYWNrIiwibW9iaWxlTWVudSIsIndlYlNoYXJlIiwiV2ViU2hhcmUiLCJmYWxsYmFjayJdLCJtYXBwaW5ncyI6Ijs7O0VBRUE7RUFDQTtFQUNBO0VBQ0EsSUFBTSxJQUFJLEdBTVIsYUFBVyxHQUFHOztBQUFDO0VBQ2pCO0VBQ0EsRUFBSSxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUM7QUFDbEM7RUFDQSxFQUFJLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQztBQUMxQjtFQUNBLEVBQUksSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDO0FBQzVDO0VBQ0E7RUFDQSxFQUFJLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE9BQU8sV0FBQyxNQUFRO0VBQ3RFLElBQU0sSUFBSSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sdUJBQVFBLE1BQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxJQUFDLENBQUMsQ0FBQztFQUM5RCxJQUFNLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLHVCQUFRQSxNQUFJLENBQUMsTUFBTSxDQUFDLElBQUksSUFBQyxDQUFDLENBQUM7RUFDOUQsR0FBSyxDQUFDLENBQUM7QUFDUDtFQUNBO0VBQ0EsRUFBSSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDLGdCQUFnQixDQUFDLE9BQU8sWUFBRSxPQUFTO0VBQ3RFLElBQU0sSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDQSxNQUFJLENBQUMsUUFBUSxDQUFDO0VBQzlDLFFBQVEsU0FBTztBQUNmO0VBQ0EsSUFBTUEsTUFBSSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDO0FBQ2xDO0VBQ0EsSUFBTUEsTUFBSSxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUNBLE1BQUksQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDbEQ7RUFDQSxJQUFNQSxNQUFJLENBQUMsTUFBTSxHQUFHQSxNQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUM7QUFDOUM7RUFDQSxJQUFNLElBQUlBLE1BQUksQ0FBQyxJQUFJLENBQUNBLE1BQUksQ0FBQyxNQUFNLENBQUMsRUFBRTtFQUNsQyxNQUFRQSxNQUFJLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQ0EsTUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztBQUNuRDtFQUNBLE1BQVEsWUFBWSxDQUFDQSxNQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7QUFDOUM7RUFDQSxNQUFRQSxNQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxHQUFHLFVBQVUsYUFBTztFQUNuRCxRQUFVQSxNQUFJLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQ0EsTUFBSSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztFQUN0RCxPQUFTLEVBQUVBLE1BQUksQ0FBQyxhQUFhLENBQUMsQ0FBQztFQUMvQixLQUFPO0VBQ1AsR0FBSyxDQUFDLENBQUM7QUFDUDtFQUNBLEVBQUksT0FBTyxJQUFJLENBQUM7RUFDZCxFQUFDO0FBQ0g7RUFDRTtFQUNGO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtpQkFDRSxzQkFBSyxNQUFNLEVBQUU7RUFDZixFQUFJQyxJQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsR0FBRyxXQUFPLE1BQU0sVUFBSyxDQUFDO0FBQ3hFO0VBQ0EsRUFBSUEsSUFBSSxLQUFLLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUNqRDtFQUNBLEVBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUN2QjtFQUNBLEVBQUksSUFBSSxTQUFTLENBQUMsU0FBUyxJQUFJLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUztFQUM1RCxNQUFNLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBQztFQUNqRCxPQUFTLElBQUksUUFBUSxDQUFDLFdBQVc7RUFDakMsTUFBTSxRQUFRLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxHQUFDO0VBQ25DO0VBQ0EsTUFBTSxPQUFPLEtBQUssR0FBQztBQUNuQjtFQUNBLEVBQUksT0FBTyxJQUFJLENBQUM7RUFDZCxFQUFDO0FBQ0g7RUFDRTtFQUNGO0VBQ0E7RUFDQTtFQUNBO2lCQUNFLDBCQUFPLEtBQUssRUFBRTtFQUNoQixFQUFJLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQztBQUNuQjtFQUNBLEVBQUksS0FBSyxDQUFDLGlCQUFpQixDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztFQUNwQyxFQUNEO0FBQ0Q7RUFDQTtFQUNBLElBQUksQ0FBQyxRQUFRLEdBQUcsbUJBQW1CLENBQUM7QUFDcEM7RUFDQTtFQUNBLElBQUksQ0FBQyxTQUFTLEdBQUc7RUFDakIsRUFBRSxPQUFPLEVBQUUsb0JBQW9CO0VBQy9CLENBQUMsQ0FBQztBQUNGO0VBQ0E7RUFDQSxJQUFJLENBQUMsSUFBSSxHQUFHLGNBQWMsQ0FBQztBQUMzQjtFQUNBO0VBQ0EsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJOztFQ2hHekI7RUFDQTtFQUNBO0VBQ0E7RUFDQSxJQUFNLEtBQUssR0FLVCxjQUFXLENBQUMsSUFBWSxFQUFFOytCQUFWLEdBQUc7QUFBUTtFQUM3QixFQUFJLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO0FBQ3JCO0VBQ0EsRUFBSSxJQUFJLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUM7QUFDakM7RUFDQSxFQUFJLElBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQztBQUMvQjtFQUNBLEVBQUksSUFBSSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDO0FBQ2pDO0VBQ0EsRUFBSSxJQUFJLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUM7QUFDL0I7RUFDQSxFQUFJLElBQUksQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQztBQUNyQztFQUNBLEVBQUksSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDO0FBQzdCO0VBQ0EsRUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxZQUFZLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDL0M7RUFDQSxFQUFJLE9BQU8sSUFBSSxDQUFDO0VBQ2QsRUFBQztBQUNIO0VBQ0U7RUFDRjtFQUNBO0VBQ0E7RUFDQTtrQkFDRSxrQ0FBVyxLQUFLLEVBQUU7RUFDcEIsRUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsd0JBQXdCLENBQUM7RUFDdkQsTUFBTSxTQUFPO0FBQ2I7RUFDQSxFQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyx1QkFBdUIsQ0FBQztFQUN0RCxNQUFNLFNBQU87QUFDYjtFQUNBLEVBQUlBLElBQUksRUFBRSxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLHVCQUF1QixDQUFDLENBQUM7RUFDM0QsRUFBSUEsSUFBSSxNQUFNLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDO0FBQ2pFO0VBQ0EsRUFBSSxNQUFNLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQyxJQUFJO0VBQzdCLE1BQVEsRUFBRSxDQUFDLGdCQUFnQixDQUFDLHdCQUF3QixDQUFDO0VBQ3JELEtBQU87RUFDUCxLQUFPLE1BQU0sV0FBRSxDQUFDLFlBQU0sQ0FBQyxDQUFDLEtBQUssSUFBSSxDQUFDLENBQUMsT0FBTyxJQUFDLENBQUM7RUFDNUMsS0FBTyxHQUFHLFdBQUUsQ0FBQyxXQUFLLENBQUMsQ0FBQyxRQUFLLENBQUM7RUFDMUIsS0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDbEI7RUFDQSxFQUFJLE9BQU8sTUFBTSxDQUFDO0VBQ2hCLEVBQUM7QUFDSDtFQUNFO0VBQ0Y7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7a0JBQ0Usd0JBQU0sS0FBSyxFQUFFO0VBQ2YsRUFBSUEsSUFBSSxRQUFRLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxhQUFhLEVBQUUsQ0FBQztFQUNoRCxFQUFJQSxJQUFJLFFBQVEsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDMUU7RUFDQSxFQUFJLEtBQUtBLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtFQUM5QztFQUNBLElBQU1BLElBQUksRUFBRSxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMzQjtFQUNBLElBQU0sSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUNyQjtFQUNBO0VBQ0EsSUFBTSxJQUFJLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxJQUFFLFdBQVM7QUFDdEM7RUFDQSxJQUFNLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUM7RUFDekIsR0FBSztBQUNMO0VBQ0EsRUFBSSxPQUFPLENBQUMsUUFBUSxJQUFJLElBQUksR0FBRyxRQUFRLENBQUM7RUFDdEMsRUFBQztBQUNIO0VBQ0U7RUFDRjtFQUNBO0VBQ0E7RUFDQTtFQUNBO2tCQUNFLHdCQUFNLElBQVksRUFBRTs7aUNBQVYsR0FBRztBQUFRO0VBQ3ZCLEVBQUksSUFBSSxDQUFDLElBQUksR0FBRyxDQUFDLElBQUksSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQztBQUMxQztFQUNBLEVBQUlBLElBQUksUUFBUSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUN2RTtFQUNBO0VBQ0EsNEJBQThDO0VBQzlDO0VBQ0EsSUFBTUEsSUFBSSxFQUFFLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzNCO0VBQ0EsSUFBTSxFQUFFLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxjQUFRO0VBQ3pDLE1BQVFELE1BQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUM7RUFDdkIsS0FBTyxDQUFDLENBQUM7QUFDVDtFQUNBLElBQU0sRUFBRSxDQUFDLGdCQUFnQixDQUFDLE1BQU0sY0FBUTtFQUN4QyxNQUFRLElBQUksQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLEtBQUs7RUFDOUIsVUFBVUEsTUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsR0FBQztFQUM3QixLQUFPLENBQUMsQ0FBQztFQUNUOztNQVpJLEtBQUtDLElBQUlDLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLFlBWXZDO0FBQ0w7RUFDQTtFQUNBLEVBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLFlBQUcsS0FBSyxFQUFLO0VBQ3BELElBQU0sS0FBSyxDQUFDLGNBQWMsRUFBRSxDQUFDO0FBQzdCO0VBQ0EsSUFBTSxJQUFJRixNQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxLQUFLLEtBQUs7RUFDckMsUUFBUSxPQUFPLEtBQUssR0FBQztBQUNyQjtFQUNBLElBQU1BLE1BQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7RUFDekIsR0FBSyxDQUFDLENBQUM7QUFDUDtFQUNBLEVBQUksT0FBTyxJQUFJLENBQUM7RUFDZCxFQUFDO0FBQ0g7RUFDRTtFQUNGO0VBQ0E7RUFDQTtFQUNBO2tCQUNFLHdCQUFNLEVBQUUsRUFBRTtFQUNaLEVBQUlDLElBQUksU0FBUyxHQUFHLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxvQkFBb0I7RUFDeEQsTUFBUSxFQUFFLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsb0JBQW9CLENBQUMsR0FBRyxFQUFFLENBQUMsVUFBVSxDQUFDO0FBQ3hFO0VBQ0EsRUFBSUEsSUFBSSxPQUFPLEdBQUcsU0FBUyxDQUFDLGFBQWEsQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQztBQUM1RTtFQUNBO0VBQ0EsRUFBSSxTQUFTLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQyxDQUFDO0VBQzdELEVBQUksSUFBSSxPQUFPLElBQUUsT0FBTyxDQUFDLE1BQU0sRUFBRSxHQUFDO0FBQ2xDO0VBQ0E7RUFDQSxFQUFJLFNBQVMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQyxDQUFDO0FBQzdFO0VBQ0E7RUFDQSxFQUFJLEVBQUUsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNsRCxFQUFJLEVBQUUsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsQ0FBQztBQUMvQztFQUNBLEVBQUksT0FBTyxJQUFJLENBQUM7RUFDZCxFQUFDO0FBQ0g7RUFDRTtFQUNGO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7a0JBQ0UsZ0NBQVUsRUFBRSxFQUFFO0VBQ2hCLEVBQUlBLElBQUksU0FBUyxHQUFHLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxvQkFBb0I7RUFDeEQsTUFBUSxFQUFFLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsb0JBQW9CLENBQUMsR0FBRyxFQUFFLENBQUMsVUFBVSxDQUFDO0FBQ3hFO0VBQ0E7RUFDQSxFQUFJQSxJQUFJLE9BQU8sR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUM7RUFDcEUsRUFBSUEsSUFBSSxFQUFFLElBQU0sRUFBRSxDQUFDLFlBQVksQ0FBQyxJQUFJLFlBQUssSUFBSSxDQUFDLE9BQU8sQ0FBQyxjQUFlLENBQUM7QUFDdEU7RUFDQTtFQUNBLEVBQUksSUFBSSxFQUFFLENBQUMsUUFBUSxDQUFDLFlBQVksSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLGNBQWM7RUFDL0QsTUFBTSxPQUFPLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsY0FBYyxHQUFDO0VBQ3RELE9BQVMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSztFQUMvQixJQUFNLElBQUksQ0FBQyxPQUFPLGNBQVUsRUFBRSxDQUFDLElBQUksQ0FBQyxXQUFXLEdBQUUsZUFBVyxFQUFFO0VBQzlELElBQU1BLElBQUksU0FBUyxHQUFHLFlBQVMsRUFBRSxDQUFDLElBQUksQ0FBQyxXQUFXLEdBQUUsYUFBVSxDQUFDO0VBQy9ELElBQU0sT0FBTyxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0VBQ2xELEdBQUs7RUFDTCxNQUFNLE9BQU8sQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUFDLGlCQUFpQixHQUFDO0FBQy9DO0VBQ0E7RUFDQSxFQUFJLE9BQU8sQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDO0VBQ25DLEVBQUksT0FBTyxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUM7RUFDcEQsSUFBTSxJQUFJLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ25DLEVBQUksT0FBTyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQztBQUN0RDtFQUNBO0VBQ0EsRUFBSSxTQUFTLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQyxDQUFDO0VBQzFELEVBQUksU0FBUyxDQUFDLFlBQVksQ0FBQyxPQUFPLEVBQUUsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzdEO0VBQ0E7RUFDQSxFQUFJLFNBQVMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQyxDQUFDO0FBQzFFO0VBQ0E7RUFDQSxFQUFJLEVBQUUsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUMxRSxFQUFJLEVBQUUsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFDaEQ7RUFDQSxFQUFJLE9BQU8sSUFBSSxDQUFDO0VBQ2QsRUFDRDtBQUNEO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQSxLQUFLLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztBQUNuQjtFQUNBO0VBQ0EsS0FBSyxDQUFDLE1BQU0sR0FBRyxXQUFXLEVBQUUsQ0FBQztBQUM3QjtFQUNBO0VBQ0EsS0FBSyxDQUFDLE9BQU8sR0FBRztFQUNoQixFQUFFLGVBQWUsRUFBRSxlQUFlO0VBQ2xDLEVBQUUsaUJBQWlCLEVBQUUsT0FBTztFQUM1QixFQUFFLFlBQVksRUFBRSxPQUFPO0VBQ3ZCLENBQUMsQ0FBQztBQUNGO0VBQ0E7RUFDQSxLQUFLLENBQUMsTUFBTSxHQUFHO0VBQ2YsRUFBRSxlQUFlLEVBQUUsS0FBSztFQUN4QixDQUFDLENBQUM7QUFDRjtFQUNBO0VBQ0EsS0FBSyxDQUFDLFNBQVMsR0FBRztFQUNsQixFQUFFLFVBQVUsRUFBRSxtQkFBbUI7RUFDakMsRUFBRSxzQkFBc0IsRUFBRSxLQUFLO0VBQy9CLENBQUMsQ0FBQztBQUNGO0VBQ0E7RUFDQSxLQUFLLENBQUMsS0FBSyxHQUFHO0VBQ2QsRUFBRSxlQUFlLEVBQUUsQ0FBQyxXQUFXLEVBQUUsUUFBUSxDQUFDO0VBQzFDLEVBQUUsYUFBYSxFQUFFLENBQUMsY0FBYyxFQUFFLE1BQU0sQ0FBQztFQUN6QyxFQUFFLGFBQWEsRUFBRSxrQkFBa0I7RUFDbkMsQ0FBQzs7RUN2T0Q7RUFDQTtFQUNBO0VBQ0E7RUFDQSxJQUFNLEtBQUssR0FNVCxjQUFXLENBQUMsSUFBSSxFQUFFO0VBQ3BCLEVBQUksSUFBSSxHQUFHLENBQUMsSUFBSSxJQUFJLElBQUksR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDO0FBQ3RDO0VBQ0EsRUFBSSxLQUFLLENBQUMsSUFBSSxDQUFDO0VBQ2YsS0FBTyxJQUFJLFdBQUUsUUFBUSxFQUFLO0VBQzFCLE1BQVEsSUFBSSxRQUFRLENBQUMsRUFBRTtFQUN2QixVQUFVLE9BQU8sUUFBUSxDQUFDLElBQUksRUFBRSxHQUFDO0VBQ2pDO0VBQ0E7RUFDQSxVQUNZLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEdBQUM7RUFDbEMsS0FBTyxDQUFDO0VBQ1IsS0FBTyxLQUFLLFdBQUUsS0FBSyxFQUFLO0VBQ3hCO0VBQ0EsUUFDVSxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFDO0VBQzdCLEtBQU8sQ0FBQztFQUNSLEtBQU8sSUFBSSxXQUFFLElBQUksRUFBSztFQUN0QixNQUFRRSxJQUFNLE1BQU0sR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO0VBQ3JELE1BQVEsTUFBTSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7RUFDaEMsTUFBUSxNQUFNLENBQUMsWUFBWSxDQUFDLGFBQWEsRUFBRSxJQUFJLENBQUMsQ0FBQztFQUNqRCxNQUFRLE1BQU0sQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFFLGdCQUFnQixDQUFDLENBQUM7RUFDdkQsTUFBUSxRQUFRLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztFQUMxQyxLQUFPLENBQUMsQ0FBQztBQUNUO0VBQ0EsRUFBSSxPQUFPLElBQUksQ0FBQztFQUNkLEVBQ0Q7QUFDRDtFQUNBO0VBQ0EsS0FBSyxDQUFDLElBQUksR0FBRyxlQUFlOztFQzFDNUIsSUFBSSxDQUFDLENBQUMsdUNBQXVDLENBQUMsQ0FBQyxDQUFDLG9DQUFvQyxDQUFDLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sR0FBQyxPQUFPLENBQUMsR0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLE9BQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBQyxLQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBZ0IsbUJBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsVUFBVSxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsT0FBTyxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLE9BQU8sR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxVQUFVLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sR0FBRyxDQUFDLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDLElBQUksR0FBQyxVQUFRLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxHQUFDLFdBQVMsR0FBRyxpQkFBaUIsR0FBRyxDQUFDLENBQUMsSUFBSSxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBQyxLQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLElBQUksR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFLLEdBQUMsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFDLE9BQU8sQ0FBQzs7RUNNOXFEO0VBQ0E7RUFDQTtFQUNBLElBQU0sVUFBVSxHQVFkLG1CQUFXLENBQUMsT0FBTyxFQUFFOztBQUFDO0VBQ3hCLEVBQUksSUFBSSxDQUFDLEdBQUcsR0FBRyxPQUFPLENBQUM7QUFDdkI7RUFDQSxFQUFJLElBQUksQ0FBQyxJQUFJLEdBQUcsVUFBVSxDQUFDLElBQUksQ0FBQztBQUNoQztFQUNBLEVBQUksSUFBSSxDQUFDLFNBQVMsR0FBRyxVQUFVLENBQUMsU0FBUyxDQUFDO0FBQzFDO0VBQ0EsRUFBSSxJQUFJLENBQUMsU0FBUyxHQUFHLFVBQVUsQ0FBQyxTQUFTLENBQUM7QUFDMUM7RUFDQSxFQUFJLElBQUksQ0FBQyxRQUFRLEdBQUcsVUFBVSxDQUFDLFFBQVEsQ0FBQztBQUN4QztFQUNBLEVBQUksSUFBSSxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUMsVUFBVSxDQUFDO0FBQzVDO0VBQ0EsRUFBSSxJQUFJLENBQUMsT0FBTyxHQUFHLFVBQVUsQ0FBQyxPQUFPLENBQUM7QUFD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
