import { userRepository } from "@/endpoints/sqlite/repositories/user-repository";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  BackHandler,
  TextInput as RNTextInput,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { ThemedText } from "../ui";

interface LoginInputsProps {
  isDbReady: boolean | null;
  onLogin: (email: string, password: string) => Promise<void>;
  isLoading: boolean;
}

export default function LoginInputs({
  isDbReady,
  onLogin,
  isLoading,
}: LoginInputsProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [scannedEmail, setScannedEmail] = useState("");
  const scanInputRef = useRef<RNTextInput>(null);
  const emailInputRef = useRef<RNTextInput>(null);
  const passwordInputRef = useRef<RNTextInput>(null);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Helper function to extract password from hash format (hashed_123456_demo -> 123456)
  const extractPasswordFromHash = (passwordHash: string): string => {
    // Remove 'hashed_' prefix and '_demo' suffix
    if (passwordHash.startsWith("hashed_") && passwordHash.endsWith("_demo")) {
      return passwordHash.slice(7, -5); // Remove 'hashed_' (7 chars) and '_demo' (5 chars)
    }
    // Fallback: return empty string if format doesn't match
    return "";
  };

  // Handle scanned email - auto-login with password from SQLite
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (scannedEmail.trim() && isDbReady === true) {
      // Debounce to wait for complete barcode input
      debounceTimeoutRef.current = setTimeout(async () => {
        const trimmedEmail = scannedEmail.trim();

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailRegex.test(trimmedEmail)) {
          try {
            // Fetch user from SQLite to get the password hash
            const user = await userRepository.findByEmail(trimmedEmail);
            
            if (user && user.password_hash) {
              // Extract password from hash format (hashed_123456_demo -> 123456)
              const extractedPassword = extractPasswordFromHash(user.password_hash);
              
              if (extractedPassword) {
                // Auto-fill email and use extracted password
                setEmail(trimmedEmail);
                setPassword(extractedPassword);

                // Automatically trigger login after a short delay
                setTimeout(() => {
                  onLogin(trimmedEmail, extractedPassword);
                }, 100);
              } else {
                console.log("Failed to extract password from hash:", user.password_hash);
                // Fallback: still set email but don't auto-login
                setEmail(trimmedEmail);
              }
            } else {
              console.log("User not found or no password hash for email:", trimmedEmail);
              // Fallback: still set email but don't auto-login
              setEmail(trimmedEmail);
            }
          } catch (error) {
            console.error("Error fetching user from SQLite:", error);
            // Fallback: still set email but don't auto-login
            setEmail(trimmedEmail);
          }
        } else {
          // Not a valid email, might be partial scan - ignore
          console.log("Scanned value is not a valid email:", trimmedEmail);
        }

        // Clear scanned email
        setScannedEmail("");
      }, 200);
    }

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, [scannedEmail, isDbReady, onLogin]);

  // Auto-focus hidden scanner input on mount
  useEffect(() => {
    if (isDbReady === true) {
      const timer = setTimeout(() => {
        scanInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isDbReady]);

  // Prevent hardware back button when scanner is active
  useEffect(() => {
    if (scanInputRef.current) {
      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          if (scanInputRef.current?.isFocused()) {
            return true; // Prevent default behavior
          }
          return false;
        }
      );

      return () => backHandler.remove();
    }
  }, []);

  // Cleanup blur timeout on unmount
  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      return;
    }
    await onLogin(email, password);
  };

  return (
    <View style={styles.container}>
      {isDbReady === false && (
        <View style={styles.warningContainer}>
          <ThemedText style={styles.warningTitle}>
            Database not initialized
          </ThemedText>
          <ThemedText style={styles.warningText}>
            Please initialize the local database before signing in.
          </ThemedText>
          <TouchableOpacity
            style={styles.warningButton}
            onPress={() => router.push("/database-init")}
          >
            <ThemedText style={styles.warningButtonText}>
              Open Database Setup
            </ThemedText>
          </TouchableOpacity>
        </View>
      )}

      {isDbReady === true && (
        <>
          {/* Hidden Barcode Scanner Input */}
          <RNTextInput
            ref={scanInputRef}
            placeholder="Scan email barcode"
            value={scannedEmail}
            onChangeText={(text) => setScannedEmail(text)}
            autoCapitalize="none"
            keyboardType="email-address"
            showSoftInputOnFocus={false}
            autoFocus={false}
            blurOnSubmit={false}
            editable={true}
            onKeyPress={(e) => {
              e.stopPropagation?.();
            }}
            onFocus={() => {
              scanInputRef.current?.focus();
            }}
            onBlur={() => {
              // Clear any existing blur timeout
              if (blurTimeoutRef.current) {
                clearTimeout(blurTimeoutRef.current);
              }
              
              if (!isLoading) {
                // Only refocus scanner if email/password inputs are not focused
                blurTimeoutRef.current = setTimeout(() => {
                  const isEmailFocused = emailInputRef.current?.isFocused() ?? false;
                  const isPasswordFocused = passwordInputRef.current?.isFocused() ?? false;
                  
                  // Only refocus scanner if:
                  // 1. Scanner ref still exists
                  // 2. Email and password fields are empty
                  // 3. Neither email nor password inputs are currently focused
                  if (
                    scanInputRef.current &&
                    !email &&
                    !password &&
                    !isEmailFocused &&
                    !isPasswordFocused
                  ) {
                    scanInputRef.current?.focus();
                  }
                }, 1000);
              }
            }}
            style={styles.hiddenInput}
          />

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Email</ThemedText>
            <RNTextInput
              ref={emailInputRef}
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              style={styles.input}
              placeholderTextColor="#999"
              onFocus={() => {
                // Clear blur timeout and blur scanner when focusing email input
                if (blurTimeoutRef.current) {
                  clearTimeout(blurTimeoutRef.current);
                  blurTimeoutRef.current = null;
                }
                scanInputRef.current?.blur();
              }}
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Password</ThemedText>
            <View style={styles.passwordContainer}>
              <RNTextInput
                ref={passwordInputRef}
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="password"
                style={[styles.input, styles.passwordInput]}
                placeholderTextColor="#999"
                onFocus={() => {
                  // Clear blur timeout and blur scanner when focusing password input
                  if (blurTimeoutRef.current) {
                    clearTimeout(blurTimeoutRef.current);
                    blurTimeoutRef.current = null;
                  }
                  scanInputRef.current?.blur();
                }}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <ThemedText style={styles.eyeButtonText}>
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[
              styles.loginButton,
              isLoading && styles.loginButtonDisabled,
            ]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <ThemedText style={styles.loginButtonText}>
              {isLoading ? "Signing in..." : "Sign In"}
            </ThemedText>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  warningContainer: {
    padding: 16,
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#FCD34D",
    borderRadius: 8,
  },
  warningTitle: {
    color: "#92400E",
    marginBottom: 8,
    fontWeight: "600",
  },
  warningText: {
    color: "#92400E",
    marginBottom: 12,
  },
  warningButton: {
    backgroundColor: "#D97706",
    borderRadius: 8,
    paddingVertical: 12,
  },
  warningButtonText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontWeight: "600",
  },
  hiddenInput: {
    position: "absolute",
    opacity: 0,
    width: "100%",
    height: 56,
    zIndex: 0,
    pointerEvents: "box-none",
    backgroundColor: "transparent",
  },
  inputContainer: {
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
    opacity: 0.7,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#FFFFFF",
  },
  passwordContainer: {
    position: "relative",
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeButton: {
    position: "absolute",
    right: 12,
    top: 12,
    padding: 4,
  },
  eyeButtonText: {
    fontSize: 20,
  },
  loginButton: {
    backgroundColor: "#3B82F6",
    borderRadius: 8,
    paddingVertical: 16,
    marginTop: 24,
  },
  loginButtonDisabled: {
    opacity: 0.5,
  },
  loginButtonText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
  },
});
