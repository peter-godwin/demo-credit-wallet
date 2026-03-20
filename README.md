# Demo Credit Wallet Service

A RESTful wallet API built for the **Lendsqr Backend Engineering Assessment**.  
Users can create accounts, fund wallets, transfer funds, and withdraw — with Karma blacklist protection at onboarding.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Architecture Overview](#architecture-overview)
3. [E-R Diagram](#e-r-diagram)
4. [Design Decisions](#design-decisions)
5. [Getting Started](#getting-started)
6. [API Documentation](#api-documentation)
7. [Running Tests](#running-tests)
8. [Deployment](#deployment)

---

## Tech Stack

| Layer        | Technology              |
|--------------|-------------------------|
| Runtime      | Node.js (LTS)           |
| Language     | TypeScript              |
| Framework    | Express.js              |
| ORM          | KnexJS                  |
| Database     | MySQL                   |
| Testing      | Jest + ts-jest          |
| HTTP Client  | Axios (Adjutor API)     |
| Deployment   | Railway  |

---



## Architecture Overview

```
src/
├── config/         # Knex DB instance
├── controllers/    # Request handlers 
├── middlewares/    # Auth middleware (faux token)
├── models/         # TypeScript interfaces / DTOs
├── routes/         # Express route definitions
├── services/       # Business logic (UserService, WalletService, KarmaService)
└── utils/          # Response helpers, validators, account number generator

migrations/         # Knex migration files 
tests/              # Unit tests
```

The architecture follows a **layered pattern**:

```
Request → Route → Middleware → Controller → Service → DB
```

- **Controllers** are thin: they validate input and delegate to services.
- **Services** contain all business logic and own database transactions.
- **Migrations** manage schema changes — never raw SQL in application code.

---

## E-R Diagram
<img width="1174" height="474" alt="demo-credit_1" src="https://github.com/user-attachments/assets/6240090e-545b-4f16-933b-2abea5184664" />

       │

**Relationships:**
- One `user` → one `wallet` 
- One `wallet` → many `transactions`
- A transfer creates **two** transaction records: one debit (sender) and one credit (recipient)

---

## Design Decisions

### 1. Karma Blacklist Check (Fail-Safe)
Both email and phone are checked against the Adjutor Karma blacklist before any user is created. A non 404 error from the API deliberately **fails closed**  the user is not onboarded if we cannot verify their identity.

### 2. Transaction Scoping (Atomicity)
All state-changing wallet operations (`fund`, `transfer`, `withdraw`) run inside a `knex.transaction()` block with `SELECT ... FOR UPDATE` row locking. This prevents:
- **Double-spend**: two concurrent withdrawals draining more than the available balance.
- **Race conditions**: a balance read becoming stale between the check and the update.

### 3. Two Transaction Records Per Transfer
When a transfer occurs, both the sender (debit) and recipient (credit) get a transaction record.

### 4. Faux Token Authentication
As specified, authentication is simplified: the Bearer token is the user's UUID. The middleware validates that the UUID belongs to a real user in the database. This is swappable for JWT by replacing the middleware in one place.

### 5. Account Number Format
Generated account numbers followed a 10-digit format.

### 6. UUIDs as Primary Keys
UUIDs are used instead of auto-increment integers.

### 7. DECIMAL(15,2) for Money
Floating-point types (`FLOAT`, `DOUBLE`) are never used for currency due to precision loss. `DECIMAL(15,2)` stores exact values up to 999,999,999,999,999.99.

---

## Getting Started

### Prerequisites
- Node.js >= 18 (LTS)
- MySQL >= 8.0
- A [Lendsqr Adjutor API]([https://adjutor.lendsqr.com](https://api.adjutor.io/#046b0002-fdc2-4e4e-8b3a-29afb47f38b0)) key

### Installation

```bash
git clone https://github.com/<your-username>/demo-credit-wallet.git
cd demo-credit-wallet
npm install
```

### Environment Setup

```bash
cp .env.example .env
# Use your DB credentials and Adjutor API key
```

### Database Setup

```bash
# Create the database
mysql -u root -p -e "CREATE DATABASE demo_credit;"

# Run migrations
npm run migrate
```

### Run in Development

```bash
npm run dev
```

---

## API Documentation

Base URL: `https://<your-name>-lendsqr-be-test.<platform>.com`

### Authentication

All protected routes require:
```
Authorization: Bearer <user-uuid>
```
> The token is the user's UUID returned when account is created.

---

### Users

#### Create Account
```
POST /api/users
```
**Body:**
```json
{
  "first_name": "Peter",
  "last_name": "Godwin",
  "email": "peter@gmail.com",
  "phone": "08023331112",
  "bvn": "84759201781"
}
```
**Response `201`:**
```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "user": {
      "id": "bd7369b8-0213-4e84-aabb-96585e08a9c3",
      "first_name": "Peter",
      "last_name": "Godwin",
      "email": "peter@gmail.com",
      "phone": "08023331112",
      "bvn": "84759201781",
      "is_blacklisted": 0,
      "blacklist_reason": null,
      "created_at": "2026-03-19T03:55:12.000Z",
      "updated_at": "2026-03-19T03:55:12.000Z"
    },
    "wallet": {
      "id": "8e5e309e-4011-4466-bef4-d2dcee65e031",
      "user_id": "bd7369b8-0213-4e84-aabb-96585e08a9c3",
      "account_number": "6666565847",
      "balance": "0.00",
      "is_active": 1,
      "created_at": "2026-03-19T03:55:12.000Z",
      "updated_at": "2026-03-19T03:55:12.000Z"
    }
  }
}
```
**Failure cases:**
- `403` — user is on the Karma blacklist
- `409` — email or phone already registered
- `422` — validation errors

---

#### Get User Profile
```
GET /api/users/:userId
Authorization: Bearer <token>
```

---

### Wallets

#### Get Wallet Balance
```
GET /api/wallets/me
Authorization: Bearer <token>
```

#### Fund Wallet
```
POST /api/wallets/fund
Authorization: Bearer <token>
```
```json
{ "amount": 5000 }
```

#### Transfer Funds
```
POST /api/wallets/transfer
Authorization: Bearer <token>
```
```json
{
  "recipient_account_number": "2099887766",
  "amount": 1000,
  "description": "Test payment"
}
```

#### Withdraw Funds
```
POST /api/wallets/withdraw
Authorization: Bearer <token>
```
```json
{ "amount": 2000, "description": "ATM withdrawal" }
```

#### Transaction History
```
GET /api/wallets/transactions?page=1&limit=20
Authorization: Bearer <token>
```

---

## Running Tests

```bash
npm test
```

Tests cover:
-  User creation 
-  Karma blacklist rejection: email and phone
-  Duplicate email & phone rejection
-  Wallet funding
-  Fund transfer: success, insufficient funds, invalid recipient, self-transfer
-  Withdrawal: success & insufficient funds
-  Input validation: email, phone, amount
-  Karma API error handling: 404, 503, network failure

---

## Deployment

```bash
npm run build
npm start
```

Deployed at: `https://<your-name>-lendsqr-be-test.<platform>.com`

GitHub: `https://github.com/<your-username>/demo-credit-wallet`
