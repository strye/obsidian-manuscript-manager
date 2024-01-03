'use strict';

var obsidian = require('obsidian');
var path = require('path');

function _interopNamespaceDefault(e) {
	var n = Object.create(null);
	if (e) {
		Object.keys(e).forEach(function (k) {
			if (k !== 'default') {
				var d = Object.getOwnPropertyDescriptor(e, k);
				Object.defineProperty(n, k, d.get ? d : {
					enumerable: true,
					get: function () { return e[k]; }
				});
			}
		});
	}
	n.default = e;
	return Object.freeze(n);
}

var path__namespace = /*#__PURE__*/_interopNamespaceDefault(path);

const VIEW_TYPE_BOARD = "board-view";

class BoardView extends obsidian.ItemView {
	constructor(leaf, settings = {}) {
		super(leaf);
		this.icon = "book-text";
		this._settings = settings;
		this._boardData = null;

		// Bind drag methods so we keep the proper context
		this.renameFile = this.renameFile.bind(this);
		this.renameFiles = this.renameFiles.bind(this);
	}
	getViewType() { return VIEW_TYPE_BOARD; }
	getDisplayText() { return "Story Board view"; }

	loadBoard(viewData) {
		// console.log('loadBoard');
		if (viewData) this._boardData = viewData;
		const metadata = this._boardData.project,
		draft = this._boardData.version;

		if (!metadata || !draft) return;
		// console.log('loadBoard has data')
		const container = this.containerEl.children[1];
		container.empty();

		const manuPath = draft.path,
		folder = this.app.vault.getAbstractFileByPath(manuPath);

		let scenes = [];
		if (folder instanceof obsidian.TFolder) {
			// console.log('loadBoard found folder')
			folder.children.forEach(file => {
				if (file instanceof obsidian.TFile) {
					// let tFile = this.app.vault.read(file),
					// yaml = parseYaml(tFile);
					// console.log(yaml);
					let cache = this.app.metadataCache.getFileCache(file);
					let scn = {frontmatter: cache.frontmatter };
					scn.fileName = file.basename;
					scn.filePath = file.path;
					scenes.push(scn);
					console.log(scn);
				}
			});
		}

		let page = container.createEl("board-page");
		page.loadScenes({
			label: draft.label,
			path: draft.path,
			state: draft.state,
			title: metadata.title
		}, scenes);
		page.subscribe("orderUpdated",this.renameFiles);
	}

	async renameFiles(data) {
		for (const scene of data.scenes) {
			await this.renameFile(scene);
		}

		console.log('renameFiles');
		this.loadBoard();
	}
	async renameFile(scene) {
		let file = this.app.vault.getAbstractFileByPath(scene.filePath);
		if (file instanceof obsidian.TFile) {
			let ext = path__namespace.extname(scene.filePath),
			fileTitle = path__namespace.basename(scene.filePath,ext),
			fileName = path__namespace.basename(scene.filePath),
			dir = path__namespace.dirname(scene.filePath),
			sceneNo = scene.sceneNumber.toString().padStart(3,"0"),
			newTitle = sceneNo+"_"+fileTitle.split('_')[1],
			newName = sceneNo+"_"+fileName.split('_')[1],
			newPath = path__namespace.join(dir, newName);
			// console.log(scene.filePath)

			await this.app.fileManager.processFrontMatter(file, fm =>{
				fm.alias = newTitle;
				fm.sceneLine.scene = scene.sceneNumber;
			});

			await this.app.fileManager.renameFile(file,newPath);
			// console.log(newPath)
		}
	}

	async onOpen() {
		// loadBoard called separately for setup
	}

	async onClose() {
		// Nothing to clean up.
	}
}

const VIEW_TYPE_MANAGER = "manager-view";

class ManagerView extends obsidian.ItemView {
	constructor(leaf, settings = {}) {
		super(leaf);
		this.icon = "library";
		this.navigation = true;

		this._settings = settings;
	}

