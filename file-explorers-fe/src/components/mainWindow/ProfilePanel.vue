<template>
  <div class="profile-container">
    <!-- Logged In View -->
    <div v-if="isAuthenticated" class="profile-content">
      <h2 class="profile-title">Profile</h2>

      <div class="user-info outline-container">
        <div class="info-item">
          <span class="label">Username:</span>
          <span class="value">{{ user?.username }}</span>
        </div>
        <div class="info-item">
          <span class="label">Email:</span>
          <span class="value">{{ user?.email }}</span>
        </div>
        <div class="info-item">
          <span class="label">User ID:</span>
          <span class="value">{{ user?.id }}</span>
        </div>
      </div>

      <div class="actions">
        <button @click="handleLogout" class="btn btn-logout">
          Logout
        </button>
      </div>
    </div>

    <!-- Login/Register View -->
    <div v-else class="auth-content">
      <div class="auth-tabs">
        <button :class="['tab', { active: activeTab === 'login' }]" @click="activeTab = 'login'">
          Login
        </button>
        <button :class="['tab', { active: activeTab === 'register' }]" @click="activeTab = 'register'">
          Register
        </button>
      </div>

      <!-- Login Form -->
      <form v-if="activeTab === 'login'" @submit.prevent="handleLogin" class="auth-form outline-container">
        <h3>Login to Your Account</h3>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <div class="form-group">
          <label for="login-username">Username</label>
          <input id="login-username" v-model="loginForm.username" type="text" required placeholder="Enter your username"
            class="input-field" />
        </div>

        <div class="form-group">
          <label for="login-password">Password</label>
          <input id="login-password" v-model="loginForm.password" type="password" required
            placeholder="Enter your password" class="input-field" />
        </div>

        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading ? 'Logging in...' : 'Login' }}
        </button>
      </form>

      <!-- Register Form -->
      <form v-if="activeTab === 'register'" @submit.prevent="handleRegister" class="auth-form outline-container">
        <h3>Create New Account</h3>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <div class="form-group">
          <label for="register-username">Username</label>
          <input id="register-username" v-model="registerForm.username" type="text" required
            placeholder="Choose a username" class="input-field" />
        </div>

        <div class="form-group">
          <label for="register-email">Email</label>
          <input id="register-email" v-model="registerForm.email" type="email" required placeholder="Enter your email"
            class="input-field" />
        </div>

        <div class="form-group">
          <label for="register-password">Password</label>
          <input id="register-password" v-model="registerForm.password" type="password" required minlength="6"
            placeholder="Choose a password (min 6 characters)" class="input-field" />
        </div>

        <div class="form-group">
          <label for="register-confirm">Confirm Password</label>
          <input id="register-confirm" v-model="registerForm.confirmPassword" type="password" required
            placeholder="Confirm your password" class="input-field" />
        </div>

        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading ? 'Registering...' : 'Register' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';

const store = useStore();

const activeTab = ref<'login' | 'register'>('login');
const loading = ref(false);
const error = ref('');

const loginForm = ref({
  username: '',
  password: ''
});

const registerForm = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
});

const isAuthenticated = computed(() => store.getters['userStoreModule/isAuthenticated']);
const user = computed(() => store.getters['userStoreModule/getUser']);

const handleLogin = async () => {
  error.value = '';
  loading.value = true;

  try {
    const result = await store.dispatch('userStoreModule/login', {
      username: loginForm.value.username,
      password: loginForm.value.password
    });

    if (result.success) {
      loginForm.value = { username: '', password: '' };
    } else {
      error.value = result.error || 'Login failed';
    }
  } finally {
    loading.value = false;
    store.dispatch("levelStoreModule/fetchLevels");
  }
};

const handleRegister = async () => {
  error.value = '';

  if (registerForm.value.password !== registerForm.value.confirmPassword) {
    error.value = 'Passwords do not match';
    return;
  }

  loading.value = true;

  try {
    const result = await store.dispatch('userStoreModule/register', {
      username: registerForm.value.username,
      email: registerForm.value.email,
      password: registerForm.value.password
    });

    if (result.success) {
      registerForm.value = { username: '', email: '', password: '', confirmPassword: '' };
    } else {
      error.value = result.error || 'Registration failed';
    }
  } finally {
    loading.value = false;
    store.dispatch("levelStoreModule/fetchLevels");
  }
};

const handleLogout = () => {
  store.dispatch('userStoreModule/logout');
  error.value = '';
  // Refresh the page to reset all state
  window.location.reload();
};
</script>

<style scoped lang="scss">
.profile-container {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  padding: 40px 20px;
  color: var(--text);
}

.profile-content,
.auth-content {
  max-width: 900px;
  margin: 0 auto;
  width: 100%;
}

.profile-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.auth-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.profile-title {
  font-size: 48px;
  font-weight: 700;
  margin: 0 0 40px 0;
  color: var(--text);
  text-align: center;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: var(--element-background);
  padding: 24px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-color);

  &:last-child {
    border-bottom: none;
  }

  .label {
    font-weight: 600;
    color: var(--secondary-text);
  }

  .value {
    color: var(--text);
    font-weight: 500;
  }
}

.auth-tabs {
  display: flex;
  gap: 8px;
  border-bottom: 2px solid var(--border-color);
}

.tab {
  flex: 1;
  padding: 12px 24px;
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  color: var(--secondary-text);
  transition: all 0.3s ease;

  &:hover {
    color: var(--text);
  }

  &.active {
    color: var(--text);
    border-bottom-color: var(--primary);
  }
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: var(--element-background);
  padding: 24px;
  border-radius: 8px;
  border: 1px solid var(--border-color);

  h3 {
    margin: 0;
    font-size: 20px;
    color: var(--text);
    text-align: center;
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;

  label {
    font-weight: 600;
    color: var(--text);
    font-size: 14px;
  }

  .input-field {
    padding: 12px 16px;
    border: 2px solid var(--border-color);
    border-radius: 4px;
    font-size: 16px;
    transition: border-color 0.3s ease;
    background: var(--background-secondary);
    color: var(--text);

    &:focus {
      outline: none;
      border-color: var(--primary);
    }

    &::placeholder {
      color: var(--secondary-text);
    }
  }
}

.error-message {
  padding: 12px 16px;
  background: rgba(220, 53, 69, 0.2);
  color: #ff6b6b;
  border-radius: 4px;
  font-size: 14px;
  text-align: center;
  border: 1px solid rgba(220, 53, 69, 0.4);
}

.actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  flex: 1;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.btn-primary {
  background: var(--primary);
  color: var(--text);
  border: 1px solid var(--border-color);

  &:hover:not(:disabled) {
    background: #356d31;
    transform: translateY(-2px);
  }
}

.btn-logout {
  background: rgba(220, 53, 69, 0.3);
  color: #ff6b6b;
  border: 1px solid rgba(220, 53, 69, 0.4);

  &:hover {
    background: rgba(220, 53, 69, 0.5);
    transform: translateY(-2px);
  }
}

.outline-container {
  border: 1px solid var(--border-color);
  border-radius: 4px;
}
</style>
