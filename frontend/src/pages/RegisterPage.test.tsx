import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RegisterPage } from "./RegisterPage";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";

vi.mock("../hooks/useAuth", () => ({ useAuth: vi.fn() }));
vi.mock("../hooks/useToast", () => ({ useToast: vi.fn() }));

describe("RegisterPage", () => {
  it("registers only the backend-supported customer fields", async () => {
    const register = vi.fn().mockResolvedValue({
      id: 9,
      name: "Mira Patel",
      email: "mira@example.com",
      role: "CUSTOMER",
      email_verified: false,
      debug_verification_token: null,
    });
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isInitialising: false,
      isAuthenticated: false,
      login: vi.fn(),
      register,
      refreshProfile: vi.fn(),
      logout: vi.fn(),
      logoutAll: vi.fn(),
    });
    vi.mocked(useToast).mockReturnValue({ showToast: vi.fn(), dismissToast: vi.fn() });

    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/register"]}>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<p>Sign-in destination</p>} />
        </Routes>
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText("Name"), "Mira Patel");
    await user.type(screen.getByLabelText("Email"), "mira@example.com");
    await user.type(screen.getByLabelText("Password"), "password@123");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => {
      expect(register).toHaveBeenCalledWith({
        name: "Mira Patel",
        email: "mira@example.com",
        password: "password@123",
      });
    });
    expect(await screen.findByText("Sign-in destination")).toBeInTheDocument();
  });
});
