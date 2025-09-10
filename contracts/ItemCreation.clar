(define-constant ERR-NOT-AUTHORIZED u100)
(define-constant ERR-INVALID-FACTORY u101)
(define-constant ERR-INVALID-DETAILS u102)
(define-constant ERR-INVALID-HASH u103)
(define-constant ERR-ITEM-ALREADY-EXISTS u104)
(define-constant ERR-ITEM-NOT-FOUND u105)
(define-constant ERR-INVALID-TIMESTAMP u106)
(define-constant ERR-AUTHORITY-NOT-VERIFIED u107)
(define-constant ERR-INVALID-MATERIAL u108)
(define-constant ERR-INVALID-SIZE u109)
(define-constant ERR-INVALID-COLOR u110)
(define-constant ERR-INVALID-QR-CODE u111)
(define-constant ERR-MAX-ITEMS-EXCEEDED u112)
(define-constant ERR-INVALID-UPDATE-PARAM u113)
(define-constant ERR-ITEM-UPDATE-NOT-ALLOWED u114)
(define-constant ERR-INVALID-STYLE u115)
(define-constant ERR-INVALID-BRAND u116)
(define-constant ERR-INVALID-PRICE u117)
(define-constant ERR-INVALID-ORIGIN u118)
(define-constant ERR-INVALID-CERTIFICATION u119)
(define-constant ERR-INVALID-STATUS u120)

(define-data-var next-item-id uint u0)
(define-data-var max-items uint u1000000)
(define-data-var creation-fee uint u500)
(define-data-var authority-contract (optional principal) none)

(define-map items
  uint
  {
    factory: principal,
    details: (tuple (material (string-utf8 50)) (size (string-utf8 20)) (color (string-utf8 30)) (style (string-utf8 50)) (brand (string-utf8 50)) (price uint) (origin (string-utf8 100)) (certification (string-utf8 100))),
    hash: (buff 32),
    qr-code: (string-utf8 200),
    timestamp: uint,
    creator: principal,
    status: bool
  }
)

(define-map items-by-hash
  (buff 32)
  uint)

(define-map item-updates
  uint
  {
    update-details: (tuple (material (string-utf8 50)) (size (string-utf8 20)) (color (string-utf8 30)) (style (string-utf8 50)) (brand (string-utf8 50)) (price uint) (origin (string-utf8 100)) (certification (string-utf8 100))),
    update-timestamp: uint,
    updater: principal
  }
)

(define-read-only (get-item (id uint))
  (map-get? items id)
)

(define-read-only (get-item-updates (id uint))
  (map-get? item-updates id)
)

(define-read-only (is-item-registered (hash (buff 32)))
  (is-some (map-get? items-by-hash hash))
)

