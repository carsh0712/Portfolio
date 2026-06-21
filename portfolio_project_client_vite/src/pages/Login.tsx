import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import AuthTextField from '../components/AuthTextField';
import FormError from '../components/FormError';
import PageCard from '../components/PageCard';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');

    try {
      await login(email, password);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : '로그인에 실패했습니다. 다시 시도해주세요.'
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">로그인</h1>
          <p className="text-gray-600">포트폴리오를 관리하려면 로그인하세요.</p>
        </div>

        <PageCard>
          <form onSubmit={handleSubmit} className="space-y-6">
            <FormError message={error} className="mb-0" />

            <AuthTextField
              id="email"
              label="이메일"
              type="email"
              value={email}
              onChange={setEmail}
              required
              disabled={isLoading}
              placeholder="email@example.com"
            />
            <AuthTextField
              id="password"
              label="비밀번호"
              type="password"
              value={password}
              onChange={setPassword}
              required
              disabled={isLoading}
              placeholder="********"
            />

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              계정이 없으신가요?{' '}
              <Link to="/register" className="text-blue-600 hover:text-blue-800 font-medium">
                회원가입
              </Link>
            </p>
          </div>
        </PageCard>
      </div>
    </div>
  );
}
