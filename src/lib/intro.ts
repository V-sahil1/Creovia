// Tiny signal so the hero and smooth scroll wait for the preloader to finish.
let done = false;
const listeners = new Set<() => void>();

export function markIntroDone() {
  done = true;
  listeners.forEach((cb) => cb());
  listeners.clear();
}

// Calls cb once the intro is done (immediately if it already is). Returns an unsubscribe.
export function onIntroDone(cb: () => void) {
  if (done) {
    cb();
    return () => {};
  }
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
