import {WiredHTMLElement } from '../../dm.js';
import html from './my-select.html';
const template = document.createElement('template');
template.innerHTML = html;

class MySelect extends WiredHTMLElement {
	static get is() { return 'my-select'; }

	constructor() {
		super();
		this._label = '';
		this._value = "";
		this._optionTmplt = '<option value="${code}">${name}</option>';
		this._mode = "view";  // view, readonly, edit, input


		// Attach a shadow root to the element.
		const shadowRoot = this.attachShadow({mode: 'open'});
		shadowRoot.appendChild(template.content.cloneNode(true));
	}

	static get observedAttributes() {
		return ['field-label','field-value','field-mode'];
	}

	render() {
		this.shadowRoot.querySelector('#lblElm').innerText = this._label;
		let selElm = this.shadowRoot.querySelector('#selElm');
		selElm.value = this._value;

		if (this._mode === "readonly") selElm.disabled = true;
	}
	clear() {
		let selElm = this.shadowRoot.querySelector('#selElm');
		selElm.innerHTML = '<option value="">Empty List</option>'
		selElm.disabled = true;
	}


	load(data, value){
		let selElm = this.shadowRoot.querySelector('#selElm');
		data.sort(this.sortOptions);
		this.fillOptions(selElm,data);
		if (value) {selElm.value = value; this._value = value;}
		selElm.disabled = false;
	}



	sortOptions(a,b) {
		if (a.code < b.code) return -1;
		if (a.code > b.code) return 1;
		return 0;
	}
	fillOptions(selEl, data) {
		selEl.innerHTML = '<option value="">none</option>'
		const opStr = this._optionTmplt;
		let opts = data.map(obj => opStr.replace(/\${(\w+)}/g,(match, key) => obj[key])).join('')
		selEl.innerHTML += opts;
	}

	_moveSlottedOptions() {
		let selElm = this.shadowRoot.querySelector('#selElm');
        let children = this.childNodes;
        children.forEach(opt => {
			if (opt.nodeType === 1) selElm.append(opt)
        });
		if (children.length>0) selElm.disabled = false;
	}

	setup() {
		let selElm = this.shadowRoot.querySelector('#selElm');
		selElm.addEventListener('change', evt => {
			let evtName = this.id+"Selected";
			this._value = selElm.value
			// console.log(`${evtName}: ${this._value}`);
			this.emit(evtName, {value: this._value})
		},this)
		selElm.disabled = true;
	}
	connectedCallback() {
		this.setup();
		this._moveSlottedOptions();
		this._label = this.getAttribute('field-label');
		this._value = this.getAttribute('field-value');
		this._mode = this.getAttribute('field-mode') || "view";

		this.render()
	}

	attributeChangedCallback(attrName, oldVal, newVal) {
		if (attrName === 'field-label') { this._label = newVal; this.render(); }
		if (attrName === 'field-value') { this._value = newVal; this.render(); }
		if (attrName === 'field-mode') { this._mode = newVal; this.render(); }
	}

	get mode(){ return this._mode }
	set mode(val){ this.setAtProp('field-mode', val); }

	get optionTemplate(){ return this._optionTmplt }
	set optionTemplate(val){ this._optionTmplt = val; }

	get value(){ return this._value }
	set value(val){ this.setAtProp('field-value', val); }

	get label(){ return this._label; }
	set label(val){ this.setAtProp('field-label', val) }
}  // END MySelect

customElements.define(MySelect.is, MySelect);
export default MySelect;