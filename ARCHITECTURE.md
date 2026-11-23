# Artelio Marketplace – Full Technical & System Architecture Document

> **System Designation:** AI-Enabled Zero-Custody Marketplace for Fine Art & Independent Creators  
> **Repository:** `bhosalegurudatta-ind/artelio-marketplace`  
> **Production URL:** `https://artelio-marketplace.vercel.app`  
> **Architecture Version:** 2.4.0 (Production Edition)  
> **Last Updated:** November 2026  

---

## 1. Executive Summary & Design Philosophy

Artelio is a modern fine art and creative lifestyle marketplace engineered to empower independent artists while providing art collectors with museum-grade trust, authenticity guarantees, and interactive visual technologies.

### Core Architectural Pillars
1. **Zero-Custody Master Storage:** The platform never takes unconditional custody of unwatermarked, high-resolution original art files. Only downsampled, watermarked previews are indexed publicly; master resolution files are stored securely in creator vaults and released only upon confirmed payment.
2. **Cryptographic Provenance (dHash):** Every artwork is fingerprinted with a 64-bit perceptual difference hash (`dHash`), logged immutably alongside artist identity and creation timestamps, enabling instant public authenticity verification and duplicate detection.
3. **Multimodal AI Style-Fusion (RAG-Assisted):** Artists can leverage Google Gemini multimodal models grounded in their own existing portfolio references to generate novel artwork variations and concept art while retaining their signature artistic style.
4. **Automated Escrow & 90/10 Fair Split:** Financial transactions are split into a 90% creator payout and a 10% platform fee, protected by a milestone-based escrow hold released upon verified physical/digital delivery.
5. **Interactive AR Room Visualizer:** Real-time canvas projection enabling collectors to preview art on customizable living room, bedroom, and studio walls with real-world dimensions and bespoke framing styles.

---

## 2. High-Level System Architecture

The following diagram illustrates the end-to-end data flow between collectors, artists, the Next.js application layer, external cloud microservices, and database stores:

```mermaid
flowchart TD
    subgraph ClientLayer["Client & Device Tier"]
        C1["Web Collector Browser\n(Desktop & Mobile)"]
        C2["Artist Studio Atelier\n(Creator Dashboard)"]
        C3["Public Auditor\n(/verify Provenance)"]
    end

    subgraph EdgeCDN["Vercel Edge Network & Global CDN"]
        V1["DNS & Anycast Edge Cache"]
        V2["Serverless Node.js Route Handlers"]
        V3["Next.js App Router (React Server Components)"]
    end

    subgraph ServiceLayer["Application Service Layer"]
        S_AUTH["Auth & RBAC Service\n(Supabase JWT + Google OAuth)"]
        S_PROV["Provenance & Hash Engine\n(Sharp 64-bit dHash & Hamming)"]
        S_AI["AI Creative Studio\n(Gemini Pro Multimodal RAG)"]
        S_PAY["Escrow & Payment Engine\n(Razorpay Orders & Webhooks)"]
        S_ROOM["Interactive AR Canvas\n(HTML5 Room Engine)"]
    end

    subgraph PersistenceLayer["Data & Storage Infrastructure"]
        DB[(Supabase PostgreSQL Database)]
        ST_PUB[(Public Previews S3 Bucket)]
        ST_PRIV[(Zero-Custody Master Vault S3 Bucket)]
    end

    subgraph ExternalServices["External APIs & Gateways"]
        EXT_RAZOR["Razorpay Gateway\n(UPI / Cards / Escrow)"]
        EXT_GEMINI["Google Gemini API\n(Multimodal LLM / Diffusion)"]
    end

    C1 -->|HTTPS / Browsing & Cart| V1
    C2 -->|Upload / Manage / Studio| V1
    C3 -->|CoA / Image Hash Check| V1

    V1 --> V3
    V3 --> V2

    V2 --> S_AUTH
    V2 --> S_PROV
    V2 --> S_AI
    V2 --> S_PAY
    V2 --> S_ROOM

    S_AUTH --> DB
    S_PROV --> ST_PUB
    S_PROV --> DB
    S_PAY --> DB
    S_PAY --> EXT_RAZOR
    S_AI --> EXT_GEMINI
    S_ROOM --> ST_PUB
```

---

## 3. Technology Stack & Layer Breakdown

