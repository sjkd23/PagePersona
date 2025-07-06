import { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import { useAuth } from '../../hooks/useAuth';

interface AuthProps {
  initialMode?: 'login' | 'register';
  onSuccess?: () => void;
}

export default function Auth({ initialMode = 'login', onSuccess }: AuthProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const { login, register, isLoading, error, clearError } = useAuth();

  const handleLogin = async (data: { login: string; password: string }) => {
    const result = await login(data.login, data.password);
    if (result.success) {
      onSuccess?.();
    }
  };

  const handleRegister = async (data: {
    username: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }) => {
    const result = await register(data);
    if (result.success) {
      onSuccess?.();
    }
  };

  const switchToRegister = () => {
    clearError();
    setMode('register');
  };

  const switchToLogin = () => {
    clearError();
    setMode('login');
  };

  if (mode === 'login') {
    return (
      <LoginForm
        onSubmit={handleLogin}
        onSwitchToRegister={switchToRegister}
        isLoading={isLoading}
        error={error}
      />
    );
  }

  return (
    <RegisterForm
      onSubmit={handleRegister}
      onSwitchToLogin={switchToLogin}
      isLoading={isLoading}
      error={error}
    />
  );
}
