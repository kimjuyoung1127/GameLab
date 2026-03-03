---
name: pre-commit-validate
description: "커밋 전 5단계 검증 실행 — pre-commit, 커밋 전, validate, 검증, build check, 빌드 확인"
---

## Trigger
사용자가 "commit", "커밋", "pre-commit", "검증"을 요청하거나, git commit을 생성하려 할 때 활성화.

## Input Context
없음 (모든 검증은 전역)

## Read First
1. 루트 `CLAUDE.md` — "커밋 전 체크리스트" 섹션
2. `scripts/check-utf8.mjs` — 인코딩 검증 스크립트

## Do (순서 엄수)
1. `cd frontend && npm run build` — FE 빌드 성공 확인
2. `cd backend && python -m pytest tests/ -v` — 모든 테스트 통과 확인
3. `node scripts/check-utf8.mjs` — 인코딩/줄바꿈 검증
4. BE 모델 변경이 있었다면: FE 타입 매칭 확인 (`be-fe-model-sync` 검증 호출)
5. 새 파일에 1~3줄 한국어 헤더 주석이 있는지 확인

## Do Not
1. 어떤 단계도 건너뛰지 않는다
2. 알려진 테스트 실패가 있는 상태로 커밋하지 않는다
3. UTF-8이 아닌 인코딩의 파일을 커밋하지 않는다
4. 새 파일에 헤더 주석 없이 커밋하지 않는다

## Validation
- [ ] `npm run build` — exit code 0
- [ ] `python -m pytest tests/ -v` — 전체 테스트 통과
- [ ] `node scripts/check-utf8.mjs` — "UTF-8 check passed"
- [ ] BE/FE 모델 정합성 확인 (해당 시)
- [ ] 새 파일 헤더 주석 확인

## Output Template
```
[pre-commit-validate 완료]
- FE 빌드: pass
- BE 테스트: {n}/{n} pass
- UTF-8 검증: pass
- BE/FE 모델 동기화: {pass/N/A}
- 헤더 주석: {pass/N/A}
- 커밋 준비: OK
```
