# Next.js App Router 라우트

## 루트 파일

| 파일 | 설명 |
|------|------|
| `layout.tsx` | 루트 레이아웃 (Inter 폰트, `lang="en"`, 다크 모드) |
| `page.tsx` | 루트 페이지 — bypass 설정에 따라 `/sessions` 또는 `/login`으로 redirect |
| `globals.css` | Tailwind 설정 + 다크 모드 기본 스타일 |

## 라우트 구조

### 인증 그룹 `(auth)/`

| 라우트 | 파일 | 설명 |
|--------|------|------|
| `/login` | `login/page.tsx` | 로그인 페이지 (현재 bypass 가능) |

### 대시보드 그룹 `(dashboard)/`

| 라우트 | 파일 | 설명 |
|--------|------|------|
| `/` | `page.tsx` | 대시보드 메인 → `/overview`로 redirect |
| `/upload` | `upload/page.tsx` | 오디오 파일 업로드 (드래그앤드롭, 멀티파일, 잡 폴링) |
| `/sessions` | `sessions/page.tsx` | 세션 목록 (필터, 검색, 삭제, 일괄 삭제) |
| `/labeling/[id]` | `labeling/[id]/page.tsx` | 3패널 라벨링 작업 공간 (핵심 기능) |
| `/overview` | `overview/page.tsx` | 대시보드 메트릭스 (4카드, 최근 세션, 빠른 액션) |
| `/leaderboard` | `leaderboard/page.tsx` | 리더보드 (랭킹 테이블) |

`(dashboard)/layout.tsx`는 `DashboardShell` 컴포넌트로 모든 대시보드 페이지를 감싼다.

## 주의사항

- **`labeling/[id]/page.tsx`가 가장 큰 파일 (~1100줄)** — 리팩토링 후보
- 라우트 그룹 `(auth)`, `(dashboard)`는 URL 경로에 포함되지 않음
- 모든 대시보드 페이지는 `DashboardShell` 내부에서 렌더링됨
- 동적 라우트 `[id]`는 세션 ID (UUID)
