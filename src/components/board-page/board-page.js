import {DM, WiredHTMLElement } from '../../dm.js';
import styles from "./board-page.style.css";
import html from "./board-page.html";

const template = document.createElement('template');
template.innerHTML = html;

class BoardPage extends WiredHTMLElement {
    static get is() { return 'board-page'; }
    constructor() {
        super();

		this._draggedItem = null;

		// Bind drag methods so we keep the proper context
		this._handleDragStart = this._handleDragStart.bind(this);
		this._handleDrop = this._handleDrop.bind(this);
		this._handleDragOver = this._handleDragOver.bind(this);
		this._resetBorders = this._resetBorders.bind(this);
		this._setOrder = this._setOrder.bind(this);

        // Attach a shadow root to the element.
        const shadowRoot = this.attachShadow({mode: 'open'});
        shadowRoot.innerHTML = `<style>${styles}</style>`;
        shadowRoot.appendChild(template.content.cloneNode(true));
    }

	_handleDragStart(e) {
		this._draggedItem = e.target;
		e.dataTransfer.effectAllowed = 'move';
		e.dataTransfer.setData('text/html', this._draggedItem.innerHTML);
		//e.target.style.opacity = '0.5';
	}
	_handleDragOver(e) {
		e.preventDefault();
		e.dataTransfer.dropEffect = 'move';
		const targetItem = e.target;
		if (targetItem !== this._draggedItem && targetItem.classList.contains('drag-item')) {
			const boundingRect = targetItem.getBoundingClientRect();
			const offset = boundingRect.x + (boundingRect.width / 2);
			if (e.clientX - offset > 0) {
				targetItem.style.borderRight = 'solid 2px #000';
				targetItem.style.borderLeft = '';
			} else {
				targetItem.style.borderLeft = 'solid 2px #000';
				targetItem.style.borderRight = '';
			}
		} else {
			this._resetBorders();
		}
	}
	_handleDrop(e) {
		e.preventDefault();
		const targetItem = e.target;
		if (targetItem !== this._draggedItem && targetItem.classList.contains('drag-item')) {
			if (e.clientX > targetItem.getBoundingClientRect().left + (targetItem.offsetWidth / 2)) {
				targetItem.parentNode.insertBefore(this._draggedItem, targetItem.nextSibling);
			} else {
				targetItem.parentNode.insertBefore(this._draggedItem, targetItem);
			}
			this._setOrder();
		}
		this._draggedItem.style.opacity = '';
		this._draggedItem = null;
		this._resetBorders();
	}
	_resetBorders() {
		let sr = this.shadowRoot,
		cards= sr.querySelectorAll("scene-card");
		cards.forEach(card => {
			card.style.borderLeft = '';
			card.style.borderRight = '';
		});

	}
	_setOrder() {
		let eData = [],
		sr = this.shadowRoot,
		scenes= sr.querySelectorAll("scene-card"),
		order = 1;
		scenes.forEach(scene => {
			scene.sceneNumber = order;
			scene.sceneLine.scene = order;
			order++;
			//scene.render();

			eData.push({
				fileName: scene.fileName,
				filePath: scene.filePath,
				sceneNumber: scene.sceneNumber,
				sceneTitle: scene.sceneTitle,
			})

		});
		this.emit("orderUpdated",{scenes: eData})
	}


	refreshCards() {
		let sr = this.shadowRoot,
		cards= sr.querySelectorAll("scene-card");
		cards.forEach(card => { card.render(); });
	}
	loadScenes(project, scenes) {
		// console.log('loadScenes')
		let sr = this.shadowRoot,
		board= sr.getElementById('board'),
		sList = DM.Target(board).clear();

		sr.getElementById('brdTitle').innerText = project.title;
		sr.getElementById('brdVersion').innerText = project.label;

		scenes.sort((a,b) => {
			let retVal = 0, 
			orderA = a.fileName,
			orderB = b.fileName;
			// orderA = a.frontmatter.sceneLine.scene,
			// orderB = b.frontmatter.sceneLine.scene;
			if (orderA < orderB) retVal = -1;
			if (orderA > orderB) retVal = 1;
			return retVal;
		})

		scenes.forEach(scene => {
			const fm = scene.frontmatter;

			//sceneLine: Scene 1 | Day 0 | Dan from 1994 POV | Portland 
			sList.append('scene-card')
			.attr('draggable',true)
			.class("drag-item", true)
			.prop('fileName', scene.fileName)
			.prop('filePath', scene.filePath)
			.prop('sceneTitle',fm.alias)
			.prop('sceneDesc',fm.desc)
			.prop('storyPart',fm.manuscript.part)
			.prop('sceneNumber',fm.sceneLine.scene)
			.prop('sceneLine',fm.sceneLine)
			// .prop('sceneConflict',fm.title)
			// .prop('sceneChoice',fm.title)
			// .prop('sceneConsequence',fm.title)
			.exec(s=>{s.elm.render()})

		});
	}

	_setupBoardListeners() {
		let sr = this.shadowRoot,
		board= sr.getElementById('board');
		// const mouseListener = new AbortController();

		// Add event listeners for drag and drop events
		board.addEventListener('dragstart', this._handleDragStart);
		board.addEventListener('dragover', this._handleDragOver);
		board.addEventListener('drop', this._handleDrop);
	}


	connectedCallback() {
		this._setupBoardListeners();

		// this.shadowRoot.getElementById('refresh').addEventListener('click', e=>{
		// 	this.refreshCards();
		// });
	}

}  // END BoardPage

customElements.define(BoardPage.is, BoardPage);
