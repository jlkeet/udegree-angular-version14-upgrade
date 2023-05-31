// TODO(gdi2290): switch to DLLs

// Polyfills
// import 'core-js/es/reflect'
import { environment } from './environments/environment';
// import 'hammerjs/hammer';

// import 'ie-shim'; // Internet Explorer 9 support


import 'core-js/es';
// Added parts of es6 which are necessary for your project or your browser support requirements.
import 'core-js/es/symbol';
import 'core-js/es/object';
import 'core-js/es/function';
import 'core-js/es/parse-int';
import 'core-js/es/parse-float';
import 'core-js/es/number';
import 'core-js/es/math';
import 'core-js/es/string';
import 'core-js/es/date';
import 'core-js/es/array';
import 'core-js/es/regexp';
import 'core-js/es/map';
import 'core-js/es/set';
import 'core-js/es/weak-map';
import 'core-js/es/weak-set';
// import 'core-js/es/typed';


// see issue https://github.com/AngularClass/angular2-webpack-starter/issues/709
// import 'core-js/es6/promise';

import 'zone.js/dist/zone';


/*
 APPLICATION IMPORTS
 */
 (window as any)['global'] = window;

// Comment out ENV for now because error
