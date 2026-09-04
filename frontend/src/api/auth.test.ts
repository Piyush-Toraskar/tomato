import { logoutCurrentDevice } from "./auth";
import { clearSessionTokens, setSessionTokens } from "./client";

describe("authentication API", () => {
  afterEach(() => {
    clearSessionTokens();
    vi.unstubAllGlobals();
  });

  it("clears the local session after logout", async () => {
    setSessionTokens({
      access_token: "access",
      refresh_token: "refresh",
      token_type: "bearer",
    });
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Logged out" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    await logoutCurrentDevice();

    expect(localStorage.getItem("tomato.refresh-token")).toBeNull();
  });
});
