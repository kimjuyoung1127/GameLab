---
name: hotkey-sync
description: "단축키 추가/변경/삭제 시 5개 파일 동기화 — hotkey add, hotkey change, 단축키 추가, 핫키 변경, 키바인딩"
---

## Trigger
사용자가 "hotkey", "단축키", "shortcut", "키바인딩" 관련 요청을 하거나, 아래 5개 파일 중 하나를 수정할 때 활성화.

## Input Context
- 새/변경/삭제할 키 바인딩
- 동작 설명
- 적용 모드 (review / edit / global)

## Read First
1. `frontend/src/lib/hooks/labeling/useLabelingHotkeys.ts` — 실제 keydown 핸들러
2. `frontend/src/components/layout/HotkeyHelp.tsx` — 도움말 UI 섹션 배열
3. `frontend/src/app/(dashboard)/labeling/[id]/components/constants.ts` — 도구 메타데이터
4. `frontend/messages/ko.json` — hotkeys 네임스페이스
5. `frontend/messages/en.json` — hotkeys 네임스페이스
6. `docs/status/PROJECT-STATUS.md` — Hotkey Policy 테이블

## Do
1. `useLabelingHotkeys.ts` switch 블록에 키 핸들러 case 추가/수정/삭제
2. `HotkeyHelp.tsx` sections 배열의 적절한 카테고리에 항목 추가/수정/삭제
3. 도구 관련이면 `constants.ts` tools/zoomTools 배열 갱신
4. `ko.json` hotkeys 네임스페이스에 i18n 키 추가
5. `en.json` hotkeys 네임스페이스에 동일 키 추가
6. `PROJECT-STATUS.md` Hotkey Policy 테이블 행 갱신
7. `cd frontend && npm run build` 실행하여 빌드 확인

## Do Not
1. 5/6개 위치 중 일부만 수정하고 나머지를 빠뜨리지 않는다
2. 기존 키 바인딩과 충돌하는 키를 추가하지 않는다
3. 브라우저 기본 단축키(Ctrl+T, Ctrl+W 등)를 사용하지 않는다
4. TSX에 한국어/영어 문자열을 하드코딩하지 않는다 — `t()` 사용

## Validation
- [ ] `useLabelingHotkeys.ts` 핸들러 존재
- [ ] `HotkeyHelp.tsx` 섹션에 키+설명 항목 존재
- [ ] `ko.json` hotkeys 네임스페이스에 키 존재
- [ ] `en.json` hotkeys 네임스페이스에 매칭 키 존재
- [ ] `PROJECT-STATUS.md` 테이블 행 갱신됨
- [ ] `npm run build` 통과
- [ ] 동일 모드 내 중복 키 바인딩 없음

## Output Template
```
[hotkey-sync 완료]
- 키: {key}
- 동작: {description}
- 모드: {mode}
- 변경 파일: 5/5 (또는 6/6)
- 빌드: pass
```
