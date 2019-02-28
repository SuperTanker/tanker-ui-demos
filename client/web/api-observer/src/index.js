import 'react-app-polyfill/ie11';
import '@babel/polyfill';
import '@babel/register';

import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

import './index.css';

ReactDOM.render(<App />, document.getElementById('root'));
