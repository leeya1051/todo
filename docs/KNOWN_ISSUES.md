# 알려진 이슈

## ESLint가 9.x에 고정된 이유

`package.json`의 `eslint`는 `^9.39.5`로 고정되어 있다. npm이 "This version is no
longer supported" 경고를 띄우지만, 지금은 10.x로 올릴 수 없다.

- `eslint-config-next@16.3.2`(현재 최신 안정 버전)가 내부적으로 물고 있는
  `eslint-plugin-react@7.37.5`(역시 최신 배포 버전)의 `peerDependencies`가
  `eslint: "^3 || ... || ^9.7"`까지만 지원한다 — ESLint 10 지원 버전이
  레지스트리에 아직 없다.
- 직접 `eslint@10`으로 올려서 검증한 결과, `npm run lint` 실행 시
  `eslint-plugin-react`에서 `TypeError: contextOrFilename.getFilename is not
  a function`로 즉시 크래시한다 (ESLint 10의 내부 API 변경 때문).

즉 보안 취약점이 아니라 단순 EOL 안내이며, `npm audit`에는 잡히지 않는다.
`eslint-config-next`(또는 `eslint-plugin-react`)가 ESLint 10 지원 버전을
배포하면 그때 `eslint`와 `eslint-config-next`를 함께 올리면 된다. 그 전까지는
`package.json`의 caret 범위(`^9.39.5`)가 실수로 10.x가 설치되는 것을 막아준다.
