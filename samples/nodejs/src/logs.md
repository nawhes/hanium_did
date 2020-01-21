nawhes@nawhes:~/hanium/hanium_did/samples/nodejs/src$ node test.js 

 ## What do you want? init
 # steward is ready!
Open Pool Ledger: poolSteward
"Sovrin Steward" -> Create wallet
 # Gov is ready!
Open Pool Ledger: poolGov
"Gov" > Create wallet"
 # Hbank is ready!
Open Pool Ledger: poolHbank
"Hbank" > Create wallet"
 # Hstore is ready!
Open Pool Ledger: poolHstore
"Hstore" > Create wallet"
 # alice is ready!
Open Pool Ledger: poolAlice
"alice" > Create wallet"

 ## What do you want? onboarding
"Steward" -> Create and store in Wallet DID from seed
"Steward" > Create and store in Wallet "Steward Gov" DID
"Steward" > Send Nym to Ledger for "Steward Gov" DID
{ result: 
   { txnMetadata: 
      { txnId: '6b3d9674aecc9cc04512db3207b03daec3be1c9778c57230c0b9a03c526c4da3',
        txnTime: 1579632462,
        seqNo: 263 },
     reqSignature: { type: 'ED25519', values: [Array] },
     rootHash: 'E4fmMxj4ayrc62p8AgmsjyXsbodFgy3uzS4n6wWCdqWy',
     txn: 
      { type: '1',
        metadata: [Object],
        data: [Object],
        protocolVersion: 2 },
     auditPath: 
      [ '6CJCzH4ypfJTuAMeEcbr2kabjDwJvy3F55GDCWYNwCAs',
        'kzxaoaEP667MnXhP3gU2KYzJetziUG2bj1trYzwgqcK',
        '2N3NZrNfni2AA3pyZELosGpXjd3BUPSbJp8vh2X2wQaM' ],
     ver: '1' },
  op: 'REPLY' }
"Steward" > Send connection request to Gov with "Steward Gov" DID and nonce
"Gov" > Create and store in Wallet "Gov Steward" DID
"Gov" > Get key for did from "Steward" connection request
"Gov" > Anoncrypt connection response for "Steward" with "Gov Steward" DID, verkey and nonce
"Gov" > Send anoncrypted connection response to "Steward"
"Steward" > Anondecrypt connection response from "Gov"
"Steward" > Authenticates "Gov" by comparision of Nonce
"Steward" > Send Nym to Ledger for "Gov Steward" DID
{ result: 
   { txn: 
      { type: '1',
        data: [Object],
        metadata: [Object],
        protocolVersion: 2 },
     auditPath: 
      [ 'GNtGKZBizx1BEKFaZwe6xmdRsHc4XHpJ4yWGje21mL4X',
        '6CJCzH4ypfJTuAMeEcbr2kabjDwJvy3F55GDCWYNwCAs',
        'kzxaoaEP667MnXhP3gU2KYzJetziUG2bj1trYzwgqcK',
        '2N3NZrNfni2AA3pyZELosGpXjd3BUPSbJp8vh2X2wQaM' ],
     ver: '1',
     reqSignature: { type: 'ED25519', values: [Array] },
     txnMetadata: 
      { txnTime: 1579632465,
        txnId: '59ba0f9433d051c52ec7e37e48d1b4990a5cd6b8f0d4792cd143321eabd7e260',
        seqNo: 264 },
     rootHash: 'Dc5gGwokR4HU9TtVgWWKb27WZTcYFMMsP3Tu32A5nMhg' },
  op: 'REPLY' }
"Gov" > Create and store in Wallet "Gov" new DID"
"Gov" > Authcrypt "Gov DID info" for "Steward"
"Gov" > Send authcrypted "Gov DID info" to "Steward"
"Steward" > Authdecrypted "Gov DID info" from Gov
"Steward" > Authenticate Gov by comparision of Verkeys
"Steward" > Send Nym to Ledger for "Gov DID" with $'TRUST_ANCHOR' Role
{ result: 
   { txnMetadata: 
      { txnId: 'd0b308c22f8ead9e17aa19edeea29a6c3e2a4546dc1603db6680d3a4fb95dfdd',
        txnTime: 1579632468,
        seqNo: 265 },
     reqSignature: { type: 'ED25519', values: [Array] },
     rootHash: '6jrLXQmwgFiyWDwh6HPE7CqcqpSx941rr1idNb9YiAts',
     txn: 
      { type: '1',
        metadata: [Object],
        data: [Object],
        protocolVersion: 2 },
     auditPath: 
      [ 'GkJhj24uaGjkUy5fZgLuS7AZnrsLZ3sDyyacxZXacYKb',
        '2N3NZrNfni2AA3pyZELosGpXjd3BUPSbJp8vh2X2wQaM' ],
     ver: '1' },
  op: 'REPLY' }
