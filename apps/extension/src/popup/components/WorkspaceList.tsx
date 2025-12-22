import { Layout } from "lucide-react";
import type React from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import * as m from "@/paraglide/messages";
import type { Collection, Workspace } from "../../types";
import { PopupListItem } from "./PopupListItem";

interface WorkspaceListProps {
	workspaces: Workspace[];
	collections: Collection[];
	onWorkspaceClick: (id: string) => void;
}

export const WorkspaceList: React.FC<WorkspaceListProps> = ({
	workspaces,
	collections,
	onWorkspaceClick,
}) => {
	if (workspaces.length === 0) {
		return <EmptyState title={m.popup_workspace_list_empty_title()} />;
	}
	return (
		<div className="grid gap-2 animate-in slide-in-from-right-4 duration-300">
			{workspaces.map((ws) => {
				const colCount = collections.filter(
					(c) => c.workspaceId === ws.id,
				).length;
				return (
					<PopupListItem
						key={ws.id}
						icon={<Layout size={20} strokeWidth={2.5} />}
						title={ws.name}
						subtitle={m.popup_workspace_list_collections_subtitle({
							count: colCount,
						})}
						onClick={() => onWorkspaceClick(ws.id)}
					/>
				);
			})}
		</div>
	);
};
