import * as actions from '../actions/settings';
import type { Author } from './comments';
import { update } from './utils';
import produce from 'immer';

export interface SettingsState {
  user: Author | null;
  commentsEnabled: boolean;
  currentTab: string | null;
  componentStyle: string | null;
  apiEnabled: boolean;
  apiUrl: string;
  apiKey: string;
  authUserId: number | null;
  shareType: string;
}

export type SettingsStateUpdate = Partial<SettingsState>;

// Reducer with initial state
export const INITIAL_STATE: SettingsState = {
  user: null,
  commentsEnabled: false,
  currentTab: null,
  componentStyle: null,
  apiEnabled: false,
  apiUrl: '',
  apiKey: '',
  authUserId: null,
  shareType: '',
};

export const reducer = produce((draft: SettingsState, action: actions.Action) => {
  switch (action.type) {
  case actions.UPDATE_GLOBAL_SETTINGS:
    update(draft, action.update);
    break;
  default:
    break;
  }
}, INITIAL_STATE);
