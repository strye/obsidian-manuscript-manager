import {WiredHTMLElement } from '../../dm.js';
import styles from "./my-field.style.css";
import html from './my-field.html';
const template = document.createElement('template');
template.innerHTML = html;

class MyField extends WiredHTMLElement {
	static get is() { return 'my-field'; }

	constructor() {
		super();
		this._label = '';
		this._value = '';
		this._oldValue = '';
		this._mode = "view";  // view, readonly, edit, input
		this._required = false;

		// Attach a shadow root to the element.
		const shadowRoot = this.attachShadow({mode: 'open'});
        this.shadowRoot.innerHTML = `<style>${styles}</style>${this.shadowRoot.innerHTML}`;
		shadowRoot.appendChild(template.content.cloneNode(true));
	}

	static get observedAttributes() {
		return ['field-label','field-value','field-mode','field-required'];
	}

	render() {
		this.shadowRoot.querySelector('#lblElm').innerText = this._label;
		this.shadowRoot.querySelector('#txtElm').innerText = this._value;
		this._renderEditor();

		this.shadowRoot.querySelector('#dView').classList.toggle('hidden',(this._mode==='edit'||this._mode==='input'));
		this.shadowRoot.querySelector('#icoEdit').classList.toggle('hidden',(['edit','readonly','input'].includes(this._mode)));

		this.shadowRoot.querySelector('#dEdit').classList.toggle('hidden',(this._mode!=='edit'&&this._mode!=='input'));
		this.shadowRoot.querySelector('#icoSave').classList.toggle('hidden',(this._mode!=='edit'));
		this.shadowRoot.querySelector('#icoCanel').classList.toggle('hidden',(this._mode!=='edit'));

		this.shadowRoot.querySelector('#fldContainer').classList.toggle('required',(this._required));
		this.shadowRoot.querySelector('#fldContainer').classList.toggle('missing',(this._required && this._value?.length<=0));

	}
	_renderEditor() {
		this.shadowRoot.querySelector('#editElm').value = this._value;
	}
	clear() {
		this._oldValue = "";
		this._value = "";
		this.render();
	}
	save() {
		if (this._mode !== "input") this._mode = 'view';

		this._oldValue = this._value;
		let evtName = this.id+"Saved";
		this.emit(evtName, {value: this._value})
		this.render();
	}
	edit() {
		if (this._mode === "readonly") return;
		this._mode = 'edit';
		this.render();
	}
	cancel() {
		this._mode = 'view';
		this._value = this._oldValue;
		this.render();
	}
	blur() {
		let editElm = this.shadowRoot.querySelector('#editElm');
		if (editElm) editElm.blur();
	}

	_setupListeners() {
		let editElm = this.shadowRoot.querySelector('#editElm');
		if (editElm) {
			editElm.addEventListener('change', evt => {
				this._value = editElm.value;
			},this)
			editElm.addEventListener('blur', evt => {
				this._value = editElm.value;
				this.save();
			},this)
		}
	}
	setup() {
		this._setupListeners();
		this.shadowRoot.querySelector('#icoEdit').addEventListener('click', evt => {
			this.edit();
		})
		this.shadowRoot.querySelector('#icoSave').addEventListener('click', evt => {
			this.save();
		})
		this.shadowRoot.querySelector('#icoCanel').addEventListener('click', evt => {
			this.cancel();
		})
	}

	connectedCallback() {
		this._label = this.getAttribute('field-label');
		this._value = this.getAttribute('field-value');
		this._mode = this.getAttribute('field-mode') || "view";
		this._required = this._testBool(this.getAttribute('field-required'));

		this.setup();
		this.render();
	}

	attributeChangedCallback(attrName, oldVal, newVal) {
		if (attrName === 'field-label') { this._label = newVal; this.render(); }
		if (attrName === 'field-value') { this._value = newVal; this._oldValue = newVal; this.render(); }
		if (attrName === 'field-mode') { this._mode = newVal; this.render(); }
		if (attrName === 'field-required') { this._required = this._testBool(newVal); this.render(); }
	}
	_testBool(value) { return (value && value.toLocaleLowerCase() === 'true'); }

	get required(){ return this._required }
	set required(val){ this.setAtProp('field-required', val); }

	get mode(){ return this._mode }
	set mode(val){ this.setAtProp('field-mode', val); }

	get value(){ return this._value }
	set value(val){ this.setAtProp('field-value', val); }

	get label(){ return this._label; }
	set label(val){ this.setAtProp('field-label', val) }
}  // END MyField

customElements.define(MyField.is, MyField);
export default MyField;