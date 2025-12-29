import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import TransformerForm from "../TransformerForm";
import type { ClientPersona as Persona } from "@pagepersonai/shared";

// Import component mocks
import "./mocks/componentMocks";

describe("TransformerForm", () => {
  const mockPersonas: Persona[] = [
    {
      id: "casual",
      name: "Casual",
      description: "Casual tone",
      label: "Casual",
      exampleTexts: ["Hey there!", "What’s up?", "Just chilling."],
      avatarUrl: "/casual.jpg",
      theme: {
        primary: "#3B82F6",
        secondary: "#60A5FA",
        accent: "#DBEAFE",
      },
    },
    {
      id: "professional",
      name: "Professional",
      description: "Professional tone",
      label: "Professional",
      exampleTexts: ["Good day.", "Please find attached.", "Best regards."],
      avatarUrl: "/professional.jpg",
      theme: {
        primary: "#1F2937",
        secondary: "#374151",
        accent: "#F3F4F6",
      },
    },
  ];

  const defaultProps = {
    selectedPersona: null,
    personas: mockPersonas,
    url: "",
    inputMode: "url" as const,
    isLoading: false,
    loadingPersonas: false,
    urlError: null,
    textError: null,
    maxTextLength: 10000,
    onPersonaSelect: vi.fn(),
    onInputChange: vi.fn(),
    onModeChange: vi.fn(),
    onTransform: vi.fn(),
    isValidInput: vi.fn(() => true),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render all form elements", () => {
    render(<TransformerForm {...defaultProps} />);

    expect(screen.getByText("Choose your persona")).toBeInTheDocument();
    expect(screen.getByText("URL")).toBeInTheDocument();
    expect(screen.getByText("Text")).toBeInTheDocument();
    expect(screen.getByText("Select a persona first")).toBeInTheDocument();
  });

  it("should render persona options", () => {
    render(<TransformerForm {...defaultProps} />);

    expect(screen.getByText("Casual")).toBeInTheDocument();
    expect(screen.getByText("Professional")).toBeInTheDocument();
  });

  it("should call onPersonaSelect when persona is clicked", () => {
    const mockOnPersonaSelect = vi.fn();
    render(
      <TransformerForm
        {...defaultProps}
        onPersonaSelect={mockOnPersonaSelect}
      />,
    );

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "casual" } });

    expect(mockOnPersonaSelect).toHaveBeenCalledWith(mockPersonas[0]);
  });

  it("should highlight selected persona", () => {
    render(
      <TransformerForm {...defaultProps} selectedPersona={mockPersonas[0]} />,
    );

    const select = screen.getByRole("combobox");
    expect(select).toHaveValue("casual");
    expect(screen.getByText("Casual tone")).toBeInTheDocument(); // Should show description when selected
  });

  it("should call onModeChange when mode toggle is clicked", () => {
    const mockOnModeChange = vi.fn();
    render(
      <TransformerForm {...defaultProps} onModeChange={mockOnModeChange} />,
    );

    fireEvent.click(screen.getByText("Text"));

    expect(mockOnModeChange).toHaveBeenCalledWith("text");
  });

  it("should render TextInput when in URL mode", () => {
    render(
      <TransformerForm
        {...defaultProps}
        inputMode="url"
        url="https://test.com"
      />,
    );

    const input = screen.getByTestId("text-input");
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue("https://test.com");
  });

  it("should render TextArea when in text mode", () => {
    render(
      <TransformerForm
        {...defaultProps}
        inputMode="text"
        url="Some text content"
      />,
    );

    const textarea = screen.getByTestId("text-area");
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveValue("Some text content");
  });

  it("should show character count in text mode", () => {
    render(<TransformerForm {...defaultProps} inputMode="text" url="Hello" />);

    // Look for text that contains the character count instead of a specific testId
    expect(screen.getByText(/5.*\/.*10.*000/)).toBeInTheDocument();
  });

  it("should not show character count in URL mode", () => {
    render(<TransformerForm {...defaultProps} inputMode="url" />);

    expect(screen.queryByTestId("character-count")).not.toBeInTheDocument();
  });

  it("should call onInputChange when input value changes", () => {
    const mockOnInputChange = vi.fn();
    render(
      <TransformerForm {...defaultProps} onInputChange={mockOnInputChange} />,
    );

    const input = screen.getByTestId("text-input");
    fireEvent.change(input, { target: { value: "https://newurl.com" } });

    expect(mockOnInputChange).toHaveBeenCalledWith("https://newurl.com");
  });

  it("should display URL error when provided", () => {
    render(
      <TransformerForm
        {...defaultProps}
        inputMode="url"
        urlError="Invalid URL"
      />,
    );

    // Look for the text directly instead of relying on a specific testId
    expect(screen.getByText("Invalid URL")).toBeInTheDocument();
  });

  it("should display text error when provided", () => {
    render(
      <TransformerForm
        {...defaultProps}
        inputMode="text"
        textError="Text too long"
      />,
    );

    // Look for the text directly instead of relying on a specific testId
    expect(screen.getByText("Text too long")).toBeInTheDocument();
  });

  it("should disable transform button when loading", () => {
    render(<TransformerForm {...defaultProps} isLoading={true} />);

    const button = screen.getByRole("button", { name: /generating/i });
    expect(button).toBeDisabled();
  });

  it("should disable transform button when input is invalid", () => {
    const mockIsValidInput = vi.fn(() => false);
    render(
      <TransformerForm {...defaultProps} isValidInput={mockIsValidInput} />,
    );

    const button = screen.getByText("Select a persona first");
    expect(button).toBeDisabled();
  });

  it("should disable transform button when no persona is selected", () => {
    render(<TransformerForm {...defaultProps} selectedPersona={null} />);

    const button = screen.getByText("Select a persona first");
    expect(button).toBeDisabled();
  });

  it("should enable transform button when all conditions are met", () => {
    const mockIsValidInput = vi.fn(() => true);
    render(
      <TransformerForm
        {...defaultProps}
        selectedPersona={mockPersonas[0]}
        url="https://test.com"
        isValidInput={mockIsValidInput}
      />,
    );

    const button = screen.getByText("Generate");
    expect(button).not.toBeDisabled();
  });

  it("should call onTransform when transform button is clicked", () => {
    const mockOnTransform = vi.fn();
    const mockIsValidInput = vi.fn(() => true);
    render(
      <TransformerForm
        {...defaultProps}
        selectedPersona={mockPersonas[0]}
        url="https://test.com"
        isValidInput={mockIsValidInput}
        onTransform={mockOnTransform}
      />,
    );

    fireEvent.click(screen.getByText("Generate"));

    expect(mockOnTransform).toHaveBeenCalled();
  });

  it("should show loading state for personas", () => {
    render(
      <TransformerForm
        {...defaultProps}
        loadingPersonas={true}
        personas={[]}
      />,
    );

    expect(screen.getByText("Loading personas...")).toBeInTheDocument();
  });

  it("should disable all inputs when loading", () => {
    render(<TransformerForm {...defaultProps} isLoading={true} />);

    const input = screen.getByTestId("text-input");
    expect(input).toBeDisabled();
  });

  it("should respect maxTextLength prop", () => {
    render(
      <TransformerForm
        {...defaultProps}
        inputMode="text"
        maxTextLength={500}
        url="test"
      />,
    );

    expect(screen.getByText("4 / 500 characters")).toBeInTheDocument();
  });

  it("should allow deselecting persona by clicking selected one", () => {
    const mockOnPersonaSelect = vi.fn();
    render(
      <TransformerForm
        {...defaultProps}
        selectedPersona={mockPersonas[0]}
        onPersonaSelect={mockOnPersonaSelect}
      />,
    );

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "" } });

    expect(mockOnPersonaSelect).toHaveBeenCalledWith(null);
  });
});
