# Deploy Log - 2026-02-18

## Critical Changes Since Last Deploy
1. **Scrolling Fix**: Fixed the "frozen" home page issue by removing `overscroll-behavior: none` from `src/index.css`.
2. **Crash Prevention**: Added `ErrorBoundary` to prevent white screen crashes.
3. **Login Debugging**: Added detailed error alerts to the "Post Bounty" and "Enter as Hunter" buttons.

## Action Required
Please **redeploy** the application to Vercel (push these changes to GitHub).

## How to Verify
1. Open the new deployment.
2. Verify scrolling works.
3. Click "Post Bounty".
   - If it works, you will be redirected to Google Sign In.
   - If it fails, you will now see a specific error message (e.g. "Supabase URL missing"). **Please tell me this message.**

## Note on "Nothing is working"
The previous report that "nothing is working" is likely because errors were being swallowed efficiently or the scroll lock made the page feel unresponsive. These changes expose the errors and fix the scroll lock.
