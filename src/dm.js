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

class QueryCollection extends BaseCollection {
    // constructor() {
	// 	super()
    // }

	queryArray(filter, sortField) {
		let collection = this._myCollection,
		res = [];
		for (const key in collection) {
			if (this._passFilter(collection[key], filter)) {
				res.push(collection[key]);
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

	_passFilter(row, filter) {
        let res = true;
        for(var prop in filter) {
            if (row[prop].value !== filter[prop]) res = false;
        }
        return res;
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

export { BaseCollection, Collection, DM, EventEmitter, QueryCollection, WiredHTMLElement };
