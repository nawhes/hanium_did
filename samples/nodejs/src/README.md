#### 개요
해당 데모는 전자상거래의 주문입력을 DID환경에서 처리하는 프로세스를 다루며
Hyperledger indy 환경에서 동작한다.\n
모든 소스는 github.com/hyperledger/indy-sdk.git을 참조하였다.

데모는 nodejs에서 동작하는 6개의 소스파일로 이루어져있으며 
각 소스는 아래와 같다.
_steward.js -> indy network를 처음으로 동작시키는 피어.
_gov.js -> 정부기관의 역할을 하는 피어.
_hbank.js -> 금전출납의 역할을 하는 피어.
_hstore.js -> 주문을 접수하는 피어.
_alice.js -> indy network를 활용해 주문을 하고자 하는 사용자 피어.
test.js -> 위의 피어를 동작시키며 피어간의 요청과 응답을 전달한다.

#### 데모 시나리오
4개의 노드로 이루어진 indy network가 동작하고 있는 상태이다.
steward, gov, hbank, hstore, alice는 4개의 노드와 통신하며 각 각의 원장에 자신의 wallet을 생성하였다.
steward는 gov, hbank, hstore에게 'TRUST_ANCHOR' 역할을 부여한다.
 -> gov, hbank, hstore는 상승된 권한으로 더 큰 영향을 행사할 수 있다.(인증서 스키마 생성, 인증서 발급 등)
gov, hbank, hstore는 각자가 필요한 인증서의 스키마를 생성하고 구체화한다.
 -> 노드는 인증서와 관련된 정보를 저장하게 된다.
alice는 gov에게 govID를 요청한다.
 -> alice의 wallet에 govID가 저장된다.
alice는 govID를 활용하여 hbank에게 자신의 신원을 증명한다.
 -> hbank는 alice의 govID의 이상유무를 확인한다.
alice는 receipt를 요청한다.
 -> alice의 wallet에 receipt가 저장된다.
alice는 receipt를 활용하여 hstore에게 자신의 주문을 전송한다.
 -> hstore는 alice의 receipt의 이상유무를 확인한다.
 
#### 데모를 동작하기 위해서
test.js는 사용자의 입력을 대기하는 프로세스이다.\n
수신가능한 입력은 init, onboarding, schema, govid, receipt, order, wallet, close이다.
