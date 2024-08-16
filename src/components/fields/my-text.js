import MyField from './my-field/my-field.js';

class MyText extends MyField {
	static get is() { return 'my-text'; }

	constructor() {
		super();

        // extend shadow root of element.
        // this.shadowRoot.innerHTML = `<style>${styles}</style>${this.shadowRoot.innerHTML}`;
		this.shadowRoot.querySelector("#dEdit").innerHTML = '<input type="text" id="editElm" />';

	}

	_setupListeners() {
		super._setupListeners();
		let editElm = this.shadowRoot.querySelector('#editElm');
		if (editElm) {
			editElm.addEventListener('keydown', evt => {
				if (evt.key === 'Enter'|| evt.keyCode === 13) { 
					this._value = editElm.value;
					this.save();
				}
			},this)
		}
	}



}  // END MyText

customElements.define(MyText.is, MyText);
export default MyText;