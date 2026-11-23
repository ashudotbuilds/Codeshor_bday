'use client';

import { createContext, useContext, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { sendJson } from './wish-form';

const Jobs = createContext(null);
const providers = ['claude', 'gemini', 'openai'];

export function useStoryboardJobs() {
  return useContext(Jobs);
}

function storageKey(organizer, provider) {
  return 'birthday-adda:provider-key:' + organizer + ':' + provider;
}

export function savedProviderKey(organizer, provider) {
  try {
    return sessionStorage.getItem(storageKey(organizer, provider)) ?? '';
  } catch {
    return '';
  }
}

export function rememberProviderKeys(organizer, entries) {
  try {
    for (const [provider, key] of entries) sessionStorage.setItem(storageKey(organizer, provider), key.trim());
    return true;
  } catch {
    return false;
  }
}

export function forgetProviderKeys(organizer) {
  try {
    for (const provider of providers) sessionStorage.removeItem(storageKey(organizer, provider));
    return true;
  } catch {
    return false;
  }
}

export function StoryboardJobs({ organizer, children }) {
  const router = useRouter();
  const running = useRef(new Set());
  const [jobs, setJobs] = useState({});

  function update(id, job) {
    setJobs(current => ({ ...current, [id]: job }));
  }

  function dismiss(id) {
    setJobs(current => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  }

  function start(id, payload, { pending, success }, storageFailed = false) {
    if (running.current.has(id)) return false;
    running.current.add(id);
    update(id, { pending: true, message: pending, storageFailed });
    void sendJson('/api/cards/' + id + '/storyboard', payload, {
      offline: 'Lost connection while updating the storyboard. Refresh the board to check whether it finished.',
      fallback: 'The storyboard request didn’t finish. Refresh the board before trying again.'
    })
      .then(() => {
        update(id, { message: success, storageFailed });
        router.refresh();
      }, failure => {
        update(id, { failed: true, message: failure.message, storageFailed });
      })
      .finally(() => running.current.delete(id));
    return true;
  }

  return <Jobs.Provider value={{ organizer, jobs, start }}>
    {children}
    <div className="storyboard-job-notices" aria-live="polite" aria-atomic="false">
      {Object.entries(jobs).map(([id, job]) => <div className="storyboard-job-notice" key={id}>
        <div>
          <p className={job.failed ? 'error' : undefined}>{job.message}</p>
          {job.storageFailed && <p>Your browser couldn’t remember the API key for this tab.</p>}
        </div>
        {!job.pending && <button className="text-link" type="button" onClick={() => dismiss(id)}>Dismiss</button>}
      </div>)}
    </div>
  </Jobs.Provider>;
}