| Layer | Technologies Selected | Rationale & Architectural Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | Next.js 14 (App Router), React 18, TypeScript | Full-stack hybrid SSR + CSR architecture with optimal Core Web Vitals, static page generation, and SEO optimization. |
| **Styling & Design System** | Tailwind CSS 3.4, PostCSS, Lucide Icons | Utility-first styling adhering strictly to the Artelio Brand Palette (`#F83758` Coral Red, `#17223B` Deep Navy, `#FAF9F6` Warm Linen). |
| **Backend & APIs** | Next.js Serverless Route Handlers (`runtime = 'nodejs'`) | Lightweight, autoscaling microservices handling multipart uploads, webhook validation, and payment coordination. |
| **Image & Media Engine** | Sharp (libvips C-bindings) | High-speed server-side image processing, 64-bit perceptual hashing, tiled SVG watermark generation, and downscaling. |
| **Database & Auth** | Supabase (PostgreSQL 15), Supabase Auth (JWT), Row-Level Security (RLS) | Relational integrity, foreign key cascades, role-based access control, and Google OAuth 2.0 social sign-in. |
| **Object Storage** | Supabase Storage (S3-compatible) | Dual-bucket configuration separating public watermarked previews (`artworks`) from secure master releases (`originals`). |
| **AI & Multimodal Vision** | Google Gemini Multimodal API (`@google/genai`) | Contextual style extraction, multimodal prompts referencing existing portfolio pieces, and curatorial suggestions. |
| **Payment Gateway** | Razorpay Node SDK & Razorpay Standard Checkout | Live UPI, NetBanking, Cards, and recurring Subscriptions with cryptographic signature validation (`hmac-sha256`). |
| **Hosting & CI/CD** | Vercel Edge Platform + GitHub Actions | Automated continuous deployment on pushes to `main`, instant edge caching, and SSL termination. |

---

## 4. Zero-Custody & Cryptographic Provenance Architecture

Artelio solves the single greatest vulnerability of online digital art marketplaces: **the risk of unauthorized replication and theft of master resolution assets.**

```mermaid
sequenceDiagram
    autonumber
    actor Artist as Artist Atelier
    participant API as Artelio Upload API
    participant Sharp as Sharp Image Processing
    participant DB as PostgreSQL DB
    participant Storage as Object Storage
    actor Collector as Buyer / Collector
    actor Auditor as Public Provenance (/verify)

    Artist->>API: Upload Master File (Raw Resolution)
    API->>Sharp: Compute 64-bit dHash & Generate Watermarked Preview (1000px)
    Sharp-->>API: Returns { previewBuffer, imageHash }
    API->>Storage: Store Preview in Public Bucket
    API->>Storage: Store Encrypted Master in Secure Vault
    API->>DB: INSERT into artworks (image_hash, image_url, original_path)
    
    Collector->>API: Browse / Inspect Artwork
    API-->>Collector: Serves Low-Res Watermarked Preview Only
    
    Collector->>API: Completes Purchase (Razorpay Escrow)
    API->>DB: Update order status = 'paid'
    API-->>Collector: Generates Signed Download URL for High-Res Master + CoA
    
    Auditor->>API: Query /verify by CoA Number, Artwork ID, or Image Upload
    API->>DB: Look up by UUID, Order ID, or Hamming Distance (dHash <= 16)
    API-->>Auditor: Returns Authenticity Certificate, Timestamp, and Creator Identity
```

### 4.1 Perceptual Difference Hashing (`dHash`) Algorithm
Unlike cryptographic hashes (SHA-256 or MD5) which change drastically with even a single bit flip, Artelio computes a **64-bit Difference Hash (dHash)**:
1. The input image is converted to grayscale and stripped of alpha channels.
2. The image is resized to an exact $9 \times 8$ grid ($72$ total pixels).
3. Adjacent horizontal pixels are compared: if pixel $(x, y) > (x+1, y)$, bit is `1`, else `0`.
4. The resulting 64-bit string is encoded as a 16-character hexadecimal string.
5. Verification computes the **Hamming Distance** (count of differing bits). A distance $\le 16$ indicates a confident visual match regardless of compression or minor scaling.

---

## 5. Database Schema & Data Models

The relational schema is hosted on Supabase PostgreSQL and enforces strict referential integrity.

```mermaid
erDiagram
    USERS ||--o{ ARTWORKS : "creates"
    USERS ||--o{ ORDERS : "purchases"
    ARTWORKS ||--o{ ARTWORK_IMAGES : "has many photos"
    ARTWORKS ||--o{ ARTWORK_TAGS : "categorized by"
    ORDERS ||--|| ARTWORKS : "orders piece"
    USERS ||--o{ DISPUTES : "files"
    ORDERS ||--o{ DISPUTES : "subject of"

    USERS {
        uuid id PK
        text name
        text email UK
        text role "artist | customer | admin"
        text bio
        text payout_upi_id
        text payout_method
        boolean approved
        timestamp created_at
    }

    ARTWORKS {
        uuid id PK
        uuid artist_id FK
        text title
        text description
        text medium
        numeric price
        text image_url
        text original_path
        text image_hash "64-bit hex"
        boolean is_digital
        boolean is_ai_assisted
        boolean sold
        timestamp created_at
    }

    ARTWORK_IMAGES {
        uuid id PK
        uuid artwork_id FK
        text preview_url
        int position
    }

    ORDERS {
        uuid id PK
        uuid artwork_id FK
        uuid customer_id FK
        text status "pending | paid | delivered | disputed | refunded"
        numeric amount
        text razorpay_payment_id
        text razorpay_order_id
        text shipping_address
        text courier_name
        text tracking_url
        timestamp delivered_at
        timestamp created_at
    }

    DISPUTES {
        uuid id PK
        uuid order_id FK
        uuid raised_by FK
        text reason
        text status "open | under_review | resolved | rejected"
        timestamp created_at
    }
```

