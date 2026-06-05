import { useState } from "react"
import { useAuth } from "./auth-context"
import { isValidEmail, validatePassword } from "./firebase-utils"

export interface AuthFormState {
  email: string
  password: string
  name?: string
  confirmPassword?: string
}

export interface AuthFormErrors {
  email?: string
  password?: string
  name?: string
  confirmPassword?: string
  general?: string
}

export interface UseAuthFormReturn {
  formData: AuthFormState
  errors: AuthFormErrors
  isLoading: boolean
  updateField: (field: keyof AuthFormState, value: string) => void
  validateForm: () => boolean
  handleSignUp: (onSuccess?: () => void) => Promise<void>
  handleSignIn: (onSuccess?: () => void) => Promise<void>
  clearErrors: () => void
  setError: (field: keyof AuthFormErrors, message: string) => void
}

const DEFAULT_FORM_STATE: AuthFormState = {
  email: "",
  password: "",
  name: "",
  confirmPassword: "",
}

export function useAuthForm(): UseAuthFormReturn {
  const { signUp, signIn } = useAuth()
  const [formData, setFormData] = useState<AuthFormState>(DEFAULT_FORM_STATE)
  const [errors, setErrors] = useState<AuthFormErrors>({})
  const [isLoading, setIsLoading] = useState(false)

  const updateField = (field: keyof AuthFormState, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
    // Clear error for this field when user starts typing
    setErrors((prev) => ({
      ...prev,
      [field]: undefined,
    }))
  }

  const clearErrors = () => {
    setErrors({})
  }

  const setError = (field: keyof AuthFormErrors, message: string) => {
    setErrors((prev) => ({
      ...prev,
      [field]: message,
    }))
  }

  const validateForm = (): boolean => {
    const newErrors: AuthFormErrors = {}

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required"
    } else {
      const passwordValidation = validatePassword(formData.password)
      if (!passwordValidation.valid) {
        newErrors.password = passwordValidation.message
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateSignUpForm = (): boolean => {
    const newErrors: AuthFormErrors = {}

    // Name validation
    if (!formData.name?.trim()) {
      newErrors.name = "Full name is required"
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required"
    } else {
      const passwordValidation = validatePassword(formData.password)
      if (!passwordValidation.valid) {
        newErrors.password = passwordValidation.message
      }
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password"
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSignIn = async (onSuccess?: () => void) => {
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    try {
      await signIn(formData.email, formData.password)
      setFormData(DEFAULT_FORM_STATE)
      clearErrors()
      onSuccess?.()
    } catch (error: any) {
      setErrors({
        general: error.message || "Failed to sign in. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignUp = async (onSuccess?: () => void) => {
    if (!validateSignUpForm()) {
      return
    }

    setIsLoading(true)
    try {
      await signUp(formData.email, formData.password, formData.name || "")
      setFormData(DEFAULT_FORM_STATE)
      clearErrors()
      onSuccess?.()
    } catch (error: any) {
      setErrors({
        general: error.message || "Failed to create account. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return {
    formData,
    errors,
    isLoading,
    updateField,
    validateForm,
    handleSignUp,
    handleSignIn,
    clearErrors,
    setError,
  }
}
