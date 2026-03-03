---
name: new-domain-endpoint
description: "새 도메인 API 엔드포인트 풀스택 생성 — new endpoint, API 추가, 도메인 추가, full-stack endpoint, 엔드포인트 생성"
---

## Trigger
사용자가 "new endpoint", "새 API", "도메인 추가", "엔드포인트 생성"을 요청하거나, 새 BE 라우트 + FE 클라이언트가 필요할 때 활성화.

## Input Context
- 도메인 이름
- HTTP 메서드
- 요청/응답 shape
- Supabase 테이블 (해당 시)

## Read First
1. `backend/app/CLAUDE.md` — 라우터 등록 순서
2. `backend/app/models/CLAUDE.md` — 모델 규칙
3. `backend/app/models/common.py` — CamelModel 베이스
4. `frontend/src/lib/api/auth-fetch.ts` — authFetch 래퍼 패턴
5. `frontend/src/lib/api/endpoints.ts` — 엔드포인트 URL barrel
6. 기존 도메인 쌍 참조 (예: `labeling.py` / `labeling.ts`)

## Do
1. BE 모델 생성: `backend/app/models/{domain}.py` (CamelModel 상속)
2. BE 라우터 생성: `backend/app/api/{domain}/router.py` + `__init__.py`
3. `backend/app/main.py`에 라우터 등록 (등록 순서 준수)
4. `backend/app/models/schemas.py` barrel re-export 갱신
5. FE 타입 생성: `frontend/src/types/{domain}.ts` (camelCase 미러)
6. `frontend/src/types/index.ts` barrel re-export 갱신
7. FE API 클라이언트 생성: `frontend/src/lib/api/{domain}.ts` (authFetch 사용)
8. `frontend/src/lib/api/endpoints.ts` barrel 갱신
9. 모든 새 파일에 한국어 헤더 주석 추가
10. `pre-commit-validate` 스킬 실행

## Do Not
1. barrel re-export 갱신을 빠뜨리지 않는다
2. FE에서 raw fetch 대신 authFetch를 사용한다
3. BE에서 CamelModel 상속을 빠뜨리지 않는다
4. 필드 네이밍 규칙을 위반하지 않는다 (BE snake_case, FE camelCase)

## Validation
- [ ] 미러 구조 8개 파일 생성/갱신됨
- [ ] CamelModel 상속됨
- [ ] authFetch 사용됨
- [ ] barrel 갱신됨 (schemas.py, index.ts, endpoints.ts)
- [ ] 모든 새 파일에 헤더 주석 존재
- [ ] pre-commit 검증 통과

## Output Template
```
[new-domain-endpoint 완료]
- 도메인: {domain}
- BE 모델: backend/app/models/{domain}.py
- BE 라우터: backend/app/api/{domain}/router.py
- FE 타입: frontend/src/types/{domain}.ts
- FE API: frontend/src/lib/api/{domain}.ts
- Barrel 갱신: 4개
- 테스트/빌드: pass
```
