const {test,afterEach}=require('node:test');
const assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');const dom=new JSDOM('<html><body></body></html>',{url:'http://localhost',pretendToBeVisual:true});
for(const key of ['window','document','navigator','HTMLElement','HTMLInputElement','HTMLFormElement','Node','FormData','MutationObserver','Event','localStorage'])Object.defineProperty(globalThis,key,{value:key==='window'?dom.window:dom.window[key],configurable:true});
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const Module=require('node:module');const load=Module._load;Module._load=function(name,...args){if(name==='next/navigation')return {usePathname:()=>'/news/example'};return load.call(this,name,...args);};
const React=require('react');const {render,screen,fireEvent,act,cleanup,waitFor}=require('@testing-library/react');
const Experience=require('../components/EditorialNewsletterExperience.tsx').default;
const Popup=require('../components/EditorialNewsletterPopup.tsx').default;
const prefs=require('../lib/newsletter-preferences.ts');
dom.window.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');this.querySelector('button').focus();};dom.window.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};
let now=100,tick,desktop=false;Object.defineProperty(performance,'now',{value:()=>now,configurable:true});window.setInterval=fn=>{tick=fn;return 1;};window.clearInterval=()=>{};window.matchMedia=()=>({matches:desktop});
async function advance(n){for(let i=0;i<n;i++){now+=1000;await act(async()=>tick());}}
afterEach(cleanup);
test('mobile exclusion, hidden tab, active form and modal deferral, 45-second engagement, dismissal persistence',async()=>{
render(React.createElement(Experience));fireEvent.pointerDown(window);await advance(50);assert.equal(document.querySelector('dialog'),null);desktop=true;
Object.defineProperty(document,'visibilityState',{value:'hidden',configurable:true});await advance(50);assert.equal(document.querySelector('dialog'),null);Object.defineProperty(document,'visibilityState',{value:'visible',configurable:true});
const form=document.createElement('form');form.innerHTML='<input>';document.body.append(form);form.firstChild.focus();fireEvent.pointerDown(window);await advance(50);assert.equal(document.querySelector('dialog'),null);form.remove();
const modal=document.createElement('div');modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');document.body.append(modal);await advance(50);assert.equal(document.querySelector('dialog'),null);modal.remove();
fireEvent.pointerDown(window);await advance(44);assert.equal(document.querySelector('dialog'),null);await advance(1);await waitFor(()=>assert.ok(document.querySelector('dialog[open]')));fireEvent.click(screen.getByRole('button',{name:'Close newsletter'}));assert.ok(JSON.parse(localStorage.getItem('meritlives-newsletter')).dismissedUntil>Date.now());assert.equal(prefs.popupSuppressed(),true);
});
test('dialog accessible name, Escape callback and focus restoration',()=>{
const trigger=document.createElement('button');document.body.append(trigger);trigger.focus();let closed=0;const view=render(React.createElement(Popup,{onClose:()=>closed++}));const dialog=screen.getByRole('dialog',{name:'Great ideas deserve to be shared.'});fireEvent(dialog,new Event('cancel',{cancelable:true}));assert.equal(closed,1);view.unmount();assert.equal(document.activeElement,trigger);trigger.remove();
});
test('successful subscription persists no PII and disabled storage falls back to memory',()=>{
prefs.newsletterSubscribed();assert.deepEqual(JSON.parse(localStorage.getItem('meritlives-newsletter')),{subscribed:true});const original=dom.window.Storage.prototype.setItem;dom.window.Storage.prototype.setItem=()=>{throw Error('disabled');};assert.doesNotThrow(()=>prefs.newsletterSubscribed());assert.equal(prefs.popupSuppressed(),true);dom.window.Storage.prototype.setItem=original;
});
test('popup wraps Tab in both directions and redirects escaped focus',()=>{
 const originalRects=dom.window.HTMLElement.prototype.getClientRects;
 dom.window.HTMLElement.prototype.getClientRects=()=>[{width:10,height:10}];
 try {
  const view=render(React.createElement(Popup,{onClose(){}}));const dialog=screen.getByRole('dialog');
  const first=screen.getByRole('button',{name:'Close newsletter'});const last=screen.getByRole('link',{name:'Privacy Policy'});
  last.focus();fireEvent.keyDown(last,{key:'Tab'});assert.equal(document.activeElement,first);
  fireEvent.keyDown(first,{key:'Tab',shiftKey:true});assert.equal(document.activeElement,last);
  const outside=document.createElement('button');document.body.append(outside);outside.focus();assert.equal(dialog.contains(document.activeElement),true);outside.remove();view.unmount();
 } finally {dom.window.HTMLElement.prototype.getClientRects=originalRects;}
});
test('fresh page honors stored dismissal, expiration and successful subscription',()=>{
 const modulePath=require.resolve('../lib/newsletter-preferences.ts');const fresh=()=>{delete require.cache[modulePath];return require(modulePath);};
 localStorage.setItem('meritlives-newsletter',JSON.stringify({dismissedUntil:Date.now()+30*86400000}));assert.equal(fresh().popupSuppressed(),true);
 localStorage.setItem('meritlives-newsletter',JSON.stringify({dismissedUntil:Date.now()-1}));assert.equal(fresh().popupSuppressed(),false);
 localStorage.setItem('meritlives-newsletter',JSON.stringify({subscribed:true}));assert.equal(fresh().popupSuppressed(),true);
});
