import { fireEvent, render, screen } from "@testing-library/react";
import App from "./App";

beforeEach(() => {
  window.localStorage.clear();
  document.body.removeAttribute("data-theme");
  document.documentElement.style.colorScheme = "";
});

test("renders the app and toggles the theme", () => {
  render(<App />);

  expect(
    screen.getByRole("heading", { name: /pii detector/i })
  ).toBeInTheDocument();

  const toggle = screen.getByRole("button", { name: /switch to light mode/i });

  expect(document.body).toHaveAttribute("data-theme", "dark");

  fireEvent.click(toggle);

  expect(document.body).toHaveAttribute("data-theme", "light");
  expect(window.localStorage.getItem("pii_detector_theme")).toBe("light");
  expect(
    screen.getByRole("button", { name: /switch to dark mode/i })
  ).toBeInTheDocument();
});
