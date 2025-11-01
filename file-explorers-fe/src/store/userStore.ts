import { Module, MutationTree } from "vuex";

export interface UserState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface User {
  id: number;
  username: string;
  email: string;
}

export interface RootState {
  // Define root state if needed
}

interface UserMutations extends MutationTree<UserState> {
  SET_USER(state: UserState, payload: User | null): void;
  SET_TOKEN(state: UserState, payload: string | null): void;
  SET_AUTHENTICATED(state: UserState, payload: boolean): void;
  LOGOUT(state: UserState): void;
}

export const userStoreModule: Module<UserState, RootState> = {
  namespaced: true,
  state() {
    // Load from localStorage if available
    const token = localStorage.getItem('auth_token');
    const userJson = localStorage.getItem('user');
    const user = userJson ? JSON.parse(userJson) : null;
    
    return {
      user: user,
      token: token,
      isAuthenticated: !!token
    }
  },
  getters: {
    getUser(state: UserState) { 
      return state.user 
    },
    getToken(state: UserState) { 
      return state.token 
    },
    isAuthenticated(state: UserState) { 
      return state.isAuthenticated 
    }
  },
  mutations: {
    SET_USER(state, payload: User | null) {
      state.user = payload;
      if (payload) {
        localStorage.setItem('user', JSON.stringify(payload));
      } else {
        localStorage.removeItem('user');
      }
    },
    SET_TOKEN(state, payload: string | null) {
      state.token = payload;
      if (payload) {
        localStorage.setItem('auth_token', payload);
      } else {
        localStorage.removeItem('auth_token');
      }
    },
    SET_AUTHENTICATED(state, payload: boolean) {
      state.isAuthenticated = payload;
    },
    LOGOUT(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    }
  } as UserMutations,
  actions: {
    async login({ commit }, credentials: { username: string; password: string }) {
      try {
        const response = await fetch(`${process.env.VUE_APP_API_URL || 'http://localhost:8080'}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(credentials),
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(error || 'Login failed');
        }

        const result = await response.json();
        
        // Backend wraps response in a 'data' field
        commit('SET_TOKEN', result.data.token);
        commit('SET_USER', result.data.user);
        commit('SET_AUTHENTICATED', true);
        
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },

    async register({ commit }, credentials: { username: string; email: string; password: string }) {
      try {
        const response = await fetch(`${process.env.VUE_APP_API_URL || 'http://localhost:8080'}/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(credentials),
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(error || 'Registration failed');
        }

        const result = await response.json();
        
        // Backend wraps response in a 'data' field
        commit('SET_TOKEN', result.data.token);
        commit('SET_USER', result.data.user);
        commit('SET_AUTHENTICATED', true);
        
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },

    logout({ commit }) {
      commit('LOGOUT');
    }
  },
}