	getViewType() { return VIEW_TYPE_MANAGER; }
	getDisplayText() { return "Manager view"; }

	async activateView(frontmatter) {
		const workspace = this.app.workspace;
		await workspace.detachLeavesOfType(VIEW_TYPE_BOARD);

		await workspace.getLeaf('tab').setViewState({
			type: VIEW_TYPE_BOARD,
			active: true,
		});

		await workspace.getLeavesOfType(VIEW_TYPE_BOARD)[0].view.loadBoard(frontmatter);

		workspace.revealLeaf(
			workspace.getLeavesOfType(VIEW_TYPE_BOARD)[0]
		);
	}



	async onOpen() {
		let self = this;
		const container = this.containerEl.children[1];
		container.empty();

		container.createEl("h2", { text: "Manuscripts" });

		let files = this.app.vault.getMarkdownFiles(),
		projects = files.filter(file => {
			const cache = this.app.metadataCache.getFileCache(file);
			return cache?.frontmatter?.manager === "manumanager";
		});

		projects.forEach(file => {
			const proj = this.app.metadataCache.getFileCache(file),
			versions = proj.frontmatter.drafts;

			container.createEl("h4", { text: proj.frontmatter.title });

			versions.forEach(draft => {
				let list = container.createEl("div",{text:'  - '}),
				a = list.createEl("a", { text: draft.label});
				list.createEl("span",{text:"   ("+draft.state+")"});
				const viewData = {
					project: proj.frontmatter, 
					version: draft
				};

				a.addEventListener('click', evt => {
					self.activateView(viewData);
				}, this);
			});
			container.createEl("hr");
		});

		// container.createDiv({ text: `Image Set: ${this._settings.imageSet}` })
		// container.createEl("div", { text: `Return Count: ${this._settings.imageCount}` });
	}

	async onClose() {
		// Nothing to clean up.
	}
}

class EventEmitter {
	constructor() {
		this.events = {};
	}
	
	emit(eventName, data) {
		const event = this.events[eventName];
		if( event ) {
			event.forEach(fn => {
				fn.call(null, data);
			});
		}
	}
	
	subscribe(eventName, fn) {
		if(!this.events[eventName]) {
			this.events[eventName] = [];
		}
	  
		this.events[eventName].push(fn);
		return () => {
			this.events[eventName] = this.events[eventName].filter(eventFn => fn !== eventFn);
		}
	}
}

class ElementHlpr extends EventEmitter {

    constructor(options) {
		super(options);
		let self = this;
		
		self._data = null;
		self._elm = null;
		self._children = [];      


		switch (typeof(options)) {
			case "string":
					self._elm = document.createElement(options);
				break;
			case "object":
                if (options instanceof Element || options instanceof HTMLDocument) {
                    self._elm = options;
                } else {
                    self._elm = document.createElement(options.name);
                    if (options.attrs) {
                        for (const atr in options.attrs) {
                            self.attr(atr, options.attrs[atr]);
                        }
                    }
                    if (options.styles) {
                        for (const styl in options.styles) {
                            self.style([styl], options.styles[styl]);
                        }
                    }
                }
				break;
		}

		// if (typeof(options) === "string") {
		// 	this._elm = document.createElement(options);
		// } else if (typeof(options) === "object") {

		// }

	}
	get elm() { return this._elm; }
	set elm(val) { this._elm = val; }
	
	clear() {
		this._elm.innerHTML = "";
		this._elm.innerText = "";
		return this;
	}

	attr(name, value) {
		this._elm.setAttribute(name, value);
		return this;
	}

	class(name, yesno) {
		this._elm.classList.toggle(name, yesno);
		return this;
	}

	style(name, value) {
		this._elm.style[name] = value;
		return this;
	}


	text(val) {
		this._elm.innerText = val;
		return this;
	}

	prop(name, value) {
		this._elm[name] = value;
		return this;
	}