"Steward" > Create and store in Wallet "Hbank Steward" DID
"Steward" > Send Nym to Ledger for "Hbank Steward" DID
"Steward" > Send connection request to Steward with "Hbank Steward" DID and nonce
"Hbank" > Create and store in Wallet "Hbank Steward" DID
"Hbank" > Get key for did from "Steward" connection request
"Hbank" > Anoncrypt connection response for "Steward" with "Hbank Steward" DID, verkey and nonce
"Hbank" > Send anoncrypted connection response to "Steward"
"Steward" > Anondecrypt connection response from "Hbank"
"Steward" > Authenticates "Hbank" by comparision of Nonce
"Steward" > Send Nym to Ledger for "Hbank Steward" DID
"Hbank" > Create and store in Wallet "Hbank" new DID"
"Hbank" > Authcrypt "Hbank DID info" for "Steward"
"Hbank" > Send authcrypted "Hbank DID info" to "Steward"
"Steward" > Authdecrypted "Hbank DID info" from Hbank
"Steward" > Authenticate Steward by comparision of Verkeys
"Steward" > Send Nym to Ledger for "Hbank DID" with $'TRUST_ANCHOR' Role
"Steward" > Create and store in Wallet "Hstore Steward" DID
"Steward" > Send Nym to Ledger for "Hstore Steward" DID
"Steward" > Send connection request to Steward with "Hstore Steward" DID and nonce
"Hstore" > Create and store in Wallet "Hstore Steward" DID
"Hstore" > Get key for did from "Steward" connection request
"Hstore" > Anoncrypt connection response for "Steward" with "Hstore Steward" DID, verkey and nonce
"Hstore" > Send anoncrypted connection response to "Steward"
"Steward" > Anondecrypt connection response from "Hstore"
"Steward" > Authenticates "Hstore" by comparision of Nonce
"Steward" > Send Nym to Ledger for "Hstore Steward" DID
"Hstore" > Create and store in Wallet "Hstore" new DID"
"Hstore" > Authcrypt "Hstore DID info" for "Steward"
"Hstore" > Send authcrypted "Hstore DID info" to "Steward"
"Steward" > Authdecrypted "Hstore DID info" from Hstore
"Steward" > Authenticate Gov by comparision of Verkeys
"Steward" > Send Nym to Ledger for "Hstore DID" with $'TRUST_ANCHOR' Role

 ## What do you want? schema
"Gov" -> Create "GovId" Schema
"Gov" -> Send "GovId" Schema to Ledger
{ result: 
   { reqSignature: { values: [Array], type: 'ED25519' },
     txn: 
      { protocolVersion: 2,
        metadata: [Object],
        type: '101',
        data: [Object] },
     txnMetadata: 
      { seqNo: 272,
        txnTime: 1579632490,
        txnId: '4p6DNZPNoAZZVAhKoDAYVo:2:GovId:0.1' },
     ver: '1',
     auditPath: 
      [ '8wdMRz1L8Zuxu5Y7Vy59T32jJMEx7fnjjehUBsrNkKcy',
        '3QEtctuGrKj1NEfGUKWscGwSedkrMVACbBTSgx98ejFM',
        'F9S7VDg2pLPAUWCfP8G1KCKKhT8xj8spzEvi95tG3QBD',
        'GkJhj24uaGjkUy5fZgLuS7AZnrsLZ3sDyyacxZXacYKb',
        '2N3NZrNfni2AA3pyZELosGpXjd3BUPSbJp8vh2X2wQaM' ],
     rootHash: '6CifKexs4d5fKb8TVSSuaieC39QAd9HwkmdHZoBmG218' },
  op: 'REPLY' }
