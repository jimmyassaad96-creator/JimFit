import { useState, useEffect } from "react";
import { sb } from "../../platform/supabase.js";

/**
 * The signed-in client's `client_profiles` row, with a single retry and an
 * explicit failed state rather than an empty profile on a network blip.
 *
 * Carries the client-side gym-freeze check added Sept 19 2026: freezing a gym
 * used to sign out only its owner and trainers, so a client of that gym stayed
 * logged in while the gym owner was being told nobody could. Same safety-net
 * shape as the trainer check in useTrainerIdentity.
 *
 * Skipped entirely when `trainerInfo` is set — a trainer has no client profile.
 */
export function useClientProfile({ userId, trainerInfo, profile, setProfile }) {
    const [profileChecked, setProfileChecked] = useState(false);
    const [profileFetchFailed, setProfileFetchFailed] = useState(false);
    const [profileRetryTick, setProfileRetryTick] = useState(0);

    useEffect(() => {
      if (!userId || trainerInfo || !sb) { setProfileChecked(true); return; }
      setProfileChecked(false);
      setProfileFetchFailed(false);
      let cancelled = false;
      // Not .maybeSingle() on purpose: that call errors out (and silently
      // looks like "no profile") if this user_id ever has more than one row
      // — which is exactly what caused the duplicate-profile bug. Taking the
      // oldest row instead means a stray duplicate can never make the app
      // think someone has no profile and prompt them to make another one.
      //
      // A plain network error here needs the same protection: on weak signal
      // this select can fail outright, and mistaking that for "no profile"
      // bounces an existing client straight into the onboarding questionnaire
      // — and if they then tap Skip, it risks creating a second profile row.
      // Retry once before giving up, and land on a distinct "couldn't load"
      // screen rather than the questionnaire if it still fails.
      function fetchProfile(retriesLeft) {
        sb.from("client_profiles").select("*").eq("user_id", userId).order("created_at", { ascending: true }).limit(1).then(async ({ data, error: err }) => {
          if (cancelled) return;
          if (err) {
            if (retriesLeft > 0) { setTimeout(() => fetchProfile(retriesLeft - 1), 1200); return; }
            setProfileFetchFailed(true);
            setProfileChecked(true);
            return;
          }
          const row = data && data.length ? data[0] : null;
          // Sept 19 2026 inspection fix: freezing a gym only ever signed out
          // its owner and trainers (see the trainer-check effect above) —
          // nothing checked a CLIENT's own gym against the freeze flag, even
          // though GymOwnerView's own copy tells the gym owner "trainers and
          // clients can't log in until this is resolved." Same safety-net
          // shape as the trainer-side check: also catches an already-open
          // session, not just a fresh login, since this effect reruns on
          // every login/reload.
          if (row && row.gym_id) {
            const { data: gymRow } = await sb.from("gyms").select("is_frozen").eq("id", row.gym_id).maybeSingle();
            if (cancelled) return;
            if (gymRow && gymRow.is_frozen) {
              await sb.auth.signOut();
              setUserId(null);
              setUserEmail(null);
              setProfile(null);
              setProfileChecked(true);
              return;
            }
          }
          setProfile(row);
          setProfileChecked(true);
        });
      }
      fetchProfile(1);
      return () => { cancelled = true; };
    }, [userId, trainerInfo, profileRetryTick]);

  return { profileChecked, profileFetchFailed, setProfileRetryTick };
}
