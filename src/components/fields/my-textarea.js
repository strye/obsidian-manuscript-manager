import MyField from './my-field/my-field.js';

class MyTextarea extends MyField {
	static get is() { return 'my-textarea'; }

	constructor() {
		super();

        // extend shadow root of element.
        // this.shadowRoot.innerHTML = `<style>${styles}</style>${this.shadowRoot.innerHTML}`;
		this.shadowRoot.querySelector("#dEdit").innerHTML = '<textarea id="editElm"></textarea>';

	}
}  // END MyTextarea

customElements.define(MyTextarea.is, MyTextarea);