	exec(method) {
		method(this);
		return this;
	}
	listen(eventName, action) {
		this._elm.addEventListener(eventName, action);
		return this;
	}

	append(elmName) {
		let elm = new ElementHlpr(elmName);
		this._children.push(elm);
		this._elm.appendChild(elm.elm);

		// Returns the new helper element
		return elm;
	}
	remove(target) {
		// if target is string getElementById
		if (typeof(options) === "string") {
			let elm2r = this._elm.getElementById(target);
			this._elm.removeChild(elm2r);
		}
		// if target is object
		if (typeof(options) === "object") {
			this._elm.removeChild(target);
		}

		return this;
	}
	byId(target) {
		let elm2r = this._elm.querySelector("#"+target);
		return new ElementHlpr(elm2r);
	}
	parent() {
		let elm2r = this._elm.parent;
		return new ElementHlpr(elm2r);
	}

	data(dataSet) { 
		var handler = {
			get: function(obj, prop) {
				return prop in obj ? obj[prop] : 37;
			}
		};
		this._data = new Proxy(dataSet, handler);

		return this;
	}


}

class BaseCollection extends EventEmitter {
    constructor() {
		super();
		this._myCollection = {};
    }
	get size() { return Object.keys(this._myCollection).length; }

	hasKey(key) {
        return ("undefined" !== typeof(this._myCollection[key]))
    }

	put(key, value) { 
		this._myCollection[key] = value;
		this.emit('update', { type:'add', rowId: key });
	}

	get(key) { return this._myCollection[key]; }

	clone(key) { 
		let row = this._myCollection[key],
		clone = {};
		for(var fld in row){
			clone[fld] = row[fld];
		}
		return clone;
	}

	remove(key) { 
		delete this._myCollection[key]; 
		this.emit('update', { type:'remove', rowId: key });
	}

	upsert(key, value) {
		for(var prop in value){
			this._myCollection[key][prop] = value[prop];
		}
	}

	clear() { 
		this._myCollection = {};
		this.emit('update', { type:'clear' });
	}

	forEach(callback){
		let collection = this._myCollection;
		let idx = 0;
		for(var prop in collection){
			callback(collection[prop], idx);
			idx++;
		}
	}
	iterator(callback, sort, filter) {
		let res = [];
		if (filter) res = this.filteredArray(filter.field, filter.criteria, sort);
		else res = this.toArray(sort);

		res.forEach((item, idx) => {
			callback(item, idx);
		});
	}

	toArray(sortField) {
		var collection = this._myCollection;
		var res = [];
		for(var prop in collection){
			res.push(collection[prop]);
		}
		if (sortField) {
			return res.sort(function(a,b) {
				if (a[sortField] < b[sortField]) return -1;
				if (a[sortField] > b[sortField]) return 1;
				return 0;
			});
		} else {
			return res;
		}
	}

	filteredArray(criteria, value, sortField) {
		var collection = this._myCollection;
		var res = [];
		for(var prop in collection){
			if (collection[prop][criteria] === value) {
				res.push(collection[prop]);
			}
		}
		if (sortField) {
			return res.sort(function(a,b) {
				if (a[sortField] < b[sortField]) return -1;
				if (a[sortField] > b[sortField]) return 1;
				return 0;
			});
		} else {
			return res;
		}
	}


}

class Collection extends BaseCollection {
    constructor(key = 'id', data = null) {
		super();

		this._myCollection = {};
		this._key = key;

		let self = this;
		this._rowHandler = {
			set: (target, key, val) => {
				let ov = target[key], res = false;
				if (key in target) { target[key] = val; res = true; }
				else { res = target.setItem(key, val); }
				self.emit('update', { type:'change', row: target[self._key], property: key, oldVal: ov, newVal: val });
				return res;
			},
		};

		if (data && data.length > 0) {
			data.forEach(itm => {
				let keyVal = itm[self._key];
				self._myCollection[keyVal] = new Proxy(itm, self._rowHandler);
			});
		}
    }

