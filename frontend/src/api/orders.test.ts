import { createOrder } from "./orders";
import { clearSessionTokens, setSessionTokens } from "./client";

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
}

describe("orders API", () => {
  afterEach(() => {
    clearSessionTokens();
    vi.unstubAllGlobals();
  });

  it("sends the exact idempotency header expected by the backend", async () => {
    setSessionTokens({
      access_token: "access-token",
      refresh_token: "refresh-token",
      token_type: "bearer",
    });

    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      jsonResponse({
        id: 42,
        user_id: 7,
        restaurant_id: 3,
        total_amount: "249.00",
        status: "PLACED",
        created_at: "2026-09-03T12:00:00Z",
        updated_at: "2026-09-03T12:00:00Z",
        items: [],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await createOrder(
      {
        restaurant_id: 3,
        items: [{ menu_item_id: 11, quantity: 1 }],
      },
      "tomato-attempt-123",
    );

    const options = fetchMock.mock.calls[0]?.[1];
    const headers = new Headers(options?.headers);

    expect(headers.get("Idempotency-Key")).toBe("tomato-attempt-123");
    expect(headers.get("Authorization")).toBe("Bearer access-token");
    expect(options?.method).toBe("POST");
  });
});
