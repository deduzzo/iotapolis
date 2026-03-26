import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useIdentity } from '../hooks/useIdentity';

/**
 * Checks if the user needs onboarding:
 * 1. No forum_setup in localStorage → redirect to /setup (choose create/connect)
 * 2. No identity (no keypair) → redirect to /identity (generate keypair)
 * 3. Has keypair but no username → redirect to /identity (register)
 * 4. Everything ok → render children
 *
 * Whitelisted routes that don't require onboarding: /setup, /identity, /settings
 */

const SETUP_KEY = 'forum_setup_done';
const WHITELIST = ['/setup', '/identity', '/settings'];

export default function OnboardingGuard({ children }) {
  const { identity, loading } = useIdentity();
  const location = useLocation();
  const navigate = useNavigate();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (loading) return;

    const currentPath = location.pathname;

    // Don't redirect if already on a whitelisted page
    if (WHITELIST.some(p => currentPath.startsWith(p))) {
      setChecked(true);
      return;
    }

    const setupDone = localStorage.getItem(SETUP_KEY);

    // Step 1: No setup done yet → go to /setup
    if (!setupDone) {
      navigate('/setup', { replace: true });
      return;
    }

    // Step 2: No identity at all → go to /identity
    if (!identity) {
      navigate('/identity', { replace: true });
      return;
    }

    // Step 3: Has wallet but no username → go to /identity
    if (identity.address && !identity.username) {
      navigate('/identity', { replace: true });
      return;
    }

    // All good
    setChecked(true);
  }, [identity, loading, location.pathname, navigate]);

  if (loading || !checked) {
    // Show nothing while checking — avoids flash
    return null;
  }

  return children;
}