---

## 6. Financial, Escrow & Subscription Architecture

Artelio adopts a compliant, transparent financial model structured around direct creator empowerment.

```mermaid
flowchart LR
    Buyer["Collector Checkout (₹10,000)"] --> Gateway["Razorpay Gateway"]
    Gateway --> Escrow["Escrow Vault (Artelio Trust Escrow)"]
    
    Escrow -->|Delivery Confirmed| PayoutSplit{"Automated Settlement Split"}
    
    PayoutSplit -->|90% Direct Creator Payout| Artist["Artist Account (₹9,000 via UPI/NEFT)"]
    PayoutSplit -->|10% Marketplace Commission| Platform["Artelio Operations (₹1,000)"]
    
    Escrow -.->|Dispute Raised within 48h| Arbitration["Artelio Trust & Safety Review"]
    Arbitration -.->|Item Damaged / Fake| Refund["100% Refund to Collector"]
```

### 6.1 Subscription Tiers (ES Course Report Sec 5.1)
- **Artist Professional Subscription (₹999 / month or ₹9,990 / year):**
  - Unlimited artwork listings with automated zero-custody watermarking.
  - 64-bit dHash provenance registration on the public ledger.
  - Multimodal AI Studio access (portfolio style-fusion).
  - Payout processing at 90% net rate.
- **Collector VIP Membership (₹499 / month):**
  - Unlimited 3D Room Visualizer wall previews & high-res exports.
  - Early-access drops (48 hours before general release).
  - Private 3D virtual spaces and curated collection galleries.

---

## 7. Security, Authentication & Role-Based Access Control (RBAC)

Artelio enforces defense-in-depth across the entire request lifecycle:

1. **Authentication:**
   - Supabase Auth handles user sessions via asymmetric JWT tokens.
   - Google OAuth 2.0 social sign-in synchronizes directly to the internal `users` schema via server-side `/api/auth/sync`.
2. **Authorization Roles:**
   - `visitor`: Unauthenticated public users (read-only browsing, public provenance lookup).
   - `customer`: Verified buyers (can purchase, bookmark, message artists, file disputes).
   - `artist`: Verified creators (can access upload atelier, set UPI payout details, run AI studio).
   - `admin`: Platform governance (can resolve disputes, hide flagged content, verify creator applications).
3. **Server-Side Guard Rails:**
   - Critical API routes (`/api/admin/*`, `/api/artworks/delete`) verify user identity using `supabaseAdmin` service role credentials against database records, completely immune to client-side header tampering.

---

## 8. Directory & Codebase Architecture

```text
artelio-marketplace/
├── app/
│   ├── api/
│   │   ├── admin/           # Admin dispute & artist moderation endpoints
│   │   ├── ai/              # Gemini multimodal RAG & prompt generation
│   │   ├── artworks/        # Artwork CRUD & watermarking handlers
│   │   ├── orders/          # Escrow order management & tracking
│   │   ├── razorpay/        # Payment order creation & webhook verification
│   │   ├── subscriptions/   # Razorpay recurring subscription APIs
│   │   └── verify/          # Public provenance registry & dHash matching
│   ├── artwork/[id]/        # Artwork detail page & AR visualizer modal
│   ├── browse/              # Filterable, searchable art gallery
│   ├── checkout/            # Razorpay secure checkout flow
│   ├── dashboard/           # Artist atelier (Upload, AI Studio, Billing)
│   ├── orders/              # Collector order tracking & dispute initiation
│   ├── plans/               # Subscription upgrade portal (₹999 / ₹499)
│   ├── spaces/              # 3D private virtual gallery & wall visualizer
│   └── verify/              # Public provenance authenticity portal
├── components/              # Reusable React components (Navbar, Modals, Cards)
├── lib/                     # Core business logic (imageTools, plans, supabase)
├── public/                  # Static assets, branding, and local artwork catalog
├── scripts/                 # Maintenance utilities (backfill-hashes.js)
├── ARCHITECTURE.md          # Technical architecture document
└── tailwind.config.ts       # Design system tokens and styling rules
```

---

## 9. Verification & Quality Assurance Protocols

1. **Continuous Integration:** Every commit to `main` undergoes full static type checking (`npx tsc --noEmit`) prior to production deployment.
2. **Automated Provenance Audit:** Previews are verified against the perceptual hash ledger with Hamming distance assertions before being marked active.
3. **Payment Integrity:** Webhook signatures are verified with cryptographically secure HMAC-SHA256 tokens using the dedicated Razorpay secret.
