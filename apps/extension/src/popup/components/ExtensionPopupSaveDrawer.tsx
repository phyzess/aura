import { ArrowRight, Check, Folder, Layout, X } from "lucide-react";
import type React from "react";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { IconButton } from "@/components/ui/IconButton";
import { Input } from "@/components/ui/Input";
import { Select, type SelectOption } from "@/components/ui/Select";
import type { TabItem } from "../../types";

interface ExtensionPopupSaveDrawerProps {
	isOpen: boolean;
	sessionTabs: Partial<TabItem>[];
	checkedTabs: Set<number>;
	wsOptions: SelectOption[];
	colOptions: SelectOption[];
	targetWsId: string;
	targetColId: string;
	newWsName: string;
	newColName: string;
	onClose: () => void;
	onToggleTab: (index: number) => void;
	onToggleAllTabs: () => void;
	onChangeWorkspace: (id: string) => void;
	onChangeCollection: (id: string) => void;
	onChangeNewWorkspaceName: (name: string) => void;
	onChangeNewCollectionName: (name: string) => void;
	onConfirmSave: () => void;
}

export const ExtensionPopupSaveDrawer: React.FC<
	ExtensionPopupSaveDrawerProps
> = ({
	isOpen,
	sessionTabs,
	checkedTabs,
	wsOptions,
	colOptions,
	targetWsId,
	targetColId,
	newWsName,
	newColName,
	onClose,
	onToggleTab,
	onToggleAllTabs,
	onChangeWorkspace,
	onChangeCollection,
	onChangeNewWorkspaceName,
	onChangeNewCollectionName,
	onConfirmSave,
}) => {
	return (
		<Drawer
			isOpen={isOpen}
			onClose={onClose}
			className="h-[85%] bg-surface-elevated rounded-t-4xl shadow-soft flex flex-col overflow-hidden border-t border-surface"
		>
			<div className="px-6 pt-5 pb-2 shrink-0 flex items-center justify-between">
				<div>
					<h2 className="text-heading text-primary">Save Session</h2>
					<p className="text-xs text-secondary">
						Review tabs & choose destination
					</p>
				</div>
				<IconButton
					type="button"
					variant="subtle"
					size="sm"
					aria-label="Close save drawer"
					onClick={onClose}
					className="w-8 h-8 bg-surface-muted text-muted hover:text-secondary hover:bg-surface-elevated"
				>
					<X size={16} />
				</IconButton>
			</div>

			<div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-2">
				<div className="mb-6 space-y-3">
					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-1">
							<label className="text-label text-muted uppercase tracking-wider ml-1">
								Space
							</label>
							<Select
								options={wsOptions}
								value={targetWsId}
								onChange={(val) => {
									onChangeWorkspace(val);
									if (val === "new") onChangeCollection("new");
								}}
								icon={<Layout size={12} />}
								size="sm"
							/>
						</div>
						<div className="space-y-1">
							<label className="text-label text-muted uppercase tracking-wider ml-1">
								Collection
							</label>
							<Select
								options={colOptions}
								value={targetColId}
								onChange={onChangeCollection}
								icon={<Folder size={12} />}
								size="sm"
							/>
						</div>
					</div>

					{targetWsId === "new" && (
						<div className="animate-in fade-in slide-in-from-top-1">
							<div className="group bottom-shadow-wrapper bottom-shadow-lg bottom-shadow-focus rounded-xl">
								<Input
									type="text"
									placeholder="New Space Name"
									value={newWsName}
									onChange={(e) => onChangeNewWorkspaceName(e.target.value)}
									size="sm"
									className="relative z-10 text-xs font-semibold"
								/>
							</div>
						</div>
					)}
					{targetColId === "new" && (
						<div className="animate-in fade-in slide-in-from-top-1">
							<div className="group bottom-shadow-wrapper bottom-shadow-lg bottom-shadow-focus rounded-xl">
								<Input
									type="text"
									placeholder="New Collection Name"
									value={newColName}
									onChange={(e) => onChangeNewCollectionName(e.target.value)}
									size="sm"
									className="relative z-10 text-xs font-semibold"
								/>
							</div>
						</div>
					)}
				</div>

				<div>
					<div className="flex items-center justify-between mb-2">
						<label className="text-label text-muted uppercase tracking-wider ml-1">
							Tabs to Save ({checkedTabs.size})
						</label>
						<Button
							type="button"
							variant="link"
							size="sm"
							onClick={onToggleAllTabs}
							className="text-label text-accent hover:opacity-80"
						>
							{checkedTabs.size === sessionTabs.length
								? "Unselect All"
								: "Select All"}
						</Button>
					</div>

					<div className="space-y-1.5">
						{sessionTabs.map((tab, idx) => {
							const isChecked = checkedTabs.has(idx);
							return (
								<div
									key={tab.url || idx}
									onClick={() => onToggleTab(idx)}
									className={`flex items-center gap-3 p-2 rounded-xl border transition-all cursor-pointer ${
										isChecked
											? "bg-surface-elevated border-surface-border"
											: "bg-transparent border-transparent opacity-60 hover:opacity-100 hover:bg-surface-muted"
									}`}
								>
									<div
										className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
											isChecked
												? "bg-accent border-accent text-on-accent"
												: "border-surface"
										}`}
									>
										{isChecked && <Check size={10} strokeWidth={4} />}
									</div>

									<div className="w-6 h-6 rounded bg-surface-elevated flex items-center justify-center shrink-0 overflow-hidden shadow-soft">
										<img
											src={tab.faviconUrl || ""}
											className="w-3.5 h-3.5"
											alt=""
											onError={(e) => {
												e.currentTarget.style.display = "none";
											}}
										/>
									</div>

									<div className="min-w-0 flex-1">
										<div
											className={`text-xs font-semibold truncate ${
												isChecked ? "text-primary" : "text-secondary"
											}`}
										>
											{tab.title}
										</div>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			</div>

			<div className="px-6 py-4 border-t-2 border-surface-border bg-surface-elevated">
				<Button
					onClick={onConfirmSave}
					disabled={checkedTabs.size === 0}
					fullWidth
				>
					<span>Save {checkedTabs.size} Tabs</span>
					<ArrowRight size={16} />
				</Button>
			</div>
		</Drawer>
	);
};
