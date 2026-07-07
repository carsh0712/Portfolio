# Day 11. 공개 페이지 SEO와 공유 미리보기 개선

## 시작하며

공개 포트폴리오 URL은 단순히 브라우저에서 잘 열리는 것만으로는 부족하다.

사용자가 링크를 카카오톡이나 SNS에 붙여 넣었을 때 제목, 설명, 대표 이미지가 자연스럽게 보여야 링크를 누를 이유가 생긴다. 오늘은 React SPA 구조에서 공개 페이지의 SEO와 공유 미리보기를 어떻게 처리할지 정리하고 구현했다.

## 오늘의 목표

- 공개 Portfolio 페이지가 고유한 title과 description을 갖게 한다.
- 공개 Project 상세 페이지도 Project 기준의 공유 정보를 갖게 한다.
- 카카오톡 같은 공유 봇이 JavaScript 실행 없이도 Open Graph 메타를 읽을 수 있게 한다.
- 기존 React SPA 실행은 깨지지 않게 유지한다.
- 구현 내용을 HTML 문서로 남긴다.

## 문제 상황

현재 공개 화면은 React SPA로 동작한다.

브라우저 사용자는 페이지에 들어온 뒤 API를 호출하고, React가 화면을 그려도 충분하다. 하지만 카카오톡, 검색엔진, SNS 공유 봇은 처음 내려받은 HTML의 `<head>`를 먼저 읽는다.

기본 `index.html`에 하나의 title만 있으면 모든 공개 링크가 같은 제목으로 인식될 수 있다. 프로젝트마다 제목과 대표 이미지가 다른 서비스에서는 이 방식이 아쉽다.

## 선택한 방향

클라이언트에서만 처리하지 않고, Flask 서버가 공개 URL 요청에 대해 HTML 메타를 주입하도록 했다.

즉 사용자가 다음 URL을 열면:

```text
/public/{username}/{portfolio_code}
/public/{username}/{portfolio_code}/{project_code}
```

서버는 빌드된 `index.html`을 읽고, 공개 데이터베이스에서 Portfolio 또는 Project 정보를 조회한 뒤 `<head>` 안에 페이지별 메타 태그를 넣어 응답한다.

## 주입하는 메타 정보

공개 페이지에는 다음 정보를 넣는다.

```html
<title>페이지 제목</title>
<link rel="canonical" href="공개 URL" />
<meta name="description" content="페이지 설명" />
<meta property="og:title" content="페이지 제목" />
<meta property="og:description" content="페이지 설명" />
<meta property="og:url" content="공개 URL" />
<meta property="og:type" content="website" />
<meta property="og:image" content="대표 이미지 URL" />
<meta name="twitter:card" content="summary_large_image" />
```

Portfolio 페이지는 Portfolio 이름과 설명을 사용한다.

Project 상세 페이지는 Project 제목과 요약을 우선 사용하고, 설명이 부족하면 Portfolio 설명을 fallback으로 사용한다.

대표 이미지는 Project 썸네일이나 Portfolio 대표 이미지를 활용한다. 이미지가 없는 경우에는 이미지 메타를 생략하고 제목과 설명 중심으로 노출한다.

## SPA를 유지하는 방법

중요한 점은 HTML 메타를 넣으면서도 React 앱 실행을 깨지 않는 것이다.

서버는 기존 `index.html`에서 기본 `<title>`만 제거하고, Vite가 만든 script와 `<div id="root"></div>`는 그대로 둔다. 그래서 공유 봇은 HTML 메타를 읽고, 실제 사용자의 브라우저에서는 React 앱이 평소처럼 실행된다.

이 방식은 정적 SPA와 서버 사이드 메타 주입 사이에서 현실적인 절충점이다. 완전한 SSR은 아니지만, 링크 공유 품질을 올리는 데 필요한 핵심 정보는 서버 응답에 담을 수 있다.

## 기본 HTML fallback

동적 공개 URL이 아닌 일반 진입점도 최소한의 설명을 갖도록 Vite 기본 `index.html`에 fallback 메타를 추가했다.

이 fallback은 모든 페이지를 대표하는 고정 정보다. 공개 Portfolio와 Project URL에서는 서버가 주입하는 페이지별 메타가 더 중요하다.

## 확인 방법

먼저 로컬 또는 배포 환경에서 공개 URL의 HTML 응답을 확인한다.

```text
view-source:https://example.com/public/username/portfolio-code
```

`og:title`, `og:description`, `og:image`가 들어 있다면 1차 확인은 끝난다.

카카오톡 미리보기는 Kakao Developers 공유 디버거에서 확인한다. 카카오톡은 캐시가 강하므로 수정 후 바로 반영되지 않을 수 있다. 이때는 공유 디버거에서 캐시를 갱신하거나 테스트 URL에 query string을 붙여 새 URL처럼 확인한다.

## 오늘의 결과

공개 Portfolio와 Project URL이 페이지별 HTML 메타를 갖게 되었다.

이제 카카오톡이나 SNS에 링크를 공유했을 때 모든 페이지가 같은 title로 보이는 문제를 줄일 수 있고, 대표 이미지가 있는 공개 페이지는 미리보기 이미지까지 노출할 수 있다.

또한 `html/pages/seo.html` 문서에 적용 구조와 확인 방법을 정리했다. 나중에 robots, sitemap, 기본 OG 이미지 같은 작업을 이어가기도 쉬워졌다.

## 다음 작업

SEO의 기본 흐름은 잡혔지만, 운영 품질을 더 높이려면 몇 가지가 남아 있다.

- 이미지가 없는 페이지를 위한 기본 OG 이미지 준비
- 카카오톡에서 WebP 이미지가 안정적으로 노출되는지 확인
- 검색엔진용 `robots.txt`와 `sitemap.xml` 검토
- 공개 페이지 title/description 문구 품질 다듬기
- 배포 후 Kakao Developers 공유 디버거로 실제 URL 확인
