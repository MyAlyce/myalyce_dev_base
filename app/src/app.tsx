
import React from 'react'
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';

import './init'


// We need to inject any CSS we want to use, any scss will be converted
let cssloader = [
  'src/react/styles/index.scss',
  'src/react/styles/spectre.css/dist/spectre-exp.min.css',
  'node_modules/my-alyce-component-lib/dist/index.css'
];

let styles = '';
cssloader.forEach((url) => {
  styles += `<link rel="stylesheet" href="${url}" type="text/css" />`
})

if(styles) document.head.insertAdjacentHTML('beforeend',styles);





import { App } from './react/appbody'

ReactDOM.render(
  <BrowserRouter>
    <App/>
  </BrowserRouter>,
  document.getElementById('react')
);