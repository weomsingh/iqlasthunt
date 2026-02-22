# Fix Summary: Transaction Type Errors — RESOLVED ✅

## Root Cause
The `transactions_type_check` DB constraint only allowed:
`deposit`, `withdrawal`, `stake`, `win_prize`, `refund_stake`, `lock_vault`, `unlock_vault`

But the code (frontend + SQL functions) was inserting:
- `bounty_refund` ← used in `cancel_bounty()`
- `stake_partial_refund` ← used in `select_winner()`
- `release_vault` ← old name used in `PayerVault.jsx` 
- `refund_vault` ← old name used in `PayerVault.jsx`

## Fix Applied

### 1. MASTER_FIX_RUN_THIS.sql (NEW FILE)
Run this ONCE in Supabase SQL Editor. It:
- [x] Expands `transactions_type_check` to include all needed types
- [x] Adds `paused` + `deleted` to bounties status constraint
- [x] Adds `pending_review` to submissions status constraint
- [x] Recreates `cancel_bounty()`, `select_winner()`, `submit_work()`, `stake_on_bounty()` with correct types
- [x] Fixes RLS policies for all tables
- [x] Grants proper permissions

### 2. Frontend: src/pages/payer/Vault.jsx
- [x] Replaced `release_vault` → `unlock_vault`
- [x] Replaced `refund_vault` → `bounty_refund`
- [x] Added `stake_partial_refund` to positive types
- [x] Added user-friendly emoji labels for all tx types
- [x] Fixed icon background color logic

### 3. Frontend: src/pages/hunter/Vault.jsx
- [x] Added `stake_partial_refund` to isPositive check
- [x] Added user-friendly emoji labels for all tx types

## Steps to Deploy

**Step 1 (Required):** Go to Supabase → SQL Editor → Paste and run:
```
/Users/omsingh/Downloads/iqhuntfinale-main/src/lib/MASTER_FIX_RUN_THIS.sql
```

**Step 2:** Deploy the updated frontend (git push / Vercel redeploy)

## Valid Transaction Types (after fix)
| Type | Description | Positive? |
|------|-------------|-----------|
| `deposit` | User adds funds | ✅ + |
| `withdrawal` | User withdraws | ❌ - |
| `stake` | Hunter stakes on bounty | ❌ - |
| `lock_vault` | Payer locks funds for bounty | ❌ - |
| `unlock_vault` | Surplus returned to payer | ✅ + |
| `bounty_refund` | Full refund when bounty cancelled | ✅ + |  
| `win_prize` | Winner gets reward | ✅ + |
| `refund_stake` | Full stake refund | ✅ + |
| `stake_partial_refund` | 30% stake returned to losers | ✅ + |
