import * as alertsSchema from "./alerts.schema";
import * as appSchema from "./app.schema";
import * as authSchema from "./auth.schema";

export const schema = {
	...authSchema,
	...appSchema,
	...alertsSchema,
} as const;