	put(key, value) { 
		this._myCollection[key] = new Proxy(value, this._rowHandler); 
		this.emit('update', { type:'add', row: key });
	}

}

/*
sample schema {
    'id': {name: 'id', type: "int", required: false, canEdit: false},
    'TI': {name: 'TI', type: "text", required: true, canEdit: true}
}
*/
class DataRow extends EventEmitter {
    constructor(schema, values = {}) {
		super();
		// Need to rebuild the schema to break reference?
		this._fieldSchema = schema;
		this._fieldValues = {};
		
        for (const fld in this._fieldSchema) {
			let field = {};
            field.value = values[fld] || null;
			field.originalValue = field.value;
			this._fieldValues[fld] = field;
        }
    }
    get schema() { return this._fieldSchema; }
    set schema(val) { this._fieldSchema = val; }
    get fields() { return this._fieldValues; }
    get values() {
        let res = {};
        for (const key in this._fieldSchema) {
            res[key] = this._fieldValues[key].value;
        }
        return res;     
    }

    updateRow(values, reset = false) {
        for (const fld in values) {
            this._fieldValues[fld].value = values[fld];
            if (reset) this._fieldValues[fld].originalValue = values[fld];
        }
    }
    updateField(field, value, reset = false) {
        this._fieldValues[field].value = value;
        if (reset) this._fieldValues[fld].originalValue = value;
	};
    resetRow() {
        for (const fld in this._fieldValues) {
            this._fieldValues[fld].value === this._fieldValues[fld].originalValue;
        }
    }
    resetField(field) {
        this._fieldValues[field].value === this._fieldValues[field].originalValue;
    }

    rowDirty(){
        let self = this, dirty = false;
        for (const fld in self._fieldValues) {
            let field = self._fieldValues[fld];
            if (field.value !== field.originalValue) dirty = true;
        }
        return dirty;
    }
    fieldDirty(field){
        return (this._fieldValues[field].value !== this._fieldValues[field].originalValue);
    }

	getField(name) { return this._fieldValues[name].value}
    select(fields) {
        if (Array.isArray(fields)) {
            let res = {};
            fields.forEach(fld => {
                res[fld] = this._fieldValues[fld].value;            
            });
            return res;     
        } else {return this.values;}
    }

    passFilter(filter) {
        let res = true;
        for(var prop in filter) {
            if (this._fieldValues[prop].value !== filter[prop]) res = false;
        }
        return res;
    }
}

class DataQuery {
    constructor(setCollection) {
        this._setColl = setCollection;
        this._selectFlds = false;
        this._setArray = [];
        this._resultKeys = {};
    }

    select(fields) {
        for (const key in this._setColl) {
            this._resultKeys[key] = true;
        }
        if (fields) this._selectFlds = fields;
        return this;
    }
    filter(criteria) {
        this._resultKeys = {};
		for(let key in this._setColl){
			if (this._setColl[key].passFilter(criteria)) {
				this._resultKeys[key] = true;
			}
		}
    }
    toArray() {
        this._setArray = [];
        for(const key in this._resultKeys){
			this._setArray.push(this._setColl[key].select(this._selectFlds));
		}
        return this;
    }
    sort(criteria) {
        // let crit = { field2: 1, field1: -1 }
        this._setArray.sort(function(a,b) {
            let sortFields = Object.keys(criteria);
            
            let retVal = null;
            sortFields.forEach((fld, idx) => {
                let dir = criteria[fld];
                if (retVal === null) {
                    if (a[fld] < b[fld]) { retVal=(-1 * dir); }
                    if (a[fld] > b[fld]) { retVal=(1 * dir); }    
                }
                if (retVal) return retVal;
                if ((idx+1) >= sortFields.length) retVal= 0;
                return retVal;
            });
            return retVal
        });
        return this;
    }
    limit(count) {
        let tmpAry = [];
        let max = (count < this._setArray.length) ? this._setArray.length : count;
        for (let index = 0; index < max; index++) {
            tmpAry.push(this._setArray[index]);
        }
        this._setArray = [];
        this._setArray = tmpAry;
    }
    result() {
		if (this._setArray.length <= 0 && Object.keys(this._resultKeys).length > 0) this.toArray();
        return this._setArray;
    }
    iterator(callback) {
		this._setArray.forEach((item, idx) => {
			callback(item, idx);
		});
    }
}

