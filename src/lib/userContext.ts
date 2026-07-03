import { AsyncLocalStorage } from 'async_hooks';

export interface UserSessionStore {
  userId: string | null;
}

export const userSessionStore = new AsyncLocalStorage<UserSessionStore>();
