import {
	AlertCircle,
	ArrowRight,
	Check,
	FileJson,
	FolderOpen,
	Layers,
	UploadCloud,
	X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { IconButton } from "@/components/ui/IconButton";
import { Select, type SelectOption } from "@/components/ui/Select";
import { TextField } from "@/components/ui/TextField";
import type { Collection, Workspace } from "@/types";

interface ImportModalProps {
	isOpen: boolean;
	onClose: () => void;
	workspaces: Workspace[];
	collections: Collection[];
	onImport: (
		fileContent: string,
		targetWorkspaceId: string | "new",
		newWorkspaceName: string | undefined,
		targetCollectionId: string | "new",
		newCollectionName: string | undefined,
	) => Promise<void>;
}

export const ImportModal: React.FC<ImportModalProps> = ({
	isOpen,
	onClose,
	workspaces,
	collections,
	onImport,
}) => {
	const [step, setStep] = useState<1 | 2>(1);
	const [file, setFile] = useState<File | null>(null);
	const [fileContent, setFileContent] = useState<string>("");
	const [error, setError] = useState<string | null>(null);
	const [isImporting, setIsImporting] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const [targetWorkspaceId, setTargetWorkspaceId] = useState<string>("new");
	const [newWorkspaceName, setNewWorkspaceName] = useState("Imported Space");

	const [targetCollectionId, setTargetCollectionId] = useState<string>("new");
	const [newCollectionName, setNewCollectionName] =
		useState("My Imported Tabs");

	const [destinationMode, setDestinationMode] = useState<
		| "NEW_SPACE_NEW_COLLECTION"
		| "EXISTING_SPACE_NEW_COLLECTION"
		| "EXISTING_SPACE_EXISTING_COLLECTION"
	>("NEW_SPACE_NEW_COLLECTION");

	useEffect(() => {
		if (!isOpen) {
			const timer = setTimeout(() => {
				setStep(1);
				setFile(null);
				setFileContent("");
				setError(null);
				setIsImporting(false);
				setTargetWorkspaceId("new");
				setNewWorkspaceName("Imported Space");
				setTargetCollectionId("new");
				setNewCollectionName("My Imported Tabs");
				setDestinationMode("NEW_SPACE_NEW_COLLECTION");
			}, 300);
			return () => clearTimeout(timer);
		}
	}, [isOpen]);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const selectedFile = e.target.files?.[0];
		if (selectedFile) {
			if (
				selectedFile.type !== "application/json" &&
				!selectedFile.name.endsWith(".json")
			) {
				setError("Please select a valid JSON file.");
				return;
			}
			setFile(selectedFile);
			setError(null);

			const reader = new FileReader();
			reader.onload = (event) => {
				try {
					const content = event.target?.result as string;
					const parsed = JSON.parse(content);
					if (!parsed.lists && !Array.isArray(parsed.lists)) {
						setError('Invalid Toby backup format. Could not find "lists".');
						return;
					}
					setFileContent(content);

					let defaultName =
						selectedFile.name.replace(/\.json$/i, "") || "My Imported Tabs";

					if (parsed.lists.length === 1 && parsed.lists[0].title) {
						defaultName = parsed.lists[0].title;
					}

					setNewCollectionName(defaultName);
					setNewWorkspaceName(defaultName);

					setStep(2);
				} catch (_err) {
					setError("Failed to parse JSON file.");
				}
			};
			reader.readAsText(selectedFile);
		}
	};

	const handleSubmit = async () => {
		if (!fileContent) return;

		setIsImporting(true);
		try {
			await onImport(
				fileContent,
				targetWorkspaceId,
				targetWorkspaceId === "new" ? newWorkspaceName : undefined,
				targetCollectionId,
				targetCollectionId === "new" ? newCollectionName : undefined,
			);
			onClose();
		} catch (e) {
			console.error(e);
			setError("Import failed. Please try again.");
			setIsImporting(false);
		}
	};

	const workspaceOptions: SelectOption[] = workspaces.map((w) => ({
		value: w.id,
		label: w.name,
	}));

	const currentWorkspaceCollections =
		targetWorkspaceId !== "new"
			? collections.filter((c) => c.workspaceId === targetWorkspaceId)
			: [];

	const collectionOptions: SelectOption[] = currentWorkspaceCollections.map(
		(c) => ({ value: c.id, label: c.name }),
	);

	const hasWorkspaces = workspaces.length > 0;
	const workspacesWithCollections = workspaces.filter((w) =>
		collections.some((c) => c.workspaceId === w.id),
	);
	const workspaceWithCollectionsOptions: SelectOption[] =
		workspacesWithCollections.map((w) => ({ value: w.id, label: w.name }));
	const canUseExistingSpaceExistingCollection =
		workspacesWithCollections.length > 0;

	return (
		<Dialog
			isOpen={isOpen}
			onClose={onClose}
			size="md"
			className="shadow-2xl border border-surface animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
		>
			<div className="p-6 border-b border-surface flex justify-between items-center bg-surface-elevated z-10">
				<div>
					<h3 className="text-xl font-bold text-primary">Import from Toby</h3>
					<p className="text-body text-secondary">
						Restore your tabs from backup
					</p>
				</div>
				<IconButton
					type="button"
					variant="subtle"
					size="sm"
					aria-label="Close import modal"
					onClick={onClose}
				>
					<X size={20} />
				</IconButton>
			</div>

			<div className="p-6 overflow-y-auto custom-scrollbar">
				{error && (
					<div className="mb-4 flex items-center gap-2 text-xs text-danger bg-danger-soft/70 border border-danger/20 rounded-xl px-3 py-2 animate-in slide-in-from-top-2">
						<AlertCircle size={16} />
						{error}
					</div>
				)}

				{step === 1 && (
					<div
						className="border-2 border-dashed border-surface rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-accent hover:bg-accent-soft/40 transition-all group"
						onClick={() => fileInputRef.current?.click()}
					>
						<input
							type="file"
							ref={fileInputRef}
							onChange={handleFileChange}
							accept=".json"
							className="hidden"
						/>
						<div className="w-16 h-16 rounded-full bg-accent-soft text-accent flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-accent group-hover:text-on-accent transition-all">
							<UploadCloud size={32} />
						</div>
						<p className="font-bold text-primary">Click to upload JSON</p>
						<p className="text-xs text-muted mt-2">
							Support Toby export format (.json)
						</p>
					</div>
				)}

				{step === 2 && (
					<div className="space-y-6">
						<div className="flex items-center gap-3 p-3 rounded-xl bg-success-soft/70 border border-success/20">
							<div className="w-10 h-10 rounded-lg flex items-center justify-center bg-success-soft text-success">
								<FileJson size={20} />
							</div>
							<div className="flex-1 min-w-0">
								<p className="font-bold text-primary truncate">{file?.name}</p>
								<p className="text-xs text-success flex items-center gap-1">
									<Check size={12} /> Ready to parse
								</p>
							</div>
							<Button
								type="button"
								variant="link"
								size="sm"
								onClick={() => {
									setStep(1);
									setFile(null);
								}}
								className="text-xs font-bold"
							>
								Change
							</Button>
						</div>

						<div className="space-y-5">
							<div className="space-y-3">
								<label className="block text-xs font-bold text-muted uppercase tracking-wider">
									1. Where to import
								</label>

								<div className="space-y-3">
									<div
										className={`rounded-2xl border-2 p-3 transition-all ${
											destinationMode === "NEW_SPACE_NEW_COLLECTION"
												? "bg-surface-elevated border-primary shadow-soft"
												: "bg-surface-muted border-transparent hover:bg-surface-muted/80"
										}`}
									>
										<button
											type="button"
											onClick={() => {
												setDestinationMode("NEW_SPACE_NEW_COLLECTION");
												setTargetWorkspaceId("new");
												setTargetCollectionId("new");
											}}
											className="w-full flex items-center justify-between text-left"
										>
											<div>
												<p className="text-sm font-semibold text-primary">
													New space &amp; new collection
												</p>
												<p className="text-xs text-secondary">
													Create a new space and a new collection for these
													tabs.
												</p>
											</div>
											{destinationMode === "NEW_SPACE_NEW_COLLECTION" && (
												<Check
													size={16}
													className="text-primary flex-shrink-0"
												/>
											)}
										</button>

										{destinationMode === "NEW_SPACE_NEW_COLLECTION" && (
											<div className="mt-3 space-y-3">
												<TextField
													label="Space"
													type="text"
													value={newWorkspaceName}
													onChange={(e) => setNewWorkspaceName(e.target.value)}
													size="md"
													placeholder="Enter Space Name"
												/>
												<TextField
													label="Collection"
													type="text"
													value={newCollectionName}
													onChange={(e) => setNewCollectionName(e.target.value)}
													size="md"
													placeholder="Enter Collection Name"
												/>
											</div>
										)}
									</div>

									<div
										className={`rounded-2xl border-2 p-3 transition-all ${
											destinationMode === "EXISTING_SPACE_NEW_COLLECTION"
												? "bg-surface-elevated border-primary shadow-soft"
												: "bg-surface-muted border-transparent hover:bg-surface-muted/80"
										} ${!hasWorkspaces ? "opacity-50 cursor-not-allowed" : ""}`}
									>
										<button
											type="button"
											onClick={() => {
												if (!hasWorkspaces) return;
												setDestinationMode("EXISTING_SPACE_NEW_COLLECTION");
												if (
													targetWorkspaceId === "new" &&
													workspaces.length > 0
												) {
													setTargetWorkspaceId(workspaces[0].id);
												}
												setTargetCollectionId("new");
											}}
											className="w-full flex items-center justify-between text-left"
											disabled={!hasWorkspaces}
										>
											<div>
												<p className="text-sm font-semibold text-primary">
													Existing space, new collection
												</p>
												<p className="text-xs text-secondary">
													Add a new collection into one of your existing spaces.
												</p>
											</div>
											{destinationMode === "EXISTING_SPACE_NEW_COLLECTION" && (
												<Check
													size={16}
													className="text-primary flex-shrink-0"
												/>
											)}
										</button>

										{destinationMode === "EXISTING_SPACE_NEW_COLLECTION" &&
											hasWorkspaces && (
												<div className="mt-3 space-y-3">
													<div>
														<label className="block text-[11px] font-semibold text-secondary mb-1 ml-0.5">
															Space
														</label>
														<Select
															options={workspaceOptions}
															value={targetWorkspaceId}
															onChange={(value) => {
																setTargetWorkspaceId(value);
																setTargetCollectionId("new");
															}}
															icon={<Layers size={14} />}
															placeholder="Choose a Space..."
															size="md"
														/>
													</div>
													<div>
														<TextField
															label="New collection"
															type="text"
															value={newCollectionName}
															onChange={(e) =>
																setNewCollectionName(e.target.value)
															}
															size="md"
															placeholder="Enter Collection Name"
														/>
													</div>
												</div>
											)}
									</div>

									<div
										className={`rounded-2xl border-2 p-3 transition-all ${
											destinationMode === "EXISTING_SPACE_EXISTING_COLLECTION"
												? "bg-surface-elevated border-primary shadow-soft"
												: "bg-surface-muted border-transparent hover:bg-surface-muted/80"
										} ${
											!canUseExistingSpaceExistingCollection
												? "opacity-50 cursor-not-allowed"
												: ""
										}`}
									>
										<button
											type="button"
											onClick={() => {
												if (!canUseExistingSpaceExistingCollection) return;
												setDestinationMode(
													"EXISTING_SPACE_EXISTING_COLLECTION",
												);
												const hasCollectionsForCurrent =
													targetWorkspaceId !== "new" &&
													collections.some(
														(c) => c.workspaceId === targetWorkspaceId,
													);
												if (!hasCollectionsForCurrent) {
													const firstWorkspace = workspacesWithCollections[0];
													setTargetWorkspaceId(firstWorkspace.id);
													const firstCollection = collections.find(
														(c) => c.workspaceId === firstWorkspace.id,
													);
													if (firstCollection) {
														setTargetCollectionId(firstCollection.id);
													}
												} else {
													const currentCollectionsForWorkspace =
														collections.filter(
															(c) => c.workspaceId === targetWorkspaceId,
														);
													if (
														currentCollectionsForWorkspace.length > 0 &&
														!currentCollectionsForWorkspace.some(
															(c) => c.id === targetCollectionId,
														)
													) {
														setTargetCollectionId(
															currentCollectionsForWorkspace[0].id,
														);
													}
												}
											}}
											className="w-full flex items-center justify-between text-left"
											disabled={!canUseExistingSpaceExistingCollection}
										>
											<div>
												<p className="text-sm font-semibold text-primary">
													Existing space &amp; existing collection
												</p>
												<p className="text-xs text-secondary">
													Put tabs into one of your existing collections.
												</p>
											</div>
											{destinationMode ===
												"EXISTING_SPACE_EXISTING_COLLECTION" && (
												<Check
													size={16}
													className="text-primary flex-shrink-0"
												/>
											)}
										</button>

										{destinationMode === "EXISTING_SPACE_EXISTING_COLLECTION" &&
											canUseExistingSpaceExistingCollection && (
												<div className="mt-3 space-y-3">
													<div>
														<label className="block text-[11px] font-semibold text-secondary mb-1 ml-0.5">
															Space
														</label>
														<Select
															options={workspaceWithCollectionsOptions}
															value={
																targetWorkspaceId === "new"
																	? workspaceWithCollectionsOptions[0]?.value ||
																		""
																	: targetWorkspaceId
															}
															onChange={(value) => {
																setTargetWorkspaceId(value);
																const firstCollection = collections.find(
																	(c) => c.workspaceId === value,
																);
																if (firstCollection) {
																	setTargetCollectionId(firstCollection.id);
																}
															}}
															icon={<Layers size={14} />}
															placeholder="Choose a Space..."
															size="md"
														/>
													</div>
													<div>
														<label className="block text-[11px] font-semibold text-secondary mb-1 ml-0.5">
															Collection
														</label>
														<Select
															options={collectionOptions}
															value={targetCollectionId}
															onChange={setTargetCollectionId}
															icon={<FolderOpen size={14} />}
															placeholder="Choose a Collection..."
															size="md"
														/>
													</div>
												</div>
											)}
									</div>
								</div>
							</div>

							<Button
								onClick={handleSubmit}
								disabled={isImporting}
								fullWidth
								className="mt-4 disabled:cursor-wait flex items-center justify-center gap-2"
							>
								{isImporting ? "Importing..." : "Start Import"}
								{!isImporting && <ArrowRight size={18} />}
							</Button>
						</div>
					</div>
				)}
			</div>
		</Dialog>
	);
};
