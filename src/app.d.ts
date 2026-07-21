// See https://svelte.dev/docs/kit/types#app.d.ts
import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { Locale } from '$lib/i18n/config';
import type { PendingInvite } from '$lib/auth/invite-decision';
import type { MemberContext } from '$lib/auth/member-session';
import type { PersonProfileStatus } from '$lib/auth/profile-onboarding';
import type { OnboardingState } from '$lib/auth/session';
import type { Workspace } from '$lib/types';

declare global {
	interface Document {
		startViewTransition?: (callback: () => void | Promise<void>) => {
			finished: Promise<void>;
			ready: Promise<void>;
			updateCallbackDone: Promise<void>;
		};
	}

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
			invitedMember?: boolean;
			invitedMemberResolved?: boolean;
			memberContext?: MemberContext | null;
			memberContextResolved?: boolean;
			personProfile?: PersonProfileStatus | null;
			personProfileResolved?: boolean;
		}
	}
}

/// <reference types="vite-plugin-pwa/info" />
/// <reference types="vite-plugin-pwa/svelte" />
/// <reference types="vite-plugin-pwa/vanillajs" />

export {};
