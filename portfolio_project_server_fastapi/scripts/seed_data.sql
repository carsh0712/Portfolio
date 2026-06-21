-- ============================================
-- Portfolio Database Seed Data
-- Source: portfolio_project_client_vite/src/data/*.json
-- ============================================

-- 기존 데이터 정리 (FK 순서 역순으로 삭제)
DELETE FROM cors_origin;
DELETE FROM upload_file;
DELETE FROM project;
DELETE FROM portfolio;
DELETE FROM `user`;

-- Auto increment 초기화
ALTER TABLE `user` AUTO_INCREMENT = 1;
ALTER TABLE portfolio AUTO_INCREMENT = 1;
ALTER TABLE project AUTO_INCREMENT = 1;

-- ============================================
-- 1. User
-- ============================================
-- Password: admin123
INSERT INTO `user` (username, email, password_hash, created_at, updated_at)
VALUES ('admin', 'admin@portfolio.com',
    '$2b$12$hjAHP1zckzy9F7mjxMAv.elpTjkEnTzTu5jll0oq0lP7FkC83sHuu',
    NOW(), NOW());

SET @user_id = LAST_INSERT_ID();

-- ============================================
-- 2. Portfolios (from categories.json)
-- ============================================
INSERT INTO portfolio (user_id, code, name, description, file_uuid, `order`, is_public, created_at, updated_at)
VALUES
    (@user_id, 'MYAPPS', '내가 만든 앱',    '직접 개발한 애플리케이션 모음',     NULL, 1, TRUE, NOW(), NOW()),
    (@user_id, 'GAMES', '내가 깬 게임',    '클리어한 게임 목록과 플레이 후기',   NULL, 2, TRUE, NOW(), NOW()),
    (@user_id, 'ARTWORKS', '내가 그린 그림',  '디지털 아트 및 일러스트 작품',       NULL, 3, TRUE, NOW(), NOW());

SET @cat_apps     = LAST_INSERT_ID();
SET @cat_games    = @cat_apps + 1;
SET @cat_artworks = @cat_apps + 2;

-- ============================================
-- 3. Project Items (from projects.json)
-- ============================================
INSERT INTO project (portfolio_id, code, title, summary, thumbnail_file_uuid, tags, `order`, is_public, description, tech_stack, screenshots, links, start_date, end_date, features, created_at, updated_at)
VALUES
    (@cat_apps, 'ECOMM', 'E-Commerce Platform',
     'React와 Node.js로 구축한 풀스택 쇼핑몰 플랫폼',
     NULL,
     '["Web", "Full-Stack", "E-Commerce"]',
     0, TRUE,
     '사용자 인증, 상품 관리, 장바구니, 결제 시스템을 포함한 완전한 이커머스 솔루션입니다. Redux를 활용한 상태 관리와 Stripe API를 통한 결제 처리를 구현했습니다.',
     '["React", "TypeScript", "Node.js", "Express", "MongoDB", "Redux", "Stripe API"]',
     '[{"file_uuid": "a0000000000000000000000000000001", "caption": "메인 페이지"}, {"file_uuid": "a0000000000000000000000000000002", "caption": "상품 목록"}, {"file_uuid": "a0000000000000000000000000000003", "caption": "장바구니"}, {"file_uuid": "a0000000000000000000000000000004", "caption": "결제 페이지"}]',
     '[{"name": "github", "url": "https://github.com/username/ecommerce", "background_color": "#181717", "text_color": "#ffffff", "icon": "github"}, {"name": "demo", "url": "https://ecommerce-demo.com", "background_color": "#007bff", "text_color": "#ffffff", "icon": "globe"}, {"name": "blog", "url": "https://blog.example.com/ecommerce-dev-log", "background_color": "#28a745", "text_color": "#ffffff", "icon": "book"}]',
     '2024-01', '2024-06',
     '["JWT 기반 사용자 인증", "상품 검색 및 필터링", "실시간 장바구니 업데이트", "Stripe 결제 연동", "주문 내역 관리", "관리자 대시보드"]',
     NOW(), NOW()),

    (@cat_apps, 'TASKMGR', 'Task Management App',
     '팀 협업을 위한 칸반 보드 스타일 태스크 관리 앱',
     NULL,
     '["Web", "Productivity", "Collaboration"]',
     1, TRUE,
     '드래그 앤 드롭으로 태스크를 관리할 수 있는 협업 도구입니다. 실시간 동기화와 팀원 간 알림 기능을 제공합니다.',
     '["React", "TypeScript", "Firebase", "Tailwind CSS", "React DnD"]',
     '[{"file_uuid": "a0000000000000000000000000000005", "caption": "칸반 보드"}, {"file_uuid": "a0000000000000000000000000000006", "caption": "태스크 상세"}, {"file_uuid": "a0000000000000000000000000000007", "caption": "팀 관리"}]',
     '[{"name": "github", "url": "https://github.com/username/taskmanager", "background_color": "#181717", "text_color": "#ffffff", "icon": "github"}]',
     '2024-03', '2024-05',
     '["드래그 앤 드롭 인터페이스", "실시간 데이터 동기화", "팀 멤버 초대 및 권한 관리", "태스크 마감일 알림", "프로젝트별 보드 관리"]',
     NOW(), NOW()),

    (@cat_apps, 'WEATHER', 'Weather Dashboard',
     'OpenWeather API를 활용한 날씨 정보 대시보드',
     NULL,
     '["Web", "Dashboard", "API Integration"]',
     2, TRUE,
     '위치 기반 날씨 정보와 5일 예보를 제공하는 대시보드입니다. 다양한 차트를 통해 기온, 습도, 풍속 등의 데이터를 시각화합니다.',
     '["React", "TypeScript", "Chart.js", "OpenWeather API", "Geolocation API"]',
     '[{"file_uuid": "a0000000000000000000000000000008", "caption": "날씨 대시보드"}, {"file_uuid": "a0000000000000000000000000000009", "caption": "5일 예보"}]',
     '[{"name": "github", "url": "https://github.com/username/weather", "background_color": "#181717", "text_color": "#ffffff", "icon": "github"}, {"name": "demo", "url": "https://weather-demo.com", "background_color": "#0ea5e9", "text_color": "#ffffff", "icon": "globe"}]',
     '2024-02', '2024-02',
     '["현재 위치 기반 날씨 조회", "도시 검색 기능", "5일 날씨 예보", "기온/습도/풍속 차트", "다크 모드 지원"]',
     NOW(), NOW()),

    (@cat_apps, 'RTCHAT', 'Real-time Chat Application',
     'WebSocket 기반 실시간 채팅 애플리케이션',
     NULL,
     '["Web", "Full-Stack", "Real-time"]',
     3, TRUE,
     'Socket.io를 활용한 실시간 메시징 플랫폼입니다. 1:1 채팅, 그룹 채팅, 파일 공유 기능을 지원합니다.',
     '["React", "Node.js", "Socket.io", "PostgreSQL", "Redis"]',
     '[{"file_uuid": "a0000000000000000000000000000010", "caption": "채팅 목록"}, {"file_uuid": "a0000000000000000000000000000011", "caption": "채팅방"}, {"file_uuid": "a0000000000000000000000000000012", "caption": "파일 공유"}]',
     '[{"name": "github", "url": "https://github.com/username/realtime-chat", "background_color": "#181717", "text_color": "#ffffff", "icon": "github"}, {"name": "demo", "url": "https://chat-demo.com", "background_color": "#22c55e", "text_color": "#ffffff", "icon": "globe"}, {"name": "blog", "url": "https://blog.example.com/realtime-chat-dev-log", "background_color": "#28a745", "text_color": "#ffffff", "icon": "book"}]',
     '2024-04', '2024-07',
     '["실시간 메시지 전송", "그룹 채팅방 생성", "이미지/파일 공유", "읽음 표시 기능", "메시지 검색"]',
     NOW(), NOW()),

    (@cat_apps, 'BLOGCMS', 'Blog CMS',
     '마크다운 기반 블로그 콘텐츠 관리 시스템',
     NULL,
     '["Web", "CMS", "SEO"]',
     4, TRUE,
     'Next.js와 MDX를 활용한 정적 블로그 시스템입니다. SEO 최적화와 빠른 페이지 로딩을 제공합니다.',
     '["Next.js", "TypeScript", "MDX", "Prisma", "Vercel"]',
     '[{"file_uuid": "a0000000000000000000000000000013", "caption": "블로그 홈"}, {"file_uuid": "a0000000000000000000000000000014", "caption": "글 작성"}]',
     '[{"name": "github", "url": "https://github.com/username/blog-cms", "background_color": "#181717", "text_color": "#ffffff", "icon": "github"}, {"name": "demo", "url": "https://blog-demo.com", "background_color": "#1e293b", "text_color": "#ffffff", "icon": "globe"}]',
     '2024-05', '2024-06',
     '["마크다운 에디터", "카테고리/태그 관리", "SEO 최적화", "RSS 피드 생성", "댓글 시스템"]',
     NOW(), NOW()),

    (@cat_apps, 'EXPENSE', 'Expense Tracker',
     '개인 재무 관리를 위한 지출 추적 앱',
     NULL,
     '["Mobile", "Finance", "Productivity"]',
     5, TRUE,
     '수입과 지출을 카테고리별로 관리하고 월별 리포트를 제공하는 재무 관리 애플리케이션입니다.',
     '["React Native", "TypeScript", "SQLite", "Victory Charts"]',
     '[{"file_uuid": "a0000000000000000000000000000015", "caption": "대시보드"}, {"file_uuid": "a0000000000000000000000000000016", "caption": "지출 입력"}, {"file_uuid": "a0000000000000000000000000000017", "caption": "월별 리포트"}]',
     '[{"name": "github", "url": "https://github.com/username/expense-tracker", "background_color": "#181717", "text_color": "#ffffff", "icon": "github"}, {"name": "download", "url": "https://example.com/downloads/expense-tracker.apk", "background_color": "#059669", "text_color": "#ffffff", "icon": "download"}]',
     '2024-06', '2024-08',
     '["수입/지출 기록", "카테고리별 분류", "월별 지출 차트", "예산 설정 및 알림", "데이터 백업/복원"]',
     NOW(), NOW()),

    (@cat_apps, 'VIDSTREAM', 'Video Streaming Platform',
     'HLS 기반 비디오 스트리밍 서비스',
     NULL,
     '["Web", "Full-Stack", "Cloud"]',
     6, TRUE,
     'AWS MediaConvert를 활용한 비디오 인코딩과 CloudFront CDN을 통한 스트리밍 서비스입니다.',
     '["React", "Node.js", "AWS S3", "AWS CloudFront", "FFmpeg"]',
     '[{"file_uuid": "a0000000000000000000000000000018", "caption": "비디오 플레이어"}, {"file_uuid": "a0000000000000000000000000000019", "caption": "업로드 페이지"}]',
     '[{"name": "github", "url": "https://github.com/username/video-platform", "background_color": "#181717", "text_color": "#ffffff", "icon": "github"}, {"name": "demo", "url": "https://video-demo.com", "background_color": "#be123c", "text_color": "#ffffff", "icon": "globe"}]',
     '2024-07', '2024-10',
     '["적응형 비트레이트 스트리밍", "비디오 업로드 및 인코딩", "재생 목록 관리", "시청 기록 저장", "구독 시스템"]',
     NOW(), NOW()),

    (@cat_apps, 'AIIMG', 'AI Image Generator',
     'Stable Diffusion API를 활용한 AI 이미지 생성 도구',
     NULL,
     '["Web", "AI/ML", "Full-Stack"]',
     7, TRUE,
     '텍스트 프롬프트를 입력받아 AI 이미지를 생성하는 웹 애플리케이션입니다. 다양한 스타일과 파라미터 조절이 가능합니다.',
     '["Python", "FastAPI", "React", "Stable Diffusion", "Celery"]',
     '[{"file_uuid": "a0000000000000000000000000000020", "caption": "이미지 생성"}, {"file_uuid": "a0000000000000000000000000000021", "caption": "갤러리"}, {"file_uuid": "a0000000000000000000000000000022", "caption": "스타일 설정"}]',
     '[{"name": "github", "url": "https://github.com/username/ai-image-gen", "background_color": "#181717", "text_color": "#ffffff", "icon": "github"}, {"name": "blog", "url": "https://blog.example.com/ai-image-gen-dev-log", "background_color": "#28a745", "text_color": "#ffffff", "icon": "book"}]',
     '2024-08', '2024-09',
     '["텍스트 투 이미지 생성", "스타일 프리셋", "이미지 히스토리", "고해상도 업스케일링", "배치 생성"]',
     NOW(), NOW()),

    (@cat_apps, 'INVENTORY', 'Inventory Management System',
     '중소기업용 재고 관리 시스템',
     NULL,
     '["Web", "Enterprise", "Dashboard"]',
     8, TRUE,
     '바코드 스캔과 실시간 재고 추적이 가능한 재고 관리 솔루션입니다. 발주 자동화와 재고 알림 기능을 제공합니다.',
     '["Vue.js", "TypeScript", "NestJS", "MySQL", "Docker"]',
     '[{"file_uuid": "a0000000000000000000000000000023", "caption": "재고 현황"}, {"file_uuid": "a0000000000000000000000000000024", "caption": "바코드 스캔"}]',
     '[{"name": "github", "url": "https://github.com/username/inventory-system", "background_color": "#181717", "text_color": "#ffffff", "icon": "github"}]',
     '2024-09', '2024-12',
     '["바코드/QR 스캔", "실시간 재고 현황", "자동 발주 알림", "입출고 이력 관리", "재고 리포트 생성"]',
     NOW(), NOW()),

    (@cat_apps, 'FITNESS', 'Fitness Tracking App',
     '운동 기록 및 건강 관리 모바일 앱',
     NULL,
     '["Mobile", "Health", "API Integration"]',
     9, TRUE,
     '운동 루틴 관리, 칼로리 계산, 진행 상황 추적이 가능한 피트니스 애플리케이션입니다.',
     '["Flutter", "Dart", "Firebase", "HealthKit", "Google Fit API"]',
     '[{"file_uuid": "a0000000000000000000000000000025", "caption": "운동 기록"}, {"file_uuid": "a0000000000000000000000000000026", "caption": "진행 상황"}, {"file_uuid": "a0000000000000000000000000000027", "caption": "루틴 설정"}]',
     '[{"name": "github", "url": "https://github.com/username/fitness-app", "background_color": "#181717", "text_color": "#ffffff", "icon": "github"}, {"name": "demo", "url": "https://fitness-demo.com", "background_color": "#ea580c", "text_color": "#ffffff", "icon": "globe"}, {"name": "download", "url": "https://example.com/downloads/fitness-app.apk", "background_color": "#0d9488", "text_color": "#ffffff", "icon": "download"}]',
     '2024-10', '2024-12',
     '["운동 루틴 생성", "칼로리 소모량 계산", "진행 상황 그래프", "목표 설정 및 알림", "소셜 공유 기능"]',
     NOW(), NOW());

-- ============================================
-- 4. CORS Origins
-- ============================================
INSERT INTO cors_origin (server_code, origin, created_at)
VALUES
    ('PORTFOLIO_API', 'http://localhost:5173', NOW()),
    ('PORTFOLIO_API', 'http://127.0.0.1:5173', NOW());
