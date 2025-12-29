import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import CharacterCount from "../CharacterCount";

describe("CharacterCount", () => {
  it("should display current and max character counts", () => {
    render(<CharacterCount current={150} max={500} />);

    expect(screen.getByText("150 / 500 characters")).toBeInTheDocument();
  });

  it("should format large numbers with locale string", () => {
    render(<CharacterCount current={1500} max={5000} />);

    expect(screen.getByText("1,500 / 5,000 characters")).toBeInTheDocument();
  });

  it("should apply normal styling when under 90% threshold", () => {
    render(<CharacterCount current={400} max={500} />);

    const element = screen.getByText("400 / 500 characters");
    expect(element).toHaveClass("character-count-normal");
    expect(element).not.toHaveClass("character-count-warning");
    expect(element).not.toHaveClass("character-count-error");
  });

  it("should apply warning styling when over 90% threshold", () => {
    render(<CharacterCount current={460} max={500} />);

    const element = screen.getByText("460 / 500 characters");
    expect(element).toHaveClass("character-count-warning");
    expect(element).not.toHaveClass("character-count-normal");
    expect(element).not.toHaveClass("character-count-error");
  });

  it("should apply error styling when hasError is true", () => {
    render(<CharacterCount current={300} max={500} hasError={true} />);

    const element = screen.getByText("300 / 500 characters");
    expect(element).toHaveClass("character-count-error");
    expect(element).not.toHaveClass("character-count-warning");
    expect(element).not.toHaveClass("character-count-normal");
  });

  it("should prioritize error styling over warning when both conditions are met", () => {
    render(<CharacterCount current={480} max={500} hasError={true} />);

    const element = screen.getByText("480 / 500 characters");
    expect(element).toHaveClass("character-count-error");
    expect(element).not.toHaveClass("character-count-warning");
  });

  it("should apply custom className when provided", () => {
    render(<CharacterCount current={100} max={500} className="custom-class" />);

    const element = screen.getByText("100 / 500 characters");
    expect(element).toHaveClass("custom-class");
    expect(element).toHaveClass("character-count");
  });

  it("should handle edge case when current equals max", () => {
    render(<CharacterCount current={500} max={500} />);

    expect(screen.getByText("500 / 500 characters")).toBeInTheDocument();
  });

  it("should handle edge case when current is 0", () => {
    render(<CharacterCount current={0} max={500} />);

    expect(screen.getByText("0 / 500 characters")).toBeInTheDocument();
  });

  it("should handle very large numbers", () => {
    render(<CharacterCount current={1234567} max={9999999} />);

    expect(
      screen.getByText("1,234,567 / 9,999,999 characters"),
    ).toBeInTheDocument();
  });
});