(define-private (validate-factory (factory principal))
  (if (not (is-eq factory 'SP000000000000000000002Q6VF78))
      (ok true)
      (err ERR-INVALID-FACTORY))
)

(define-private (validate-material (material (string-utf8 50)))
  (if (and (> (len material) u0) (<= (len material) u50))
      (ok true)
      (err ERR-INVALID-MATERIAL))
)

(define-private (validate-size (size (string-utf8 20)))
  (if (and (> (len size) u0) (<= (len size) u20))
      (ok true)
      (err ERR-INVALID-SIZE))
)

(define-private (validate-color (color (string-utf8 30)))
  (if (and (> (len color) u0) (<= (len color) u30))
      (ok true)
      (err ERR-INVALID-COLOR))
)

(define-private (validate-style (style (string-utf8 50)))
  (if (and (> (len style) u0) (<= (len style) u50))
      (ok true)
      (err ERR-INVALID-STYLE))
)

(define-private (validate-brand (brand (string-utf8 50)))
  (if (and (> (len brand) u0) (<= (len brand) u50))
      (ok true)
      (err ERR-INVALID-BRAND))
)

(define-private (validate-price (price uint))
  (if (> price u0)
      (ok true)
      (err ERR-INVALID-PRICE))
)

(define-private (validate-origin (origin (string-utf8 100)))
  (if (and (> (len origin) u0) (<= (len origin) u100))
      (ok true)
      (err ERR-INVALID-ORIGIN))
)

(define-private (validate-certification (cert (string-utf8 100)))
  (if (<= (len cert) u100)
      (ok true)
      (err ERR-INVALID-CERTIFICATION))
)

(define-private (validate-hash (hash (buff 32)))
  (if (is-eq (len hash) u32)
      (ok true)
      (err ERR-INVALID-HASH))
)

(define-private (validate-qr-code (qr (string-utf8 200)))
  (if (and (> (len qr) u0) (<= (len qr) u200))
      (ok true)
      (err ERR-INVALID-QR-CODE))
)

(define-private (validate-timestamp (ts uint))
  (if (>= ts block-height)
      (ok true)
      (err ERR-INVALID-TIMESTAMP))
)

(define-private (validate-details (details (tuple (material (string-utf8 50)) (size (string-utf8 20)) (color (string-utf8 30)) (style (string-utf8 50)) (brand (string-utf8 50)) (price uint) (origin (string-utf8 100)) (certification (string-utf8 100)))))
  (begin
    (try! (validate-material (get material details)))
    (try! (validate-size (get size details)))
    (try! (validate-color (get color details)))
    (try! (validate-style (get style details)))
    (try! (validate-brand (get brand details)))
    (try! (validate-price (get price details)))
    (try! (validate-origin (get origin details)))
    (try! (validate-certification (get certification details)))
    (ok true)
  )
)

(define-public (set-authority-contract (contract-principal principal))
  (begin
    (asserts! (is-none (var-get authority-contract)) (err ERR-AUTHORITY-NOT-VERIFIED))
    (var-set authority-contract (some contract-principal))
    (ok true)
  )
)

(define-public (set-max-items (new-max uint))
  (begin
    (asserts! (> new-max u0) (err ERR-INVALID-UPDATE-PARAM))
    (asserts! (is-some (var-get authority-contract)) (err ERR-AUTHORITY-NOT-VERIFIED))
    (var-set max-items new-max)
    (ok true)
  )
)

(define-public (set-creation-fee (new-fee uint))
  (begin
    (asserts! (>= new-fee u0) (err ERR-INVALID-UPDATE-PARAM))
    (asserts! (is-some (var-get authority-contract)) (err ERR-AUTHORITY-NOT-VERIFIED))
    (var-set creation-fee new-fee)
    (ok true)
  )
)

(define-public (create-item
  (factory principal)
  (details (tuple (material (string-utf8 50)) (size (string-utf8 20)) (color (string-utf8 30)) (style (string-utf8 50)) (brand (string-utf8 50)) (price uint) (origin (string-utf8 100)) (certification (string-utf8 100))))
  (hash (buff 32))
  (qr-code (string-utf8 200))
)
  (let (
        (next-id (var-get next-item-id))
        (current-max (var-get max-items))
        (authority (var-get authority-contract))
      )
    (asserts! (< next-id current-max) (err ERR-MAX-ITEMS-EXCEEDED))
    (try! (validate-factory factory))
    (try! (validate-details details))
    (try! (validate-hash hash))
    (try! (validate-qr-code qr-code))
    (asserts! (is-none (map-get? items-by-hash hash)) (err ERR-ITEM-ALREADY-EXISTS))
    (let ((authority-recipient (unwrap! authority (err ERR-AUTHORITY-NOT-VERIFIED))))
      (try! (stx-transfer? (var-get creation-fee) tx-sender authority-recipient))
    )
    (map-set items next-id
      {
        factory: factory,
        details: details,
        hash: hash,
        qr-code: qr-code,
        timestamp: block-height,
        creator: tx-sender,
        status: true
      }
    )
    (map-set items-by-hash hash next-id)
    (var-set next-item-id (+ next-id u1))
    (print { event: "item-created", id: next-id })
    (ok next-id)
  )
)

(define-public (update-item
  (item-id uint)
  (update-details (tuple (material (string-utf8 50)) (size (string-utf8 20)) (color (string-utf8 30)) (style (string-utf8 50)) (brand (string-utf8 50)) (price uint) (origin (string-utf8 100)) (certification (string-utf8 100))))
)
  (let ((item (map-get? items item-id)))
    (match item
      i
        (begin
          (asserts! (is-eq (get creator i) tx-sender) (err ERR-NOT-AUTHORIZED))
          (try! (validate-details update-details))
          (map-set items item-id
            (merge i { details: update-details, timestamp: block-height })
          )
          (map-set item-updates item-id
            {
              update-details: update-details,
              update-timestamp: block-height,
              updater: tx-sender
            }
          )
          (print { event: "item-updated", id: item-id })
          (ok true)
        )
      (err ERR-ITEM-NOT-FOUND)
    )
  )
)

(define-public (verify-item-hash (id uint) (hash (buff 32)))
  (match (map-get? items id)
    item
      (ok (is-eq (get hash item) hash))
    (err ERR-ITEM-NOT-FOUND)
  )
)

(define-public (get-item-count)
  (ok (var-get next-item-id))
)

(define-public (check-item-existence (hash (buff 32)))
  (ok (is-item-registered hash))
)