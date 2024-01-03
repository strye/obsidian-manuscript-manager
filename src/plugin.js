import { Plugin } from "obsidian";
// import ManuManSettingTab from './ManuManSettingTab.js'
import { ManagerView, VIEW_TYPE_MANAGER } from './manager-view.js';
import { BoardView, VIEW_TYPE_BOARD } from './board-view.js';
import './elementImports.mjs'


const DEFAULT_SETTINGS = {
	libraryFolder: "_manuManager"
};

class ManuManManager extends Plugin {
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
};

module.exports = ManuManManager;

