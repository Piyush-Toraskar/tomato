import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginPage } from "./LoginPage";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { customer } from "../test/fixtures";

vi.mock("../hooks/useAuth", () => ({ useAuth: vi.fn() }));
vi.mock("../hooks/useToast", () => ({ useToast: vi.fn() }));

describe("LoginPage", () => {
  it("submits the supported login fields and routes a customer home", async () => {
    const login = vi.fn().mockResolvedValue(customer);
    const showToast = vi.fn();
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isInitialising: false,
      isAuthenticated: false,
      login,
      register: vi.fn(),
      refreshProfile: vi.fn(),
      logout: vi.fn(),
      logoutAll: vi.fn(),
    });
    vi.mocked(useToast).mockReturnValue({ showToast, dismissToast: vi.fn() });

    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<p>Home destination</p>} />
        </Routes>
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText("Email"), "asha@example.com");
    await user.type(screen.getByLabelText("Password"), "password@123");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith({
        email: "asha@example.com",
        password: "password@123",
      });
    });
    expect(await screen.findByText("Home destination")).toBeInTheDocument();
    expect(showToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Welcome back, Asha Sharma" }),
    );
  });

  it("shows a human-readable authentication error", async () => {
    const login = vi.fn().mockRejectedValue(new Error("Incorrect email or password."));
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isInitialising: false,
      isAuthenticated: false,
      login,
      register: vi.fn(),
      refreshProfile: vi.fn(),
      logout: vi.fn(),
      logoutAll: vi.fn(),
    });
    vi.mocked(useToast).mockReturnValue({ showToast: vi.fn(), dismissToast: vi.fn() });

    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText("Email"), "wrong@example.com");
    await user.type(screen.getByLabelText("Password"), "password@123");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Incorrect email or password.")).toBeInTheDocument();
  });
});
