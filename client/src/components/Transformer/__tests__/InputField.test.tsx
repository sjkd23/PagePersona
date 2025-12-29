import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import InputField from "../InputField";

describe("InputField", () => {
  const defaultProps = {
    mode: "url" as const,
    value: "",
    onModeChange: vi.fn(),
    onChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Mode Toggle", () => {
    it("should render InputModeToggle with correct props", () => {
      render(<InputField {...defaultProps} mode="text" />);

      expect(screen.getByText("URL")).toBeInTheDocument();
      expect(screen.getByText("Text")).toBeInTheDocument();
    });

    it("should call onModeChange when mode is changed", () => {
      const mockOnModeChange = vi.fn();
      render(<InputField {...defaultProps} onModeChange={mockOnModeChange} />);

      fireEvent.click(screen.getByText("Text"));
      expect(mockOnModeChange).toHaveBeenCalledWith("text");
    });

    it("should disable mode toggle when disabled prop is true", () => {
      render(<InputField {...defaultProps} disabled={true} />);

      const urlButton = screen.getByText("URL");
      const textButton = screen.getByText("Text");
      expect(urlButton).toBeDisabled();
      expect(textButton).toBeDisabled();
    });
  });

  describe("URL Mode", () => {
    it("should render TextInput when mode is url", () => {
      render(
        <InputField {...defaultProps} mode="url" value="https://test.com" />,
      );

      const input = screen.getByDisplayValue("https://test.com");
      expect(input).toBeInTheDocument();
      expect(input.tagName).toBe("INPUT");
    });

    it("should show URL placeholder", () => {
      render(<InputField {...defaultProps} mode="url" />);

      expect(
        screen.getByPlaceholderText("https://example.com"),
      ).toBeInTheDocument();
    });

    it("should call onChange when URL input changes", () => {
      const mockOnChange = vi.fn();
      render(
        <InputField {...defaultProps} mode="url" onChange={mockOnChange} />,
      );

      const input = screen.getByPlaceholderText("https://example.com");
      fireEvent.change(input, { target: { value: "https://newsite.com" } });

      expect(mockOnChange).toHaveBeenCalledWith("https://newsite.com");
    });

    it("should show URL error when provided", () => {
      render(
        <InputField
          {...defaultProps}
          mode="url"
          urlError="Invalid URL format"
        />,
      );

      expect(screen.getByText("Invalid URL format")).toBeInTheDocument();
    });

    it("should not show character count in URL mode", () => {
      render(
        <InputField {...defaultProps} mode="url" value="https://test.com" />,
      );

      expect(screen.queryByText(/characters/)).not.toBeInTheDocument();
    });
  });

  describe("Text Mode", () => {
    it("should render TextArea when mode is text", () => {
      render(
        <InputField {...defaultProps} mode="text" value="Some text content" />,
      );

      const textarea = screen.getByDisplayValue("Some text content");
      expect(textarea).toBeInTheDocument();
      expect(textarea.tagName).toBe("TEXTAREA");
    });

    it("should show text placeholder", () => {
      render(<InputField {...defaultProps} mode="text" />);

      expect(
        screen.getByPlaceholderText("Paste or type your text here..."),
      ).toBeInTheDocument();
    });

    it("should call onChange when text input changes", () => {
      const mockOnChange = vi.fn();
      render(
        <InputField {...defaultProps} mode="text" onChange={mockOnChange} />,
      );

      const textarea = screen.getByPlaceholderText(
        "Paste or type your text here...",
      );
      fireEvent.change(textarea, { target: { value: "New text content" } });

      expect(mockOnChange).toHaveBeenCalledWith("New text content");
    });

    it("should show text error when provided", () => {
      render(
        <InputField
          {...defaultProps}
          mode="text"
          textError="Text is too long"
        />,
      );

      expect(screen.getByText("Text is too long")).toBeInTheDocument();
    });

    it("should show character count in text mode", () => {
      render(<InputField {...defaultProps} mode="text" value="Hello world" />);

      expect(screen.getByText("11 / 10,000 characters")).toBeInTheDocument();
    });

    it("should respect custom maxLength", () => {
      render(
        <InputField
          {...defaultProps}
          mode="text"
          value="Hello"
          maxLength={500}
        />,
      );

      expect(screen.getByText("5 / 500 characters")).toBeInTheDocument();
    });

    it("should set correct rows for textarea", () => {
      render(<InputField {...defaultProps} mode="text" />);

      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveAttribute("rows", "4");
    });
  });

  describe("Error Handling", () => {
    it("should apply error styling when URL has error", () => {
      render(
        <InputField {...defaultProps} mode="url" urlError="Invalid URL" />,
      );

      const input = screen.getByRole("textbox");
      expect(input).toHaveClass("text-input-error");
    });

    it("should apply error styling when text has error", () => {
      render(
        <InputField {...defaultProps} mode="text" textError="Text too long" />,
      );

      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveClass("text-area-error");
    });

    it("should not show error when no error is provided", () => {
      render(<InputField {...defaultProps} mode="url" />);

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("should show character count error styling when text has error", () => {
      render(
        <InputField
          {...defaultProps}
          mode="text"
          value="test"
          textError="Error"
        />,
      );

      const characterCount = screen.getByText("4 / 10,000 characters");
      expect(characterCount).toHaveClass("character-count-error");
    });
  });

  describe("Disabled State", () => {
    it("should disable input when disabled prop is true", () => {
      render(<InputField {...defaultProps} mode="url" disabled={true} />);

      const input = screen.getByRole("textbox");
      expect(input).toBeDisabled();
    });

    it("should disable textarea when disabled prop is true", () => {
      render(<InputField {...defaultProps} mode="text" disabled={true} />);

      const textarea = screen.getByRole("textbox");
      expect(textarea).toBeDisabled();
    });
  });

  describe("Custom Styling", () => {
    it("should apply custom className", () => {
      const { container } = render(
        <InputField {...defaultProps} className="custom-input-field" />,
      );

      expect(container.firstChild).toHaveClass("custom-input-field");
    });
  });

  describe("Error Priority", () => {
    it("should show URL error when in URL mode even if text error exists", () => {
      render(
        <InputField
          {...defaultProps}
          mode="url"
          urlError="URL error"
          textError="Text error"
        />,
      );

      expect(screen.getByText("URL error")).toBeInTheDocument();
      expect(screen.queryByText("Text error")).not.toBeInTheDocument();
    });

    it("should show text error when in text mode even if URL error exists", () => {
      render(
        <InputField
          {...defaultProps}
          mode="text"
          urlError="URL error"
          textError="Text error"
        />,
      );

      expect(screen.getByText("Text error")).toBeInTheDocument();
      expect(screen.queryByText("URL error")).not.toBeInTheDocument();
    });
  });
});
