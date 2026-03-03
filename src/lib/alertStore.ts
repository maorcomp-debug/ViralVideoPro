/**
 * Custom alert – replaces window.alert to avoid browser prefix "האתר X אומר".
 * Use showAlert(msg) instead of alert(msg) – shows only the message.
 */
type Listener = (msg: string | null) => void;
const listeners: Listener[] = [];
let currentMsg: string | null = null;

export function showAlert(msg: string): void {
  currentMsg = msg;
  listeners.forEach((fn) => fn(msg));
}

export function dismissAlert(): void {
  currentMsg = null;
  listeners.forEach((fn) => fn(null));
}

export function subscribe(fn: Listener): () => void {
  listeners.push(fn);
  return () => {
    const i = listeners.indexOf(fn);
    if (i >= 0) listeners.splice(i, 1);
  };
}

export function getAlert(): string | null {
  return currentMsg;
}
