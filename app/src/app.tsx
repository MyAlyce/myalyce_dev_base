
import React, { Component } from 'react'
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';

import './init'

//console.log('Test');

export class App extends Component {
  render() {
    return (
      <div>Test worked!</div>
    );
  }
}


ReactDOM.render(
  <BrowserRouter>
    <App/>
  </BrowserRouter>,
  document.getElementById('react')
);