"Gov" -> Get "GovId" Schema from Ledger
"Gov" -> Create and store in Wallet "GovId" Credential Definition
"Gov" -> Send  "GovId" Credential Definition to Ledger
{ result: 
   { reqSignature: { values: [Array], type: 'ED25519' },
     txn: 
      { protocolVersion: 2,
        metadata: [Object],
        type: '102',
        data: [Object] },
     txnMetadata: 
      { seqNo: 273,
        txnTime: 1579632495,
        txnId: '4p6DNZPNoAZZVAhKoDAYVo:3:CL:272:TAG1' },
     ver: '1',
     auditPath: 
      [ 'Fw9YeiT2BejZWZ35h1UJJAKcpcJ1LRV5fBWCYEtKaVwS',
        '2N3NZrNfni2AA3pyZELosGpXjd3BUPSbJp8vh2X2wQaM' ],
     rootHash: 'CqkWAcQSSRM9fSt3dFYmsZHW8mFffaCQR4or3UUT4TtD' },
  op: 'REPLY' }
"Hbank" -> Create "Receipt" Schema
"Hbank" -> Send "Receipt" Schema to Ledger
"Hbank" -> Get "Receipt" Schema from Ledger
"Hbank" -> Create and store in Wallet "Receipt" Credential Definition
"Hbank" -> Send  "Receipt" Credential Definition to Ledger

 ## What do you want? govid
"Gov" > Create and store in Wallet "Gov Alice" DID
"Gov" > Send Nym to Ledger for "Gov Alice" DID
"Gov" > Send connection request to Alice with "Gov Alice" DID and nonce
"alice" > Create and store in Wallet "alice Gov" DID
"alice" > Get key for did from "Gov" connection request
"alice" > Anoncrypt connection response for "Gov" with "alice Gov" DID, verkey and nonce
"alice" > Send anoncrypted connection response to "Gov"
"Gov" > Anondecrypt connection response from "Alice"
"Gov" > Authenticates "Alice" by comparision of Nonce
"Gov" > Send Nym to Ledger for "Alice Gov" DID
"Gov" -> Create "GovId" Credential Offer for Alice
"Gov" -> Get key for Alice did
"Gov" -> Authcrypt "GovId" Credential Offer for Alice
"Gov" -> Send authcrypted "GovId" Credential Offer to Alice
"alice" -> Authdecrypted "GovID" Credential Offer from Gov
"alice" -> Create and store "GovID" Master Secret in Wallet
"alice" -> Get "GovID" Credential Definition from Ledger
"alice" -> Create "GovID" Credential Request for Gov
"alice" -> Authcrypt "GovId" Credential Request for Gov
"alice" -> Send authcrypted "GovId" Credential Request to Gov
"Gov" -> Authdecrypt "GovId" Credential Request from Alice
"Gov" -> Create "GovId" Credential for Alice
"Gov" -> Authcrypt "GovId" Credential for Alice
"Gov" -> Send authcrypted "GovId" Credential to Alice
"alice" -> Authdecrypted "GovId" Credential from Gov
 ##### GovIDCredJson
{"schema_id":"4p6DNZPNoAZZVAhKoDAYVo:2:GovId:0.1","cred_def_id":"4p6DNZPNoAZZVAhKoDAYVo:3:CL:272:TAG1","rev_reg_id":null,"values":{"last_name":{"raw":"Garcia","encoded":"1668440391"},"first_name":{"raw":"Alice","encoded":"1667853377"}},"signature":{"p_credential":{"m_2":"30270487725376836740169562907591266417951872892441131874164012099339480102430","a":"19940428086391437167012344415408228266769296561331674279483335630481505630125403406443549119881212970910644875995408430725158623472932329924720919691150664771020209823732201393913841859940774102628743370141689094075279381721247468293761963708367627139409275091683364934785676068560250035157789270516830969613169540977817431481211294310549406740533302897788540681490281998297386210834922243643808380271354612599034066094120720691689929771368668167897915497734592790458271719725349830905002834178293538033893855045173786838534514769531989655620137744091228855431447552913154388482766394803161922580559284377375306532537","e":"259344723055062059907025491480697571938277889515152306249728583105665800713306759149981690559193987143012367913206299323899696942213235956742929717355100681203134434543352101834247","v":"5622506964755806373047907911701686792639139078199790238878881127482422938527302041654446593729284120694677654395872287168708364096816125271806940459302829036223376328632469694137462040335632087769070339248698876769493451428271109916213013219182815315402063138973173207014652455332846939363229883678546436952489611607442454597278063515604515241711792456845963763759328637995089901393647691864322869271577196352889973273239297984052632960674709905366427066104016245363742559149308985957542205052715358057754841790760892478165078162388249543266858967348569322143065754118273461540308280540219376779361069235089045716173062449181060769969078579592370317223190169565320581327180178949101320274454123827315816971278429446385468011162783118643695896864267851792931234343508605081440330924541834414170247583996650018918536512014"},"r_credential":null},"signature_correctness_proof":{"se":"5569571420613563502238864628240025014580767853549362917919474180172825622053941439504760681752481115327992726372813378412038543012992489645066520179848319806199409359477346311809938519575453651376931142974429914848695742535230100821118523946510043378551817713506626906896970459331911886545679237488279943101821600699107920412679624653553127906137897449587756957567701203542074618351048057281124434118788893192408136389437092158695874771706033058729207407470485534811368494789139525286809060944604535325396644949294413000006119478633083154668532126417304381621273158262839079115160330640525275055517822957078984538146","c":"59641820123477474566247668698711428565758530598952211227479124624752947007623"},"rev_reg":null,"witness":null}

