import { getAuthWithPersistence } from "./firebase"
import {
  sendPasswordResetEmail,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  User,
} from "firebase/auth"

/**
 * Send a password reset email to the user
 */
export const sendPasswordReset = async (email: string): Promise<void> => {
  try {
    const auth = await getAuthWithPersistence();
    await sendPasswordResetEmail(auth, email)
  } catch (error: any) {
    if (error.code === "auth/user-not-found") {
      throw new Error("No account found with this email address")
    } else if (error.code === "auth/invalid-email") {
      throw new Error("Invalid email address")
    }
    throw new Error(error.message || "Failed to send password reset email")
  }
}

/**
 * Update user email (requires re-authentication)
 */
export const changeEmail = async (user: User, newEmail: string, password: string): Promise<void> => {
  try {
    // Re-authenticate the user
    const credential = EmailAuthProvider.credential(user.email!, password)
    await reauthenticateWithCredential(user, credential)

    // Update email
    await updateEmail(user, newEmail)
  } catch (error: any) {
    if (error.code === "auth/wrong-password") {
      throw new Error("Incorrect password")
    } else if (error.code === "auth/email-already-in-use") {
      throw new Error("This email is already in use")
    } else if (error.code === "auth/invalid-email") {
      throw new Error("Invalid email address")
    }
    throw new Error(error.message || "Failed to update email")
  }
}

/**
 * Update user password (requires re-authentication)
 */
export const changePassword = async (user: User, currentPassword: string, newPassword: string): Promise<void> => {
  try {
    // Validate new password
    if (newPassword.length < 6) {
      throw new Error("Password must be at least 6 characters long")
    }

    // Re-authenticate the user
    const credential = EmailAuthProvider.credential(user.email!, currentPassword)
    await reauthenticateWithCredential(user, credential)

    // Update password
    await updatePassword(user, newPassword)
  } catch (error: any) {
    if (error.code === "auth/wrong-password") {
      throw new Error("Current password is incorrect")
    } else if (error.code === "auth/weak-password") {
      throw new Error("New password is too weak")
    }
    throw new Error(error.message || "Failed to update password")
  }
}

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate password strength
 */
export const validatePassword = (password: string): { valid: boolean; message: string } => {
  if (password.length < 6) {
    return { valid: false, message: "Password must be at least 6 characters" }
  }

  if (!/[A-Z]/.test(password) && !/[0-9]/.test(password)) {
    // Optional: require at least one uppercase letter or number
    // return { valid: false, message: "Password should contain uppercase letter or number" }
  }

  return { valid: true, message: "Password is valid" }
}
