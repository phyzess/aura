export type {
	DataEntity,
	DataLayer,
	DataLayerConfig,
	LocalDataLayer,
} from "./types";
export { DEFAULT_BATCH_SIZE } from "./types";
export {
	createServerDataLayer,
	createLocalDataLayer,
	wrapLocalDataLayerWithResult,
} from "./factory";
export type { ServerDataLayerDeps, LocalDataLayerDeps } from "./factory";

