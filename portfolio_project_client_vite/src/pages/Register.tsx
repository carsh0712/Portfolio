import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthTextField from '../components/AuthTextField';
import FormError from '../components/FormError';
import PageCard from '../components/PageCard';
import { signup } from '../utils/api';

export default function Register() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setIsLoading(true);

    try {
      await signup({ email, password, username });
      alert('회원가입이 완료되었습니다. 로그인해주세요.');
      navigate('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : '회원가입에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">회원가입</h1>
          <p className="text-gray-600">새 계정을 만들어 포트폴리오를 관리하세요.</p>
        </div>

        <PageCard>
          <FormError message={error} />

          <form onSubmit={handleSubmit} className="space-y-6">
            <AuthTextField
              id="username"
              label="사용자명"
              value={username}
              onChange={setUsername}
              required
              disabled={isLoading}
              placeholder="홍길동"
            />
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
              minLength={8}
              placeholder="8자 이상 입력"
            />
            <AuthTextField
              id="confirmPassword"
              label="비밀번호 확인"
              type="password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              required
              disabled={isLoading}
              placeholder="비밀번호 재입력"
            />

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {isLoading ? '가입 중...' : '가입하기'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              이미 계정이 있으신가요?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-800 font-medium">
                로그인
              </Link>
            </p>
          </div>
        </PageCard>
      </div>
    </div>
  );
}
