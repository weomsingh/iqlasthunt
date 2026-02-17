# 🎯 IQHUNT v19.0 - COMPLETE REBUILD PLAN

## 📋 EXECUTIVE SUMMARY
This plan implements the **full IQHUNT platform** with all features, proper styling, and backend integration. This is a production-ready build, not a skeleton.

---

## 🗄️ DATABASE ARCHITECTURE

### Tables to Create/Update

1. **profiles** (ENHANCED)
   - Existing fields + role enforcement
   - Hunter-specific: expertise[], bio, date_of_birth, stats (hunts_completed, success_rate)
   - Payer-specific: is_organization, company_name, verified_status
   - Financial: wallet_balance, total_earnings, total_spent

2. **bounties** (ENHANCED)
   - Core: title, description, reward, currency, status
   - Constraints: max_hunters (default 3), submission_deadline
   - Financial: vault_amount (105% escrow), admin_verified
   - Metadata: pdf_url (encrypted mission brief), winner_id

3. **hunter_stakes** (NEW)
   - Links: hunter_id, bounty_id
   - State: status (active/rejected/won/lost), entry_fee, staked_at
   - Constraint: ONE active stake per hunter AT A TIME

4. **submissions** (NEW)
   - Links: hunter_id, bounty_id
   - Content: submission_url, submitted_at, ai_score (0-100)
   - Verdict: selected_as_winner (boolean)

5. **war_room_messages** (NEW - EPHEMERAL)
   - Links: bounty_id, sender_id, sender_role
   - Content: message (encrypted), sent_at
   - **AUTO-PURGE**: Deleted when winner selected

6. **transactions** (NEW)
   - Links: user_id, bounty_id (nullable)
   - Financial: type (deposit/withdrawal/stake/payout/refund), amount, currency
   - Verification: utr (bank reference), status (pending/approved/rejected), admin_notes
   - Timestamps: created_at, processed_at

7. **admin_actions** (NEW - AUDIT LOG)
   - Links: admin_id, target_type (bounty/transaction/user), target_id
   - Action: action_type, notes, timestamp

### PostgreSQL Functions (RPC)

1. **`lock_target(p_bounty_id, p_hunter_id, p_entry_fee)`**
   - Atomic check: Hunter has NO other active stakes
   - Creates hunter_stake record with status='active'
   - Deducts entry_fee from hunter's wallet
   - Returns success/error message

2. **`submit_work(p_bounty_id, p_hunter_id, p_submission_url)`**
   - Validates: Hunter has active stake on this bounty
   - Creates submission record
   - Triggers AI scoring (mock for now)
   - Returns submission_id

3. **`select_winner(p_bounty_id, p_winner_id, p_admin_id)`**
   - Validates: Payer or Admin only
   - Updates submission: selected_as_winner = true
   - Updates bounty: winner_id, status='completed'
   - Transfers vault_amount to winner's wallet
   - **PURGES war_room_messages for this bounty**
   - Creates transaction records
   - Returns success

4. **`verify_deposit(p_transaction_id, p_admin_id, p_approved)`**
   - Admin function
   - If approved: Updates transaction status, adds to user wallet
   - If rejected: Updates status with admin_notes
   - Returns updated transaction

5. **`request_withdrawal(p_user_id, p_amount, p_upi_id)`**
   - Validates: Sufficient balance
   - Creates transaction (type='withdrawal', status='pending')
   - Deducts from wallet (held in escrow)
   - Returns transaction_id

---

## 🎨 FRONTEND ARCHITECTURE

### Page Structure

```
/                          → LandingPage (public)
/auth/callback             → AuthCallback (OAuth handler)
/onboarding                → OnboardingPage (profile setup)

/hunter/arena              → Arena (browse & stake on bounties)
/hunter/dashboard          → HunterDashboard (stats, active hunts)
/hunter/vault              → HunterVault (wallet, earnings, withdraw)
/hunter/bounty/:id         → BountyDetailsPage (mission brief, submit)
/hunter/warroom/:id        → WarRoomPage (real-time chat)

/payer/dashboard           → PayerDashboard (overview, analytics)
/payer/post                → PostBountyPage (create new bounty)
/payer/live                → LiveBountiesPage (manage active bounties)
/payer/history             → HistoryPage (past bounties)
/payer/vault               → PayerVault (wallet, deposits)
/payer/warroom/:id         → WarRoomPage (same as hunter)

/admin/dashboard           → AdminDashboard (platform overview)
/admin/verify-deposits     → VerifyDepositsPage (approve/reject)
/admin/verify-bounties     → VerifyBountiesPage (approve new bounties)
/admin/users               → UserManagementPage (ban/verify users)

/covenant                  → CovenantPage (terms)
/contact                   → ContactPage (support)
/privacy                   → PrivacyPage
/terms                     → TermsPage
```

