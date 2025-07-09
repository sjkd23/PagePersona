import { useState, useEffect, useRef } from 'react'
import type { Persona, WebpageContent } from '../types/personas'
import { useAuth } from './useAuthContext'
import ApiService, { setTokenGetter } from '../lib/apiClient'
import { logger } from '../utils/logger'
import { useTransformationHistory } from './useTransformationHistory'

export interface TransformationState {
  selectedPersona: Persona | null
  personas: Persona[]
  url: string
  inputMode: 'url' | 'text'
  isLoading: boolean
  content: WebpageContent | null
  error: string | null
  loadingPersonas: boolean
  urlError: string | null
  textError: string | null
  hasClickedGenerate: boolean
}

export interface TransformationActions {
  setSelectedPersona: (persona: Persona | null) => void
  setUrl: (url: string) => void
  setInputMode: (mode: 'url' | 'text') => void
  setError: (error: string | null) => void
  handleInputChange: (value: string) => void
  handleModeChange: (mode: 'url' | 'text') => void
  handleTransform: () => Promise<void>
  handleRestoreTransformation: (item: WebpageContent) => void
  isValidInput: () => boolean
}

const MAX_TEXT_LENGTH = 10000

const validateUrl = (inputUrl: string): string | null => {
  if (!inputUrl.trim()) {
    return null
  }

  try {
    const url = new URL(inputUrl.startsWith('http') ? inputUrl : `https://${inputUrl}`)
    
    const hostname = url.hostname
    if (!hostname || hostname === 'localhost') {
      if (hostname === 'localhost') {
        return null
      }
      return 'Please enter a valid URL'
    }
    
    const isValidDomain = hostname.includes('.') && 
                         hostname.split('.').length >= 2 && 
                         hostname.split('.').every(part => part.length > 0)
    
    const isValidIP = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(hostname)
    
    if (!isValidDomain && !isValidIP) {
      return 'Please enter a valid URL'
    }
    
    return null
  } catch {
    return 'Please enter a valid URL'
  }
}

const validateText = (inputText: string): string | null => {
  if (inputText.trim().length < 50) {
    return `Text must be at least 50 characters (currently ${inputText.trim().length} characters)`
  }
  if (inputText.length > MAX_TEXT_LENGTH) {
    return `Text must be ${MAX_TEXT_LENGTH} characters or less (currently ${inputText.length} characters)`
  }
  return null
}

