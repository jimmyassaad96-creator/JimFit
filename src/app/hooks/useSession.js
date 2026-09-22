import { useState, useEffect } from "react";
import { deriveClientName, deriveClientLastName, deriveClientPhone } from "../../domain/selectors.js";
import { PREF_KEY } from "../../domain/group1.js";
import { sb } from "../../platform/supabase.js";

/**
 * Who is signed in: the Supabase session, the display name/phone derived from
 * it, and the password-recovery mode the auth listener flips.
 *
 * The listener and its unsubscribe stay in one effect, in the order they were
 * written — the gate chain reads nameChecked and clientName on the very first
 * render, so a change here shows a blank screen rather than a wrong value.
 *
 * `setAppName` is passed in because the same effect also restores the stored
 * app name; splitting that out would turn one effect into two.
 */
export function useSession({ setAppName }) {
    const [clientName, setClientName] = useState(null);
    const [clientLastName, setClientLastName] = useState(""); // carried from signup into ProfileGate only
    const [clientPhone, setClientPhone] = useState(""); // carried from signup into ProfileGate only, same as clientLastName
    const [userId, setUserId] = useState(null);
    const [userEmail, setUserEmail] = useState(null);
    const [nameChecked, setNameChecked] = useState(false);
    const [recoveryMode, setRecoveryMode] = useState(false);

    useEffect(() => {
      try {
        const raw = localStorage.getItem(PREF_KEY);
        if (raw) {
          const p = JSON.parse(raw);
          setAppName(p.appName || "JimFit");
        }
      } catch (err) {}
      if (!sb) { setNameChecked(true); return; }
      sb.auth.getSession().then(({ data }) => {
        const user = data.session && data.session.user;
        setClientName(deriveClientName(user));
        setClientLastName(deriveClientLastName(user));
        setClientPhone(deriveClientPhone(user));
        setUserId(user ? user.id : null);
        setUserEmail(user ? user.email : null);
        setNameChecked(true);
      });
      const { data: authListener } = sb.auth.onAuthStateChange((event, session) => {
        if (event === "PASSWORD_RECOVERY") { setRecoveryMode(true); return; }
        const user = session && session.user;
        setClientName(deriveClientName(user));
        setClientLastName(deriveClientLastName(user));
        setClientPhone(deriveClientPhone(user));
        setUserId(user ? user.id : null);
        setUserEmail(user ? user.email : null);
      });
      return () => { authListener && authListener.subscription && authListener.subscription.unsubscribe(); };
    }, []);

    async function handleRecoveryDone() {
      const { data } = await sb.auth.getSession();
      const user = data.session && data.session.user;
      setClientName(deriveClientName(user));
      setClientLastName(deriveClientLastName(user));
      setClientPhone(deriveClientPhone(user));
      setUserId(user ? user.id : null);
      setUserEmail(user ? user.email : null);
      setRecoveryMode(false);
    }

  return {
    clientName, setClientName, clientLastName, setClientLastName,
    clientPhone, setClientPhone, userId, setUserId, userEmail, setUserEmail,
    nameChecked, recoveryMode, setRecoveryMode, handleRecoveryDone,
  };
}
