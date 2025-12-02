/**
 * WebAuthn Utility Library
 * Profesional biometric authentication using W3C WebAuthn standard
 * 
 * Supports:
 * - 📱 Fingerprint (Android/iOS)
 * - 🔐 Windows Hello (Face/Fingerprint)
 * - 🍎 Face ID / Touch ID (macOS/iOS)
 * - 🔑 Security Keys (YubiKey, etc)
 * - 🌐 Passkeys (Google, Apple, Microsoft)
 */

/**
 * Check if WebAuthn is supported by browser
 */
export function isWebAuthnSupported(): boolean {
  return !!(
    window.PublicKeyCredential &&
    navigator.credentials &&
    navigator.credentials.create
  );
}

/**
 * Check if platform authenticator is available (built-in biometrics)
 */
export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (!isWebAuthnSupported()) return false;
  
  try {
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return available;
  } catch (error) {
    console.error('[WebAuthn] Platform authenticator check failed:', error);
    return false;
  }
}

/**
 * Get available authenticator types
 */
export async function getAvailableAuthenticators(): Promise<{
  platform: boolean; // Built-in (fingerprint, Face ID, Windows Hello)
  crossPlatform: boolean; // External (security keys, USB)
  userVerifying: boolean; // Supports biometric/PIN
}> {
  if (!isWebAuthnSupported()) {
    return { platform: false, crossPlatform: false, userVerifying: false };
  }

  try {
    const platform = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    
    return {
      platform,
      crossPlatform: true, // Always true if WebAuthn supported
      userVerifying: platform, // Platform authenticators always verify
    };
  } catch (error) {
    console.error('[WebAuthn] Authenticator check failed:', error);
    return { platform: false, crossPlatform: false, userVerifying: false };
  }
}

/**
 * Get user-friendly authenticator name based on platform
 */
export function getAuthenticatorName(): string {
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (/android/.test(userAgent)) {
    return 'Fingerprint Sensor';
  } else if (/iphone|ipad|ipod/.test(userAgent)) {
    return 'Face ID / Touch ID';
  } else if (/windows/.test(userAgent)) {
    return 'Windows Hello';
  } else if (/mac/.test(userAgent)) {
    return 'Touch ID';
  } else if (/linux/.test(userAgent)) {
    return 'Fingerprint / Security Key';
  } else {
    return 'Biometric Sensor';
  }
}

/**
 * Get emoji icon for current platform
 */
export function getAuthenticatorIcon(): string {
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (/android/.test(userAgent)) {
    return '📱';
  } else if (/iphone|ipad|ipod/.test(userAgent)) {
    return '🔐';
  } else if (/windows/.test(userAgent)) {
    return '🪟';
  } else if (/mac/.test(userAgent)) {
    return '🍎';
  } else {
    return '🔒';
  }
}

/**
 * Convert ArrayBuffer to Base64
 */
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert Base64 to ArrayBuffer
 */
function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Register new credential (Setup biometric)
 */
