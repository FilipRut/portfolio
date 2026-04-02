import{V as Gt,E as hi,T as ui,O as pi,B as mi,a as gi,R as fi,Q as be,M as Ue,S as yi,P as bi,W as vi,A as xi,b as wi,c as Ei,d as _i,e as Ci,D as ge,f as Ai,G as q,g as Mi,h as Ri,i as zi,j as vt,C as je,k as $i,l as Di,m as Pi,n as Li}from"./three.BJad5YKq.js";import{b as R}from"./rapier.CKC5f6tm.js";import{g as ht}from"./gsap.CxMipysd.js";class Q{constructor(t,i,e,c,b="div"){this.parent=t,this.object=i,this.property=e,this._disabled=!1,this._hidden=!1,this.initialValue=this.getValue(),this.domElement=document.createElement(b),this.domElement.classList.add("lil-controller"),this.domElement.classList.add(c),this.$name=document.createElement("div"),this.$name.classList.add("lil-name"),Q.nextNameID=Q.nextNameID||0,this.$name.id=`lil-gui-name-${++Q.nextNameID}`,this.$widget=document.createElement("div"),this.$widget.classList.add("lil-widget"),this.$disable=this.$widget,this.domElement.appendChild(this.$name),this.domElement.appendChild(this.$widget),this.domElement.addEventListener("keydown",v=>v.stopPropagation()),this.domElement.addEventListener("keyup",v=>v.stopPropagation()),this.parent.children.push(this),this.parent.controllers.push(this),this.parent.$children.appendChild(this.domElement),this._listenCallback=this._listenCallback.bind(this),this.name(e)}name(t){return this._name=t,this.$name.textContent=t,this}onChange(t){return this._onChange=t,this}_callOnChange(){this.parent._callOnChange(this),this._onChange!==void 0&&this._onChange.call(this,this.getValue()),this._changed=!0}onFinishChange(t){return this._onFinishChange=t,this}_callOnFinishChange(){this._changed&&(this.parent._callOnFinishChange(this),this._onFinishChange!==void 0&&this._onFinishChange.call(this,this.getValue())),this._changed=!1}reset(){return this.setValue(this.initialValue),this._callOnFinishChange(),this}enable(t=!0){return this.disable(!t)}disable(t=!0){return t===this._disabled?this:(this._disabled=t,this.domElement.classList.toggle("lil-disabled",t),this.$disable.toggleAttribute("disabled",t),this)}show(t=!0){return this._hidden=!t,this.domElement.style.display=this._hidden?"none":"",this}hide(){return this.show(!1)}options(t){const i=this.parent.add(this.object,this.property,t);return i.name(this._name),this.destroy(),i}min(t){return this}max(t){return this}step(t){return this}decimals(t){return this}listen(t=!0){return this._listening=t,this._listenCallbackID!==void 0&&(cancelAnimationFrame(this._listenCallbackID),this._listenCallbackID=void 0),this._listening&&this._listenCallback(),this}_listenCallback(){this._listenCallbackID=requestAnimationFrame(this._listenCallback);const t=this.save();t!==this._listenPrevValue&&this.updateDisplay(),this._listenPrevValue=t}getValue(){return this.object[this.property]}setValue(t){return this.getValue()!==t&&(this.object[this.property]=t,this._callOnChange(),this.updateDisplay()),this}updateDisplay(){return this}load(t){return this.setValue(t),this._callOnFinishChange(),this}save(){return this.getValue()}destroy(){this.listen(!1),this.parent.children.splice(this.parent.children.indexOf(this),1),this.parent.controllers.splice(this.parent.controllers.indexOf(this),1),this.parent.$children.removeChild(this.domElement)}}class Ii extends Q{constructor(t,i,e){super(t,i,e,"lil-boolean","label"),this.$input=document.createElement("input"),this.$input.setAttribute("type","checkbox"),this.$input.setAttribute("aria-labelledby",this.$name.id),this.$widget.appendChild(this.$input),this.$input.addEventListener("change",()=>{this.setValue(this.$input.checked),this._callOnFinishChange()}),this.$disable=this.$input,this.updateDisplay()}updateDisplay(){return this.$input.checked=this.getValue(),this}}function ve(l){let t,i;return(t=l.match(/(#|0x)?([a-f0-9]{6})/i))?i=t[2]:(t=l.match(/rgb\(\s*(\d*)\s*,\s*(\d*)\s*,\s*(\d*)\s*\)/))?i=parseInt(t[1]).toString(16).padStart(2,0)+parseInt(t[2]).toString(16).padStart(2,0)+parseInt(t[3]).toString(16).padStart(2,0):(t=l.match(/^#?([a-f0-9])([a-f0-9])([a-f0-9])$/i))&&(i=t[1]+t[1]+t[2]+t[2]+t[3]+t[3]),i?"#"+i:!1}const Si={isPrimitive:!0,match:l=>typeof l=="string",fromHexString:ve,toHexString:ve},Nt={isPrimitive:!0,match:l=>typeof l=="number",fromHexString:l=>parseInt(l.substring(1),16),toHexString:l=>"#"+l.toString(16).padStart(6,0)},ki={isPrimitive:!1,match:l=>Array.isArray(l)||ArrayBuffer.isView(l),fromHexString(l,t,i=1){const e=Nt.fromHexString(l);t[0]=(e>>16&255)/255*i,t[1]=(e>>8&255)/255*i,t[2]=(e&255)/255*i},toHexString([l,t,i],e=1){e=255/e;const c=l*e<<16^t*e<<8^i*e<<0;return Nt.toHexString(c)}},Bi={isPrimitive:!1,match:l=>Object(l)===l,fromHexString(l,t,i=1){const e=Nt.fromHexString(l);t.r=(e>>16&255)/255*i,t.g=(e>>8&255)/255*i,t.b=(e&255)/255*i},toHexString({r:l,g:t,b:i},e=1){e=255/e;const c=l*e<<16^t*e<<8^i*e<<0;return Nt.toHexString(c)}},Fi=[Si,Nt,ki,Bi];function Oi(l){return Fi.find(t=>t.match(l))}class Gi extends Q{constructor(t,i,e,c){super(t,i,e,"lil-color"),this.$input=document.createElement("input"),this.$input.setAttribute("type","color"),this.$input.setAttribute("tabindex",-1),this.$input.setAttribute("aria-labelledby",this.$name.id),this.$text=document.createElement("input"),this.$text.setAttribute("type","text"),this.$text.setAttribute("spellcheck","false"),this.$text.setAttribute("aria-labelledby",this.$name.id),this.$display=document.createElement("div"),this.$display.classList.add("lil-display"),this.$display.appendChild(this.$input),this.$widget.appendChild(this.$display),this.$widget.appendChild(this.$text),this._format=Oi(this.initialValue),this._rgbScale=c,this._initialValueHexString=this.save(),this._textFocused=!1,this.$input.addEventListener("input",()=>{this._setValueFromHexString(this.$input.value)}),this.$input.addEventListener("blur",()=>{this._callOnFinishChange()}),this.$text.addEventListener("input",()=>{const b=ve(this.$text.value);b&&this._setValueFromHexString(b)}),this.$text.addEventListener("focus",()=>{this._textFocused=!0,this.$text.select()}),this.$text.addEventListener("blur",()=>{this._textFocused=!1,this.updateDisplay(),this._callOnFinishChange()}),this.$disable=this.$text,this.updateDisplay()}reset(){return this._setValueFromHexString(this._initialValueHexString),this}_setValueFromHexString(t){if(this._format.isPrimitive){const i=this._format.fromHexString(t);this.setValue(i)}else this._format.fromHexString(t,this.getValue(),this._rgbScale),this._callOnChange(),this.updateDisplay()}save(){return this._format.toHexString(this.getValue(),this._rgbScale)}load(t){return this._setValueFromHexString(t),this._callOnFinishChange(),this}updateDisplay(){return this.$input.value=this._format.toHexString(this.getValue(),this._rgbScale),this._textFocused||(this.$text.value=this.$input.value.substring(1)),this.$display.style.backgroundColor=this.$input.value,this}}class fe extends Q{constructor(t,i,e){super(t,i,e,"lil-function"),this.$button=document.createElement("button"),this.$button.appendChild(this.$name),this.$widget.appendChild(this.$button),this.$button.addEventListener("click",c=>{c.preventDefault(),this.getValue().call(this.object),this._callOnChange()}),this.$button.addEventListener("touchstart",()=>{},{passive:!0}),this.$disable=this.$button}}class Ni extends Q{constructor(t,i,e,c,b,v){super(t,i,e,"lil-number"),this._initInput(),this.min(c),this.max(b);const x=v!==void 0;this.step(x?v:this._getImplicitStep(),x),this.updateDisplay()}decimals(t){return this._decimals=t,this.updateDisplay(),this}min(t){return this._min=t,this._onUpdateMinMax(),this}max(t){return this._max=t,this._onUpdateMinMax(),this}step(t,i=!0){return this._step=t,this._stepExplicit=i,this}updateDisplay(){const t=this.getValue();if(this._hasSlider){let i=(t-this._min)/(this._max-this._min);i=Math.max(0,Math.min(i,1)),this.$fill.style.width=i*100+"%"}return this._inputFocused||(this.$input.value=this._decimals===void 0?t:t.toFixed(this._decimals)),this}_initInput(){this.$input=document.createElement("input"),this.$input.setAttribute("type","text"),this.$input.setAttribute("aria-labelledby",this.$name.id),window.matchMedia("(pointer: coarse)").matches&&(this.$input.setAttribute("type","number"),this.$input.setAttribute("step","any")),this.$widget.appendChild(this.$input),this.$disable=this.$input;const i=()=>{let y=parseFloat(this.$input.value);isNaN(y)||(this._stepExplicit&&(y=this._snap(y)),this.setValue(this._clamp(y)))},e=y=>{const f=parseFloat(this.$input.value);isNaN(f)||(this._snapClampSetValue(f+y),this.$input.value=this.getValue())},c=y=>{y.key==="Enter"&&this.$input.blur(),y.code==="ArrowUp"&&(y.preventDefault(),e(this._step*this._arrowKeyMultiplier(y))),y.code==="ArrowDown"&&(y.preventDefault(),e(this._step*this._arrowKeyMultiplier(y)*-1))},b=y=>{this._inputFocused&&(y.preventDefault(),e(this._step*this._normalizeMouseWheel(y)))};let v=!1,x,E,z,C,B;const K=5,At=y=>{x=y.clientX,E=z=y.clientY,v=!0,C=this.getValue(),B=0,window.addEventListener("mousemove",Et),window.addEventListener("mouseup",_)},Et=y=>{if(v){const f=y.clientX-x,I=y.clientY-E;Math.abs(I)>K?(y.preventDefault(),this.$input.blur(),v=!1,this._setDraggingStyle(!0,"vertical")):Math.abs(f)>K&&_()}if(!v){const f=y.clientY-z;B-=f*this._step*this._arrowKeyMultiplier(y),C+B>this._max?B=this._max-C:C+B<this._min&&(B=this._min-C),this._snapClampSetValue(C+B)}z=y.clientY},_=()=>{this._setDraggingStyle(!1,"vertical"),this._callOnFinishChange(),window.removeEventListener("mousemove",Et),window.removeEventListener("mouseup",_)},Mt=()=>{this._inputFocused=!0},w=()=>{this._inputFocused=!1,this.updateDisplay(),this._callOnFinishChange()};this.$input.addEventListener("input",i),this.$input.addEventListener("keydown",c),this.$input.addEventListener("wheel",b,{passive:!1}),this.$input.addEventListener("mousedown",At),this.$input.addEventListener("focus",Mt),this.$input.addEventListener("blur",w)}_initSlider(){this._hasSlider=!0,this.$slider=document.createElement("div"),this.$slider.classList.add("lil-slider"),this.$fill=document.createElement("div"),this.$fill.classList.add("lil-fill"),this.$slider.appendChild(this.$fill),this.$widget.insertBefore(this.$slider,this.$input),this.domElement.classList.add("lil-has-slider");const t=(w,y,f,I,H)=>(w-y)/(f-y)*(H-I)+I,i=w=>{const y=this.$slider.getBoundingClientRect();let f=t(w,y.left,y.right,this._min,this._max);this._snapClampSetValue(f)},e=w=>{this._setDraggingStyle(!0),i(w.clientX),window.addEventListener("mousemove",c),window.addEventListener("mouseup",b)},c=w=>{i(w.clientX)},b=()=>{this._callOnFinishChange(),this._setDraggingStyle(!1),window.removeEventListener("mousemove",c),window.removeEventListener("mouseup",b)};let v=!1,x,E;const z=w=>{w.preventDefault(),this._setDraggingStyle(!0),i(w.touches[0].clientX),v=!1},C=w=>{w.touches.length>1||(this._hasScrollBar?(x=w.touches[0].clientX,E=w.touches[0].clientY,v=!0):z(w),window.addEventListener("touchmove",B,{passive:!1}),window.addEventListener("touchend",K))},B=w=>{if(v){const y=w.touches[0].clientX-x,f=w.touches[0].clientY-E;Math.abs(y)>Math.abs(f)?z(w):(window.removeEventListener("touchmove",B),window.removeEventListener("touchend",K))}else w.preventDefault(),i(w.touches[0].clientX)},K=()=>{this._callOnFinishChange(),this._setDraggingStyle(!1),window.removeEventListener("touchmove",B),window.removeEventListener("touchend",K)},At=this._callOnFinishChange.bind(this),Et=400;let _;const Mt=w=>{if(Math.abs(w.deltaX)<Math.abs(w.deltaY)&&this._hasScrollBar)return;w.preventDefault();const f=this._normalizeMouseWheel(w)*this._step;this._snapClampSetValue(this.getValue()+f),this.$input.value=this.getValue(),clearTimeout(_),_=setTimeout(At,Et)};this.$slider.addEventListener("mousedown",e),this.$slider.addEventListener("touchstart",C,{passive:!1}),this.$slider.addEventListener("wheel",Mt,{passive:!1})}_setDraggingStyle(t,i="horizontal"){this.$slider&&this.$slider.classList.toggle("lil-active",t),document.body.classList.toggle("lil-dragging",t),document.body.classList.toggle(`lil-${i}`,t)}_getImplicitStep(){return this._hasMin&&this._hasMax?(this._max-this._min)/1e3:.1}_onUpdateMinMax(){!this._hasSlider&&this._hasMin&&this._hasMax&&(this._stepExplicit||this.step(this._getImplicitStep(),!1),this._initSlider(),this.updateDisplay())}_normalizeMouseWheel(t){let{deltaX:i,deltaY:e}=t;return Math.floor(t.deltaY)!==t.deltaY&&t.wheelDelta&&(i=0,e=-t.wheelDelta/120,e*=this._stepExplicit?1:10),i+-e}_arrowKeyMultiplier(t){let i=this._stepExplicit?1:10;return t.shiftKey?i*=10:t.altKey&&(i/=10),i}_snap(t){let i=0;return this._hasMin?i=this._min:this._hasMax&&(i=this._max),t-=i,t=Math.round(t/this._step)*this._step,t+=i,t=parseFloat(t.toPrecision(15)),t}_clamp(t){return t<this._min&&(t=this._min),t>this._max&&(t=this._max),t}_snapClampSetValue(t){this.setValue(this._clamp(this._snap(t)))}get _hasScrollBar(){const t=this.parent.root.$children;return t.scrollHeight>t.clientHeight}get _hasMin(){return this._min!==void 0}get _hasMax(){return this._max!==void 0}}class Ti extends Q{constructor(t,i,e,c){super(t,i,e,"lil-option"),this.$select=document.createElement("select"),this.$select.setAttribute("aria-labelledby",this.$name.id),this.$display=document.createElement("div"),this.$display.classList.add("lil-display"),this.$select.addEventListener("change",()=>{this.setValue(this._values[this.$select.selectedIndex]),this._callOnFinishChange()}),this.$select.addEventListener("focus",()=>{this.$display.classList.add("lil-focus")}),this.$select.addEventListener("blur",()=>{this.$display.classList.remove("lil-focus")}),this.$widget.appendChild(this.$select),this.$widget.appendChild(this.$display),this.$disable=this.$select,this.options(c)}options(t){return this._values=Array.isArray(t)?t:Object.values(t),this._names=Array.isArray(t)?t:Object.keys(t),this.$select.replaceChildren(),this._names.forEach(i=>{const e=document.createElement("option");e.textContent=i,this.$select.appendChild(e)}),this.updateDisplay(),this}updateDisplay(){const t=this.getValue(),i=this._values.indexOf(t);return this.$select.selectedIndex=i,this.$display.textContent=i===-1?t:this._names[i],this}}class Yi extends Q{constructor(t,i,e){super(t,i,e,"lil-string"),this.$input=document.createElement("input"),this.$input.setAttribute("type","text"),this.$input.setAttribute("spellcheck","false"),this.$input.setAttribute("aria-labelledby",this.$name.id),this.$input.addEventListener("input",()=>{this.setValue(this.$input.value)}),this.$input.addEventListener("keydown",c=>{c.code==="Enter"&&this.$input.blur()}),this.$input.addEventListener("blur",()=>{this._callOnFinishChange()}),this.$widget.appendChild(this.$input),this.$disable=this.$input,this.updateDisplay()}updateDisplay(){return this.$input.value=this.getValue(),this}}var Wi=`.lil-gui {
  font-family: var(--font-family);
  font-size: var(--font-size);
  line-height: 1;
  font-weight: normal;
  font-style: normal;
  text-align: left;
  color: var(--text-color);
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
  --background-color: #1f1f1f;
  --text-color: #ebebeb;
  --title-background-color: #111111;
  --title-text-color: #ebebeb;
  --widget-color: #424242;
  --hover-color: #4f4f4f;
  --focus-color: #595959;
  --number-color: #2cc9ff;
  --string-color: #a2db3c;
  --font-size: 11px;
  --input-font-size: 11px;
  --font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
  --font-family-mono: Menlo, Monaco, Consolas, "Droid Sans Mono", monospace;
  --padding: 4px;
  --spacing: 4px;
  --widget-height: 20px;
  --title-height: calc(var(--widget-height) + var(--spacing) * 1.25);
  --name-width: 45%;
  --slider-knob-width: 2px;
  --slider-input-width: 27%;
  --color-input-width: 27%;
  --slider-input-min-width: 45px;
  --color-input-min-width: 45px;
  --folder-indent: 7px;
  --widget-padding: 0 0 0 3px;
  --widget-border-radius: 2px;
  --checkbox-size: calc(0.75 * var(--widget-height));
  --scrollbar-width: 5px;
}
.lil-gui, .lil-gui * {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
.lil-gui.lil-root {
  width: var(--width, 245px);
  display: flex;
  flex-direction: column;
  background: var(--background-color);
}
.lil-gui.lil-root > .lil-title {
  background: var(--title-background-color);
  color: var(--title-text-color);
}
.lil-gui.lil-root > .lil-children {
  overflow-x: hidden;
  overflow-y: auto;
}
.lil-gui.lil-root > .lil-children::-webkit-scrollbar {
  width: var(--scrollbar-width);
  height: var(--scrollbar-width);
  background: var(--background-color);
}
.lil-gui.lil-root > .lil-children::-webkit-scrollbar-thumb {
  border-radius: var(--scrollbar-width);
  background: var(--focus-color);
}
@media (pointer: coarse) {
  .lil-gui.lil-allow-touch-styles, .lil-gui.lil-allow-touch-styles .lil-gui {
    --widget-height: 28px;
    --padding: 6px;
    --spacing: 6px;
    --font-size: 13px;
    --input-font-size: 16px;
    --folder-indent: 10px;
    --scrollbar-width: 7px;
    --slider-input-min-width: 50px;
    --color-input-min-width: 65px;
  }
}
.lil-gui.lil-force-touch-styles, .lil-gui.lil-force-touch-styles .lil-gui {
  --widget-height: 28px;
  --padding: 6px;
  --spacing: 6px;
  --font-size: 13px;
  --input-font-size: 16px;
  --folder-indent: 10px;
  --scrollbar-width: 7px;
  --slider-input-min-width: 50px;
  --color-input-min-width: 65px;
}
.lil-gui.lil-auto-place, .lil-gui.autoPlace {
  max-height: 100%;
  position: fixed;
  top: 0;
  right: 15px;
  z-index: 1001;
}

.lil-controller {
  display: flex;
  align-items: center;
  padding: 0 var(--padding);
  margin: var(--spacing) 0;
}
.lil-controller.lil-disabled {
  opacity: 0.5;
}
.lil-controller.lil-disabled, .lil-controller.lil-disabled * {
  pointer-events: none !important;
}
.lil-controller > .lil-name {
  min-width: var(--name-width);
  flex-shrink: 0;
  white-space: pre;
  padding-right: var(--spacing);
  line-height: var(--widget-height);
}
.lil-controller .lil-widget {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  min-height: var(--widget-height);
}
.lil-controller.lil-string input {
  color: var(--string-color);
}
.lil-controller.lil-boolean {
  cursor: pointer;
}
.lil-controller.lil-color .lil-display {
  width: 100%;
  height: var(--widget-height);
  border-radius: var(--widget-border-radius);
  position: relative;
}
@media (hover: hover) {
  .lil-controller.lil-color .lil-display:hover:before {
    content: " ";
    display: block;
    position: absolute;
    border-radius: var(--widget-border-radius);
    border: 1px solid #fff9;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
  }
}
.lil-controller.lil-color input[type=color] {
  opacity: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
}
.lil-controller.lil-color input[type=text] {
  margin-left: var(--spacing);
  font-family: var(--font-family-mono);
  min-width: var(--color-input-min-width);
  width: var(--color-input-width);
  flex-shrink: 0;
}
.lil-controller.lil-option select {
  opacity: 0;
  position: absolute;
  width: 100%;
  max-width: 100%;
}
.lil-controller.lil-option .lil-display {
  position: relative;
  pointer-events: none;
  border-radius: var(--widget-border-radius);
  height: var(--widget-height);
  line-height: var(--widget-height);
  max-width: 100%;
  overflow: hidden;
  word-break: break-all;
  padding-left: 0.55em;
  padding-right: 1.75em;
  background: var(--widget-color);
}
@media (hover: hover) {
  .lil-controller.lil-option .lil-display.lil-focus {
    background: var(--focus-color);
  }
}
.lil-controller.lil-option .lil-display.lil-active {
  background: var(--focus-color);
}
.lil-controller.lil-option .lil-display:after {
  font-family: "lil-gui";
  content: "↕";
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  padding-right: 0.375em;
}
.lil-controller.lil-option .lil-widget,
.lil-controller.lil-option select {
  cursor: pointer;
}
@media (hover: hover) {
  .lil-controller.lil-option .lil-widget:hover .lil-display {
    background: var(--hover-color);
  }
}
.lil-controller.lil-number input {
  color: var(--number-color);
}
.lil-controller.lil-number.lil-has-slider input {
  margin-left: var(--spacing);
  width: var(--slider-input-width);
  min-width: var(--slider-input-min-width);
  flex-shrink: 0;
}
.lil-controller.lil-number .lil-slider {
  width: 100%;
  height: var(--widget-height);
  background: var(--widget-color);
  border-radius: var(--widget-border-radius);
  padding-right: var(--slider-knob-width);
  overflow: hidden;
  cursor: ew-resize;
  touch-action: pan-y;
}
@media (hover: hover) {
  .lil-controller.lil-number .lil-slider:hover {
    background: var(--hover-color);
  }
}
.lil-controller.lil-number .lil-slider.lil-active {
  background: var(--focus-color);
}
.lil-controller.lil-number .lil-slider.lil-active .lil-fill {
  opacity: 0.95;
}
.lil-controller.lil-number .lil-fill {
  height: 100%;
  border-right: var(--slider-knob-width) solid var(--number-color);
  box-sizing: content-box;
}

.lil-dragging .lil-gui {
  --hover-color: var(--widget-color);
}
.lil-dragging * {
  cursor: ew-resize !important;
}
.lil-dragging.lil-vertical * {
  cursor: ns-resize !important;
}

.lil-gui .lil-title {
  height: var(--title-height);
  font-weight: 600;
  padding: 0 var(--padding);
  width: 100%;
  text-align: left;
  background: none;
  text-decoration-skip: objects;
}
.lil-gui .lil-title:before {
  font-family: "lil-gui";
  content: "▾";
  padding-right: 2px;
  display: inline-block;
}
.lil-gui .lil-title:active {
  background: var(--title-background-color);
  opacity: 0.75;
}
@media (hover: hover) {
  body:not(.lil-dragging) .lil-gui .lil-title:hover {
    background: var(--title-background-color);
    opacity: 0.85;
  }
  .lil-gui .lil-title:focus {
    text-decoration: underline var(--focus-color);
  }
}
.lil-gui.lil-root > .lil-title:focus {
  text-decoration: none !important;
}
.lil-gui.lil-closed > .lil-title:before {
  content: "▸";
}
.lil-gui.lil-closed > .lil-children {
  transform: translateY(-7px);
  opacity: 0;
}
.lil-gui.lil-closed:not(.lil-transition) > .lil-children {
  display: none;
}
.lil-gui.lil-transition > .lil-children {
  transition-duration: 300ms;
  transition-property: height, opacity, transform;
  transition-timing-function: cubic-bezier(0.2, 0.6, 0.35, 1);
  overflow: hidden;
  pointer-events: none;
}
.lil-gui .lil-children:empty:before {
  content: "Empty";
  padding: 0 var(--padding);
  margin: var(--spacing) 0;
  display: block;
  height: var(--widget-height);
  font-style: italic;
  line-height: var(--widget-height);
  opacity: 0.5;
}
.lil-gui.lil-root > .lil-children > .lil-gui > .lil-title {
  border: 0 solid var(--widget-color);
  border-width: 1px 0;
  transition: border-color 300ms;
}
.lil-gui.lil-root > .lil-children > .lil-gui.lil-closed > .lil-title {
  border-bottom-color: transparent;
}
.lil-gui + .lil-controller {
  border-top: 1px solid var(--widget-color);
  margin-top: 0;
  padding-top: var(--spacing);
}
.lil-gui .lil-gui .lil-gui > .lil-title {
  border: none;
}
.lil-gui .lil-gui .lil-gui > .lil-children {
  border: none;
  margin-left: var(--folder-indent);
  border-left: 2px solid var(--widget-color);
}
.lil-gui .lil-gui .lil-controller {
  border: none;
}

.lil-gui label, .lil-gui input, .lil-gui button {
  -webkit-tap-highlight-color: transparent;
}
.lil-gui input {
  border: 0;
  outline: none;
  font-family: var(--font-family);
  font-size: var(--input-font-size);
  border-radius: var(--widget-border-radius);
  height: var(--widget-height);
  background: var(--widget-color);
  color: var(--text-color);
  width: 100%;
}
@media (hover: hover) {
  .lil-gui input:hover {
    background: var(--hover-color);
  }
  .lil-gui input:active {
    background: var(--focus-color);
  }
}
.lil-gui input:disabled {
  opacity: 1;
}
.lil-gui input[type=text],
.lil-gui input[type=number] {
  padding: var(--widget-padding);
  -moz-appearance: textfield;
}
.lil-gui input[type=text]:focus,
.lil-gui input[type=number]:focus {
  background: var(--focus-color);
}
.lil-gui input[type=checkbox] {
  appearance: none;
  width: var(--checkbox-size);
  height: var(--checkbox-size);
  border-radius: var(--widget-border-radius);
  text-align: center;
  cursor: pointer;
}
.lil-gui input[type=checkbox]:checked:before {
  font-family: "lil-gui";
  content: "✓";
  font-size: var(--checkbox-size);
  line-height: var(--checkbox-size);
}
@media (hover: hover) {
  .lil-gui input[type=checkbox]:focus {
    box-shadow: inset 0 0 0 1px var(--focus-color);
  }
}
.lil-gui button {
  outline: none;
  cursor: pointer;
  font-family: var(--font-family);
  font-size: var(--font-size);
  color: var(--text-color);
  width: 100%;
  border: none;
}
.lil-gui .lil-controller button {
  height: var(--widget-height);
  text-transform: none;
  background: var(--widget-color);
  border-radius: var(--widget-border-radius);
}
@media (hover: hover) {
  .lil-gui .lil-controller button:hover {
    background: var(--hover-color);
  }
  .lil-gui .lil-controller button:focus {
    box-shadow: inset 0 0 0 1px var(--focus-color);
  }
}
.lil-gui .lil-controller button:active {
  background: var(--focus-color);
}

@font-face {
  font-family: "lil-gui";
  src: url("data:application/font-woff2;charset=utf-8;base64,d09GMgABAAAAAALkAAsAAAAABtQAAAKVAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHFQGYACDMgqBBIEbATYCJAMUCwwABCAFhAoHgQQbHAbIDiUFEYVARAAAYQTVWNmz9MxhEgodq49wYRUFKE8GWNiUBxI2LBRaVnc51U83Gmhs0Q7JXWMiz5eteLwrKwuxHO8VFxUX9UpZBs6pa5ABRwHA+t3UxUnH20EvVknRerzQgX6xC/GH6ZUvTcAjAv122dF28OTqCXrPuyaDER30YBA1xnkVutDDo4oCi71Ca7rrV9xS8dZHbPHefsuwIyCpmT7j+MnjAH5X3984UZoFFuJ0yiZ4XEJFxjagEBeqs+e1iyK8Xf/nOuwF+vVK0ur765+vf7txotUi0m3N0m/84RGSrBCNrh8Ee5GjODjF4gnWP+dJrH/Lk9k4oT6d+gr6g/wssA2j64JJGP6cmx554vUZnpZfn6ZfX2bMwPPrlANsB86/DiHjhl0OP+c87+gaJo/gY084s3HoYL/ZkWHTRfBXvvoHnnkHvngKun4KBE/ede7tvq3/vQOxDXB1/fdNz6XbPdcr0Vhpojj9dG+owuSKFsslCi1tgEjirjXdwMiov2EioadxmqTHUCIwo8NgQaeIasAi0fTYSPTbSmwbMOFduyh9wvBrESGY0MtgRjtgQR8Q1bRPohn2UoCRZf9wyYANMXFeJTysqAe0I4mrherOekFdKMrYvJjLvOIUM9SuwYB5DVZUwwVjJJOaUnZCmcEkIZZrKqNvRGRMvmFZsmhP4VMKCSXBhSqUBxgMS7h0cZvEd71AWkEhGWaeMFcNnpqyJkyXgYL7PQ1MoSq0wDAkRtJIijkZSmqYTiSImfLiSWXIZwhRh3Rug2X0kk1Dgj+Iu43u5p98ghopcpSo0Uyc8SnjlYX59WUeaMoDqmVD2TOWD9a4pCRAzf2ECgwGcrHjPOWY9bNxq/OL3I/QjwEAAAA=") format("woff2");
}`;function Hi(l){const t=document.createElement("style");t.innerHTML=l;const i=document.querySelector("head link[rel=stylesheet], head style");i?document.head.insertBefore(t,i):document.head.appendChild(t)}let Xe=!1;class Ee{constructor({parent:t,autoPlace:i=t===void 0,container:e,width:c,title:b="Controls",closeFolders:v=!1,injectStyles:x=!0,touchStyles:E=!0}={}){if(this.parent=t,this.root=t?t.root:this,this.children=[],this.controllers=[],this.folders=[],this._closed=!1,this._hidden=!1,this.domElement=document.createElement("div"),this.domElement.classList.add("lil-gui"),this.$title=document.createElement("button"),this.$title.classList.add("lil-title"),this.$title.setAttribute("aria-expanded",!0),this.$title.addEventListener("click",()=>this.openAnimated(this._closed)),this.$title.addEventListener("touchstart",()=>{},{passive:!0}),this.$children=document.createElement("div"),this.$children.classList.add("lil-children"),this.domElement.appendChild(this.$title),this.domElement.appendChild(this.$children),this.title(b),this.parent){this.parent.children.push(this),this.parent.folders.push(this),this.parent.$children.appendChild(this.domElement);return}this.domElement.classList.add("lil-root"),E&&this.domElement.classList.add("lil-allow-touch-styles"),!Xe&&x&&(Hi(Wi),Xe=!0),e?e.appendChild(this.domElement):i&&(this.domElement.classList.add("lil-auto-place","autoPlace"),document.body.appendChild(this.domElement)),c&&this.domElement.style.setProperty("--width",c+"px"),this._closeFolders=v}add(t,i,e,c,b){if(Object(e)===e)return new Ti(this,t,i,e);const v=t[i];switch(typeof v){case"number":return new Ni(this,t,i,e,c,b);case"boolean":return new Ii(this,t,i);case"string":return new Yi(this,t,i);case"function":return new fe(this,t,i)}console.error(`gui.add failed
	property:`,i,`
	object:`,t,`
	value:`,v)}addColor(t,i,e=1){return new Gi(this,t,i,e)}addFolder(t){const i=new Ee({parent:this,title:t});return this.root._closeFolders&&i.close(),i}load(t,i=!0){return t.controllers&&this.controllers.forEach(e=>{e instanceof fe||e._name in t.controllers&&e.load(t.controllers[e._name])}),i&&t.folders&&this.folders.forEach(e=>{e._title in t.folders&&e.load(t.folders[e._title])}),this}save(t=!0){const i={controllers:{},folders:{}};return this.controllers.forEach(e=>{if(!(e instanceof fe)){if(e._name in i.controllers)throw new Error(`Cannot save GUI with duplicate property "${e._name}"`);i.controllers[e._name]=e.save()}}),t&&this.folders.forEach(e=>{if(e._title in i.folders)throw new Error(`Cannot save GUI with duplicate folder "${e._title}"`);i.folders[e._title]=e.save()}),i}open(t=!0){return this._setClosed(!t),this.$title.setAttribute("aria-expanded",!this._closed),this.domElement.classList.toggle("lil-closed",this._closed),this}close(){return this.open(!1)}_setClosed(t){this._closed!==t&&(this._closed=t,this._callOnOpenClose(this))}show(t=!0){return this._hidden=!t,this.domElement.style.display=this._hidden?"none":"",this}hide(){return this.show(!1)}openAnimated(t=!0){return this._setClosed(!t),this.$title.setAttribute("aria-expanded",!this._closed),requestAnimationFrame(()=>{const i=this.$children.clientHeight;this.$children.style.height=i+"px",this.domElement.classList.add("lil-transition");const e=b=>{b.target===this.$children&&(this.$children.style.height="",this.domElement.classList.remove("lil-transition"),this.$children.removeEventListener("transitionend",e))};this.$children.addEventListener("transitionend",e);const c=t?this.$children.scrollHeight:0;this.domElement.classList.toggle("lil-closed",!t),requestAnimationFrame(()=>{this.$children.style.height=c+"px"})}),this}title(t){return this._title=t,this.$title.textContent=t,this}reset(t=!0){return(t?this.controllersRecursive():this.controllers).forEach(e=>e.reset()),this}onChange(t){return this._onChange=t,this}_callOnChange(t){this.parent&&this.parent._callOnChange(t),this._onChange!==void 0&&this._onChange.call(this,{object:t.object,property:t.property,value:t.getValue(),controller:t})}onFinishChange(t){return this._onFinishChange=t,this}_callOnFinishChange(t){this.parent&&this.parent._callOnFinishChange(t),this._onFinishChange!==void 0&&this._onFinishChange.call(this,{object:t.object,property:t.property,value:t.getValue(),controller:t})}onOpenClose(t){return this._onOpenClose=t,this}_callOnOpenClose(t){this.parent&&this.parent._callOnOpenClose(t),this._onOpenClose!==void 0&&this._onOpenClose.call(this,t)}destroy(){this.parent&&(this.parent.children.splice(this.parent.children.indexOf(this),1),this.parent.folders.splice(this.parent.folders.indexOf(this),1)),this.domElement.parentElement&&this.domElement.parentElement.removeChild(this.domElement),Array.from(this.children).forEach(t=>t.destroy())}controllersRecursive(){let t=Array.from(this.controllers);return this.folders.forEach(i=>{t=t.concat(i.controllersRecursive())}),t}foldersRecursive(){let t=Array.from(this.folders);return this.folders.forEach(i=>{t=t.concat(i.foldersRecursive())}),t}}let St=!1,ut=null,N=null,Y=null,wt=null,W=null,A,Zt=!1,xt=null,qe=new Gt,Qe=new hi,X=!1;const Ct=[],Tt=[],Vi=50;function _e(){return{entries:A.selectables.map(l=>({meshPos:l.mesh.position.clone(),meshRot:l.mesh.rotation.clone(),meshScale:l.mesh.scale.clone(),groupPos:l.group.position.clone()}))}}function Ke(l){l.entries.forEach((t,i)=>{const e=A.selectables[i];e&&(e.mesh.position.copy(t.meshPos),e.mesh.rotation.copy(t.meshRot),e.mesh.scale.copy(t.meshScale),e.group.position.copy(t.groupPos))}),W&&Ji()}function ji(){Ct.push(_e()),Ct.length>Vi&&Ct.shift(),Tt.length=0}function Xi(){Ct.length&&(Tt.push(_e()),Ke(Ct.pop()))}function Ui(){Tt.length&&(Ct.push(_e()),Ke(Tt.pop()))}let xe=!1;function Je(){xe||(ji(),xe=!0)}function Ze(){xe=!1}let kt=[];function Yt(l){l.group.updateMatrixWorld(!0);const t=l.mesh.position.clone();return l.group.localToWorld(t),t}function Wt(l){l.group.updateMatrixWorld(!0);const t=l.group.getWorldQuaternion(new be),i=new be().setFromEuler(l.mesh.rotation);return t.multiply(i)}function qi(l){A=l,window.addEventListener("keydown",t=>{t.target instanceof HTMLInputElement||t.target instanceof HTMLTextAreaElement||((t.key==="d"||t.key==="D")&&(St=!St,X=St,St?Qi():Ki()),St&&(t.key==="t"&&N?.setMode("translate"),t.key==="r"&&N?.setMode("rotate"),t.key==="s"&&N?.setMode("scale"),t.key==="Escape"&&Ht(),t.key==="z"&&(t.ctrlKey||t.metaKey)&&!t.shiftKey&&(t.preventDefault(),Xi()),t.key==="z"&&(t.ctrlKey||t.metaKey)&&t.shiftKey&&(t.preventDefault(),Ui())))}),console.log("[keychain-debug] Ready. Press D to toggle.")}function Qi(){Zt=!1,A.mainGroup.visible=!0,qe.copy(A.camera.position),Qe.copy(A.camera.rotation),A.renderer.domElement.style.pointerEvents="auto",A.renderer.domElement.parentElement.style.pointerEvents="auto",ut=new Ee({title:"🔧 Keychain Debug",width:320}),ut.domElement.style.cssText="position:fixed;top:10px;right:10px;z-index:99999;",ut.add({exportAll:nn},"exportAll").name("📋 Kopiuj wszystkie wartości");const l=A.selectables.map(e=>e.label);ut.add({el:"(brak)"},"el",["(brak)",...l]).name("🎯 Element").onChange(e=>{if(e==="(brak)")Ht();else{const c=A.selectables.find(b=>b.label===e);c&&ei(c)}}),ut.add({paused:Zt},"paused").name("⏸ Pauza fizyki").onChange(e=>{Zt=e}),N=new ui(A.camera,A.renderer.domElement),N.setSize(.8),N.setSpace("local"),A.scene.add(N.getHelper()),Y=new pi(A.camera,A.renderer.domElement),Y.enablePan=!0,Y.enableZoom=!0,Y.enableDamping=!1;const t=new Gt(0,0,-1).applyQuaternion(A.camera.quaternion);Y.target.copy(A.camera.position).add(t.multiplyScalar(10)),Y.update(),N.addEventListener("dragging-changed",e=>{Y&&(Y.enabled=!e.value),e.value?Je():Ze()}),A.renderer.domElement.addEventListener("click",ti);const i=document.createElement("div");i.id="debug-badge",i.textContent="🔧 DEBUG (D=zamknij, LMB=orbit, T/R/S=gizmo, ⌘Z/⌘⇧Z=undo/redo)",i.style.cssText="position:fixed;top:10px;left:50%;transform:translateX(-50%);background:#e53e3e;color:#fff;padding:6px 16px;border-radius:20px;font:600 13px/1 sans-serif;z-index:99999;pointer-events:none;",document.body.appendChild(i)}function Ki(){Zt=!1,Ht(),Ct.length=0,Tt.length=0,A.camera.position.copy(qe),A.camera.rotation.copy(Qe),A.renderer.domElement.style.pointerEvents="",A.renderer.domElement.parentElement.style.pointerEvents="",ut?.destroy(),ut=null,N&&(A.scene.remove(N.getHelper()),N.dispose(),N=null),Y&&(Y.dispose(),Y=null),A.renderer.domElement.removeEventListener("click",ti),document.getElementById("debug-badge")?.remove()}function ti(l){if(!St||!A||N?.dragging||l.target.closest(".lil-gui"))return;const t=A.renderer.domElement.getBoundingClientRect(),i=new gi((l.clientX-t.left)/t.width*2-1,-((l.clientY-t.top)/t.height)*2+1),e=new fi;e.setFromCamera(i,A.camera);const c=[];for(const v of A.selectables)v.group.traverse(x=>{x.isMesh&&c.push({mesh:x,entry:v})});const b=e.intersectObjects(c.map(v=>v.mesh),!1);if(b.length>0){const v=c.find(x=>x.mesh===b[0].object);if(v){ei(v.entry);return}}Ht()}function ei(l){Ht(),W=l;const t=Yt(l),i=Wt(l);if(kt=ii(l).map(C=>({entry:C,worldPosOffset:Yt(C).sub(t),initialParentWorldQuat:i.clone(),initialChildWorldQuat:Wt(C),initialParentScale:l.mesh.scale.clone(),initialChildScale:C.mesh.scale.clone(),savedMeshPos:C.mesh.position.clone(),savedMeshRot:C.mesh.rotation.clone(),savedMeshScale:C.mesh.scale.clone()})),wt=new mi(l.group,15023678),A.scene.add(wt),N?.attach(l.mesh),!ut)return;xt=ut.addFolder(`📦 ${l.label}`),xt.open();const c=l.mesh;function b(C){return C.onFinishChange(()=>{Je(),Ze()})}const v=xt.addFolder("Pozycja (mesh)");b(v.add(c.position,"x",-2,2,.001).name("x ← lewo / prawo →")),b(v.add(c.position,"y",-2,2,.001).name("y ↓ dół / góra ↑")),b(v.add(c.position,"z",-2,2,.001).name("z ← tył / przód →")),v.open();const x=xt.addFolder("Obrót (mesh)"),E={x:Bt(c.rotation.x),y:Bt(c.rotation.y),z:Bt(c.rotation.z)};b(x.add(E,"x",-180,180,.5).name("x°").onChange(C=>{c.rotation.x=ye(C)})),b(x.add(E,"y",-180,180,.5).name("y°").onChange(C=>{c.rotation.y=ye(C)})),b(x.add(E,"z",-180,180,.5).name("z°").onChange(C=>{c.rotation.z=ye(C)})),x.open();const z=xt.addFolder("Skala");b(z.add(c.scale,"x",.1,3,.01).name("X")),b(z.add(c.scale,"y",.1,3,.01).name("Y")),b(z.add(c.scale,"z",.1,3,.01).name("Z")),xt.add({copy:()=>en(l)},"copy").name("📋 Kopiuj ten element")}function Ji(){if(!W)return;const l=Yt(W),t=Wt(W);kt=ii(W).map(e=>({entry:e,worldPosOffset:Yt(e).sub(l),initialParentWorldQuat:t.clone(),initialChildWorldQuat:Wt(e),initialParentScale:W.mesh.scale.clone(),initialChildScale:e.mesh.scale.clone()}))}function Ht(){wt&&(A.scene.remove(wt),wt.dispose(),wt=null),N?.detach(),xt?.destroy(),xt=null,W=null,kt=[]}function Zi(){if(Y&&Y.update(),wt&&wt.update(),!W||!kt.length)return;const l=Yt(W),i=Wt(W).clone().multiply(tn(kt[0].initialParentWorldQuat));kt.forEach(e=>{const c=e.worldPosOffset.clone().applyQuaternion(i),b=l.clone().add(c);e.entry.group.updateMatrixWorld(!0),e.entry.mesh.position.copy(e.entry.group.worldToLocal(b));const v=i.clone().multiply(e.initialChildWorldQuat),E=e.entry.group.getWorldQuaternion(new be).clone().invert().multiply(v);e.entry.mesh.rotation.setFromQuaternion(E);const z=W.mesh.scale,C=e.initialParentScale;e.entry.mesh.scale.set(e.initialChildScale.x*(C.x>.001?z.x/C.x:1),e.initialChildScale.y*(C.y>.001?z.y/C.y:1),e.initialChildScale.z*(C.z>.001?z.z/C.z:1))})}function tn(l){return l.clone().invert()}const Bt=Ue.radToDeg,ye=Ue.degToRad;function ii(l){const t=A.selectables,i=t.indexOf(l),e=l.label;if(e.includes("Karabińczyk"))return t.filter((x,E)=>E!==i);const c=e.includes("Orange")?"Orange":e.includes("Żabka")||e.includes("zabka")?"Żabka":e.includes("HP")?"HP":e.includes("Wella")?"Wella":e.includes("Lidl")?"Lidl":e.includes("Selgros")?"Selgros":e.includes("Enea")?"Enea":null;if(!c)return[];const b=[];let v=!1;for(let x=0;x<t.length;x++){if(x===i){v=!0;continue}if(!v)continue;const E=t[x].label;(c==="Orange"?E.includes("Orange"):c==="Żabka"?E.includes("Żabka")||E.includes("zabka"):c==="HP"?E.includes("HP"):c==="Wella"?E.includes("Wella"):c==="Lidl"?E.includes("Lidl"):c==="Selgros"?E.includes("Selgros")||E.includes("Enea"):c==="Enea"&&E.includes("Enea"))&&b.push(t[x])}return b}function ni(l){const t=l.mesh.position,i=l.mesh.rotation,e=l.mesh.scale,c=l.group.position;return`${l.label}:
  mesh.pos: (${t.x.toFixed(3)}, ${t.y.toFixed(3)}, ${t.z.toFixed(3)})
  mesh.rot: (${Bt(i.x).toFixed(1)}°, ${Bt(i.y).toFixed(1)}°, ${Bt(i.z).toFixed(1)}°)
  mesh.scale: (${e.x.toFixed(2)}, ${e.y.toFixed(2)}, ${e.z.toFixed(2)})
  group.pos: (${c.x.toFixed(3)}, ${c.y.toFixed(3)}, ${c.z.toFixed(3)})`}function en(l){const t=ni(l);navigator.clipboard?.writeText(t),console.log("[debug]",t)}function nn(){const l=A.selectables.map(ni).join(`

`);navigator.clipboard?.writeText(l),console.log(`[debug] ALL:
`+l)}const L={LINEAR_DAMPING:2,ANGULAR_DAMPING:8,MOUSE_FORCE:1.6,INERTIA_FORCE:1.5},zt=[{name:"big",R:.27,tubeR:.03,scale:1,N:20,pivotTop:.19,pivotBot:.2,plane:"yz",rotY:0,meshRot:[102.2,-14.1,159.6],meshPos:[.614,.503,.175]},{name:"medium",R:.18,tubeR:.025,scale:.67,N:16,pivotTop:.2,pivotBot:.12,plane:"xy",rotY:0,meshRot:[39.4,10.1,121.8],meshPos:[1.008,1.04,-.297]},{name:"small",R:.12,tubeR:.02,scale:.44,N:12,pivotTop:.07,pivotBot:.1,plane:"yz",rotY:0,meshRot:[-112.2,22.5,75.6],meshPos:[1.117,1.001,-.44]}],$t=[{name:"zbig",R:.2,tubeR:.025,scale:.74,N:16,pivotTop:.14,pivotBot:.16,plane:"yz",rotY:0,meshRot:[-93.5,1,-135.5],meshPos:[-.714,.505,-.039]},{name:"zsmall",R:.14,tubeR:.02,scale:.52,N:12,pivotTop:.1,pivotBot:.07,plane:"xy",rotY:0,meshRot:[-125.8,29.2,-126.3],meshPos:[-.888,.812,-.186]}],Dt=[{name:"hbig",R:.2,tubeR:.025,scale:.74,N:16,pivotTop:.14,pivotBot:.14,plane:"yz",rotY:0,meshRot:[121.3,75.9,-131.7],meshPos:[-.139,-.261,.285]},{name:"hsmall",R:.14,tubeR:.02,scale:.52,N:12,pivotTop:.08,pivotBot:.06,plane:"xy",rotY:0,meshRot:[-64.8,21.5,19.2],meshPos:[.038,.146,.695]}],_t=[{name:"wbig",R:.2,tubeR:.025,scale:.74,N:16,pivotTop:.14,pivotBot:.14,plane:"yz",rotY:0,meshRot:[57.2,-34.8,54.4],meshPos:[.713,-.077,-.158]},{name:"wsmall",R:.14,tubeR:.02,scale:.52,N:12,pivotTop:.08,pivotBot:.06,plane:"xy",rotY:0,meshRot:[-143.4,-30.1,158.3],meshPos:[.53,.131,-.474]}],Pt=[{name:"lring",R:.14,tubeR:.02,scale:.52,N:12,pivotTop:.08,pivotBot:.06,plane:"xy",rotY:0,meshRot:[162.4,9.2,129.2],meshPos:[.916,.11,.017]}],Lt=[{name:"sbig",R:.2,tubeR:.025,scale:.74,N:16,pivotTop:.14,pivotBot:.14,plane:"yz",rotY:0,meshRot:[115,28.5,-127],meshPos:[-.627,.044,.055]},{name:"ssmall",R:.14,tubeR:.02,scale:.52,N:12,pivotTop:.08,pivotBot:.06,plane:"xy",rotY:0,meshRot:[4.7,57.5,-55.6],meshPos:[-.658,.183,.237]}],It=[{name:"ering",R:.14,tubeR:.02,scale:.52,N:12,pivotTop:.08,pivotBot:.06,plane:"yz",rotY:0,meshRot:[125,-88.5,-151.5],meshPos:[-1.365,.651,.728]}];let we=null,te=null;function cn(){return!we||!te?Promise.resolve():new Promise(l=>{ht.to(we,{progress:1,duration:.6,ease:"power3.in",onComplete:()=>{te&&(te.visible=!1),l()}})})}function dn(){const l=document.getElementById("global-three-container"),t=document.getElementById("keychain-container");if(!l||!t)return;const i=window.innerWidth<768,e=i?55:40,c=i?.95:1.47,b=i?1.2:1.8,v=i?.24:.34,x=new yi,E=new bi(e,window.innerWidth/window.innerHeight,.1,1e3),z=new vi({alpha:!0,antialias:!0});z.setSize(window.innerWidth,window.innerHeight),z.setPixelRatio(Math.min(window.devicePixelRatio,i?1.5:2)),z.toneMapping=xi,z.toneMappingExposure=.85,z.outputColorSpace=wi,z.shadowMap.enabled=!1,l.appendChild(z.domElement);const C=new Ei(z);x.environment=C.fromScene(new _i,.04).texture,C.dispose(),x.add(new Ci(16777215,.3));const B=new ge(16777215,3.5);B.position.set(-2,5,-8),B.castShadow=!1,x.add(B);const K=new ge(16772829,1.8);K.position.set(5,4,3),x.add(K);const At=new ge(14544639,.8);At.position.set(-4,2,2),x.add(At);const Et=new Ai(15023678,2.5,15,1.5);Et.position.set(2,-2,4),x.add(Et);const _=new q;x.add(_),E.position.z=10;const Mt=new Mi;Mt.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.7/");const w=new Ri;w.setDRACOLoader(Mt);const y="/assets/models/parts-opt/";let f,I,H;const pt=[],ee=[];let V,J;const mt=[],ie=[];let j,Z;const gt=[],ne=[];let tt,et;const it=[],se=[];let nt,st;const ft=[],oe=[];let ot,lt;const yt=[],le=[];let U,rt;const bt=[],re=[];let at,ct,Vt=!1;_.rotation.y=Math.PI;let Ce=Math.PI,Ae=0;const si=4<<16|0,Me=65536,Re=2<<16|0,ze=8<<16|0,$e=16<<16|0,De=32<<16|0,Pe=64<<16|0,Le=8388608;function oi(m){for(let S=0;S<28;S++){const P=S/28*Math.PI*2;f.createCollider(R.ColliderDesc.ball(.055).setTranslation(Math.cos(P)*.35,Math.sin(P)*.8+.05,0).setCollisionGroups(si).setDensity(2).setFriction(0).setRestitution(0),m)}}function li(m,n,d,r,g,u){for(let S=0;S<r;S++){const P=S/r*Math.PI*2,F=g==="xy"?Math.cos(P)*n:0,D=Math.sin(P)*n,O=g==="yz"?Math.cos(P)*n:0;f.createCollider(R.ColliderDesc.ball(d).setTranslation(F,D,O).setCollisionGroups(u).setDensity(1.5).setFriction(0).setRestitution(0),m)}f.createCollider(R.ColliderDesc.ball(n*.55).setTranslation(0,0,0).setCollisionGroups(u).setDensity(.1).setFriction(0).setRestitution(0),m)}R.init({}).then(()=>{f=new R.World({x:0,y:0,z:0});const m=.89,n=f.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(0,m,0));I=f.createRigidBody(R.RigidBodyDesc.dynamic().setTranslation(0,0,0).setLinearDamping(L.LINEAR_DAMPING).setAngularDamping(L.ANGULAR_DAMPING).setCcdEnabled(!0)),oi(I),f.createImpulseJoint(R.JointData.spherical({x:0,y:0,z:0},{x:0,y:m,z:0}),n,I,!0);function d(o,s,a,p,$){let M=s,T=a;o.forEach(G=>{const Rt=M.translation(),ci=Rt.y+T.y-G.pivotTop,di=Rt.x+(T.x||0),Jt=f.createRigidBody(R.RigidBodyDesc.dynamic().setTranslation(di,ci,0).setLinearDamping(L.LINEAR_DAMPING).setAngularDamping(L.ANGULAR_DAMPING).setCcdEnabled(!0));li(Jt,G.R,G.tubeR,G.N,G.plane,$),f.createImpulseJoint(R.JointData.spherical(T,{x:0,y:G.pivotTop,z:0}),M,Jt,!0),p.push(Jt),M=Jt,T={x:0,y:-G.pivotBot,z:0}})}d(zt,I,{x:-.15,y:-.69,z:.08},pt,Me),d($t,I,{x:.23,y:-.46,z:-.08},mt,Re);const r=.46;{const o=zt[zt.length-1],s=pt[pt.length-1],a=s.translation(),$=a.y+-o.pivotBot-r;V=f.createRigidBody(R.RigidBodyDesc.dynamic().setTranslation(a.x,$,0).setLinearDamping(L.LINEAR_DAMPING).setAngularDamping(L.ANGULAR_DAMPING).setCcdEnabled(!0)),f.createCollider(R.ColliderDesc.cuboid(.44,.47,.19).setCollisionGroups(Me).setDensity(1).setFriction(0).setRestitution(0),V),f.createImpulseJoint(R.JointData.spherical({x:0,y:-o.pivotBot,z:0},{x:0,y:r,z:0}),s,V,!0)}const g=.63;{const o=$t[$t.length-1],s=mt[mt.length-1],a=s.translation(),$=a.y+-o.pivotBot-g;j=f.createRigidBody(R.RigidBodyDesc.dynamic().setTranslation(a.x,$,0).setLinearDamping(L.LINEAR_DAMPING).setAngularDamping(L.ANGULAR_DAMPING).setCcdEnabled(!0)),f.createCollider(R.ColliderDesc.cuboid(.66,.63,.1).setCollisionGroups(Re).setDensity(1).setFriction(0).setRestitution(0),j),f.createImpulseJoint(R.JointData.spherical({x:0,y:-o.pivotBot,z:0},{x:0,y:g,z:0}),s,j,!0)}d(Dt,I,{x:.05,y:-.72,z:-.15},gt,ze);const u=.99;{const o=Dt[Dt.length-1],s=gt[gt.length-1],a=s.translation(),$=a.y+-o.pivotBot-u;tt=f.createRigidBody(R.RigidBodyDesc.dynamic().setTranslation(a.x,$,0).setLinearDamping(L.LINEAR_DAMPING).setAngularDamping(L.ANGULAR_DAMPING).setCcdEnabled(!0)),f.createCollider(R.ColliderDesc.cuboid(.42,.99,.05).setCollisionGroups(ze).setDensity(1).setFriction(0).setRestitution(0),tt),f.createImpulseJoint(R.JointData.spherical({x:0,y:-o.pivotBot,z:0},{x:0,y:u,z:0}),s,tt,!0)}d(_t,I,{x:-.25,y:-.52,z:.05},it,$e);const S=.42;{const o=_t[_t.length-1],s=it[it.length-1],a=s.translation(),$=a.y+-o.pivotBot-S;nt=f.createRigidBody(R.RigidBodyDesc.dynamic().setTranslation(a.x,$,0).setLinearDamping(L.LINEAR_DAMPING).setAngularDamping(L.ANGULAR_DAMPING).setCcdEnabled(!0)),f.createCollider(R.ColliderDesc.cuboid(.66,.42,.05).setCollisionGroups($e).setDensity(1).setFriction(0).setRestitution(0),nt),f.createImpulseJoint(R.JointData.spherical({x:0,y:-o.pivotBot,z:0},{x:0,y:S,z:0}),s,nt,!0)}d(Pt,it[0],{x:0,y:-_t[0].pivotBot,z:0},ft,De);const P=.88;{const o=Pt[Pt.length-1],s=ft[ft.length-1],a=s.translation(),$=a.y+-o.pivotBot-P;ot=f.createRigidBody(R.RigidBodyDesc.dynamic().setTranslation(a.x,$,0).setLinearDamping(L.LINEAR_DAMPING).setAngularDamping(L.ANGULAR_DAMPING).setCcdEnabled(!0)),f.createCollider(R.ColliderDesc.cuboid(.51,.88,.07).setCollisionGroups(De).setDensity(1).setFriction(0).setRestitution(0),ot),f.createImpulseJoint(R.JointData.spherical({x:0,y:-o.pivotBot,z:0},{x:0,y:P,z:0}),s,ot,!0)}d(Lt,I,{x:.15,y:-.65,z:.12},yt,Pe);const F=.784;{const o=Lt[Lt.length-1],s=yt[yt.length-1],a=s.translation(),$=a.y+-o.pivotBot-F;U=f.createRigidBody(R.RigidBodyDesc.dynamic().setTranslation(a.x,$,0).setLinearDamping(L.LINEAR_DAMPING).setAngularDamping(L.ANGULAR_DAMPING).setCcdEnabled(!0)),f.createCollider(R.ColliderDesc.cuboid(.46,.78,.06).setCollisionGroups(Pe).setDensity(1).setFriction(0).setRestitution(0),U),f.createImpulseJoint(R.JointData.spherical({x:0,y:-o.pivotBot,z:0},{x:0,y:F,z:0}),s,U,!0)}d(It,U,{x:0,y:-.784,z:0},bt,Le);const D=.582;{const o=It[It.length-1],s=bt[bt.length-1],a=s.translation(),$=a.y+-o.pivotBot-D;at=f.createRigidBody(R.RigidBodyDesc.dynamic().setTranslation(a.x,$,0).setLinearDamping(L.LINEAR_DAMPING).setAngularDamping(L.ANGULAR_DAMPING).setCcdEnabled(!0)),f.createCollider(R.ColliderDesc.cuboid(.58,.58,.04).setCollisionGroups(Le).setDensity(1).setFriction(0).setRestitution(0),at),f.createImpulseJoint(R.JointData.spherical({x:0,y:-o.pivotBot,z:0},{x:0,y:D,z:0}),s,at,!0)}const O=1+zt.length+$t.length+Dt.length+_t.length+Pt.length+Lt.length+It.length+7;let k=0;function h(){if(++k===O){Vt=!0,console.log(`[keychain] ${O} parts loaded — chain ready`);const o=[];H&&o.push({label:"Karabińczyk",group:H,mesh:H.children[0],body:I}),ee.forEach((s,a)=>s&&o.push({label:`Orange ring ${zt[a].name}`,group:s,mesh:s.children[0],body:pt[a]})),ie.forEach((s,a)=>s&&o.push({label:`Żabka ring ${$t[a].name}`,group:s,mesh:s.children[0],body:mt[a]})),ne.forEach((s,a)=>s&&o.push({label:`HP ring ${Dt[a].name}`,group:s,mesh:s.children[0],body:gt[a]})),se.forEach((s,a)=>s&&o.push({label:`Wella ring ${_t[a].name}`,group:s,mesh:s.children[0],body:it[a]})),oe.forEach((s,a)=>s&&o.push({label:`Lidl ring ${Pt[a].name}`,group:s,mesh:s.children[0],body:ft[a]})),le.forEach((s,a)=>s&&o.push({label:`Selgros ring ${Lt[a].name}`,group:s,mesh:s.children[0],body:yt[a]})),re.forEach((s,a)=>s&&o.push({label:`Enea ring ${It[a].name}`,group:s,mesh:s.children[0],body:bt[a]})),J&&o.push({label:"Orange charm",group:J,mesh:J.children[0],body:V}),Z&&o.push({label:"Żabka charm",group:Z,mesh:Z.children[0],body:j}),et&&o.push({label:"HP charm",group:et,mesh:et.children[0],body:tt}),st&&o.push({label:"Wella charm",group:st,mesh:st.children[0],body:nt}),lt&&o.push({label:"Lidl charm",group:lt,mesh:lt.children[0],body:ot}),rt&&o.push({label:"Selgros charm",group:rt,mesh:rt.children[0],body:U}),ct&&o.push({label:"Enea charm",group:ct,mesh:ct.children[0],body:at}),qi({scene:x,camera:E,renderer:z,mainGroup:_,selectables:o})}}w.load(y+"Carabiner.glb",o=>{H=new q,o.scene.rotation.y=-150*Math.PI/180,H.add(o.scene),_.add(H),h()}),w.load(y+"Orange.glb",o=>{J=new q;const s=o.scene,a=new zi({color:16777215,transmission:1,opacity:1,transparent:!0,roughness:.35,metalness:0,ior:1.5,thickness:2.5,attenuationColor:new je("#ff7700"),attenuationDistance:1.5,dispersion:0,side:vt});s.traverse(T=>{const G=T;G.isMesh&&(G.material=a)});const p=new $i(.5,.55,.22),$=new Di({color:16763904,roughness:.6,transparent:!0,opacity:.55,emissive:new je("#ff8800"),emissiveIntensity:.6,depthWrite:!1,side:vt}),M=new Pi(p,$);M.position.set(0,-.48,.05),s.add(M),s.position.set(1.025,1.52,-.586),s.rotation.set(-15.2*Math.PI/180,14.9*Math.PI/180,67.7*Math.PI/180),J.add(s),_.add(J),h()}),w.load(y+"Zabka.glb",o=>{Z=new q;const s=o.scene;s.traverse(a=>{const p=a;if(!p.isMesh)return;(Array.isArray(p.material)?p.material:[p.material]).forEach(M=>{M&&"roughness"in M&&(M.roughness=.85,M.metalness=0,M.side=vt)})}),s.position.set(-.829,1.561,-.096),s.rotation.set(-52.5*Math.PI/180,-32.8*Math.PI/180,-123.2*Math.PI/180),Z.add(s),_.add(Z),h()}),w.load(y+"HP.glb",o=>{et=new q;const s=o.scene;s.traverse(a=>{const p=a;if(!p.isMesh)return;(Array.isArray(p.material)?p.material:[p.material]).forEach(M=>{M&&(M.side=vt)})}),s.position.set(.038,1.23,.59),s.rotation.set(159.4*Math.PI/180,61.8*Math.PI/180,139.6*Math.PI/180),et.add(s),_.add(et),h()}),w.load(y+"Wella.glb",o=>{st=new q;const s=o.scene;s.traverse(a=>{const p=a;if(!p.isMesh)return;(Array.isArray(p.material)?p.material:[p.material]).forEach(M=>{M&&(M.side=vt)})}),s.position.set(.474,.609,-.394),s.rotation.set(53.8*Math.PI/180,-30.3*Math.PI/180,.6*Math.PI/180),st.add(s),_.add(st),h()}),w.load(y+"Lidl.glb",o=>{lt=new q;const s=o.scene;s.traverse(a=>{const p=a;if(!p.isMesh)return;(Array.isArray(p.material)?p.material:[p.material]).forEach(M=>{M&&(M.side=vt)})}),s.position.set(.86,1.074,.013),s.rotation.set(96*Math.PI/180,-34.6*Math.PI/180,111.6*Math.PI/180),lt.add(s),_.add(lt),h()}),w.load(y+"Selgros.glb",o=>{rt=new q;const s=o.scene;s.traverse(a=>{const p=a;if(!p.isMesh)return;(Array.isArray(p.material)?p.material:[p.material]).forEach(M=>{M&&(M.side=vt)})}),s.position.set(-.614,1.091,.189),s.rotation.set(-22.5*Math.PI/180,-8.5*Math.PI/180,-32*Math.PI/180),rt.add(s),_.add(rt),h()}),w.load(y+"Enea.glb",o=>{ct=new q;const s=o.scene;s.traverse(a=>{const p=a;if(!p.isMesh)return;(Array.isArray(p.material)?p.material:[p.material]).forEach(M=>{M&&(M.side=vt)})}),s.position.set(-1.329,1.244,.511),s.rotation.set(-46*Math.PI/180,15*Math.PI/180,-46*Math.PI/180),s.scale.setScalar(.8),ct.add(s),_.add(ct),h()}),w.load(y+"CircleBig.glb",o=>{function s(a,p,$){const M=new q,T=o.scene.clone(),G=Math.PI/180;if("meshRot"in a&&a.meshRot){const Rt=a.meshRot;T.rotation.set(Rt[0]*G,Rt[1]*G,Rt[2]*G)}else a.plane==="yz"&&(T.rotation.y=Math.PI/2),a.rotY&&(T.rotation.y+=a.rotY*G);T.position.set(a.meshPos[0],a.meshPos[1],a.meshPos[2]),T.scale.setScalar(a.scale),M.add(T),_.add(M),p[$]=M,h()}zt.forEach((a,p)=>s(a,ee,p)),$t.forEach((a,p)=>s(a,ie,p)),Dt.forEach((a,p)=>s(a,ne,p)),_t.forEach((a,p)=>s(a,se,p)),Pt.forEach((a,p)=>s(a,oe,p)),Lt.forEach((a,p)=>s(a,le,p)),It.forEach((a,p)=>s(a,re,p))})});const Ft=new Gt,ri=new Gt;function Ie(m,n){return Ft.set(m/window.innerWidth*2-1,-(n/window.innerHeight)*2+1,.5),Ft.unproject(E),Ft.sub(E.position).normalize(),ri.copy(E.position).add(Ft.multiplyScalar(-E.position.z/Ft.z))}const jt={progress:0};ht.to(jt,{progress:1,scrollTrigger:{trigger:"#intro",start:"top top",end:"20% top",scrub:.15}});const Se={progress:0};ht.to(Se,{progress:1,scrollTrigger:{trigger:"#intro",start:"25% top",endTrigger:"#ft-section",end:"bottom top",scrub:.15}});const ae={progress:0};we=ae,te=_,ht.to(ae,{progress:1,scrollTrigger:{trigger:"#process",start:"top bottom",end:"top 40%",scrub:.15}});const ke=document.getElementById("ft-section")||document.getElementById("keychain-anchor");let Be=0,Fe=0;i||window.addEventListener("mousemove",m=>{Be=m.clientX/window.innerWidth-.5,Fe=m.clientY/window.innerHeight-.5});let Ot=!1,dt=0,ce=0,de=!1,Xt=!1,he=0,Oe=0,Ge=0,Ne=0,Te=0;const ue=new Li,Ut=new Gt;function ai(){if(!Vt)return;ue.setFromObject(_);const m=ue.min,n=ue.max;let d=1/0,r=1/0,g=-1/0,u=-1/0;for(let F=0;F<8;F++){Ut.set(F&1?n.x:m.x,F&2?n.y:m.y,F&4?n.z:m.z),Ut.project(E);const D=(Ut.x*.5+.5)*innerWidth,O=(-Ut.y*.5+.5)*innerHeight;d=Math.min(d,D),r=Math.min(r,O),g=Math.max(g,D),u=Math.max(u,O)}const S=(g-d)*.2,P=(u-r)*.2;Oe=d-S,Ge=r-P,Ne=g+S,Te=u+P}const Ye=document.querySelector(".project-tile:last-child");function pe(m,n){if(!Vt)return!1;if(Ye){const d=Ye.getBoundingClientRect().bottom;if(n<d)return!1}return m>=Oe&&m<=Ne&&n>=Ge&&n<=Te}window.addEventListener("mousedown",m=>{X||pe(m.clientX,m.clientY)&&(Ot=!0,ce=m.clientX,dt=0,document.body.style.cursor="grabbing",m.preventDefault())}),window.addEventListener("mousemove",m=>{if(!X)if(Ot)dt=(m.clientX-ce)*.008,ce=m.clientX;else{const n=pe(m.clientX,m.clientY);n!==de&&(de=n,document.body.style.cursor=n?"grab":"")}}),window.addEventListener("mouseup",()=>{X||Ot&&(Ot=!1,document.body.style.cursor=de?"grab":"")}),window.addEventListener("wheel",m=>{if(!X&&pe(m.clientX,m.clientY))if(Math.abs(m.deltaX)>Math.abs(m.deltaY)){const n=m.deltaX*.003;Math.abs(n)>.001&&(m.preventDefault(),dt=n)}else m.ctrlKey&&m.preventDefault()},{passive:!1}),window.addEventListener("touchstart",m=>{X||m.touches.length===2&&(Xt=!0,he=(m.touches[0].clientX+m.touches[1].clientX)/2,dt=0)},{passive:!0}),window.addEventListener("touchmove",m=>{if(!X&&Xt&&m.touches.length===2){const n=(m.touches[0].clientX+m.touches[1].clientX)/2;dt=(n-he)*.006,he=n}},{passive:!0}),window.addEventListener("touchend",()=>{X||(Xt=!1)});let qt=0,Qt=0,Kt=.34,me=!0,We=0,He=!0;new IntersectionObserver(m=>{He=m[0].isIntersecting},{threshold:0}).observe(l);function Ve(){if(requestAnimationFrame(Ve),!Vt||!f||!He&&!X)return;const m=Date.now()*.001;if(!X){!Ot&&!Xt&&(dt*=.95,Math.abs(dt)<1e-4&&(dt=0));const n=jt.progress<=.3?0:Math.min((jt.progress-.3)/.2,1);_.rotation.y+=.0013*n+dt,Ae=_.rotation.y-Ce,Ce=_.rotation.y;const d=(Be*L.MOUSE_FORCE-Ae*L.INERTIA_FORCE)*(1/60),r=Fe*L.MOUSE_FORCE*(1/60);V&&V.applyImpulse({x:d,y:0,z:r},!0),j&&j.applyImpulse({x:d,y:0,z:r},!0)}{const n=.16366666666666668,d=-15*Math.PI/180,r={x:Math.sin(d)*n,y:-Math.cos(d)*n,z:.02*n};if(pt.forEach(h=>{const o=h.mass();h.applyImpulse({x:r.x*o,y:r.y*o,z:r.z*o},!0)}),V){const h=V.mass();V.applyImpulse({x:r.x*h,y:r.y*h,z:r.z*h},!0)}const g=30*Math.PI/180,u={x:Math.sin(g)*n,y:-Math.cos(g)*n,z:-.02*n};if(mt.forEach(h=>{const o=h.mass();h.applyImpulse({x:u.x*o,y:u.y*o,z:u.z*o},!0)}),j){const h=j.mass();j.applyImpulse({x:u.x*h,y:u.y*h,z:u.z*h},!0)}const S=5*Math.PI/180,P={x:Math.sin(S)*n,y:-Math.cos(S)*n,z:-.06*n};if(gt.forEach(h=>{const o=h.mass();h.applyImpulse({x:P.x*o,y:P.y*o,z:P.z*o},!0)}),tt){const h=tt.mass();tt.applyImpulse({x:P.x*h,y:P.y*h,z:P.z*h},!0)}const F=-25*Math.PI/180,D={x:Math.sin(F)*n,y:-Math.cos(F)*n,z:.04*n};if(it.forEach(h=>{const o=h.mass();h.applyImpulse({x:D.x*o,y:D.y*o,z:D.z*o},!0)}),nt){const h=nt.mass();nt.applyImpulse({x:D.x*h,y:D.y*h,z:D.z*h},!0)}if(ft.forEach(h=>{const o=h.mass();h.applyImpulse({x:D.x*o,y:D.y*o,z:D.z*o},!0)}),ot){const h=ot.mass();ot.applyImpulse({x:D.x*h,y:D.y*h,z:D.z*h},!0)}const O=15*Math.PI/180,k={x:Math.sin(O)*n,y:-Math.cos(O)*n,z:-.03*n};if(yt.forEach(h=>{const o=h.mass();h.applyImpulse({x:k.x*o,y:k.y*o,z:k.z*o},!0)}),U){const h=U.mass();U.applyImpulse({x:k.x*h,y:k.y*h,z:k.z*h},!0)}if(bt.forEach(h=>{const o=h.mass();h.applyImpulse({x:k.x*o,y:k.y*o,z:k.z*o},!0)}),at){const h=at.mass();at.applyImpulse({x:k.x*h,y:k.y*h,z:k.z*h},!0)}if(I){const h=I.mass();I.applyImpulse({x:0,y:-n*h,z:0},!0)}}if(f.timestep=1/60,f.step(),I&&H){const n=I.translation(),d=I.rotation();H.position.set(n.x,n.y,n.z),H.quaternion.set(d.x,d.y,d.z,d.w)}if(pt.forEach((n,d)=>{const r=ee[d];if(!r)return;const g=n.translation(),u=n.rotation();r.position.set(g.x,g.y,g.z),r.quaternion.set(u.x,u.y,u.z,u.w)}),V&&J){const n=V.translation();J.position.set(n.x,n.y,n.z);const d=pt[pt.length-1];if(d){const r=d.rotation();J.quaternion.set(r.x,r.y,r.z,r.w)}}if(mt.forEach((n,d)=>{const r=ie[d];if(!r)return;const g=n.translation(),u=n.rotation();r.position.set(g.x,g.y,g.z),r.quaternion.set(u.x,u.y,u.z,u.w)}),j&&Z){const n=j.translation();Z.position.set(n.x,n.y,n.z);const d=mt[mt.length-1];if(d){const r=d.rotation();Z.quaternion.set(r.x,r.y,r.z,r.w)}}if(gt.forEach((n,d)=>{const r=ne[d];if(!r)return;const g=n.translation(),u=n.rotation();r.position.set(g.x,g.y,g.z),r.quaternion.set(u.x,u.y,u.z,u.w)}),tt&&et){const n=tt.translation();et.position.set(n.x,n.y,n.z);const d=gt[gt.length-1];if(d){const r=d.rotation();et.quaternion.set(r.x,r.y,r.z,r.w)}}if(it.forEach((n,d)=>{const r=se[d];if(!r)return;const g=n.translation(),u=n.rotation();r.position.set(g.x,g.y,g.z),r.quaternion.set(u.x,u.y,u.z,u.w)}),nt&&st){const n=nt.translation();st.position.set(n.x,n.y,n.z);const d=it[it.length-1];if(d){const r=d.rotation();st.quaternion.set(r.x,r.y,r.z,r.w)}}if(ft.forEach((n,d)=>{const r=oe[d];if(!r)return;const g=n.translation(),u=n.rotation();r.position.set(g.x,g.y,g.z),r.quaternion.set(u.x,u.y,u.z,u.w)}),ot&&lt){const n=ot.translation();lt.position.set(n.x,n.y,n.z);const d=ft[ft.length-1];if(d){const r=d.rotation();lt.quaternion.set(r.x,r.y,r.z,r.w)}}if(yt.forEach((n,d)=>{const r=le[d];if(!r)return;const g=n.translation(),u=n.rotation();r.position.set(g.x,g.y,g.z),r.quaternion.set(u.x,u.y,u.z,u.w)}),U&&rt){const n=U.translation();rt.position.set(n.x,n.y,n.z);const d=yt[yt.length-1];if(d){const r=d.rotation();rt.quaternion.set(r.x,r.y,r.z,r.w)}}if(bt.forEach((n,d)=>{const r=re[d];if(!r)return;const g=n.translation(),u=n.rotation();r.position.set(g.x,g.y,g.z),r.quaternion.set(u.x,u.y,u.z,u.w)}),at&&ct){const n=at.translation();ct.position.set(n.x,n.y,n.z);const d=bt[bt.length-1];if(d){const r=d.rotation();ct.quaternion.set(r.x,r.y,r.z,r.w)}}if(!X){const n=jt.progress,d=Se.progress;let r,g,u;if(d>0&&ke){const o=ke.getBoundingClientRect();if(o.width>0&&o.height>0){const s=Ie(o.left+o.width/2,Math.min(o.top,window.innerHeight*.65)),a=.6*c;_.visible=!0,u=c,r=ht.utils.interpolate(0,s.x,d),g=ht.utils.interpolate(b,s.y+a,d)}else _.visible=!0,u=c,r=0,g=b}else if(n>=1)_.visible=!0,u=c,r=0,g=b;else{const o=t.getBoundingClientRect();if(o.width===0&&o.height===0){_.visible=!1,z.render(x,E);return}_.visible=!0;const s=Ie(o.left+o.width/2,o.top+o.height/2),a=.6*v;u=ht.utils.interpolate(v,c,n),r=ht.utils.interpolate(s.x,0,n),g=ht.utils.interpolate(s.y+a,b,n)}me?(qt=r,Qt=g,Kt=u,me=!1):(qt+=(r-qt)*.5,Qt+=(g-Qt)*.5,Kt+=(u-Kt)*.5);const S=Math.min(n*3,1),P=Math.sin(m*.8)*.04*S,F=Math.sin(m*.5)*.03*S,D=Math.cos(m*.7)*.02*S,O=ae.progress,k=O*5,h=1-O*.4;_.scale.setScalar(Kt*h),_.position.set(qt,Qt+P+k,0),_.rotation.x=F,_.rotation.z=D,O>=1?_.visible=!1:(n>0||O===0)&&(_.visible=!0),++We>=3&&(We=0,ai())}Zi(),z.render(x,E)}Ve(),window.addEventListener("resize",()=>{E.aspect=innerWidth/innerHeight,E.updateProjectionMatrix(),z.setSize(innerWidth,innerHeight),me=!0})}export{cn as forceKeychainExit,dn as initThreeScene};
