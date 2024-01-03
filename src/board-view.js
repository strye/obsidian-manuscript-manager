import { ItemView, TFolder, TFile } from "obsidian";
import * as path from 'path';

export const VIEW_TYPE_BOARD = "board-view";

export class BoardView extends ItemView {
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
		if (folder instanceof TFolder) {
			// console.log('loadBoard found folder')
			folder.children.forEach(file => {
				if (file instanceof TFile) {
					// let tFile = this.app.vault.read(file),
					// yaml = parseYaml(tFile);
					// console.log(yaml);
					let cache = this.app.metadataCache.getFileCache(file);
					let scn = {frontmatter: cache.frontmatter }
					scn.fileName = file.basename;
					scn.filePath = file.path;
					scenes.push(scn)
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
			await this.renameFile(scene)
		}

		console.log('renameFiles')
		this.loadBoard();
	}
	async renameFile(scene) {
		let file = this.app.vault.getAbstractFileByPath(scene.filePath);
		if (file instanceof TFile) {
			let ext = path.extname(scene.filePath),
			fileTitle = path.basename(scene.filePath,ext),
			fileName = path.basename(scene.filePath),
			dir = path.dirname(scene.filePath),
			sceneNo = scene.sceneNumber.toString().padStart(3,"0"),
			newTitle = sceneNo+"_"+fileTitle.split('_')[1],
			newName = sceneNo+"_"+fileName.split('_')[1],
			newPath = path.join(dir, newName);
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