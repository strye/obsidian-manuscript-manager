import styles from "./scene-card.style.css";
import html from "./scene-card.html";

const template = document.createElement('template');
template.innerHTML = html;

class SceneCard extends HTMLElement {
    static get is() {
        return 'scene-card';
    }
    constructor() {
        super();

		this._fileBasename = "";
		this._filePath = "";
		this._storyPart = 0;
		this._sceneTitle = "";
		this._sceneDesc = "";

		this._sceneNumber = 0;
		this._sceneline = {};
		this._sceneStatus = 0; // 0=draft, 1=in progress, 2=review, 3=final

		this._sceneConflict = "";
		this._sceneChoice = "";
		this._sceneConsequence = "";

        // Attach a shadow root to the element.
        const shadowRoot = this.attachShadow({mode: 'open'});
        shadowRoot.innerHTML = `<style>${styles}</style>`;
        shadowRoot.appendChild(template.content.cloneNode(true));
    }

    render() {
		let sceneline = this.buildSceneLine();
		// console.log('card:render - '+sceneline);
        let titleEl = this.shadowRoot.querySelector("#sceneTitle");
        titleEl.innerText = this._sceneTitle;

		let sceneLine = this.shadowRoot.querySelector("#sceneLine");
        sceneLine.innerText = sceneline;

		let descEl = this.shadowRoot.querySelector("#sceneDesc");
        descEl.innerText = this._sceneDesc;
	}
	buildSceneLine() {
		// let res = "Scene "+this._sceneline.scene;
		// res+= " | Day "+this._sceneline.day;
		let res = "Day "+this._sceneline.day;
		res+= " | "+this._sceneline.pov+" POV";
		res+= " | "+this._sceneline.where;
		res+= " | "+this._sceneline.when;

		return res;
	}


    // connectedCallback() {
    //     this.render()
    // }

    get fileName(){ return this._fileBasename; }
    set fileName(val){ this._fileBasename = val; }
    get filePath(){ return this._filePath; }
    set filePath(val){ this._filePath = val; }

	get sceneTitle(){ return this._sceneTitle; }
    set sceneTitle(val){ this._sceneTitle = val; }
    get sceneDesc(){ return this._sceneDesc; }
    set sceneDesc(val){ this._sceneDesc = val; }
    get storyPart(){ return this._storyPart; }
    set storyPart(val){ this._storyPart = val; }

	get sceneLine(){ return this._sceneline; }
    set sceneLine(val){ this._sceneline = val; }
	get sceneNumber(){ return this._sceneNumber; }
    set sceneNumber(val){ this._sceneNumber = val; }
    get sceneStatus(){ return this._sceneStatus; }
    set sceneStatus(val){ this._sceneStatus = val; }

    get sceneConflict(){ return this._sceneConflict; }
    set sceneConflict(val){ this._sceneConflict = val; }
    get sceneChoice(){ return this._sceneChoice; }
    set sceneChoice(val){ this._sceneChoice = val; }
    get sceneConsequence(){ return this._sceneConsequence; }
    set sceneConsequence(val){ this._sceneConsequence = val; }

}  // END SceneCard

customElements.define(SceneCard.is, SceneCard);
