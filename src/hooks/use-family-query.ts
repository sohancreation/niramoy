import { useActiveProfile } from '@/contexts/ActiveProfileContext';

/**
 * Hook that returns a helper to add family_member_id filter to Supabase queries.
 * When viewing self: filters for family_member_id IS NULL
 * When viewing family member: filters for family_member_id = id
 */
export function useFamilyFilter() {
  const { familyMemberId, isViewingFamily, activeMember } = useActiveProfile();

  /**
   * Apply family member filter to a Supabase query builder.
   * Usage: applyFilter(supabase.from('table').select('*').eq('user_id', userId))
   */
  const applyFilter = (query: any) => {
    if (familyMemberId) {
      return query.eq('family_member_id', familyMemberId);
    }
    return query.is('family_member_id', null);
  };

  /** Get the family_member_id value to include in INSERT payloads */
  const insertPayload = familyMemberId ? { family_member_id: familyMemberId } : {};

  return { applyFilter, insertPayload, familyMemberId, isViewingFamily, activeMember };
}
