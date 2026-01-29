import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Profile() {
  const { user: authUser } = useAuth();
  const user = {
    username: authUser?.username || '사용자',
    email: authUser?.email || '',
    createdAt: '-',
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <Link to="/home" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-8">
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        홈으로 돌아가기
      </Link>

      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center gap-6 mb-8">
          <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user.username}</h1>
            <p className="text-gray-600">{user.email}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">계정 정보</h2>
            <div className="space-y-4">
              <div className="flex justify-between py-3 border-b border-gray-200">
                <span className="text-gray-600">사용자명</span>
                <span className="text-gray-900 font-medium">{user.username}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-200">
                <span className="text-gray-600">이메일</span>
                <span className="text-gray-900 font-medium">{user.email}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-200">
                <span className="text-gray-600">가입일</span>
                <span className="text-gray-900 font-medium">{user.createdAt}</span>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
              프로필 수정
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
