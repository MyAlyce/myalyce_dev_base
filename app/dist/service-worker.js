if(!self.define){let e,t={};const i=(i,n)=>(i=new URL(i+".js",n).href,t[i]||new Promise((t=>{if("document"in self){const e=document.createElement("script");e.src=i,e.onload=t,document.head.appendChild(e)}else e=i,importScripts(i),t()})).then((()=>{let e=t[i];if(!e)throw new Error(`Module ${i} didn’t register its module`);return e})));self.define=(n,s)=>{const o=e||("document"in self?document.currentScript.src:"")||location.href;if(t[o])return;let r={};const c=e=>i(e,o),u={module:{uri:o},exports:r,require:c};t[o]=Promise.all(n.map((e=>u[e]||c(e)))).then((e=>(s(...e),r)))}}define(["./workbox-8f4bcedb"],(function(e){"use strict";self.skipWaiting(),e.precacheAndRoute([{url:"app.js",revision:"b01399292e6d42e930b9c1fcca066bb5"}],{}),e.registerRoute(/\.(?:png|jpg|jpeg|svg|gif)$/,new e.CacheFirst({cacheName:"images",plugins:[]}),"GET")}));
//# sourceMappingURL=service-worker.js.map
