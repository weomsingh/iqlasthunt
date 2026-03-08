/**
 * IQHUNT Firebase Service Layer
 * Replaces all Supabase operations with Firestore equivalents.
 * Minimal backend footprint — only essential collections used.
 * 
 * Collections:
 *   profiles    → user profiles (role, wallet, stats)
 *   bounties    → bounty listings
 *   hunter_stakes → stakes placed by hunters
 *   transactions  → financial transactions
 *   submissions → work submissions
 *   war_room_messages → real-time chat per bounty
 */

import {
    doc, getDoc, setDoc, updateDoc, collection,
    query, where, orderBy, limit, getDocs,
    addDoc, serverTimestamp, onSnapshot,
    increment, runTransaction, deleteDoc
} from 'firebase/firestore';
import { db } from './firebase';

// ─────────────────────────────────────────────
// PROFILES
// ─────────────────────────────────────────────

export async function getProfile(userId) {
    const ref = doc(db, 'profiles', userId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
}

export async function createProfile(userId, data) {
    const ref = doc(db, 'profiles', userId);
    const profile = {
        id: userId,
        username: data.username || data.email?.split('@')[0] || 'user',
        email: data.email || '',
        full_name: data.full_name || '',
        avatar_url: data.avatar_url || '',
        role: data.role || null,
        currency: 'INR',
        wallet_balance: 0,
        stake_balance: 0,
        total_earnings: 0,
        hunts_completed: 0,
        success_rate: 0,
        tier: 'bronze',
        is_onboarded: false,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
    };
    await setDoc(ref, profile);
    return profile;
}

export async function updateProfile(userId, data) {
    const ref = doc(db, 'profiles', userId);
    await updateDoc(ref, { ...data, updated_at: serverTimestamp() });
}

// ─────────────────────────────────────────────
// BOUNTIES
// ─────────────────────────────────────────────

export async function getLiveBounties(limitCount = 20) {
    const q = query(
        collection(db, 'bounties'),
        where('status', '==', 'live'),
        orderBy('created_at', 'desc'),
        limit(limitCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getTopBounties(limitCount = 3) {
    const q = query(
        collection(db, 'bounties'),
        where('status', '==', 'live'),
        orderBy('reward', 'desc'),
        limit(limitCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getBounty(bountyId) {
    const ref = doc(db, 'bounties', bountyId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
}

export async function getPayerBounties(payerId) {
    const q = query(
        collection(db, 'bounties'),
        where('payer_id', '==', payerId),
        orderBy('created_at', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function createBounty(payerId, data) {
    const ref = await addDoc(collection(db, 'bounties'), {
        ...data,
        payer_id: payerId,
        status: 'live',
        hunter_count: 0,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
    });
    return ref.id;
}

export async function updateBounty(bountyId, data) {
    const ref = doc(db, 'bounties', bountyId);
    await updateDoc(ref, { ...data, updated_at: serverTimestamp() });
}

// ─────────────────────────────────────────────
// HUNTER STAKES
// ─────────────────────────────────────────────

export async function getHunterActiveStake(hunterId) {
    const q = query(
        collection(db, 'hunter_stakes'),
        where('hunter_id', '==', hunterId),
        where('status', '==', 'active'),
        limit(1)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return { id: snap.docs[0].id, ...snap.docs[0].data() };
}

export async function getHunterStakes(hunterId) {
    const q = query(
        collection(db, 'hunter_stakes'),
        where('hunter_id', '==', hunterId),
        where('status', '==', 'active')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getBountyStakes(bountyId) {
    const q = query(
        collection(db, 'hunter_stakes'),
        where('bounty_id', '==', bountyId)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function placeStake(hunterId, bountyId, amount, bountyData) {
    return await runTransaction(db, async (tx) => {
        const profileRef = doc(db, 'profiles', hunterId);
        const profileSnap = await tx.get(profileRef);
        const profile = profileSnap.data();

        if (profile.wallet_balance < amount) {
            throw new Error('Insufficient balance');
        }

        // Check existing stake
        const existingStakes = await getDocs(query(
            collection(db, 'hunter_stakes'),
            where('hunter_id', '==', hunterId),
            where('bounty_id', '==', bountyId)
        ));
        if (!existingStakes.empty) {
            throw new Error('Already staked on this bounty');
        }

        // Create stake
        const stakeRef = doc(collection(db, 'hunter_stakes'));
        tx.set(stakeRef, {
            hunter_id: hunterId,
            bounty_id: bountyId,
            stake_amount: amount,
            status: 'active',
            bounty_title: bountyData.title,
            bounty_reward: bountyData.reward,
            created_at: serverTimestamp(),
        });

        // Deduct from wallet
        tx.update(profileRef, {
            wallet_balance: increment(-amount),
            stake_balance: increment(amount),
        });

        // Update bounty hunter count
        const bountyRef = doc(db, 'bounties', bountyId);
        tx.update(bountyRef, { hunter_count: increment(1) });

        // Record transaction
        const txRef = doc(collection(db, 'transactions'));
        tx.set(txRef, {
            user_id: hunterId,
            type: 'stake',
            amount,
            currency: profile.currency || 'INR',
            status: 'completed',
            description: `Stake for: ${bountyData.title}`,
            bounty_id: bountyId,
            created_at: serverTimestamp(),
        });

        return stakeRef.id;
    });
}

// ─────────────────────────────────────────────
// TRANSACTIONS
// ─────────────────────────────────────────────

export async function getTransactions(userId, limitCount = 20) {
    const q = query(
        collection(db, 'transactions'),
        where('user_id', '==', userId),
        orderBy('created_at', 'desc'),
        limit(limitCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addTransaction(data) {
    const ref = await addDoc(collection(db, 'transactions'), {
        ...data,
        created_at: serverTimestamp(),
    });
    return ref.id;
}

export async function submitDepositRequest(userId, amount, utrNumber, paymentMethod, currency) {
    await addDoc(collection(db, 'transactions'), {
        user_id: userId,
        type: 'deposit',
        amount,
        currency,
        status: 'pending',
        description: `Deposit via ${paymentMethod}`,
        metadata: { utr_number: utrNumber, payment_method: paymentMethod },
        created_at: serverTimestamp(),
    });
}

export async function submitWithdrawRequest(userId, amount, upiId, accountHolder, currency) {
    return await runTransaction(db, async (tx) => {
        const profileRef = doc(db, 'profiles', userId);
        const profileSnap = await tx.get(profileRef);
        const profile = profileSnap.data();

        if (profile.wallet_balance < amount) {
            throw new Error('Insufficient balance');
        }

        tx.update(profileRef, {
            wallet_balance: increment(-amount),
        });

        const txRef = doc(collection(db, 'transactions'));
        tx.set(txRef, {
            user_id: userId,
            type: 'withdrawal',
            amount,
            currency,
            status: 'pending',
            description: `Withdrawal to ${upiId}`,
            metadata: { upi_id: upiId, account_holder: accountHolder },
            created_at: serverTimestamp(),
        });
    });
}

// ─────────────────────────────────────────────
// SUBMISSIONS
// ─────────────────────────────────────────────

export async function submitWork(hunterId, bountyId, content, file_url = null) {
    const ref = await addDoc(collection(db, 'submissions'), {
        hunter_id: hunterId,
        bounty_id: bountyId,
        content,
        file_url,
        status: 'pending',
        created_at: serverTimestamp(),
    });
    return ref.id;
}

export async function getBountySubmissions(bountyId) {
    const q = query(
        collection(db, 'submissions'),
        where('bounty_id', '==', bountyId),
        orderBy('created_at', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getHunterSubmission(hunterId, bountyId) {
    const q = query(
        collection(db, 'submissions'),
        where('hunter_id', '==', hunterId),
        where('bounty_id', '==', bountyId),
        limit(1)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return { id: snap.docs[0].id, ...snap.docs[0].data() };
}

// ─────────────────────────────────────────────
// WAR ROOM MESSAGES (Real-time)
// ─────────────────────────────────────────────

export function subscribeToWarRoom(bountyId, callback) {
    const q = query(
        collection(db, 'war_room_messages'),
        where('bounty_id', '==', bountyId),
        orderBy('created_at', 'asc'),
        limit(100)
    );
    return onSnapshot(q, (snap) => {
        const messages = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        callback(messages);
    });
}

export async function sendWarRoomMessage(bountyId, senderId, senderName, content, role) {
    await addDoc(collection(db, 'war_room_messages'), {
        bounty_id: bountyId,
        sender_id: senderId,
        sender_name: senderName,
        content,
        role,
        created_at: serverTimestamp(),
    });
}

// ─────────────────────────────────────────────
// LEADERBOARD
// ─────────────────────────────────────────────

export async function getLeaderboard(limitCount = 20) {
    const q = query(
        collection(db, 'profiles'),
        where('role', '==', 'hunter'),
        orderBy('total_earnings', 'desc'),
        limit(limitCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ─────────────────────────────────────────────
// ADMIN
// ─────────────────────────────────────────────

export async function getPendingDeposits() {
    const q = query(
        collection(db, 'transactions'),
        where('type', '==', 'deposit'),
        where('status', '==', 'pending'),
        orderBy('created_at', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function approveDeposit(txId, userId, amount) {
    return await runTransaction(db, async (tx) => {
        const txRef = doc(db, 'transactions', txId);
        const profileRef = doc(db, 'profiles', userId);

        tx.update(txRef, { status: 'completed' });
        tx.update(profileRef, {
            wallet_balance: increment(amount),
        });
    });
}