export async function registerCredential(
  userId: string,
  userName: string,
  userDisplayName: string
): Promise<{
  success: boolean;
  credentialId?: string;
  publicKey?: string;
  authenticatorData?: string;
  clientDataJSON?: string;
  error?: string;
}> {
  try {
    console.log('[WebAuthn] 🔐 Starting registration...');

    // Check support
    if (!isWebAuthnSupported()) {
      throw new Error('WebAuthn not supported in this browser');
    }

    // Generate challenge from server
    const challengeResponse = await fetch('/api/attendance/biometric/webauthn/register-challenge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, userName, userDisplayName }),
    });

    if (!challengeResponse.ok) {
      throw new Error('Failed to get registration challenge');
    }

    const challengeData = await challengeResponse.json();
    
    if (!challengeData.success) {
      throw new Error(challengeData.error || 'Challenge generation failed');
    }

    const { challenge, rp, user, pubKeyCredParams, authenticatorSelection, timeout } = challengeData.options;

    // Convert Base64 challenge to ArrayBuffer
    const challengeBuffer = base64ToBuffer(challenge);
    const userIdBuffer = base64ToBuffer(user.id);

    // Create credential
    console.log('[WebAuthn] 📲 Requesting credential creation...');
    console.log('[WebAuthn] 🔐 Configuration from server:', authenticatorSelection);
    console.log('[WebAuthn] ⏱️ Timeout:', timeout, 'ms');
    
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge: challengeBuffer,
        rp,
        user: {
          ...user,
          id: userIdBuffer,
        },
        pubKeyCredParams,
        // ✅ USE SERVER CONFIGURATION - Don't override!
        authenticatorSelection,
        timeout,
        attestation: 'none', // Privacy-preserving
      },
    }) as PublicKeyCredential | null;

    if (!credential) {
      throw new Error('Credential creation cancelled');
    }

    console.log('[WebAuthn] ✅ Credential created!');

    // Extract credential data
    const response = credential.response as AuthenticatorAttestationResponse;
    const credentialId = bufferToBase64(credential.rawId);
    const clientDataJSON = bufferToBase64(response.clientDataJSON);
    const attestationObject = bufferToBase64(response.attestationObject);

    // Verify on server
    const verifyResponse = await fetch('/api/attendance/biometric/webauthn/register-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        credentialId,
        clientDataJSON,
        attestationObject,
      }),
    });

    const verifyData = await verifyResponse.json();

    if (!verifyData.success) {
      throw new Error(verifyData.error || 'Verification failed');
    }

    console.log('[WebAuthn] 🎉 Registration complete!');

    return {
      success: true,
      credentialId,
      publicKey: verifyData.publicKey,
      authenticatorData: attestationObject,
      clientDataJSON,
    };

  } catch (error: any) {
    console.error('[WebAuthn] ❌ Registration error:', error);
    console.error('[WebAuthn] Error name:', error.name);
    console.error('[WebAuthn] Error message:', error.message);
    console.error('[WebAuthn] Error stack:', error.stack);
    
    // User-friendly error messages
    let errorMessage = error.message;
    
    if (error.name === 'NotAllowedError') {
      errorMessage = '❌ Biometric cancelled or device locked. Try unlocking your device first.';
    } else if (error.name === 'NotSupportedError') {
      errorMessage = '❌ Biometric not supported. Enable Face ID/Touch ID/Windows Hello in device settings.';
    } else if (error.name === 'SecurityError') {
      errorMessage = '❌ Security error - WebAuthn requires HTTPS or localhost.';
    } else if (error.name === 'AbortError') {
      errorMessage = '⏱️ Timeout - No response from biometric sensor. Is it enabled?';
    } else if (error.name === 'InvalidStateError') {
      errorMessage = '🔄 Credential already exists. Try Re-enrollment if switching devices.';
    } else if (error.name === 'NotReadableError') {
      errorMessage = '🔐 Cannot access biometric sensor. Check device permissions.';
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Authenticate with credential (Verify biometric)
 */
export async function authenticateCredential(
  userId: string
): Promise<{
  success: boolean;
  verified?: boolean;
  authenticatorData?: string;
  signature?: string;
  error?: string;
}> {
  try {
    console.log('[WebAuthn] 🔍 Starting authentication...');
    console.log('[WebAuthn] User ID:', userId);

    // Check support
    if (!isWebAuthnSupported()) {
      console.error('[WebAuthn] ❌ Browser does not support WebAuthn');
      throw new Error('WebAuthn not supported in this browser');
    }
    
    console.log('[WebAuthn] ✅ Browser supports WebAuthn');

    // Get challenge from server
    console.log('[WebAuthn] 📡 Fetching auth challenge from server...');
    const challengeResponse = await fetch('/api/attendance/biometric/webauthn/auth-challenge', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Include session cookie
    });

    console.log('[WebAuthn] 📥 Challenge response status:', challengeResponse.status);

    if (!challengeResponse.ok) {
      const errorData = await challengeResponse.json().catch(() => ({}));
      console.error('[WebAuthn] ❌ Challenge fetch failed:', errorData);
      throw new Error(errorData.error || 'Failed to get authentication challenge');
    }

    const challengeData = await challengeResponse.json();
    console.log('[WebAuthn] 📋 Challenge data received:', {
      success: challengeData.success,
      hasOptions: !!challengeData.options,
      credentialsCount: challengeData.options?.allowCredentials?.length || 0,
    });
    
    if (!challengeData.success) {
      console.error('[WebAuthn] ❌ Challenge generation failed:', challengeData.error);
      throw new Error(challengeData.error || 'Challenge generation failed');
    }

    const { challenge, allowCredentials, timeout, rpId, userVerification } = challengeData.options;

    // Convert Base64 to ArrayBuffer
    const challengeBuffer = base64ToBuffer(challenge);
    const allowCredentialsWithBuffer = allowCredentials.map((cred: any) => ({
      ...cred,
      id: base64ToBuffer(cred.id),
    }));

    // Get credential
    console.log('[WebAuthn] 📲 Requesting authentication from device...');
    console.log('[WebAuthn] 🔐 User verification:', userVerification);
    console.log('[WebAuthn] 🏢 RP ID:', rpId);
    console.log('[WebAuthn] ⏱️ Timeout:', timeout, 'ms');
    console.log('[WebAuthn] 🔑 Allowed credentials:', allowCredentialsWithBuffer.length);
    console.log('[WebAuthn] 🌐 Mediation: required (force native prompt)');
    console.log('[WebAuthn] ');
    console.log('[WebAuthn] ⏳ WAITING FOR USER TO SCAN BIOMETRIC...');
    console.log('[WebAuthn] 👆 User should see native prompt now (Face ID/Touch ID/Windows Hello/Fingerprint)');
    console.log('[WebAuthn] ');
    
    // ✅ CRITICAL FOR iOS/Safari - Use mediation to show native prompt
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: challengeBuffer,
        allowCredentials: allowCredentialsWithBuffer.length > 0 ? allowCredentialsWithBuffer : undefined,
        timeout,
        rpId,
        userVerification, // ✅ Use server setting ('required' = FORCE biometric)
      },
      mediation: 'required', // ✅ FORCE UI prompt on iOS/Safari
    }) as PublicKeyCredential | null;

    console.log('[WebAuthn] 📥 User completed biometric scan');
    console.log('[WebAuthn] Assertion received:', !!assertion);

    if (!assertion) {
      console.error('[WebAuthn] ❌ Authentication cancelled by user');
      throw new Error('Authentication cancelled');
    }

    console.log('[WebAuthn] ✅ Biometric authentication successful!');

    // Extract assertion data
    const response = assertion.response as AuthenticatorAssertionResponse;
    const credentialId = bufferToBase64(assertion.rawId);
    const authenticatorData = bufferToBase64(response.authenticatorData);
    const clientDataJSON = bufferToBase64(response.clientDataJSON);
    const signature = bufferToBase64(response.signature);
    const userHandle = response.userHandle ? bufferToBase64(response.userHandle) : undefined;

    // Verify on server
    const verifyResponse = await fetch('/api/attendance/biometric/webauthn/auth-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        credentialId,
        authenticatorData,
        clientDataJSON,
        signature,
        userHandle,
      }),
    });

    const verifyData = await verifyResponse.json();

    if (!verifyData.success) {
      throw new Error(verifyData.error || 'Verification failed');
    }

    console.log('[WebAuthn] 🎉 Authentication verified!');

    return {
      success: true,
      verified: true,
      authenticatorData,
      signature,
    };

  } catch (error: any) {
    console.error('[WebAuthn] ❌ Authentication error:', error);
    console.error('[WebAuthn] Error name:', error.name);
    console.error('[WebAuthn] Error message:', error.message);
    console.error('[WebAuthn] Error stack:', error.stack);
    
    // User-friendly error messages
    let errorMessage = error.message;
    
    if (error.name === 'NotAllowedError') {
      errorMessage = '❌ Biometric cancelled or permission denied. Please try again.';
    } else if (error.name === 'NotSupportedError') {
      errorMessage = '❌ Biometric not supported. Enable in device settings.';
    } else if (error.name === 'SecurityError') {
      errorMessage = '❌ Security error - WebAuthn requires HTTPS or localhost.';
    } else if (error.name === 'AbortError') {
      errorMessage = '⏱️ Timeout - No response. Check if biometric sensor is active.';
    } else if (error.name === 'InvalidStateError') {
      errorMessage = '🔄 Credential invalid or expired. Try Re-enrollment.';
    } else if (error.name === 'NotFoundError') {
      errorMessage = '🔍 No matching credential. Register biometric first.';
    } else if (error.name === 'NotReadableError') {
      errorMessage = '🔐 Cannot read biometric sensor. Check permissions.';
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Test biometric availability and prompt user
 */
export async function testBiometric(): Promise<{
  supported: boolean;
  available: boolean;
  type: string;
  icon: string;
  message: string;
}> {
  const supported = isWebAuthnSupported();
  const available = await isPlatformAuthenticatorAvailable();
  const type = getAuthenticatorName();
  const icon = getAuthenticatorIcon();
  
  let message = '';
  
  if (!supported) {
    message = '❌ WebAuthn not supported. Update your browser.';
  } else if (!available) {
    message = `⚠️ ${type} not available. Check device settings.`;
  } else {
    message = `✅ ${icon} ${type} ready!`;
  }
  
  return {
    supported,
    available,
    type,
    icon,
    message,
  };
}
