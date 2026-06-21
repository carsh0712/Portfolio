import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * 라우트 변경 시 스크롤을 최상단으로 이동시키는 컴포넌트
 */
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default ScrollToTop;
