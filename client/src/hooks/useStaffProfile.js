import { useQuery } from '@tanstack/react-query';
import { supabaseClient } from '../services/supabaseClient.js';

export function useStaffProfile(user) {
  return useQuery({
    queryKey: ['staff-profile', user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabaseClient
        .schema('salon')
        .from('staff')
        .select('id, display_name, auth_user_id')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error(
          "Votre compte Supabase n'est pas encore associé à l'équipe salon. Contactez l'administrateur.",
        );
      }

      return data;
    },
  });
}
