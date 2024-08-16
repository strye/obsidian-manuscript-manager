import MyField from './my-field/my-field.js';

class MyCheckbox extends MyField {
	static get is() { return 'my-checkbox'; }

	constructor() {
		super();

        // extend shadow root of element.
        // this.shadowRoot.innerHTML = `<style>${styles}</style>${this.shadowRoot.innerHTML}`;
		this.shadowRoot.querySelector("#dEdit").innerHTML = '<input id="editElm" type="checkbox" />';

	}
	_renderEditor() {
		this.shadowRoot.querySelector('#editElm').checked = this._value;
		if (!this._value) this.shadowRoot.querySelector('#txtElm').innerText = "false";
	}
	_setupListeners() {
		let editElm = this.shadowRoot.querySelector('#editElm');
		if (editElm) editElm.addEventListener('change', evt => {
			this._value = editElm.checked;
		},this)
	}


}  // END MyCheckbox

customElements.define(MyCheckbox.is, MyCheckbox);
export default MyCheckbox;