---
name: labeling-feature-add
description: "라벨링 워크스페이스 기능 추가 — labeling feature, 라벨링 기능, spectrogram, 스펙트로그램, annotation, 어노테이션"
---

## Trigger
사용자가 "labeling feature", "라벨링 기능", "spectrogram", "스펙트로그램", "annotation"을 요청하거나, `/labeling/[id]` 관련 변경을 요구할 때 활성화.

## Input Context
- 기능 설명
- 영향받는 패널 (left: 파일 목록 / center: 스펙트로그램 / right: 제안 목록)
- 새 단축키 필요 여부

## Read First
1. `frontend/src/app/(dashboard)/labeling/[id]/CLAUDE.md` — 레이아웃 계약 및 편집 규칙
2. `frontend/src/app/(dashboard)/labeling/[id]/page.tsx` — 오케스트레이터 (상태 배선)
3. `frontend/src/app/(dashboard)/labeling/[id]/components/CLAUDE.md` — 컴포넌트 규칙
4. `frontend/src/lib/hooks/labeling/CLAUDE.md` — 훅 규칙
5. `docs/status/PROJECT-STATUS.md` — 현재 기능 목록 및 단축키 정책
6. `ai-context/claude-coding-guideline.md` — 섹션 4 (라벨링 규칙)

## Do
1. 새 UI를 `components/{NewComponent}.tsx`로 추출 (page.tsx 비대화 방지)
2. 인터랙션 로직이 20줄 초과 시 `hooks/{useNewHook}.ts`로 추출
3. page.tsx 오케스트레이터에 새 컴포넌트 연결
4. 새 단축키 필요 시 → `hotkey-sync` 스킬 호출
5. 새 i18n 문자열 필요 시 → `i18n-string-add` 스킬 호출
6. 새 파일에 1~3줄 한국어 헤더 주석 추가
7. 회귀 체크리스트 실행: 단축키, 드래그/리사이즈, 저장, 파일 전환, undo/redo
8. `cd frontend && npm run lint && npm run build` 실행

## Do Not
1. 프레젠테이션 컴포넌트 내에 API 호출이나 스토어 mutation을 넣지 않는다
2. page.tsx에 50줄 이상 추가하지 않고 반드시 추출한다
3. 타입 안전성을 우회하기 위해 `any`를 사용하지 않는다
4. 회귀 체크리스트를 건너뛰지 않는다
5. `useLabelingHotkeys.ts`를 수정하면서 핫키 링 파일 동기화를 빠뜨리지 않는다

## Validation
- [ ] 새 컴포넌트가 `components/`에 위치 (page.tsx 인라인 아님)
- [ ] 공유 로직은 `hooks/` 또는 `lib/hooks/labeling/`에 위치
- [ ] 모든 새 파일에 한국어 헤더 주석 존재
- [ ] 핫키 링 파일 동기화됨 (해당 시)
- [ ] i18n 문자열 ko/en 양쪽에 존재 (해당 시)
- [ ] 레이아웃 계약 유지 (left/center/right)
- [ ] Undo/Redo 정상 동작
- [ ] 파일 전환 (Ctrl+Arrow) 정상 동작
- [ ] `npm run lint` 통과
- [ ] `npm run build` 통과

## Output Template
```
[labeling-feature-add 완료]
- 기능: {feature_name}
- 새 파일: {files}
- 수정 파일: {files}
- 단축키 변경: {yes/no}
- i18n 키 추가: {count}
- 회귀 체크: pass
- 빌드: pass
```
