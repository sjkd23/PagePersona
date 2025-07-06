import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

interface AuthContainerProps {
  initialMode?: 'login' | 'signup';
}

export default function AuthContainer({ initialMode = 'login' }: AuthContainerProps) {
  const [isLoginMode, setIsLoginMode] = useState(initialMode === 'login');
  const { login, register, isLoading, error, clearError } = useAuth();

  const handleLoginSubmit = async (data: { login: string; password: string }) => {
    const result = await login(data.login, data.password);
    if (!result.success) {
      // Error is already set in the auth context
      console.error('Login failed:', result.error);
    }
  };

  const handleRegisterSubmit = async (data: {
    username: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }) => {
    const result = await register(data);
    if (!result.success) {
      // Error is already set in the auth context
      console.error('Registration failed:', result.error);
    }
  };

  const switchToLogin = () => {
    setIsLoginMode(true);
    clearError();
  };

  const switchToRegister = () => {
    setIsLoginMode(false);
    clearError();
  };

  return (
    <>
      {isLoginMode ? (
        <LoginForm
          onSubmit={handleLoginSubmit}
          onSwitchToRegister={switchToRegister}
          isLoading={isLoading}
          error={error}
        />
      ) : (
        <RegisterForm
          onSubmit={handleRegisterSubmit}
          onSwitchToLogin={switchToLogin}
          isLoading={isLoading}
          error={error}
        />
      )}
    </>
  );
}
