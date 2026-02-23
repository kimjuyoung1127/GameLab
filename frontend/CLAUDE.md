# Frontend — Next.js + React 프론트엔드

## 실행 방법

```bash
npm install
npm run dev      # 개발 서버 (포트 3000)
npm run build    # 프로덕션 빌드
```

## 환경변수 (`.env.local`)

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | 백엔드 API 주소 |
| `NEXT_PUBLIC_BYPASS_LOGIN` | `true` | 로그인 우회 여부 |

## 기술 스택

| 패키지 | 버전 | 용도 |
|--------|------|------|
| Next.js | 16.1.6 | App Router 기반 프레임워크 |
| React | 19.2.3 | UI 라이브러리 |
| TypeScript | 5 | 타입 안전성 |
| Zustand | 5.0.11 | 상태 관리 (4개 독립 스토어) |
| Tailwind CSS | 4 | 유틸리티 CSS |
| Lucide React | — | 아이콘 라이브러리 |

## 폴더 구조

| 경로 | 역할 |
|------|------|
| `src/app/` | Next.js App Router 라우트 |
| `src/types/` | 도메인 타입 정의 |
| `src/lib/` | API 클라이언트, 스토어, 커스텀 훅 |
| `src/components/` | UI 컴포넌트 (layout + domain) |

## BE 미러링 규칙

프론트엔드와 백엔드는 **1:1 미러 구조**를 유지한다.

| FE 경로 | BE 경로 | 설명 |
|---------|---------|------|
| `src/types/{도메인}.ts` | `models/{도메인}.py` | 타입/모델 정의 |
| `src/lib/api/{도메인}.ts` | `api/{도메인}/router.py` | API 엔드포인트 |

- BE 모델 변경 시 FE 타입도 **반드시 동시 수정**
- 필드명은 CamelCase (BE의 CamelModel과 일치)
- barrel re-export: `types/index.ts`, `lib/api/endpoints.ts`
