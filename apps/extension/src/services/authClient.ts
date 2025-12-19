import { createAuthClient } from "better-auth/client";
import { API_BASE_URL } from "@/config/env";

export const authClient = createAuthClient({
	baseURL: API_BASE_URL,
});
