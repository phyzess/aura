import { ArrowRight, Check, Folder, Layout, X } from "lucide-react";
import type React from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/ui/Card";
import { Drawer } from "@/components/ui/Drawer";
import { IconButton } from "@/components/ui/IconButton";
import { Select, type SelectOption } from "@/components/ui/Select";
import { TextField } from "@/components/ui/TextField";
import * as m from "@/paraglide/messages";
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
		<Drawer isOpen={isOpen} onClose={onClose} className="h-[85%]">
			<Card
				variant="elevated"
				radius="4xl"
				className="h-full bg-surface-elevated rounded-t-4xl shadow-soft flex flex-col overflow-hidden border-t border-surface"
			>
				<CardHeader className="px-6 pt-5 pb-2 shrink-0">
					<div>
						<h2 className="text-heading text-primary">
							{m.popup_save_drawer_title()}
						</h2>
						<p className="text-xs text-secondary">
							{m.popup_save_drawer_subtitle()}
						</p>
					</div>
					<IconButton
						type="button"
						variant="subtle"
						size="sm"
						aria-label={m.popup_save_drawer_close_aria()}
						onClick={onClose}
						className="w-8 h-8 bg-surface-muted text-muted hover:text-secondary hover:bg-surface-elevated"
					>
						<X size={16} />
					</IconButton>
				</CardHeader>

				<CardBody className="flex-1 overflow-y-auto custom-scrollbar px-6 py-2">
					<div className="mb-6 space-y-3">
						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-1">
								<label className="text-label text-muted uppercase tracking-wider ml-1">
									{m.popup_save_drawer_label_space()}
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
									{m.popup_save_drawer_label_collection()}
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
							<TextField
								type="text"
								placeholder={m.popup_save_drawer_placeholder_new_space()}
								value={newWsName}
								onChange={(e) => onChangeNewWorkspaceName(e.target.value)}
								size="sm"
								containerClassName="animate-in fade-in slide-in-from-top-1"
								inputClassName="text-xs font-semibold"
							/>
						)}
						{targetColId === "new" && (
							<TextField
								type="text"
								placeholder={m.popup_save_drawer_placeholder_new_collection()}
								value={newColName}
								onChange={(e) => onChangeNewCollectionName(e.target.value)}
								size="sm"
								containerClassName="animate-in fade-in slide-in-from-top-1"
								inputClassName="text-xs font-semibold"
							/>
						)}
					</div>

					<div>
						<div className="flex items-center justify-between mb-2">
							<label className="text-label text-muted uppercase tracking-wider ml-1">
								{m.popup_save_drawer_tabs_label({ count: checkedTabs.size })}
							</label>
							<Button
								type="button"
								variant="link"
								size="sm"
								onClick={onToggleAllTabs}
								className="text-label text-accent hover:opacity-80"
							>
								{checkedTabs.size === sessionTabs.length
									? m.popup_save_drawer_toggle_all_selected()
									: m.popup_save_drawer_toggle_all_unselected()}
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
				</CardBody>

				<CardFooter className="px-6 py-4 border-t-2 border-surface-border bg-surface-elevated">
					<Button
						onClick={onConfirmSave}
						disabled={checkedTabs.size === 0}
						fullWidth
					>
						<span>
							{m.popup_save_drawer_save_button({ count: checkedTabs.size })}
						</span>
						<ArrowRight size={16} />
					</Button>
				</CardFooter>
			</Card>
		</Drawer>
	);
};
