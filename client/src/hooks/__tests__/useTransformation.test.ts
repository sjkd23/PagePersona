import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTransformation } from "../useTransformation";
import type { AuthContextType } from "../../contexts/AuthContext";
import ApiService from "../../lib/apiClient";

// Mock dependencies
const mockUseAuth = vi.fn();
const mockUseTransformationHistory = vi.fn();

vi.mock("../useAuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("../../lib/apiClient", () => ({
  default: {
    getPersonas: vi.fn(),
    transformWebpage: vi.fn(),
  },
  setTokenGetter: vi.fn(),
}));

vi.mock("../useTransformationHistory", () => ({
  useTransformationHistory: () => mockUseTransformationHistory(),
}));

vi.mock("../../utils/logger", () => ({
  logger: {
    component: {
      error: vi.fn(),
      info: vi.fn(),
    },
  },
}));

const mockApiService = vi.mocked(ApiService);

describe("hooks/useTransformation", () => {
  const mockGetAccessToken = vi.fn();
  const mockAddToHistory = vi.fn();

  const createMockPersona = (id: string) => ({
    id,
    name: id.toUpperCase(),
    label: `${id} Label`,
    description: `${id} description`,
    exampleTexts: [`Example for ${id}`],
    avatarUrl: `/images/${id}.png`,
    theme: {
      primary: "#000000",
      secondary: "#111111",
      accent: "#222222",
    },
  });

  const createMockContent = () => ({
    title: "Test Page",
    url: "https://example.com",
    originalUrl: "https://example.com",
    originalTitle: "Test Page",
    originalContent: "Original content",
    transformedContent: "Transformed content",
    persona: createMockPersona("eli5"),
    timestamp: new Date(),
  });

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseAuth.mockReturnValue({
      getAccessToken: mockGetAccessToken,
      isAuthenticated: true,
    } as Partial<AuthContextType>);

    mockUseTransformationHistory.mockReturnValue({
      addToHistory: mockAddToHistory,
    });

    mockApiService.getPersonas.mockResolvedValue({
      success: true,
      data: {
        personas: [createMockPersona("eli5"), createMockPersona("pirate")],
      },
    });
  });

  it("should initialize with default state", () => {
    const { result } = renderHook(() => useTransformation());

    expect(result.current.state.selectedPersona).toBeNull();
    expect(result.current.state.url).toBe("");
    expect(result.current.state.inputMode).toBe("url");
    expect(result.current.state.isLoading).toBe(false);
    expect(result.current.state.content).toBeNull();
    expect(result.current.state.error).toBeNull();
    expect(result.current.state.hasClickedGenerate).toBe(false);
  });

  it("should load personas on mount", async () => {
    const { result } = renderHook(() => useTransformation());

    // Wait for personas to load
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(mockApiService.getPersonas).toHaveBeenCalled();
    expect(result.current.state.personas).toHaveLength(2);
    expect(result.current.state.personas[0].id).toBe("eli5");
  });

  it("should handle persona loading error", async () => {
    mockApiService.getPersonas.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useTransformation());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.state.error).toBe("Failed to connect to server");
  });

  it("should update URL", () => {
    const { result } = renderHook(() => useTransformation());

    act(() => {
      result.current.actions.setUrl("https://example.com");
    });

    expect(result.current.state.url).toBe("https://example.com");
  });

  it("should change input mode", () => {
    const { result } = renderHook(() => useTransformation());

    act(() => {
      result.current.actions.setInputMode("text");
    });

    expect(result.current.state.inputMode).toBe("text");
  });

  it("should validate URL input", () => {
    const { result } = renderHook(() => useTransformation());

    // Set up valid input
    act(() => {
      result.current.actions.setUrl("https://example.com");
      result.current.actions.setSelectedPersona(createMockPersona("eli5"));
    });

    expect(result.current.actions.isValidInput()).toBe(true);

    // Set invalid URL
    act(() => {
      result.current.actions.setUrl("");
    });

    expect(result.current.actions.isValidInput()).toBe(false);
  });

  it("should validate text input", () => {
    const { result } = renderHook(() => useTransformation());

    act(() => {
      result.current.actions.setInputMode("text");
      result.current.actions.setUrl("Some text content");
      result.current.actions.setSelectedPersona(createMockPersona("eli5"));
    });

    expect(result.current.actions.isValidInput()).toBe(true);

    // Test empty text
    act(() => {
      result.current.actions.setUrl("");
    });

    expect(result.current.actions.isValidInput()).toBe(false);
  });

  it("should handle input change", () => {
    const { result } = renderHook(() => useTransformation());

    act(() => {
      result.current.actions.handleInputChange("https://example.com");
    });

    expect(result.current.state.url).toBe("https://example.com");
    expect(result.current.state.urlError).toBeNull();
  });

  it("should handle mode change", () => {
    const { result } = renderHook(() => useTransformation());

    act(() => {
      result.current.actions.handleModeChange("text");
    });

    expect(result.current.state.inputMode).toBe("text");
    expect(result.current.state.urlError).toBeNull();
    expect(result.current.state.textError).toBeNull();
  });

  it("should handle transformation success", async () => {
    const mockContent = createMockContent();

    mockApiService.transformWebpage.mockResolvedValue({
      success: true,
      originalContent: {
        title: mockContent.originalTitle,
        content: mockContent.originalContent,
        url: mockContent.originalUrl,
        wordCount: 100,
      },
      transformedContent: mockContent.transformedContent,
      persona: {
        id: "eli5",
        name: "Explain Like I'm 5",
        description: "Simple, fun explanations anyone can understand",
      },
    });

    const { result } = renderHook(() => useTransformation());

    // Set up valid input
    act(() => {
      result.current.actions.setUrl("https://example.com");
      result.current.actions.setSelectedPersona(createMockPersona("eli5"));
    });

    // Trigger transformation
    await act(async () => {
      await result.current.actions.handleTransform();
    });

    expect(mockApiService.transformWebpage).toHaveBeenCalled();
    expect(result.current.state.content).toEqual(
      expect.objectContaining({
        originalUrl: mockContent.originalUrl,
        originalTitle: mockContent.originalTitle,
        originalContent: mockContent.originalContent,
        transformedContent: mockContent.transformedContent,
        persona: expect.any(Object),
      }),
    );
    expect(result.current.state.isLoading).toBe(false);
    expect(mockAddToHistory).toHaveBeenCalled();
  });

  it("should handle transformation error", async () => {
    mockApiService.transformWebpage.mockRejectedValue(
      new Error("Transformation failed"),
    );

    const { result } = renderHook(() => useTransformation());

    // Set up valid input
    act(() => {
      result.current.actions.setUrl("https://example.com");
      result.current.actions.setSelectedPersona(createMockPersona("eli5"));
    });

    // Trigger transformation
    await act(async () => {
      await result.current.actions.handleTransform();
    });

    expect(result.current.state.error).toBe(
      "Failed to transform the webpage. Please check your connection and try again.",
    );
    expect(result.current.state.isLoading).toBe(false);
  });

  it("should restore transformation from history", () => {
    const { result } = renderHook(() => useTransformation());

    const mockHistoryItem = createMockContent();

    act(() => {
      result.current.actions.handleRestoreTransformation(mockHistoryItem);
    });

    expect(result.current.state.content).toEqual(mockHistoryItem);
    expect(result.current.state.selectedPersona).toEqual(
      mockHistoryItem.persona,
    );
    expect(result.current.state.url).toBe(mockHistoryItem.url);
  });

  it("should prevent invalid transformations", async () => {
    const { result } = renderHook(() => useTransformation());

    // Try to transform without persona
    await act(async () => {
      await result.current.actions.handleTransform();
    });

    expect(mockApiService.transformWebpage).not.toHaveBeenCalled();
    expect(result.current.state.error).toBe(
      "Please select a persona and provide valid input",
    );
  });
});