class DataSet {
    constructor(schema, data) {
        this._schema = schema;
        this._mySet = {};       
        
        if (data) {
            data.forEach(row => {
				let key = row[this._schema.keyField];
				this.put(key, row);
			},this);
		}
    }
    get keyField() { return this._schema.keyField }
    get schema() { return this._schema }
    get size() { return Object.keys(this._mySet).length }

    hasRow(key) { return ("undefined" !== typeof(this._mySet[key])) }
    
    // Create
    put(key, values) {
        this._mySet[key] = new DataRow(this._schema.fields, values);
    };

    // Read
    select(fields) {
        let query = new DataQuery(this._mySet);
        return query.select(fields);
    }
    getRow(key) { return (this.hasRow(key) ? this._mySet[key].values : {}) }
    getRowWithSchema(key) { return (this.hasRow(key) ? this._mySet[key] : {}) }

    // Update
    update(rows, upsert = true) {
        rows.forEach(row => {
            let key = row[this._schema.keyField];
            this.updateRow(key,row,upsert);
        }, this);
    }
    updateRow(key, value, upsert = false) {
        if (this.hasKey(key)) {
            this._mySet[key].updateRow(value);
        } else if (upsert) {
            this.put(key,value);
        }
    }

    // Delete
	delete(key) { delete this._mySet[key]; };
	clear() { this._mySet = {}; };

}

class WiredHTMLElement extends HTMLElement {
	constructor() {
		super();
		this._events = {};
	}
	emit(eventName, data) {
		const event = this._events[eventName];
		if( event ) {
			event.forEach(fn => {
				fn.call(null, data);
			});
		}
	}
	
	subscribe(eventName, fn) {
		if(!this._events[eventName]) {
			this._events[eventName] = [];
		}
	  
		this._events[eventName].push(fn);
		return () => {
			this._events[eventName] = this._events[eventName].filter(eventFn => fn !== eventFn);
		}
	}



	render() {}

	connectedCallback() {
		this.render();
	}

	setAtProp(attrName, val) {
		if (val) { this.setAttribute(attrName, val); }
		else { this.removeAttribute(attrName); }
	}

}  // END WiredHTMLElement

class DM {
	static Target(target) {
        let el = new ElementHlpr();
        if (target instanceof Element || target instanceof Document) {
            el.elm = target;
        } else {
            let trg = document.querySelector(target);
            el.elm = trg;    
        }
		return el;
	}
	static NewCollection() { 
		return new Collection(key, data)
	}
	static NewDataSet(dataSchema, data) {
		return new DataSet(dataSchema, data)
	}
}

var styles$1 = ":host {\r\n\tdisplay:block; \r\n\tbackground-color: var(--background-primary);\r\n\twidth: 100%;\r\n\theight: 100%;\r\n}\r\n\r\n#container {\r\n\twidth: 100%;\r\n\theight: 100%;\r\n\r\n\tdisplay:grid;\r\n\tgrid-template-columns: 1fr;\r\n\tgrid-template-rows: auto 1fr;\r\n\tgrid-gap: 0;\r\n}\r\n#title {grid-area: 1 / 1 ;height: 42px;}\r\n#board {grid-area: 2 / 1;text-align: left;overflow-y: auto;}\r\n\r\nh1 {margin: 8px;font-size:1.2em;}\r\n\r\n.story-board {\r\n\t/* background-color: burlywood; */\r\n\tbackground-image: url('data:image/jpeg;base64,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');\r\n\tbackground-repeat: repeat;\r\n} \r\n";

