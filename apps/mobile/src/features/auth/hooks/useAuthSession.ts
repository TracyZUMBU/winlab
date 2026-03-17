import { useEffect, useState } from 'react';
import type { AuthSessionData } from '../types';
import { getCurrentSession } from '@/src/lib/supabase/session';

export const useAuthSession = (): AuthSessionData => {
  const [state, setState] = useState<AuthSessionData>({
    status: 'loading',
    session: null,
    user: null,
  });

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const { session, user } = await getCurrentSession();
        if (!isMounted) return;

        setState({
          status: user ? 'authenticated' : 'unauthenticated',
          session,
          user,
        });
      } catch {
        if (!isMounted) return;
        setState({
          status: 'unauthenticated',
          session: null,
          user: null,
        });
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, []);

  return state;
};

