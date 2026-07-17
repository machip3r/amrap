// See https://svelte.dev/docs/kit/types#app.d.ts
import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { Locale } from '$lib/i18n/config';
import type { PendingInvite } from '$lib/auth/invite-decision';
import type { MemberContext } from '$lib/auth/member-session';
import type { PersonProfileStatus } from '$lib/auth/profile-onboarding';
import type { OnboardingState } from '$lib/auth/session';
import type { Workspace } from '$lib/types';

declare global {
	namespace App {
		interface Locals {
			supabase: SupabaseClient;
			user: User | null;
			locale: Locale;
			/** Request-scoped caches — avoid duplicate Auth/DB work in one load. */
			workspace?: Workspace | null;
			workspaceResolved?: boolean;
			workspaceInflight?: Promise<Workspace | null>;
			onboardingState?: OnboardingState | null;
			onboardingResolved?: boolean;
			pendingInvite?: PendingInvite | null;
			pendingInviteResolved?: boolean;
			invitedOps?: boolean;
			invitedOpsResolved?: boolean;
			memberContext?: MemberContext | null;
			memberContextResolved?: boolean;
			personProfile?: PersonProfileStatus | null;
			personProfileResolved?: boolean;
		}
	}
}

export {};
