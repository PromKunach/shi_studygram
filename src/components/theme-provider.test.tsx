import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { ThemeProvider } from "@/components/theme-provider";

vi.mock("next/navigation", () => ({
  useServerInsertedHTML: () => {},
}));

describe("ThemeProvider", () => {
  it("does not render a script tag", () => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
      }),
    });

    const { container } = render(
      <ThemeProvider>
        <div>child</div>
      </ThemeProvider>
    );

    expect(container.querySelector("script")).toBeNull();
  });
});
