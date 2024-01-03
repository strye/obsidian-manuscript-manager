import { ItemView } from "obsidian";
import { VIEW_TYPE_BOARD } from './board-view.js';


export const VIEW_TYPE_MANAGER = "manager-view";

export class ManagerView extends ItemView {
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
				a = list.createEl("a", { text: draft.label}),
				state = list.createEl("span",{text:"   ("+draft.state+")"});
				const viewData = {
					project: proj.frontmatter, 
					version: draft
				}

				a.addEventListener('click', evt => {
					self.activateView(viewData);
				}, this);
			})
			container.createEl("hr");
		});

		// container.createDiv({ text: `Image Set: ${this._settings.imageSet}` })
		// container.createEl("div", { text: `Return Count: ${this._settings.imageCount}` });
	}

	async onClose() {
		// Nothing to clean up.
	}
}