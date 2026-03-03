---
name: be-fe-model-sync
description: "BE 모델 변경 시 FE 타입/API 클라이언트 1:1 동기화 — model sync, 모델 동기화, type mirror, 타입 미러, 필드 추가"
---

## Trigger
사용자가 "model change", "모델 변경", "add field", "필드 추가", "type sync", "타입 동기화"를 요청하거나, `backend/app/models/*.py` 파일을 수정할 때 활성화.

## Input Context
- 도메인명 (upload, jobs, sessions, labeling, overview, leaderboard, common, achievement, gamification)
- 필드 변경 내용 (추가/삭제/이름변경/타입변경)

## Read First
1. `backend/app/models/{domain}.py` — 현재 BE 모델
2. `frontend/src/types/{domain}.ts` — 현재 FE 타입
3. `frontend/src/lib/api/{domain}.ts` — API 클라이언트
4. `backend/app/models/common.py` — CamelModel 베이스 (snake_case → camelCase)
5. `backend/app/models/schemas.py` — barrel re-export
6. `frontend/src/types/index.ts` — barrel re-export

## Do
1. BE 모델에 필드 변경 적용 (Pydantic, snake_case)
2. FE 타입에 동등한 변경 적용 (TypeScript, camelCase — CamelModel alias 매칭)
3. 응답 shape 변경 시 FE API 클라이언트 갱신
4. 새 타입 추가 시 barrel re-export 갱신 (schemas.py, index.ts)
5. FE에서 변경된 타입의 모든 사용처 검색 (`Grep`으로 인터페이스/타입명 검색)
6. 소비 컴포넌트/훅/스토어 갱신
7. `cd backend && python -m pytest tests/ -v` 실행
8. `cd frontend && npm run build` 실행

## Do Not
1. BE 모델만 수정하고 FE 타입을 빠뜨리지 않는다 (또는 반대)
2. BE 모델 필드에 camelCase를 사용하지 않는다 (CamelModel이 자동 변환)
3. BE에서 optional인 필드를 FE에서 required로 정의하지 않는다 (또는 반대)
4. barrel re-export 갱신을 빠뜨리지 않는다

## Validation
- [ ] BE snake_case 필드 ↔ FE camelCase 필드 매칭
- [ ] 타입 매칭 (BE `float` = FE `number`, BE `str` = FE `string`)
- [ ] Optional/Required 정렬 (BE `| None = None` = FE `?:`)
- [ ] `schemas.py` re-export 갱신됨
- [ ] `types/index.ts` re-export 갱신됨
- [ ] 모든 FE 소비처 갱신됨
- [ ] `python -m pytest tests/ -v` 통과
- [ ] `npm run build` 통과

## Output Template
```
[be-fe-model-sync 완료]
- 도메인: {domain}
- 변경 필드: {fields}
- BE 파일: backend/app/models/{domain}.py
- FE 파일: frontend/src/types/{domain}.ts
- 소비처 업데이트: {count}개 파일
- 테스트: pass
- 빌드: pass
```