"alice" -> Store "GovId" Credential from Gov
 ##### Alice's Wallet
[ { referent: '23b26127-4431-4498-a463-ce6154c59241',
    attrs: { first_name: 'Alice', last_name: 'Garcia' },
    schema_id: '4p6DNZPNoAZZVAhKoDAYVo:2:GovId:0.1',
    cred_def_id: '4p6DNZPNoAZZVAhKoDAYVo:3:CL:272:TAG1',
    rev_reg_id: null,
    cred_rev_id: null } ]


 ## What do you want? receipt
"Hbank" > Create and store in Wallet "Hbank Alice" DID
"Hbank" > Send Nym to Ledger for "Hbank Alice" DID
"Hbank" > Send connection request to Alice with "Hbank Alice" DID and nonce
"alice" > Create and store in Wallet "alice Hbank" DID
"alice" > Get key for did from "Hbank" connection request
"alice" > Anoncrypt connection response for "Hbank" with "alice Hbank" DID, verkey and nonce
"alice" > Send anoncrypted connection response to "Hbank"
"Hbank" > Anondecrypt connection response from "Alice"
"Hbank" > Authenticates "Alice" by comparision of Nonce
"Hbank" > Send Nym to Ledger for "Alice Hbank" DID
{ nonce: '1110774933948348341492357',
  name: 'Receipt-Application',
  version: '0.1',
  requested_attributes: 
   { attr1_referent: { name: 'first_name', restrictions: [Array] },
     attr2_referent: { name: 'last_name', restrictions: [Array] },
     attr3_referent: { name: 'from_account' },
     attr4_referent: { name: 'dest_account' },
     attr5_referent: { name: 'amount' } },
  requested_predicates: {} }
"Hbank" -> Get key for Alice did
"Hbank" -> Authcrypt "Receipt-Application" Proof Request for Alice
"Hbank" -> Send authcrypted "Receipt-Application" Proof Request to Alice
"alice" -> Authdecrypt "Receipt" Proof Request from Hbank
 ##### ReceiptProofRequestJson
{"nonce":"1110774933948348341492357",
    "name":"Receipt-Application",
    "version":"0.1",
    "requested_attributes":{
        "attr1_referent":{
            "name":"first_name"
            ,"restrictions":[{
                "cred_def_id":"4p6DNZPNoAZZVAhKoDAYVo:3:CL:272:TAG1"
            }]
        },
        "attr2_referent":{
            "name":"last_name",
            "restrictions":[{
                "cred_def_id":"4p6DNZPNoAZZVAhKoDAYVo:3:CL:272:TAG1"
            }]
        },
        "attr3_referent":{
            "name":"from_account"
        },
        "attr4_referent":{
            "name":"dest_account"
        },
        "attr5_referent":{
            "name":"amount"
        }
    },
    "requested_predicates":{}
}

"alice" -> Get credentials for "Receipt" Proof Request
"Alice" -> Get Schema from Ledger
"Alice" -> Get Claim Definition from Ledger
"alice" -> Create "Receipt" Proof
"alice" -> Authcrypt "Receipt" Proof for Hbank
"alice" -> Send authcrypted "Receipt" Proof to Hbank
 ##### ReceiptProofResponseJson
{ proof: 
   { proofs: [ [Object] ],
     aggregated_proof: 
      { c_hash: '108326761545072882590766286799539083772227601749986943772535808579833690033102',
        c_list: [Array] } },
  requested_proof: 
   { revealed_attrs: { attr1_referent: [Object], attr2_referent: [Object] },
     self_attested_attrs: 
      { attr3_referent: '7458',
        attr4_referent: '7654',
        attr5_referent: '50000' },
     unrevealed_attrs: {},
     predicates: {} },
  identifiers: 
   [ { schema_id: '4p6DNZPNoAZZVAhKoDAYVo:2:GovId:0.1',
       cred_def_id: '4p6DNZPNoAZZVAhKoDAYVo:3:CL:272:TAG1',
       rev_reg_id: null,
       timestamp: null } ] }

