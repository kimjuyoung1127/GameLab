---
name: code-quality-guard
description: 코드 품질 가드. 파일 헤더 주석, 인코딩/줄바꿈, CLAUDE.md 폴더 컨벤션, 커밋 전 체크리스트, 스타일 분리, 하드코딩 정책을 적용. 새 프로젝트 시작 시 또는 코드 품질 규칙을 점검할 때 사용.
---

# Code Quality Guard (코드 품질 가드)

모든 프로젝트에 적용하는 코드 위생, 파일 관리, 커밋 품질 규칙.
기술 스택과 무관하게 일관된 코드 품질을 유지한다.

---

## 1. 파일 헤더 주석

모든 새 코드 파일 상단에 **1~3줄 기능 설명 주석** 필수.

| 언어 | 형식 | 예시 |
|------|------|------|
| Python | `"""설명."""` | `"""세션 관련 Pydantic 모델 정의."""` |
| TypeScript/JS | `/** 설명. */` | `/** 세션 도메인 타입 정의. */` |
| Go | `// Package 설명` | `// Package session 세션 관련 핸들러.` |
| Java/Kotlin | `/** 설명. */` | `/** 세션 서비스 구현. */` |
| CSS/SCSS | `/* 설명 */` | `/* 대시보드 레이아웃 스타일. */` |

**규칙:**
- 해당 파일의 역할과 주요 기능을 간결하게 기술
- 주석 언어는 프로젝트 규칙에 따름 (한국어 또는 영어)
- 기존 파일 수정 시 헤더가 없으면 추가하지 않아도 됨 (새 파일만 필수)

---

## 2. 인코딩 / 줄바꿈

모든 텍스트 파일: **UTF-8**, **LF** 줄바꿈.

### .editorconfig 표준 설정

```ini
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
indent_style = space
indent_size = 2
trim_trailing_whitespace = true

[*.py]
indent_size = 4

[*.go]
indent_style = tab

[*.md]
trim_trailing_whitespace = false
```

### .gitattributes 표준 설정

```gitattributes
* text=auto eol=lf

# 텍스트 파일 (프로젝트에 맞게 확장)
*.ts text
*.tsx text
*.js text
*.jsx text
*.json text
*.css text
*.md text
*.py text
*.yml text
*.yaml text
*.html text
*.sh text

# 바이너리 파일
*.png binary
*.jpg binary
*.gif binary
*.webp binary
*.ico binary
*.pdf binary
*.zip binary
*.woff2 binary
```

**규칙:**
- 프로젝트 루트에 `.editorconfig`와 `.gitattributes` 반드시 배치
- 커밋 전 인코딩 검증 스크립트 실행 권장 (예: `check-utf8.mjs`)
- Windows 환경에서도 LF 강제 (`git config core.autocrlf input`)

---

## 3. CLAUDE.md 폴더 컨벤션

**의미 있는 모든 폴더**에 `CLAUDE.md`를 배치하여 AI 작업 시 컨텍스트를 제공한다.

### 표준 템플릿

```markdown
# {폴더 경로}

## 역할
이 폴더의 역할 한 줄 설명.

## 구조
| 파일/폴더 | 설명 |
|-----------|------|
| `파일명` | 역할 설명 |

## 의존 규칙
- 이 폴더가 의존하는 것: ...
- 이 폴더에 의존하는 것: ...

## 금지 사항
1. ...
2. ...
```

**규칙:**
- 작업 시작 전 해당 폴더의 CLAUDE.md를 **먼저 읽을 것**
- 새 폴더 생성 시 CLAUDE.md 추가 여부 판단 (3개 이상 파일이 있는 폴더)
- 루트 CLAUDE.md는 프로젝트 전체 규칙의 **Source of Truth**

---

## 4. 프론트엔드 스타일 분리

프론트엔드 코드에서 **구조(TSX/JSX)와 스타일(CSS)을 분리**한다.

**규칙:**
1. 라우트/기능 폴더에 `styles/` 서브폴더 사용
2. 정적 스타일 → `styles/*.module.css` (또는 `.module.scss`)로 분리
3. TSX/JSX에는 **구조/상태/이벤트 로직**만 유지
4. 동적 값(퍼센트, 좌표, 런타임 계산값)만 `style={{ ... }}`로 유지
5. 전역 토큰/리셋은 **하나의 globals 파일**에서만 관리

**적용 예시:**
- React + CSS Modules: `styles/Dashboard.module.css`
- Vue SFC: `<style module>` 또는 별도 `.module.css`
- Svelte: `<style>` 블록 또는 별도 CSS 파일
- Tailwind 사용 시: 유틸리티 클래스 + 커스텀은 `globals.css`

---

## 5. 커밋 전 체크리스트

코드를 커밋하기 전 반드시 확인할 항목:

- [ ] **빌드 성공** — 프론트엔드/백엔드 빌드가 에러 없이 완료
- [ ] **테스트 통과** — 전체 테스트 스위트 통과
- [ ] **인코딩 검증** — UTF-8 + LF 줄바꿈 확인
- [ ] **타입 동기화** — BE 모델 변경 시 FE 타입도 동시 변경 확인
- [ ] **파일 헤더** — 새 파일에 1~3줄 헤더 주석 확인
- [ ] **barrel re-export** — 새 모듈 추가 시 index/barrel 파일 갱신
- [ ] **CLAUDE.md** — 새 폴더 생성 시 CLAUDE.md 추가 확인
- [ ] **불필요 코드 제거** — console.log, print, debugger 등 제거
- [ ] **환경변수 확인** — 하드코딩된 시크릿이나 URL 없음

---

## 6. 하드코딩 정책

**문자열/숫자 리터럴을 코드에 직접 넣지 않는다.**

| 유형 | 분리 위치 | 예시 |
|------|-----------|------|
| UI 문자열 | i18n 파일 또는 상수 파일 | `t('session.title')` |
| 에러 메시지 | 에러 상수/i18n | `ERROR_CODES.NOT_FOUND` |
| 매직 넘버 | named constant | `const MAX_RETRY = 3` |
| URL/엔드포인트 | 환경변수 | `process.env.API_URL` |
| 색상/크기 토큰 | CSS 변수/테마 | `var(--color-primary)` |

**예외 (인라인 허용):**
- 배열 인덱스 (0, 1 등)
- 수학 상수 (0, 1, -1, 100 등 문맥상 명확한 경우)
- 테스트 코드의 기대값

---

## 7. Import 규칙

| 규칙 | 설명 |
|------|------|
| **절대경로 alias 사용** | `@/lib/api/sessions` (상대경로 `../../lib/api/sessions` 지양) |
| **순환 의존 금지** | A → B → A 형태의 import 불가 |
| **직접 import 선호** | barrel(index.ts)보다 직접 모듈 import 권장 (새 코드) |
| **barrel은 하위 호환용** | 기존 barrel 유지하되, 새 코드에서는 선택적 사용 |
| **타입 import 분리** | `import type { ... }` 사용 (TypeScript) |

**alias 설정 참고:**
- TypeScript: `tsconfig.json` → `paths: { "@/*": ["./src/*"] }`
- Python: 패키지 구조 + 절대 import (`from app.models.session import ...`)
- Go: 모듈 경로 기반 (`import "project/internal/session"`)