---

## 🔧 COMPONENT LIBRARY

### Layout Components
- `MainLayout` - Landing page wrapper
- `DashboardLayout` - Shared hunter/payer/admin layout with sidebar
- `Sidebar` - Dynamic navigation based on role
- `Header` - Top bar with wallet balance, notifications
- `ProtectedRoute` - Role-based route guards

### Shared Components
- `BountyCard` - Displays bounty summary with CTA
- `WalletCard` - Credit-card style balance display
- `TransactionHistory` - Paginated transaction table
- `DepositModal` - UPI deposit form with QR
- `WithdrawalModal` - Withdrawal request form
- `LoadingScreen` - Full-page loader
- `EmptyState` - No data placeholder

### Hunter-Specific
- `StakeButton` - Entry fee + lock mechanism
- `SubmissionForm` - Upload submission UI
- `HunterStatsCard` - Win rate, earnings, rank

### Payer-Specific
- `BountyForm` - Multi-step bounty creation
- `HunterApplicationCard` - Review staked hunters
- `WinnerSelectionPanel` - Select alpha from submissions

### Admin-Specific
- `DepositVerificationCard` - Approve/reject with UTR check
- `BountyApprovalCard` - Review and approve bounties
- `UserCard` - User details with ban/verify actions

### War Room
- `ChatMessage` - Styled message bubble
- `ChatInput` - Message composer
- `ParticipantList` - Payer + staked hunters

---

## 🎯 CORE WORKFLOWS

### 1. Hunter Journey: Staking & Winning

**Arena → Stake → War Room → Submit → Win → Withdraw**

1. **Browse Arena**
   - See all "Live" bounties (admin approved)
   - Filter by expertise, reward range
   - Click "View Details"

2. **Bounty Details**
   - Download encrypted PDF (mission brief)
   - See entry fee, slots available
   - Click "STAKE NOW"

3. **Stake Modal**
   - Confirm entry fee deduction
   - Backend calls `lock_target()` RPC
   - If hunter has another active stake → ERROR
   - Success → Navigate to War Room

4. **War Room**
   - Real-time chat with Payer & other hunters
   - Upload submission when ready
   - See countdown to deadline

5. **Submit Work**
   - Upload file/URL
   - AI scores submission (mock for now)
   - Wait for Payer to select winner

6. **Winner Selected**
   - Notification: "You won! ₹X added to Vault"
   - War Room purged (no history)
   - Can withdraw earnings

7. **Withdraw**
   - Go to Vault → Request Withdrawal
   - Enter UPI ID
   - Admin approves → Money sent

### 2. Payer Journey: Posting & Selecting

**Post → Fund → Review → Select Winner**

1. **Post Bounty**
   - Fill form: Title, description, reward, max hunters
   - Upload mission PDF
   - Submit for admin approval

2. **Fund Vault**
   - Deposit 105% of reward via UPI
   - Submit UTR for verification
   - Admin approves → Bounty goes LIVE

3. **Monitor War Room**
   - Chat with staked hunters
   - Answer questions
   - See submission notifications

4. **Review Submissions**
   - View AI scores
   - Download submissions
   - Select best one (Alpha)

5. **Select Winner**
   - Click "SELECT AS ALPHA"
   - Backend calls `select_winner()` RPC
   - Winner gets money
   - War Room purged
   - Bounty archived

### 3. Admin Journey: Verification

**Approve Deposits → Approve Bounties → Monitor**

1. **Verify Deposits**
   - See pending transactions with UTR
   - Cross-check bank statement
   - Approve/Reject

2. **Verify Bounties**
   - Review bounty details
   - Check vault funding (105%)
   - Approve → Bounty goes LIVE

3. **Monitor Platform**
   - See stats: Active bounties, users, GMV
   - Ban malicious users
   - Handle disputes

---

## 🎨 DESIGN SYSTEM

