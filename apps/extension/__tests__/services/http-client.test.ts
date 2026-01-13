import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient, httpClient } from "@/services/http-client";

describe("HttpClient", () => {
	beforeEach(() => {
		httpClient.clear();
		apiClient.clear();
		vi.clearAllMocks();
	});

	describe("Request Deduplication", () => {
		it("should deduplicate concurrent identical requests", async () => {
			const mockResponse = new Response(JSON.stringify({ data: "test" }));
			const fetchSpy = vi
				.spyOn(global, "fetch")
				.mockResolvedValue(mockResponse);

			// Make 3 concurrent identical requests
			const promises = [
				httpClient.fetch("https://api.example.com/data"),
				httpClient.fetch("https://api.example.com/data"),
				httpClient.fetch("https://api.example.com/data"),
			];

			await Promise.all(promises);

			// Should only call fetch once
			expect(fetchSpy).toHaveBeenCalledTimes(1);
		});

		it("should not deduplicate different URLs", async () => {
			const mockResponse = new Response(JSON.stringify({ data: "test" }));
			const fetchSpy = vi
				.spyOn(global, "fetch")
				.mockResolvedValue(mockResponse);

			await Promise.all([
				httpClient.fetch("https://api.example.com/data1"),
				httpClient.fetch("https://api.example.com/data2"),
			]);

			expect(fetchSpy).toHaveBeenCalledTimes(2);
		});

		it("should not deduplicate different methods", async () => {
			const mockResponse = new Response(JSON.stringify({ data: "test" }));
			const fetchSpy = vi
				.spyOn(global, "fetch")
				.mockResolvedValue(mockResponse);

			await Promise.all([
				httpClient.fetch("https://api.example.com/data", { method: "GET" }),
				httpClient.fetch("https://api.example.com/data", { method: "POST" }),
			]);

			expect(fetchSpy).toHaveBeenCalledTimes(2);
		});

		it("should allow new request after previous completes", async () => {
			const mockResponse = new Response(JSON.stringify({ data: "test" }));
			const fetchSpy = vi
				.spyOn(global, "fetch")
				.mockResolvedValue(mockResponse);

			// First request
			await httpClient.fetch("https://api.example.com/data");

			// Second request after first completes
			await httpClient.fetch("https://api.example.com/data");

			expect(fetchSpy).toHaveBeenCalledTimes(2);
		});

		it("should track pending requests count", async () => {
			const mockResponse = new Response(JSON.stringify({ data: "test" }));
			vi.spyOn(global, "fetch").mockImplementation(
				() =>
					new Promise((resolve) => {
						setTimeout(() => resolve(mockResponse), 100);
					}),
			);

			expect(httpClient.getPendingCount()).toBe(0);

			const promise1 = httpClient.fetch("https://api.example.com/data1");
			expect(httpClient.getPendingCount()).toBe(1);

			const promise2 = httpClient.fetch("https://api.example.com/data2");
			expect(httpClient.getPendingCount()).toBe(2);

			await Promise.all([promise1, promise2]);
			expect(httpClient.getPendingCount()).toBe(0);
		});

		it("should clear all pending requests", () => {
			const mockResponse = new Response(JSON.stringify({ data: "test" }));
			vi.spyOn(global, "fetch").mockImplementation(
				() =>
					new Promise((resolve) => {
						setTimeout(() => resolve(mockResponse), 100);
					}),
			);

			httpClient.fetch("https://api.example.com/data1");
			httpClient.fetch("https://api.example.com/data2");

			expect(httpClient.getPendingCount()).toBe(2);

			httpClient.clear();
			expect(httpClient.getPendingCount()).toBe(0);
		});
	});

	describe("Convenience Methods", () => {
		it("should make GET request with get()", async () => {
			const mockData = { id: 1, name: "Test" };
			const mockResponse = new Response(JSON.stringify(mockData));
			const fetchSpy = vi
				.spyOn(global, "fetch")
				.mockResolvedValue(mockResponse);

			const result = await httpClient.get("https://api.example.com/data");

			expect(fetchSpy).toHaveBeenCalledWith(
				"https://api.example.com/data",
				expect.objectContaining({ method: "GET" }),
			);
			expect(result).toEqual(mockData);
		});

		it("should make POST request with post()", async () => {
			const mockData = { id: 1, name: "Test" };
			const postData = { name: "New Item" };
			const mockResponse = new Response(JSON.stringify(mockData));
			const fetchSpy = vi
				.spyOn(global, "fetch")
				.mockResolvedValue(mockResponse);

			const result = await httpClient.post(
				"https://api.example.com/data",
				postData,
			);

			expect(fetchSpy).toHaveBeenCalledWith(
				"https://api.example.com/data",
				expect.objectContaining({
					method: "POST",
					headers: expect.objectContaining({
						"Content-Type": "application/json",
					}),
					body: JSON.stringify(postData),
				}),
			);
			expect(result).toEqual(mockData);
		});
	});

	describe("API Client with Base URL", () => {
		it("should prepend base URL to relative paths", async () => {
			const mockResponse = new Response(JSON.stringify({ data: "test" }));
			const fetchSpy = vi
				.spyOn(global, "fetch")
				.mockResolvedValue(mockResponse);

			await apiClient.fetch("/api/user/me");

			expect(fetchSpy).toHaveBeenCalledWith(
				expect.stringContaining("/api/user/me"),
				undefined,
			);
		});

		it("should not prepend base URL to absolute URLs", async () => {
			const mockResponse = new Response(JSON.stringify({ data: "test" }));
			const fetchSpy = vi
				.spyOn(global, "fetch")
				.mockResolvedValue(mockResponse);

			await apiClient.fetch("https://other-api.com/data");

			expect(fetchSpy).toHaveBeenCalledWith(
				"https://other-api.com/data",
				undefined,
			);
		});
	});
});
