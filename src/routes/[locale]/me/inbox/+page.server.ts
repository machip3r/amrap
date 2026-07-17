import { createClient } from '$lib/supabase/server';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	const { locale, d, member } = await parent();

	const supabase = createClient();
	const { data: messages } = await supabase
		.from('inbox_messages')
		.select('id, title, body, kind, read_at, created_at, gym_id')
		.eq('recipient_person_id', member.personId)
		.order('created_at', { ascending: false })
		.limit(50);

	const unread = (messages ?? []).filter((m) => !m.read_at);
	if (unread.length > 0) {
		await supabase
			.from('inbox_messages')
			.update({ read_at: new Date().toISOString() })
			.eq('recipient_person_id', member.personId)
			.is('read_at', null);
	}

	return {
		locale,
		d,
		messages: (messages ?? []).map((m) => ({
			id: m.id as string,
			title: m.title as string,
			body: m.body as string,
			read_at: m.read_at as string | null,
			created_at: m.created_at as string
		}))
	};
};
