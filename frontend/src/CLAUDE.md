# src 루트 — 소스 코드 최상위

## 폴더 구조

| 폴더 | 설명 |
|------|------|
| `app/` | Next.js App Router 라우트 (페이지, 레이아웃) |
| `types/` | 도메인 타입 정의 (BE models/와 1:1 미러) |
| `lib/` | API 클라이언트, Zustand 스토어, 커스텀 훅 |
| `components/` | 레이아웃 및 도메인별 UI 컴포넌트 |

## 경로 별칭

```json
// tsconfig.json
"paths": {
  "@/*": ["./src/*"]
}
```

모든 import에서 `@/types/labeling`, `@/lib/store/session-store` 형태로 사용한다.

## 글로벌 스타일

`globals.css`에서 Tailwind 설정 및 다크 모드 기본값을 정의한다.

- Tailwind 4 기반 유틸리티 클래스
- 다크 모드가 기본 테마
- 커스텀 CSS 변수는 최소한으로 유지

## 참고 사항

- 새 도메인 추가 시: `types/`, `lib/api/`, `components/domain/` 3곳에 파일 생성
- barrel re-export 파일(`index.ts`, `endpoints.ts`)에 항상 추가
- "use client" 디렉티브는 훅/스토어 사용 컴포넌트에 필수
