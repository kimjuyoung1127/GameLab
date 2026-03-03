---
name: i18n-string-add
description: "새 UI 문자열 ko/en 동시 추가 — i18n, 번역, translation, 다국어, string add, 문자열 추가"
---

## Trigger
사용자가 "i18n", "번역", "translation", "문자열 추가", "다국어"를 요청하거나, 새 UI 텍스트가 필요한 기능을 추가할 때 활성화.

## Input Context
- 네임스페이스 (labeling, sidebar, hotkeys, overview 등)
- 키 이름
- 한국어 텍스트
- 영어 텍스트

## Read First
1. `frontend/messages/ko.json` — 현재 한국어 문자열
2. `frontend/messages/en.json` — 현재 영어 문자열
3. 문자열을 소비할 TSX 컴포넌트 (네임스페이스 확인용)

## Do
1. 소비 컴포넌트의 `useTranslations("namespace")` 호출에서 네임스페이스 식별
2. `ko.json`의 해당 네임스페이스에 키 추가 (네임스페이스 내 알파벳 순)
3. `en.json`의 동일 위치에 동일 키 추가
4. 소비 컴포넌트에서 `t("keyName")` 사용 (하드코딩 금지)
5. 양쪽 파일 줄 수 일치 확인
6. `cd frontend && npm run build` 실행

## Do Not
1. 한쪽 locale 파일에만 추가하지 않는다
2. ko/en 간 다른 키 이름을 사용하지 않는다
3. 2단계 이상 깊이의 중첩 키를 만들지 않는다 (프로젝트 규칙: 네임스페이스 내 flat)
4. TSX 파일에 한국어/영어 문자열을 하드코딩하지 않는다
5. `useTranslations()` 호출 없이 새 네임스페이스를 만들지 않는다

## Validation
- [ ] 키가 `ko.json`과 `en.json` 양쪽에 존재
- [ ] 동일 네임스페이스, 동일 중첩 깊이
- [ ] 양쪽 파일 줄 수 일치
- [ ] 소비 컴포넌트에서 `useTranslations("namespace")` 사용됨
- [ ] TSX에 하드코딩된 문자열 없음
- [ ] `npm run build` 통과

## Output Template
```
[i18n-string-add 완료]
- 네임스페이스: {namespace}
- 추가 키: {keys}
- ko.json 줄수: {n}
- en.json 줄수: {n}
- 빌드: pass
```