export function useTransformation() {
  // Track mounted state for cleanup
  const abortControllerRef = useRef<AbortController | null>(null)
  const isMountedRef = useRef(true)

  const [state, setState] = useState<TransformationState>({
    selectedPersona: null,
    personas: [],
    url: '',
    inputMode: 'url',
    isLoading: false,
    content: null,
    error: null,
    loadingPersonas: true,
    urlError: null,
    textError: null,
    hasClickedGenerate: false
  })

  const { getAccessToken } = useAuth()
  const { history, addToHistory, removeFromHistory, clearHistory } = useTransformationHistory()

  // Set up Auth0 token getter for API calls
  useEffect(() => {
    setTokenGetter(getAccessToken)
  }, [getAccessToken])

  // Load personas
  useEffect(() => {
    const loadPersonas = async () => {
      try {
        safeSetState(prev => ({ ...prev, loadingPersonas: true, error: null }))
        const response = await ApiService.getPersonas()
        
        if (!isMountedRef.current) return // Early exit if unmounted
        
        if (response.success && response.data) {
          // Backend now returns complete ClientPersona objects
          const frontendPersonas: Persona[] = response.data.personas
          safeSetState(prev => ({ ...prev, personas: frontendPersonas }))
        } else {
          safeSetState(prev => ({ ...prev, error: 'Failed to load personas' }))
        }
      } catch (err) {
        if (!isMountedRef.current) return // Early exit if unmounted
        
        logger.component.error('useTransformation', 'Error loading personas', err)
        safeSetState(prev => ({ ...prev, error: 'Failed to connect to server' }))
      } finally {
        safeSetState(prev => ({ ...prev, loadingPersonas: false }))
      }
    }

    loadPersonas()
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // Safe state setter that checks if component is still mounted
  const safeSetState = (updater: (prev: TransformationState) => TransformationState) => {
    if (isMountedRef.current) {
      setState(updater)
    }
  }

  const actions: TransformationActions = {
    setSelectedPersona: (persona) => {
      setState(prev => ({ ...prev, selectedPersona: persona }))
    },

    setUrl: (url) => {
      setState(prev => ({ ...prev, url }))
    },

    setInputMode: (mode) => {
      setState(prev => ({ ...prev, inputMode: mode }))
    },

    setError: (error) => {
      setState(prev => ({ ...prev, error }))
    },

    handleInputChange: (value) => {
      setState(prev => ({ ...prev, url: value }))
      
      if (state.inputMode === 'url') {
        const urlError = validateUrl(value)
        setState(prev => ({ ...prev, urlError }))
      } else {
        const textError = validateText(value)
        setState(prev => ({ ...prev, textError }))
      }
    },

    handleModeChange: (mode) => {
      setState(prev => ({ 
        ...prev, 
        inputMode: mode, 
        urlError: null, 
        textError: null 
      }))
      
      // Re-validate based on new mode if there's content
      if (state.url.trim()) {
        if (mode === 'url') {
          const urlError = validateUrl(state.url)
          setState(prev => ({ ...prev, urlError }))
        } else {
          const textError = validateText(state.url)
          setState(prev => ({ ...prev, textError }))
        }
      }
    },

    isValidInput: () => {
      if (state.inputMode === 'url') {
        return !state.urlError && state.url.trim() !== ''
      } else {
        return !state.textError && state.url.trim() !== ''
      }
    },

    handleTransform: async () => {
      if (!state.selectedPersona || !state.url.trim()) return
      
      // Validate input before transforming
      if (state.inputMode === 'url' && validateUrl(state.url)) {
        return
      }
      
      if (state.inputMode === 'text' && validateText(state.url)) {
        return
      }

      // Abort any existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // Create new abort controller for this request
      abortControllerRef.current = new AbortController()
      const abortSignal = abortControllerRef.current.signal

      safeSetState(prev => ({ ...prev, isLoading: true, error: null, hasClickedGenerate: true }))

      try {
        let response

        if (state.inputMode === 'text') {
          response = await ApiService.transformText({
            text: state.url.trim(),
            persona: state.selectedPersona.id
          })
        } else {
          const formattedUrl = state.url.startsWith('http') ? state.url : `https://${state.url}`
          response = await ApiService.transformWebpage({
            url: formattedUrl,
            persona: state.selectedPersona.id
          })
        }

        // Check if request was aborted
        if (abortSignal.aborted) {
          return
        }

        if (response.success) {
          const transformedContent: WebpageContent = {
            originalUrl: state.inputMode === 'url' ? 
              (state.url.startsWith('http') ? state.url : `https://${state.url}`) : 
              'Direct Text Input',
            originalTitle: state.inputMode === 'url' ? 
              response.originalContent?.title || 'Webpage Content' : 
              'Text Input',
            originalContent: state.inputMode === 'url' ? 
              response.originalContent?.content || '' : 
              state.url.trim(),
            transformedContent: response.transformedContent,
            persona: state.selectedPersona,
            timestamp: new Date()
          }
          safeSetState(prev => ({ ...prev, content: transformedContent }))
          addToHistory(transformedContent)
        } else {
          safeSetState(prev => ({ 
            ...prev, 
            error: response.error || `Failed to transform the ${state.inputMode === 'url' ? 'webpage' : 'text'}` 
          }))
        }
      } catch (err: unknown) {
        // Don't set error state if the request was aborted
        if (err && typeof err === 'object' && 'name' in err && (err as any).name === 'AbortError' || abortSignal.aborted) {
          return
        }
        logger.component.error('useTransformation', 'Transform error', err)
        safeSetState(prev => ({ 
          ...prev, 
          error: `Failed to transform the ${state.inputMode === 'url' ? 'webpage' : 'text'}. Please check your connection and try again.` 
        }))
      } finally {
        if (!abortSignal.aborted) {
          safeSetState(prev => ({ ...prev, isLoading: false }))
        }
      }
    },

    handleRestoreTransformation: (item) => {
      setState(prev => ({
        ...prev,
        content: item,
        selectedPersona: item.persona,
        urlError: null,
        textError: null,
        hasClickedGenerate: true
      }))
      
      if (item.originalUrl === 'Direct Text Input') {
        setState(prev => ({ 
          ...prev, 
          url: item.originalContent, 
          inputMode: 'text' 
        }))
        const textError = validateText(item.originalContent)
        setState(prev => ({ ...prev, textError }))
      } else {
        setState(prev => ({ 
          ...prev, 
          url: item.originalUrl, 
          inputMode: 'url' 
        }))
        const urlError = validateUrl(item.originalUrl)
        setState(prev => ({ ...prev, urlError }))
      }
    }
  }

  return {
    state,
    actions,
    history,
    removeFromHistory,
    clearHistory,
    MAX_TEXT_LENGTH
  }
}