### Colors
- **Primary**: #00FF9D (IQ Green)
- **Background**: #0A0A0A (Rich Black)
- **Surface**: #111111 (Card Background)
- **Text**: #FFFFFF (White), #888888 (Gray)
- **Error**: #FF5252
- **Warning**: #FFA726
- **Success**: #00FF9D

### Typography
- **Headings**: Space Grotesk (Bold, 900)
- **Body**: Inter (Regular, 400-600)
- **Mono**: JetBrains Mono (for UTR, IDs)

### Components Style Guide
- **Buttons**: Rounded (8px), Hover lift (-2px), Transition (0.3s)
- **Cards**: Dark surface (#111), 1px border (rgba(0,255,157,0.2)), 12px radius
- **Inputs**: Dark bg, green border on focus, clear error states
- **Modals**: Centered, backdrop blur, slide-in animation

### Animations
- Page transitions: Fade in (0.5s)
- Button hover: Scale (1.05) + Lift
- Loading: Spinner + skeleton screens
- Success: Confetti on winner selection

---

## 🔐 SECURITY & COMPLIANCE

1. **Session Persistence**
   - localStorage for auth token
   - Auto-refresh on app load
   - Redirect logged-in users from landing

2. **Role Enforcement**
   - Backend RLS policies
   - Frontend route guards
   - API-level validation

3. **Data Encryption**
   - Mission PDFs: Encrypted S3 URLs (presigned)
   - War Room: TLS in transit, purged after bounty

4. **Financial Security**
   - Wallet operations: Atomic transactions
   - Double-entry accounting
   - Admin audit logs

---

## 📦 IMPLEMENTATION PHASES

### Phase 1: Foundation (Database + Auth) [~2 hours]
1. ✅ Update schema with all 7 tables
2. ✅ Create all 5 RPC functions
3. ✅ Set up RLS policies
4. ✅ Fix auth flow (already done)

### Phase 2: Core Pages (Hunter Flow) [~3 hours]
1. ✅ Arena page with bounty grid
2. ✅ BountyDetailsPage with stake button
3. ✅ WarRoomPage with chat
4. ✅ Submission flow
5. ✅ HunterVault with withdraw

### Phase 3: Core Pages (Payer Flow) [~2 hours]
1. ✅ PostBountyPage with form
2. ✅ PayerDashboard with analytics
3. ✅ LiveBountiesPage with management
4. ✅ Winner selection UI

### Phase 4: Admin Panel [~1.5 hours]
1. ✅ VerifyDepositsPage
2. ✅ VerifyBountiesPage
3. ✅ AdminDashboard

### Phase 5: Polish & Deploy [~1.5 hours]
1. ✅ Add all styling
2. ✅ Test all workflows
3. ✅ Deploy to Vercel
4. ✅ Verify production

**TOTAL ESTIMATED TIME: 10 hours**

---

## ✅ ACCEPTANCE CRITERIA

Before marking this as "DONE", verify:

- [ ] All 15+ pages render correctly
- [ ] Hunter can stake on bounty (one at a time rule works)
- [ ] Payer can post bounty and select winner
- [ ] Admin can verify deposits
- [ ] War Room chat works
- [ ] Wallet shows correct balance
- [ ] Withdrawals create pending transactions
- [ ] Winner selection purges chat
- [ ] Styling matches design system
- [ ] No console errors
- [ ] Deployed to Vercel successfully

---

## 🚀 EXECUTION ORDER

I will execute in this order:

1. **Update Database Schema** (schema.sql with all tables + functions)
2. **Core Components** (WalletCard, BountyCard, etc.)
3. **Hunter Pages** (Arena → Details → War Room → Vault)
4. **Payer Pages** (Dashboard → Post → Live → History)
5. **Admin Pages** (Dashboard → Verify Deposits → Verify Bounties)
6. **Styling** (Complete App.css with all components)
7. **Testing & Deployment**

---

## 📞 NEED CLARIFICATION ON:

Before I start coding, please confirm:

1. **AI Scoring**: Should I mock it (random 0-100) or integrate a real API?
2. **PDF Encryption**: Use Supabase Storage with presigned URLs?
3. **Real-time Chat**: Use Supabase Realtime or just polling?
4. **Payment Gateway**: Keep manual UPI verification or integrate Razorpay later?
5. **Currency**: Support both INR and USD or just INR for now?

---

**📝 YOUR APPROVAL REQUIRED**

Type "APPROVED - START CODING" and I will execute this entire plan step-by-step!