"Hbank" -> Get Schema from Ledger
"Hbank" -> Get Claim Definition from Ledger
"Hbank" -> Verify "Receipt" Proof from Alice
 ##### Proof verification result
true

"Hbank" -> Create "Receipt" Credential Offer for Alice
"Hbank" -> Get key for Alice did
"Hbank" -> Authcrypt "Receipt" Credential Offer for Alice
"Hbank" -> Send authcrypted "Receipt" Credential Offer to Alice
"alice" -> Authdecrypted "Receipt" Credential Offer from Hbank
"alice" -> Create and store "Receipt" Master Secret in Wallet
"alice" -> Get "Receipt" Credential Definition from Ledger
"alice" -> Create "Receipt" Credential Request for Hbank
"alice" -> Authcrypt "Receipt" Credential Request for Hbank
"alice" -> Send authcrypted "Receipt" Credential Request to Hbank
"Hbank" -> Authdecrypt "Receipt" Credential Request from Alice
"Hbank" -> Create "Receipt" Credential for Alice
"Hbank" -> Authcrypt "Receipt" Credential for Alice
"Hbank" -> Send authcrypted "Receipt" Credential to Alice
"alice" -> Authdecrypted "Receipt" Credential from Hbank
"alice" -> Store "Receipt" Credential from Hbank
 ##### Alice's Wallet
[ { referent: '23b26127-4431-4498-a463-ce6154c59241',
    attrs: { last_name: 'Garcia', first_name: 'Alice' },
    schema_id: '4p6DNZPNoAZZVAhKoDAYVo:2:GovId:0.1',
    cred_def_id: '4p6DNZPNoAZZVAhKoDAYVo:3:CL:272:TAG1',
    rev_reg_id: null,
    cred_rev_id: null },
  { referent: '8f2c9756-6816-464f-ade3-1f1dcf47d2b3',
    attrs: { dest_account: '7654', amount: '50000', from_account: '7458' },
    schema_id: '4jxTQwgah5kwgm62kVPhsP:2:Receipt:0.1',
    cred_def_id: '4jxTQwgah5kwgm62kVPhsP:3:CL:274:TAG1',
    rev_reg_id: null,
    cred_rev_id: null } ]


 ## What do you want? order
"Hstore" > Create and store in Wallet "Hstore Alice" DID
"Hstore" > Send Nym to Ledger for "Hstore Alice" DID
"Hstore" > Send connection request to Alice with "Hstore Alice" DID and nonce
"alice" > Create and store in Wallet "alice Hstore" DID
"alice" > Get key for did from "Hstore" connection request
"alice" > Anoncrypt connection response for "Hstore" with "alice Hstore" DID, verkey and nonce
"alice" > Send anoncrypted connection response to "Hstore"
"Hstore" > Anondecrypt connection response from "Alice"
"Hstore" > Authenticates "Alice" by comparision of Nonce
"Hstore" > Send Nym to Ledger for "Alice Hstore" DID
{ nonce: '1170182345165794408054350',
  name: 'Order-Application',
  version: '0.1',
  requested_attributes: 
   { attr1_referent: { name: 'production' },
     attr2_referent: { name: 'dest_address' },
     attr3_referent: { name: 'from_account', restrictions: [Array] },
     attr4_referent: { name: 'dest_account', restrictions: [Array] } },
  requested_predicates: {} }
"Hstore" -> Get key for Alice did
"Hstore" -> Authcrypt "Order-Application" Proof Request for Alice
"Hstore" -> Send authcrypted "Order-Application" Proof Request to Alice
"alice" -> Authdecrypt "Order" Proof Request from Hstore
"alice" -> Get credentials for "Order" Proof Request
"Alice" -> Get Schema from Ledger
"Alice" -> Get Claim Definition from Ledger
"alice" -> Create "Order" Proof
"alice" -> Authcrypt "Order" Proof for Hstore
"alice" -> Send authcrypted "Order" Proof to Hstore
"Hstore" -> Get Schema from Ledger
"Hstore" -> Get Claim Definition from Ledger
"Hstore" -> Verify "Order" Proof from Alice
true

 ## What do you want? close
"Steward" -> Close and Delete wallet
"Gov" -> Close and Delete wallet
"Hbank" -> Close and Delete wallet
"Hstore" -> Close and Delete wallet
"alice" -> Close and Delete wallet
