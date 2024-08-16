import {DM, WiredHTMLElement } from '../../dm.js';
import styles from './scene-new.style.css';
import html from './scene-new.html';

const template = document.createElement('template');
template.innerHTML = html;

class SceneNew extends WiredHTMLElement {
	static get is() { return 'scene-new'; }

	constructor() {
		super();
		this._rootFolder = "";

        // extend shadow root of element.
		const shadowRoot = this.attachShadow({mode: 'open'});
        shadowRoot.innerHTML = `<style>${styles}</style>`;
        shadowRoot.appendChild(template.content.cloneNode(true));
}

	loadForm() {
		this.show();
		this.render();
	}
	clearForm() {
		this.render();
	}
	validateForm() {
		let sr = this.shadowRoot,
		title = sr.getElementById('ipTitle'),
		valid = true,
		errMessage = "";

		if (title?.value?.length<=0)  {
			valid= false;
			title.required = true;
			errMessage += errMessage.length>0 ? "<br />" : "";
			errMessage += "Title Required"
		} else {title.required = false;}
		if (errMessage.length>0) {
			sr.getElementById('errMsg').innerHTML = errMessage;
			sr.getElementById('errMsg').style.display = "block";
		} else {
			sr.getElementById('errMsg').innerHTML = "";
			sr.getElementById('errMsg').style.display = "none";
		}

		return valid;
	}
	saveForm() {
		const sr = this.shadowRoot,
		title = sr.getElementById('ipTitle').value,
		description = sr.getElementById('taDescription').value,
		sceneNo = sr.getElementById('ipSceneNo').value,
		day = sr.getElementById('ipDay').value,
		pov = sr.getElementById('ipPOV').value,
		where = sr.getElementById('ipWhere').value,
		when = sr.getElementById('ipWhen').value,
		conflict = sr.getElementById('taConflict').value,
		choice = sr.getElementById('taChoice').value,
		consequence = sr.getElementById('taConsequence').value;

		let scene = {
			alias: title,
			title: title
		};
		scene.desc = description ? description : title
		if (day && day.length>0) scene.day = day;
		if (pov && pov.length>0) scene.pov = pov;
		if (where && where.length>0) scene.where = where;
		if (when && when.length>0) scene.when = when;
		if (conflict && conflict.length>0) scene.conflict = conflict;
		if (choice && choice.length>0) scene.choice = choice;
		if (consequence && consequence.length>0) scene.consequence = consequence;

		//console.log(scene);
		this.emit('saveNewScene',scene);
		this.hide();
		this.clearForm();
	}
	render() {
	}

	connectedCallback() {
		super.connectedCallback();
		this.shadowRoot.getElementById('btnSave').addEventListener("click",e=>{
			if (this.validateForm()) {
				this.saveForm();
			}
		})

		this.render()
	}

}  // END SceneNew

customElements.define(SceneNew.is, SceneNew);
export default SceneNew;