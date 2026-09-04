import { getStableDeviceId } from "./device";

describe("getStableDeviceId", () => {
  it("returns the same browser identifier across logins", () => {
    const first = getStableDeviceId();
    const second = getStableDeviceId();

    expect(first).toMatch(/^web-/);
    expect(second).toBe(first);
  });
});
