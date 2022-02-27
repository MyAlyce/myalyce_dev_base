
import React from 'react'
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';

import './init'

//-------------------------------------
// Initialize CSS

const useStyles = true;

import './react/styles/index.scss'
import 'my-alyce-component-lib/dist/index.css'

if(useStyles) {
  document.head.insertAdjacentHTML('beforeend',
  `<link rel="stylesheet" href="dist/app.css" type="text/css" />`
  );
}
//--------------------------------------

//--------------------------------------
// Initialize React App
import { App } from './react/app.body'

ReactDOM.render(
  <BrowserRouter>
    <App/>
  </BrowserRouter>,
  document.getElementById('react')
);
//--------------------------------------