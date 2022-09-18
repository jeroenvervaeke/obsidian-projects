import { addIcon, Plugin, TFolder } from "obsidian";
import { ProjectsView, VIEW_TYPE_PROJECTS } from "./view";

import isoWeek from "dayjs/plugin/isoWeek";
import localizedFormat from "dayjs/plugin/localizedFormat";
import dayjs from "dayjs";
import { registerFileEvents } from "./lib/stores/file-index";
import { CreateWorkspaceModal } from "./modals/create-workspace-modal";
import { settings } from "./lib/stores/settings";
import { app, plugin } from "./lib/stores/obsidian";
import produce from "immer";

dayjs.extend(isoWeek);
dayjs.extend(localizedFormat);

export type ViewType = string;

export interface ViewDefinition {
	name: string;
	id: string;
	type: ViewType;
	config: Record<string, any>;
}

export interface WorkspaceDefinition {
	name: string;
	id: string;
	path: string;
	recursive: boolean;
	views: ViewDefinition[];
	noteTemplate: string;
	templateFolder: string;
}

export interface ProjectsPluginSettings {
	lastWorkspaceId?: string | undefined;
	lastViewId?: string | undefined;
	workspaces: WorkspaceDefinition[];
}

export const DEFAULT_SETTINGS: Partial<ProjectsPluginSettings> = {
	workspaces: [],
};

export default class ProjectsPlugin extends Plugin {
	// @ts-ignore
	unsubscribeSettings: Unsubscriber;

	async onload() {
		this.registerView(
			VIEW_TYPE_PROJECTS,
			(leaf) => new ProjectsView(leaf, this)
		);

		this.registerEvent(
			this.app.workspace.on("file-menu", (menu, file) => {
				if (file instanceof TFolder) {
					menu.addItem((item) => {
						item.setTitle("Create new workspace in folder")
							.setIcon("folder-plus")
							.onClick(async () => {
								new CreateWorkspaceModal(
									this.app,
									(workspace) => {
										settings.update((state) => {
											return produce(state, (draft) => {
												draft.workspaces.push(
													workspace
												);
												return draft;
											});
										});
									},
									{
										name: file.name,
										path: file.path,
									}
								).open();
							});
					});
				}
			})
		);

		app.set(this.app);
		plugin.set(this);
		settings.set(
			Object.assign({}, DEFAULT_SETTINGS, await this.loadData())
		);

		this.unsubscribeSettings = settings.subscribe((value) => {
			this.saveData(value);
		});

		this.addCommand({
			id: "show-projects",
			name: "Show Projects",
			callback: async () => {
				this.activateView();
			},
		});

		this.addCommand({
			id: "create-workspace",
			name: "Create new workspace",
			callback: async () => {
				new CreateWorkspaceModal(this.app, (workspace) => {
					settings.update((state) => {
						return produce(state, (draft) => {
							draft.workspaces.push(workspace);
							return draft;
						});
					});
				}).open();
			},
		});

		this.addIcons();

		registerFileEvents(this);
	}

	async onunload() {
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_PROJECTS);

		this.unsubscribeSettings();
	}

	async activateView() {
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_PROJECTS);

		await this.app.workspace.getLeaf(true).setViewState({
			type: VIEW_TYPE_PROJECTS,
			active: true,
		});

		const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_PROJECTS);

		if (leaves[0]) {
			this.app.workspace.revealLeaf(leaves[0]);
		}
	}

	addIcons() {
		addIcon(
			"text",
			`<g transform="matrix(1,0,0,1,2,2)"><path d="M20,32L28,32L28,24L41.008,24L30.72,72L20,72L20,80L52,80L52,72L42.992,72L53.28,24L68,24L68,32L76,32L76,16L20,16L20,32Z" /></g>`
		);
	}
}
