/**
 * Browser capability and permission helpers for the lobby (PRD F3, §9).
 * Text only — the recovery instructions are per-browser because a generic
 * "allow camera access" message is exactly what users cannot act on.
 */
export function supportsCalls(): boolean {
  if (typeof window === "undefined") return true;
  return (
    typeof window.RTCPeerConnection === "function" &&
    typeof navigator.mediaDevices?.getUserMedia === "function"
  );
}

export type BrowserFamily = "chrome" | "edge" | "firefox" | "safari" | "other";

export function detectBrowser(): BrowserFamily {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;
  if (/Edg\//.test(ua)) return "edge";
  if (/Chrome\//.test(ua) && !/OPR\//.test(ua)) return "chrome";
  if (/Firefox\//.test(ua)) return "firefox";
  if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return "safari";
  return "other";
}

export function isMobileBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export type MediaErrorKind =
  "denied" | "not_found" | "in_use" | "constraints" | "unknown";

export function classifyMediaError(error: unknown): MediaErrorKind {
  const name = (error as { name?: string } | null)?.name ?? "";
  switch (name) {
    case "NotAllowedError":
    case "PermissionDeniedError":
    case "SecurityError":
      return "denied";
    case "NotFoundError":
    case "DevicesNotFoundError":
      return "not_found";
    case "NotReadableError":
    case "TrackStartError":
    case "AbortError":
      return "in_use";
    case "OverconstrainedError":
    case "ConstraintNotSatisfiedError":
      return "constraints";
    default:
      return "unknown";
  }
}

export function mediaErrorTitle(kind: MediaErrorKind): string {
  switch (kind) {
    case "denied":
      return "Camera and microphone are blocked";
    case "not_found":
      return "No camera or microphone found";
    case "in_use":
      return "Your device is busy";
    case "constraints":
      return "That device setting isn't available";
    case "unknown":
      return "Couldn't start your devices";
  }
}

export function permissionSteps(
  kind: MediaErrorKind,
  browser: BrowserFamily,
): string[] {
  if (kind === "not_found") {
    return [
      "Plug in or enable a camera or microphone, then reload.",
      "You can still join and listen — audio and video are optional.",
    ];
  }
  if (kind === "in_use") {
    return [
      "Another app or tab may be using your camera or microphone.",
      "Close it (or the other tab) and choose the device again.",
    ];
  }
  if (kind === "constraints" || kind === "unknown") {
    return ["Pick a different device from the list, or reload and try again."];
  }
  switch (browser) {
    case "chrome":
    case "edge":
      return [
        "Click the camera icon (or the lock/tune icon) at the left of the address bar.",
        "Set Camera and Microphone to Allow.",
        "Reload this page.",
      ];
    case "firefox":
      return [
        "Click the permissions icon at the left of the address bar.",
        "Remove the blocked Camera and Microphone entries.",
        "Reload and choose Allow when asked.",
      ];
    case "safari":
      return [
        "Open Safari › Settings for This Website (or the aA menu on iPhone).",
        "Set Camera and Microphone to Allow.",
        "Reload this page.",
      ];
    default:
      return [
        "Open your browser's site permissions for this page.",
        "Allow Camera and Microphone, then reload.",
      ];
  }
}

/** Rough downlink estimate in Mbps when the browser exposes it (F3 pre-check). */
export function estimatedDownlinkMbps(): number | null {
  if (typeof navigator === "undefined") return null;
  const conn = (navigator as Navigator & { connection?: { downlink?: number } })
    .connection;
  const value = conn?.downlink;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/** Client-side mirror of the upload allowlist (server remains authoritative). */
export const UPLOAD_MAX_BYTES = 25 * 1024 * 1024;
export const UPLOAD_ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/zip",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);
export const UPLOAD_ACCEPT =
  ".png,.jpg,.jpeg,.gif,.webp,.pdf,.txt,.csv,.zip,.docx,.xlsx,.pptx";