var html$1 = "<div id=\"container\">\r\n\t<div id=\"title\">\r\n\t\t<h1><span id=\"brdTitle\"></span>: Story Board (<span id=\"brdVersion\"></span>)\r\n\t\t</h1>\r\n\t</div>\r\n\r\n\t<div id=\"board\" class=\"story-board\"></div>\r\n</div>";

const template$1 = document.createElement('template');
template$1.innerHTML = html$1;

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
        shadowRoot.innerHTML = `<style>${styles$1}</style>`;
        shadowRoot.appendChild(template$1.content.cloneNode(true));
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
		order = 0;
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
			});

		});
		this.emit("orderUpdated",{scenes: eData});
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
		});

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
			.exec(s=>{s.elm.render();});

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

var styles = ":host {\r\n    display: inline-block;\r\n    text-align: center;\r\n    position: relative; \r\n}\r\n.card {\r\n    float: left;\r\n    position: relative;\r\n\twidth: 300px;\r\n\theight: 175px;\r\n    margin: 8px;\r\n    border: 2px solid #888;\r\n    border-radius: 2px; \r\n    background-color: #dedede;\r\n    color: #000;\r\n\r\n\tdisplay:grid;\r\n\tgrid-template-columns: 1fr;\r\n\tgrid-template-rows: auto 1fr;\r\n\tgrid-gap: 0;\r\n\r\n}\r\n#sceneTitle {grid-area: 1 / 1;height: 24px}\r\n#content {grid-area: 2 / 1;overflow-y: auto;}\r\n\r\n.scene-title {padding: 0 4px;font-weight: bold;}\r\n.scene-line {font-size: 0.8em;padding: 4px 4px;font-style: italic;}\r\n.scene-desc {font-size: 0.9em;padding: 2px 4px;}\r\n\r\n\r\n.clearfix{clear: both;}\r\n.hidden { display: none;}\r\n";

var html = "<div id=\"scene\" class=\"card\">\r\n\t<!-- <div class=\"card-bg\"></div> -->\r\n\t<div class=\"scene-title\" id=\"sceneTitle\"></div>\r\n\t<div id=\"content\">\r\n\t\t<div class=\"scene-line\" id=\"sceneLine\"></div>\r\n\t\t<div class=\"scene-desc\" id=\"sceneDesc\"></div>\r\n\t</div>\r\n</div>\r\n";

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

const DEFAULT_SETTINGS = {
	libraryFolder: "_manuManager"
};

class ManuManManager extends obsidian.Plugin {
	async onload() {
		await this.loadSettings();
		// this.addSettingTab(new ManuManSettingTab(this.app, this));

		this.addCommand({
			id: "show-projects",
			name: "Show Manuscript Projects",
			callback: () => {
				this.activateView();
			},
		});


		this.registerSideView();
		this.registerView(
			VIEW_TYPE_BOARD,
			(leaf) => new BoardView(leaf,this.settings)
		);
	}
	async registerSideView() {
		this.registerView(
			VIEW_TYPE_MANAGER,
			(leaf) => new ManagerView(leaf,this.settings)
		);
		// this.addRibbonIcon("library", "Activate view", () => {
		// 	this.activateView();
		// });
	}
	async activateView() {
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_MANAGER);
	
		await this.app.workspace.getRightLeaf(false).setViewState({
			type: VIEW_TYPE_MANAGER,
			active: true,
		});
		this.app.workspace.revealLeaf(
			this.app.workspace.getLeavesOfType(VIEW_TYPE_MANAGER)[0]
		);
	}


	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}
	async saveSettings() {
		await this.saveData(this.settings);
	}
}
module.exports = ManuManManager;
