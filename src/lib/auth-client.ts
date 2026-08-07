import { createAuthClient } from "better-auth/react";
import { passkeyClient } from "@better-auth/passkey/client";
import { emailOTPClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [passkeyClient(), emailOTPClient()],
});

export const { useSession, signIn, signUp, signOut, passkey, emailOtp } = authClient;
