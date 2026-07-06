# 이미지 업로드 운영 정책

최종 업데이트: 2026-07-07

이 문서는 이미지 업로드 동작을 운영 기준으로 고정합니다. 구현 기준은 `portfolio_project_server_flask/routers/upload.py`, `portfolio_project_server_flask/utils/image_processing.py`, `portfolio_project_client_vite/src/utils/api.ts`와 맞춰 관리합니다.

## 허용 형식

이미지 업로드에서 허용하는 확장자는 다음과 같습니다.

| 구분 | 허용 값 |
| --- | --- |
| 확장자 | `jpg`, `jpeg`, `png`, `webp` |
| MIME 타입 | `image/jpeg`, `image/png`, `image/webp` |

`gif`는 업로드할 수 없습니다. GIF는 서버 리사이즈 및 WebP 변환 대상에서 제외되므로 운영 정책상 차단합니다.

참고: 파일 업로드 API 자체는 문서, 압축 파일 등 비이미지 파일도 받을 수 있지만, 포트폴리오 이미지와 프로젝트 스크린샷 업로드 UI는 위 이미지 형식만 허용합니다.

## 최대 크기

업로드 파일의 최대 크기는 `MAX_FILE_SIZE` 환경 변수로 제어합니다.

| 항목 | 기준 |
| --- | --- |
| 기본값 | `10485760` bytes |
| 운영 기준 | 10 MB |
| 적용 범위 | `/api/v1/files/upload`로 들어오는 모든 파일 |

파일 크기는 서버가 파일 내용을 읽은 뒤 검증하며, 제한을 초과하면 `400` 응답으로 거절합니다.

## 변환 및 리사이즈

서버가 식별 가능한 `jpg`, `jpeg`, `png`, `webp` 이미지는 서비스용 WebP 파일로 변환합니다.

| 산출물 | 긴 변 제한 | WebP 품질 | 파일명 |
| --- | ---: | ---: | --- |
| 상세 이미지 | 2048 px 이하 | 82 | `{user_id}-{uuid}.webp` |
| 썸네일 | 480 px 이하 | 78 | `{user_id}-{uuid}.thumb.webp` |

변환 시 EXIF 방향 정보를 반영하고, Pillow의 WebP 저장 `method=6`을 사용합니다. 상세 이미지는 기본 조회(`detail`)에 사용하고, 썸네일은 `?variant=thumbnail` 조회에 사용합니다.

## 원본 보존 정책

이미지 원본 바이너리는 별도로 보존하지 않습니다. 변환에 성공한 이미지는 상세 WebP와 썸네일 WebP만 저장합니다.

데이터베이스에는 사용자가 올린 원본 파일명(`original_filename`)을 메타데이터로 보존합니다. 다운로드 응답의 `download_name`은 이 원본 파일명을 사용하지만, 실제 저장 파일은 변환된 WebP입니다.

## 실패 및 예외 기준

- 허용 확장자가 아니면 서버에서 `400`으로 거절합니다.
- GIF는 확장자와 MIME 타입 모두 허용 대상이 아니며, 클라이언트에서도 선택 및 업로드 요청 전에 차단합니다.
- `MAX_FILE_SIZE`를 초과하면 서버에서 `400`으로 거절합니다.
- 썸네일 파일이 존재하면 `thumbnail` 변형으로 제공하고, 파일 삭제 시 상세 파일과 썸네일 파일을 함께 삭제합니다.

