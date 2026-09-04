import {
  ApiError,
  apiRequest,
  clearSessionTokens,
  onSessionExpired,
  setSessionTokens,
} from "./client";

function jsonResponse(body: unknown, status = 200, headers: HeadersInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });
}

describe("API client", () => {
  afterEach(() => {
    clearSessionTokens();
    vi.unstubAllGlobals();
  });

  it("refreshes once and retries a protected request after access-token expiry", async () => {
    setSessionTokens({
      access_token: "expired-access",
      refresh_token: "refresh-one",
      token_type: "bearer",
    });

    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ detail: "Invalid or expired token" }, 401))
      .mockResolvedValueOnce(
        jsonResponse({
          access_token: "fresh-access",
          refresh_token: "refresh-two",
          token_type: "bearer",
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ id: 7, name: "Asha" }));

    vi.stubGlobal("fetch", fetchMock);

    const result = await apiRequest<{ id: number; name: string }>("/auth/me", {
      auth: true,
    });

    expect(result).toEqual({ id: 7, name: "Asha" });
    expect(fetchMock).toHaveBeenCalledTimes(3);

    const retryHeaders = new Headers(fetchMock.mock.calls[2]?.[1]?.headers);
    expect(retryHeaders.get("Authorization")).toBe("Bearer fresh-access");
    expect(localStorage.getItem("tomato.refresh-token")).toBe("refresh-two");
  });

  it("emits session expiry and clears stored tokens when refresh is rejected", async () => {
    setSessionTokens({
      access_token: "expired-access",
      refresh_token: "expired-refresh",
      token_type: "bearer",
    });

    const expiredListener = vi.fn();
    const unsubscribe = onSessionExpired(expiredListener);

    vi.stubGlobal(
      "fetch",
      vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(jsonResponse({ detail: "Invalid token" }, 401))
        .mockResolvedValueOnce(jsonResponse({ detail: "Session expired" }, 401)),
    );

    await expect(apiRequest("/orders", { auth: true })).rejects.toBeInstanceOf(ApiError);

    expect(expiredListener).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem("tomato.refresh-token")).toBeNull();
    unsubscribe();
  });

  it("turns validation errors into a safe human-readable API error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockResolvedValueOnce(
        jsonResponse(
          {
            detail: [
              {
                loc: ["body", "email"],
                msg: "Field required",
                type: "missing",
              },
            ],
          },
          422,
          { "X-Request-ID": "request-123" },
        ),
      ),
    );

    await expect(apiRequest("/auth/register", { method: "POST", body: {} })).rejects.toMatchObject({
      status: 422,
      detail: "Please check the highlighted fields.",
      requestId: "request-123",
    });
  });

  it("maps a network failure without exposing an internal exception", async () => {
    vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockRejectedValueOnce(new Error("ECONNRESET")));

    await expect(apiRequest("/restaurants")).rejects.toMatchObject({
      status: 0,
      detail: "We could not connect to the server.",
    });
  });
});
