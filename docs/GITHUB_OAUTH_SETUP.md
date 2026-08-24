# GitHub OAuth 로그인 설정

GitHub 계정으로 로그인 기능을 사용하려면 GitHub OAuth App을 등록하고 발급받은 자격 증명을
환경 변수에 넣어야 합니다.

## 1. OAuth App 등록

1. https://github.com/settings/developers 로 이동합니다.
2. **OAuth Apps** 탭에서 **New OAuth App** 버튼을 클릭합니다.
3. 아래 값을 입력합니다.

| 항목 | 값 |
| --- | --- |
| Application name | 자유롭게 입력 (예: `todo-local`) |
| Homepage URL | `http://localhost:3000` |
| Authorization callback URL | `http://localhost:3000/api/auth/callback/github` |

> Authorization callback URL은 **정확히** 일치해야 합니다.
> GitHub는 인가 요청과 토큰 교환 요청의 `redirect_uri`가 동일할 것을 요구하는데,
> 이 값은 NextAuth가 내부적으로 계산하는 `/api/auth/callback/github` 고정 경로입니다.
> 로그인 버튼은 `/auth/github`(앱 자체 진입 경로)로 연결되지만,
> 실제 GitHub 인가/토큰 교환은 항상 이 NextAuth 콜백 경로를 거칩니다.

4. **Register application**을 클릭합니다.

## 2. Client Secret 발급

등록이 끝나면 **Client ID**가 표시됩니다.
같은 화면에서 **Generate a new client secret**을 클릭해 **Client Secret**을 발급받습니다.
Secret은 생성 직후 한 번만 전체 값이 보이므로 즉시 복사해 두세요.

## 3. 환경 변수 설정

프로젝트 루트의 `.env.local` 파일에 값을 넣습니다.
(필요한 키 목록은 `.env.local.example`을 참고하세요.)

```
GITHUB_CLIENT_ID=발급받은_client_id
GITHUB_CLIENT_SECRET=발급받은_client_secret
```

`NEXTAUTH_URL`과 `NEXTAUTH_SECRET`도 함께 설정되어 있어야 합니다.

`.env.local`과 `.env`는 `.gitignore`에 포함되어 있으므로 커밋되지 않습니다.
Secret 값을 코드나 문서에 직접 적지 마세요.

## 4. 개발 서버 재시작

환경 변수는 서버 기동 시에 읽히므로 값을 추가한 뒤 개발 서버를 재시작합니다.

```
npm run dev
```

로그인 페이지(`/login`)의 **GitHub으로 로그인** 버튼으로 동작을 확인할 수 있습니다.

## 5. 프로덕션 설정

GitHub OAuth App 하나에는 콜백 URL을 하나만 등록할 수 있습니다.
따라서 프로덕션 배포 시에는 다음 중 하나를 선택합니다.

- 프로덕션 도메인용 OAuth App을 **별도로 하나 더 등록** (로컬 개발용과 분리, 권장)
- 기존 App의 Authorization callback URL을 프로덕션 도메인으로 **변경**

어느 쪽이든 콜백 URL은 `https://<프로덕션-도메인>/api/auth/callback/github` 형식이어야 하며,
배포 환경의 `NEXTAUTH_URL`도 해당 도메인으로 맞춰야 합니다.
