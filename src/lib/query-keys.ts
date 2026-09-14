/** Central TanStack Query keys so invalidation never drifts from usage. */
export const queryKeys = {
  meetings: (params?: { limit?: number; offset?: number }) =>
    ["meetings", params ?? {}] as const,
  meetingsAll: () => ["meetings"] as const,
  meeting: (idOrCode: string) => ["meeting", idOrCode] as const,
  summary: (idOrCode: string) => ["summary", idOrCode] as const,
  transcript: (idOrCode: string) => ["transcript", idOrCode] as const,
  recordings: (idOrCode: string) => ["recordings", idOrCode] as const,
  polls: (idOrCode: string) => ["polls", idOrCode] as const,
  sessionParticipants: (sessionId: string) =>
    ["session-participants", sessionId] as const,
  knocks: (sessionId: string) => ["knocks", sessionId] as const,
  messages: (sessionId: string) => ["messages", sessionId] as const,
  usage: () => ["usage"] as const,
  audit: () => ["audit"] as const,
  passkeys: () => ["passkeys"] as const,
  authSessions: () => ["auth-sessions"] as const,
};
