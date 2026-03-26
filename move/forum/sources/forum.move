#[allow(duplicate_alias, unused_const, unused_function, lint(custom_state_change))]
module forum::forum {
    use iota::event;
    use iota::clock::Clock;
    use iota::table::{Self, Table};
    use iota::coin::{Self, Coin};
    use iota::balance::{Self, Balance};
    use iota::iota::IOTA;
    use std::string::{Self, String};

    // ── Role levels (higher = more permissions) ─────────────────────
    const ROLE_BANNED: u8 = 0;
    const ROLE_USER: u8 = 1;
    const ROLE_MODERATOR: u8 = 2;
    const ROLE_ADMIN: u8 = 3;

    // ── Escrow status codes ─────────────────────────────────────────
    const ESCROW_CREATED: u8 = 0;
    const ESCROW_DELIVERED: u8 = 1;
    const ESCROW_DISPUTED: u8 = 2;
    const ESCROW_RESOLVED: u8 = 3;

    // ── Fee constants ───────────────────────────────────────────────
    /// Marketplace: 5% fee to treasury (expressed as divisor: amount / 20)
    const MARKETPLACE_FEE_DIVISOR: u64 = 20;
    /// Escrow: 2% fee to treasury (expressed as divisor: amount / 50)
    const ESCROW_FEE_DIVISOR: u64 = 50;
    /// Votes needed to resolve escrow
    const VOTES_REQUIRED: u64 = 2;

    // ── Errors ──────────────────────────────────────────────────────
    const E_FORUM_MISMATCH: u64 = 0;
    const E_NOT_REGISTERED: u64 = 1;
    const E_ALREADY_REGISTERED: u64 = 2;
    const E_INSUFFICIENT_ROLE: u64 = 3;
    const E_BANNED: u64 = 4;
    const E_CANNOT_CHANGE_OWN_ROLE: u64 = 5;
    const E_CANNOT_PROMOTE_ABOVE_SELF: u64 = 6;
    const E_TARGET_NOT_REGISTERED: u64 = 7;
    const E_INSUFFICIENT_PAYMENT: u64 = 8;
    const E_TIER_NOT_FOUND: u64 = 9;
    const E_NO_SUBSCRIPTION: u64 = 10;
    const E_SUBSCRIPTION_EXPIRED: u64 = 11;
    const E_SUBSCRIPTION_TIER_TOO_LOW: u64 = 12;
    const E_CONTENT_NOT_FOUND: u64 = 13;
    const E_CONTENT_ALREADY_EXISTS: u64 = 14;
    const E_ALREADY_PURCHASED: u64 = 15;
    const E_BADGE_NOT_FOUND: u64 = 16;
    const E_ALREADY_HAS_BADGE: u64 = 17;
    const E_NOT_ESCROW_PARTY: u64 = 18;
    const E_ESCROW_WRONG_STATUS: u64 = 19;
    const E_ALREADY_VOTED: u64 = 20;
    const E_ESCROW_NOT_RESOLVED: u64 = 21;
    const E_INVALID_RATING: u64 = 22;
    const E_CANNOT_TIP_SELF: u64 = 23;
    const E_ZERO_AMOUNT: u64 = 24;
    const E_INSUFFICIENT_TREASURY: u64 = 25;
    const E_ONLY_SELLER: u64 = 26;
    const E_ONLY_BUYER: u64 = 27;
    const E_CANNOT_BE_OWN_SELLER: u64 = 28;
    const E_CANNOT_BE_OWN_ARBITRATOR: u64 = 29;
    const E_SELLER_CANNOT_BE_ARBITRATOR: u64 = 30;
    const E_DEADLINE_IN_PAST: u64 = 31;
    const E_CANNOT_RATE_SELF: u64 = 32;
    const E_OWN_CONTENT: u64 = 33;
    const E_ESCROW_EXPIRED: u64 = 34;

    // ── Structs ─────────────────────────────────────────────────────

    public struct SubscriptionTier has store, drop, copy {
        price: u64,
        duration_ms: u64,
        features: u64,
    }

    public struct Subscription has store, drop, copy {
        tier: u8,
        expires_at: u64,
    }

    public struct PaidContent has store {
        author: address,
        price: u64,
        buyers: Table<address, bool>,
    }

    public struct Badge has store, drop, copy {
        name: String,
        price: u64,
    }

    public struct UserReputation has store, drop, copy {
        total_trades: u64,
        successful: u64,
        disputes_won: u64,
        disputes_lost: u64,
        total_volume: u64,
        rating_sum: u64,
        rating_count: u64,
    }

    /// Shared object — the forum itself.
    public struct Forum has key, store {
        id: UID,
        admin: address,
        event_count: u64,
        user_count: u64,
        version: u64,
        /// User registry: address -> role level
        users: Table<address, u8>,
        /// Subscription state per user
        subscriptions: Table<address, Subscription>,
        /// Admin-configured subscription tiers
        subscription_tiers: Table<u8, SubscriptionTier>,
        /// Paid content registry: content_id -> PaidContent
        paid_contents: Table<String, PaidContent>,
        /// Admin-configured badges
        badges: Table<u8, Badge>,
        /// Badges owned by each user
        user_badges: Table<address, vector<u8>>,
        /// User reputation from escrow trades
        reputations: Table<address, UserReputation>,
        /// Forum treasury (collects fees)
        treasury: Balance<IOTA>,
    }

    /// Capability object — only the forum creator holds this.
    public struct AdminCap has key, store {
        id: UID,
        forum_id: ID,
    }

    /// Escrow — separate shared object for multi-sig trades.
    public struct Escrow has key, store {
        id: UID,
        buyer: address,
        seller: address,
        arbitrator: address,
        amount: u64,
        description: String,
        deadline: u64,
        status: u8,
        release_votes: vector<address>,
        refund_votes: vector<address>,
        balance: Balance<IOTA>,
    }

    // ── Events ──────────────────────────────────────────────────────

    /// Single event struct for all forum data.
    public struct ForumEvent has copy, drop {
        tag: String,
        entity_id: String,
        data: vector<u8>,
        version: u64,
        author: address,
        timestamp: u64,
    }

    /// Emitted when a user's role changes.
    public struct RoleChanged has copy, drop {
        user: address,
        old_role: u8,
        new_role: u8,
        changed_by: address,
        timestamp: u64,
    }

    /// Emitted when a tip is sent.
    public struct TipEvent has copy, drop {
        from: address,
        to: address,
        post_id: String,
        amount: u64,
        timestamp: u64,
    }

    /// Emitted when a subscription is created or renewed.
    public struct SubscriptionEvent has copy, drop {
        user: address,
        tier: u8,
        expires_at: u64,
        timestamp: u64,
    }

    /// Emitted when paid content is purchased.
    public struct PurchaseEvent has copy, drop {
        buyer: address,
        content_id: String,
        author: address,
        amount: u64,
        fee: u64,
        timestamp: u64,
    }

    /// Emitted when a badge is purchased.
    public struct BadgeEvent has copy, drop {
        user: address,
        badge_id: u8,
        timestamp: u64,
    }

    /// Emitted when an escrow is created.
    public struct EscrowCreated has copy, drop {
        escrow_id: ID,
        buyer: address,
        seller: address,
        arbitrator: address,
        amount: u64,
        deadline: u64,
        timestamp: u64,
    }

    /// Emitted when an escrow status changes.
    public struct EscrowUpdated has copy, drop {
        escrow_id: ID,
        action: String,
        actor: address,
        timestamp: u64,
    }

    /// Emitted when a trade is rated.
    public struct RatingEvent has copy, drop {
        escrow_id: ID,
        rater: address,
        rated: address,
        score: u8,
        comment: String,
        timestamp: u64,
    }

    // ── Init (runs once on deploy) ──────────────────────────────────

    fun init(ctx: &mut TxContext) {
        let sender = ctx.sender();

        let mut forum = Forum {
            id: object::new(ctx),
            admin: sender,
            event_count: 0,
            user_count: 1,
            version: 2,
            users: table::new(ctx),
            subscriptions: table::new(ctx),
            subscription_tiers: table::new(ctx),
            paid_contents: table::new(ctx),
            badges: table::new(ctx),
            user_badges: table::new(ctx),
            reputations: table::new(ctx),
            treasury: balance::zero(),
        };

        // Deployer is auto-registered as ADMIN
        table::add(&mut forum.users, sender, ROLE_ADMIN);

        let admin_cap = AdminCap {
            id: object::new(ctx),
            forum_id: object::id(&forum),
        };

        transfer::share_object(forum);
        transfer::transfer(admin_cap, sender);
    }

    // ── Internal helpers ────────────────────────────────────────────

    /// Get user role (0 if not registered).
    fun get_role(forum: &Forum, user: address): u8 {
        if (table::contains(&forum.users, user)) {
            *table::borrow(&forum.users, user)
        } else {
            0
        }
    }

    /// Assert caller is registered and not banned.
    fun assert_active_user(forum: &Forum, user: address) {
        assert!(table::contains(&forum.users, user), E_NOT_REGISTERED);
        let role = *table::borrow(&forum.users, user);
        assert!(role > ROLE_BANNED, E_BANNED);
    }

    /// Assert caller has at least the required role.
    fun assert_min_role(forum: &Forum, user: address, min_role: u8) {
        assert!(table::contains(&forum.users, user), E_NOT_REGISTERED);
        let role = *table::borrow(&forum.users, user);
        assert!(role >= min_role, E_INSUFFICIENT_ROLE);
    }

    /// Check that a subscription is active and meets the required tier.
    fun assert_subscription(forum: &Forum, user: address, required_tier: u8, clock: &Clock) {
        assert!(table::contains(&forum.subscriptions, user), E_NO_SUBSCRIPTION);
        let sub = table::borrow(&forum.subscriptions, user);
        assert!(sub.expires_at > clock.timestamp_ms(), E_SUBSCRIPTION_EXPIRED);
        assert!(sub.tier >= required_tier, E_SUBSCRIPTION_TIER_TOO_LOW);
    }

    /// Check that a subscription has not expired.
    fun assert_not_expired(sub: &Subscription, clock: &Clock) {
        assert!(sub.expires_at > clock.timestamp_ms(), E_SUBSCRIPTION_EXPIRED);
    }

    /// Check if address is one of the 3 escrow parties.
    fun assert_escrow_party(escrow: &Escrow, addr: address) {
        assert!(
            addr == escrow.buyer || addr == escrow.seller || addr == escrow.arbitrator,
            E_NOT_ESCROW_PARTY,
        );
    }

    /// Check if address has already voted in a vote list.
    fun has_voted(votes: &vector<address>, addr: address): bool {
        let len = votes.length();
        let mut i = 0;
        while (i < len) {
            if (*votes.borrow(i) == addr) {
                return true
            };
            i = i + 1;
        };
        false
    }

    /// Ensure or initialize a UserReputation entry.
    fun ensure_reputation(forum: &mut Forum, user: address) {
        if (!table::contains(&forum.reputations, user)) {
            table::add(&mut forum.reputations, user, UserReputation {
                total_trades: 0,
                successful: 0,
                disputes_won: 0,
                disputes_lost: 0,
                total_volume: 0,
                rating_sum: 0,
                rating_count: 0,
            });
        };
    }

    // ══════════════════════════════════════════════════════════════════
    // ── EXISTING ENTRY FUNCTIONS (preserved) ─────────────────────────
    // ══════════════════════════════════════════════════════════════════

    /// Register a new user — open to anyone, one-time per address.
    public entry fun register(
        forum: &mut Forum,
        entity_id: vector<u8>,
        data: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let sender = ctx.sender();
        assert!(!table::contains(&forum.users, sender), E_ALREADY_REGISTERED);

        table::add(&mut forum.users, sender, ROLE_USER);
        forum.user_count = forum.user_count + 1;
        forum.event_count = forum.event_count + 1;

        event::emit(ForumEvent {
            tag: string::utf8(b"FORUM_USER"),
            entity_id: string::utf8(entity_id),
            data,
            version: 1,
            author: sender,
            timestamp: clock.timestamp_ms(),
        });
    }

    /// Post a forum event — requires ROLE_USER or higher.
    public entry fun post_event(
        forum: &mut Forum,
        tag: vector<u8>,
        entity_id: vector<u8>,
        data: vector<u8>,
        version: u64,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let sender = ctx.sender();
        assert_active_user(forum, sender);

        forum.event_count = forum.event_count + 1;

        event::emit(ForumEvent {
            tag: string::utf8(tag),
            entity_id: string::utf8(entity_id),
            data,
            version,
            author: sender,
            timestamp: clock.timestamp_ms(),
        });
    }

    /// Post a moderator-level event — requires ROLE_MODERATOR or higher.
    public entry fun mod_post_event(
        forum: &mut Forum,
        tag: vector<u8>,
        entity_id: vector<u8>,
        data: vector<u8>,
        version: u64,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let sender = ctx.sender();
        assert_min_role(forum, sender, ROLE_MODERATOR);

        forum.event_count = forum.event_count + 1;

        event::emit(ForumEvent {
            tag: string::utf8(tag),
            entity_id: string::utf8(entity_id),
            data,
            version,
            author: sender,
            timestamp: clock.timestamp_ms(),
        });
    }

    /// Post an admin-level event — requires ROLE_ADMIN.
    public entry fun admin_post_event(
        forum: &mut Forum,
        tag: vector<u8>,
        entity_id: vector<u8>,
        data: vector<u8>,
        version: u64,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let sender = ctx.sender();
        assert_min_role(forum, sender, ROLE_ADMIN);

        forum.event_count = forum.event_count + 1;

        event::emit(ForumEvent {
            tag: string::utf8(tag),
            entity_id: string::utf8(entity_id),
            data,
            version,
            author: sender,
            timestamp: clock.timestamp_ms(),
        });
    }

    /// Change a user's role — requires ROLE_MODERATOR or higher.
    public entry fun set_user_role(
        forum: &mut Forum,
        target: address,
        new_role: u8,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let sender = ctx.sender();
        assert_min_role(forum, sender, ROLE_MODERATOR);
        assert!(sender != target, E_CANNOT_CHANGE_OWN_ROLE);
        assert!(table::contains(&forum.users, target), E_TARGET_NOT_REGISTERED);

        let sender_role = *table::borrow(&forum.users, sender);
        assert!(new_role <= sender_role, E_CANNOT_PROMOTE_ABOVE_SELF);
        let target_role = *table::borrow(&forum.users, target);
        assert!(target_role < sender_role, E_INSUFFICIENT_ROLE);

        let old_role = table::remove(&mut forum.users, target);
        table::add(&mut forum.users, target, new_role);

        event::emit(RoleChanged {
            user: target,
            old_role,
            new_role,
            changed_by: sender,
            timestamp: clock.timestamp_ms(),
        });
    }

    /// Transfer AdminCap — ultimate ownership transfer.
    public entry fun transfer_admin(cap: AdminCap, new_admin: address) {
        transfer::transfer(cap, new_admin);
    }

    // ══════════════════════════════════════════════════════════════════
    // ── TIP ──────────────────────────────────────────────────────────
    // ══════════════════════════════════════════════════════════════════

    /// Send a tip to another user for a specific post.
    /// The entire coin is transferred to the recipient.
    public entry fun tip(
        forum: &mut Forum,
        post_id: vector<u8>,
        payment: Coin<IOTA>,
        recipient: address,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let sender = ctx.sender();
        assert_active_user(forum, sender);
        assert!(sender != recipient, E_CANNOT_TIP_SELF);
        assert!(coin::value(&payment) > 0, E_ZERO_AMOUNT);

        let amount = coin::value(&payment);

        // Transfer coin directly to recipient
        transfer::public_transfer(payment, recipient);

        event::emit(TipEvent {
            from: sender,
            to: recipient,
            post_id: string::utf8(post_id),
            amount,
            timestamp: clock.timestamp_ms(),
        });
    }

    // ══════════════════════════════════════════════════════════════════
    // ── SUBSCRIPTIONS ────────────────────────────────────────────────
    // ══════════════════════════════════════════════════════════════════

    /// Admin: configure a subscription tier (add or update).
    public entry fun configure_tier(
        forum: &mut Forum,
        _cap: &AdminCap,
        tier_id: u8,
        price: u64,
        duration_ms: u64,
        features: u64,
    ) {
        let tier = SubscriptionTier { price, duration_ms, features };
        if (table::contains(&forum.subscription_tiers, tier_id)) {
            let existing = table::borrow_mut(&mut forum.subscription_tiers, tier_id);
            *existing = tier;
        } else {
            table::add(&mut forum.subscription_tiers, tier_id, tier);
        };
    }

    /// Subscribe to a tier. Payment goes to forum treasury.
    public entry fun subscribe(
        forum: &mut Forum,
        tier_id: u8,
        payment: Coin<IOTA>,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let sender = ctx.sender();
        assert_active_user(forum, sender);
        assert!(table::contains(&forum.subscription_tiers, tier_id), E_TIER_NOT_FOUND);

        let tier = *table::borrow(&forum.subscription_tiers, tier_id);
        assert!(coin::value(&payment) >= tier.price, E_INSUFFICIENT_PAYMENT);

        // Take exact price, return change to sender
        let mut payment_balance = coin::into_balance(payment);
        let exact = balance::split(&mut payment_balance, tier.price);
        balance::join(&mut forum.treasury, exact);
        // Return overpayment
        if (balance::value(&payment_balance) > 0) {
            transfer::public_transfer(coin::from_balance(payment_balance, ctx), sender);
        } else {
            balance::destroy_zero(payment_balance);
        };

        let now = clock.timestamp_ms();
        let expires_at = now + tier.duration_ms;

        let sub = Subscription { tier: tier_id, expires_at };
        if (table::contains(&forum.subscriptions, sender)) {
            let existing = table::borrow_mut(&mut forum.subscriptions, sender);
            *existing = sub;
        } else {
            table::add(&mut forum.subscriptions, sender, sub);
        };

        event::emit(SubscriptionEvent {
            user: sender,
            tier: tier_id,
            expires_at,
            timestamp: now,
        });
    }

    /// Renew an existing subscription. Extends from current expiry or now, whichever is later.
    public entry fun renew_subscription(
        forum: &mut Forum,
        payment: Coin<IOTA>,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let sender = ctx.sender();
        assert_active_user(forum, sender);
        assert!(table::contains(&forum.subscriptions, sender), E_NO_SUBSCRIPTION);

        let sub = *table::borrow(&forum.subscriptions, sender);
        let tier_id = sub.tier;
        assert!(table::contains(&forum.subscription_tiers, tier_id), E_TIER_NOT_FOUND);

        let tier = *table::borrow(&forum.subscription_tiers, tier_id);
        assert!(coin::value(&payment) >= tier.price, E_INSUFFICIENT_PAYMENT);

        // Take exact price, return change to sender
        let mut payment_balance = coin::into_balance(payment);
        let exact = balance::split(&mut payment_balance, tier.price);
        balance::join(&mut forum.treasury, exact);
        if (balance::value(&payment_balance) > 0) {
            transfer::public_transfer(coin::from_balance(payment_balance, ctx), sender);
        } else {
            balance::destroy_zero(payment_balance);
        };

        let now = clock.timestamp_ms();
        // Extend from current expiry if still active, otherwise from now
        let base = if (sub.expires_at > now) { sub.expires_at } else { now };
        let new_expires = base + tier.duration_ms;

        let existing = table::borrow_mut(&mut forum.subscriptions, sender);
        existing.expires_at = new_expires;

        event::emit(SubscriptionEvent {
            user: sender,
            tier: tier_id,
            expires_at: new_expires,
            timestamp: now,
        });
    }

    // ══════════════════════════════════════════════════════════════════
    // ── MARKETPLACE ──────────────────────────────────────────────────
    // ══════════════════════════════════════════════════════════════════

    /// Create paid content. Registers it in the paid_contents table and emits a ForumEvent.
    public entry fun create_paid_content(
        forum: &mut Forum,
        content_id: vector<u8>,
        price: u64,
        tag: vector<u8>,
        entity_id: vector<u8>,
        data: vector<u8>,
        version: u64,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let sender = ctx.sender();
        assert_active_user(forum, sender);
        assert!(price > 0, E_ZERO_AMOUNT);

        let content_id_str = string::utf8(content_id);
        assert!(!table::contains(&forum.paid_contents, content_id_str), E_CONTENT_ALREADY_EXISTS);

        table::add(&mut forum.paid_contents, content_id_str, PaidContent {
            author: sender,
            price,
            buyers: table::new(ctx),
        });

        forum.event_count = forum.event_count + 1;

        event::emit(ForumEvent {
            tag: string::utf8(tag),
            entity_id: string::utf8(entity_id),
            data,
            version,
            author: sender,
            timestamp: clock.timestamp_ms(),
        });
    }

    /// Purchase paid content. 95% goes to author, 5% to forum treasury.
    public entry fun purchase_content(
        forum: &mut Forum,
        content_id: vector<u8>,
        payment: Coin<IOTA>,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let sender = ctx.sender();
        assert_active_user(forum, sender);

        let content_id_str = string::utf8(content_id);
        assert!(table::contains(&forum.paid_contents, content_id_str), E_CONTENT_NOT_FOUND);

        let content = table::borrow_mut(&mut forum.paid_contents, content_id_str);
        assert!(sender != content.author, E_OWN_CONTENT);
        assert!(!table::contains(&content.buyers, sender), E_ALREADY_PURCHASED);
        assert!(coin::value(&payment) >= content.price, E_INSUFFICIENT_PAYMENT);

        let author = content.author;
        let price = content.price;

        // Mark as purchased
        table::add(&mut content.buyers, sender, true);

        // Split payment: 5% fee to treasury, 95% to author
        let mut payment_balance = coin::into_balance(payment);
        let fee_amount = price / MARKETPLACE_FEE_DIVISOR;
        let fee_balance = balance::split(&mut payment_balance, fee_amount);
        balance::join(&mut forum.treasury, fee_balance);

        // Remaining goes to author
        let author_coin = coin::from_balance(payment_balance, ctx);
        transfer::public_transfer(author_coin, author);

        let now = clock.timestamp_ms();
        event::emit(PurchaseEvent {
            buyer: sender,
            content_id: content_id_str,
            author,
            amount: price,
            fee: fee_amount,
            timestamp: now,
        });
    }

    /// Admin: configure a badge (add or update).
    public entry fun configure_badge(
        forum: &mut Forum,
        _cap: &AdminCap,
        badge_id: u8,
        name: vector<u8>,
        price: u64,
    ) {
        let badge = Badge { name: string::utf8(name), price };
        if (table::contains(&forum.badges, badge_id)) {
            let existing = table::borrow_mut(&mut forum.badges, badge_id);
            *existing = badge;
        } else {
            table::add(&mut forum.badges, badge_id, badge);
        };
    }

    /// Purchase a badge. Payment goes to forum treasury.
    public entry fun purchase_badge(
        forum: &mut Forum,
        badge_id: u8,
        payment: Coin<IOTA>,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let sender = ctx.sender();
        assert_active_user(forum, sender);
        assert!(table::contains(&forum.badges, badge_id), E_BADGE_NOT_FOUND);

        let badge = *table::borrow(&forum.badges, badge_id);
        assert!(coin::value(&payment) >= badge.price, E_INSUFFICIENT_PAYMENT);

        // Take exact price, return change to sender
        let mut payment_balance = coin::into_balance(payment);
        let exact = balance::split(&mut payment_balance, badge.price);
        balance::join(&mut forum.treasury, exact);
        if (balance::value(&payment_balance) > 0) {
            transfer::public_transfer(coin::from_balance(payment_balance, ctx), sender);
        } else {
            balance::destroy_zero(payment_balance);
        };

        // Add badge to user's collection
        if (!table::contains(&forum.user_badges, sender)) {
            table::add(&mut forum.user_badges, sender, vector::empty<u8>());
        };
        let user_badges = table::borrow_mut(&mut forum.user_badges, sender);

        // Check user doesn't already have this badge
        let len = user_badges.length();
        let mut i = 0;
        let mut already_has = false;
        while (i < len) {
            if (*user_badges.borrow(i) == badge_id) {
                already_has = true;
                break
            };
            i = i + 1;
        };
        assert!(!already_has, E_ALREADY_HAS_BADGE);

        user_badges.push_back(badge_id);

        event::emit(BadgeEvent {
            user: sender,
            badge_id,
            timestamp: clock.timestamp_ms(),
        });
    }

    // ══════════════════════════════════════════════════════════════════
    // ── ESCROW ───────────────────────────────────────────────────────
    // ══════════════════════════════════════════════════════════════════

    /// Create an escrow. Buyer sends funds which are locked in the Escrow object.
    /// All 3 parties (buyer, seller, arbitrator) must be registered.
    public entry fun create_escrow(
        forum: &Forum,
        seller: address,
        arbitrator: address,
        description: vector<u8>,
        deadline: u64,
        payment: Coin<IOTA>,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let buyer = ctx.sender();
        assert_active_user(forum, buyer);
        assert!(table::contains(&forum.users, seller), E_TARGET_NOT_REGISTERED);
        assert!(table::contains(&forum.users, arbitrator), E_TARGET_NOT_REGISTERED);
        assert!(buyer != seller, E_CANNOT_BE_OWN_SELLER);
        assert!(buyer != arbitrator, E_CANNOT_BE_OWN_ARBITRATOR);
        assert!(seller != arbitrator, E_SELLER_CANNOT_BE_ARBITRATOR);
        assert!(coin::value(&payment) > 0, E_ZERO_AMOUNT);
        assert!(deadline > clock.timestamp_ms(), E_DEADLINE_IN_PAST);

        let amount = coin::value(&payment);
        let escrow_balance = coin::into_balance(payment);

        let escrow = Escrow {
            id: object::new(ctx),
            buyer,
            seller,
            arbitrator,
            amount,
            description: string::utf8(description),
            deadline,
            status: ESCROW_CREATED,
            release_votes: vector::empty(),
            refund_votes: vector::empty(),
            balance: escrow_balance,
        };

        let escrow_id = object::id(&escrow);

        event::emit(EscrowCreated {
            escrow_id,
            buyer,
            seller,
            arbitrator,
            amount,
            deadline,
            timestamp: clock.timestamp_ms(),
        });

        transfer::share_object(escrow);
    }

    /// Seller marks the escrow as delivered.
    public entry fun mark_delivered(
        escrow: &mut Escrow,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let sender = ctx.sender();
        assert!(sender == escrow.seller, E_ONLY_SELLER);
        assert!(escrow.status == ESCROW_CREATED, E_ESCROW_WRONG_STATUS);
        assert!(clock.timestamp_ms() <= escrow.deadline, E_ESCROW_EXPIRED);

        escrow.status = ESCROW_DELIVERED;

        event::emit(EscrowUpdated {
            escrow_id: object::id(escrow),
            action: string::utf8(b"delivered"),
            actor: sender,
            timestamp: clock.timestamp_ms(),
        });
    }

    /// Buyer opens a dispute on the escrow.
    public entry fun open_dispute(
        escrow: &mut Escrow,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let sender = ctx.sender();
        assert!(sender == escrow.buyer, E_ONLY_BUYER);
        assert!(
            escrow.status == ESCROW_CREATED || escrow.status == ESCROW_DELIVERED,
            E_ESCROW_WRONG_STATUS,
        );
        assert!(clock.timestamp_ms() <= escrow.deadline, E_ESCROW_EXPIRED);

        escrow.status = ESCROW_DISPUTED;

        event::emit(EscrowUpdated {
            escrow_id: object::id(escrow),
            action: string::utf8(b"disputed"),
            actor: sender,
            timestamp: clock.timestamp_ms(),
        });
    }

    /// Vote to release funds to seller. Requires 2 of 3 parties.
    /// When resolved: seller gets (amount - fee), fee goes to forum treasury.
    public entry fun vote_release(
        escrow: &mut Escrow,
        forum: &mut Forum,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let sender = ctx.sender();
        assert_escrow_party(escrow, sender);
        assert!(escrow.status != ESCROW_RESOLVED, E_ESCROW_WRONG_STATUS);
        assert!(!has_voted(&escrow.release_votes, sender), E_ALREADY_VOTED);
        // Prevent double-voting: cannot vote release if already voted refund
        assert!(!has_voted(&escrow.refund_votes, sender), E_ALREADY_VOTED);

        escrow.release_votes.push_back(sender);

        event::emit(EscrowUpdated {
            escrow_id: object::id(escrow),
            action: string::utf8(b"vote_release"),
            actor: sender,
            timestamp: clock.timestamp_ms(),
        });

        // Check if we have enough votes
        if (escrow.release_votes.length() >= VOTES_REQUIRED) {
            escrow.status = ESCROW_RESOLVED;

            // Calculate fee and transfer
            let total = balance::value(&escrow.balance);
            let fee_amount = total / ESCROW_FEE_DIVISOR;
            let fee_balance = balance::split(&mut escrow.balance, fee_amount);
            balance::join(&mut forum.treasury, fee_balance);

            // Remaining to seller
            let seller_balance = balance::withdraw_all(&mut escrow.balance);
            let seller_coin = coin::from_balance(seller_balance, ctx);
            transfer::public_transfer(seller_coin, escrow.seller);

            // Update reputations
            ensure_reputation(forum, escrow.buyer);
            ensure_reputation(forum, escrow.seller);
            let buyer_rep = table::borrow_mut(&mut forum.reputations, escrow.buyer);
            buyer_rep.total_trades = buyer_rep.total_trades + 1;
            buyer_rep.successful = buyer_rep.successful + 1;
            buyer_rep.total_volume = buyer_rep.total_volume + escrow.amount;

            let seller_rep = table::borrow_mut(&mut forum.reputations, escrow.seller);
            seller_rep.total_trades = seller_rep.total_trades + 1;
            seller_rep.successful = seller_rep.successful + 1;
            seller_rep.total_volume = seller_rep.total_volume + escrow.amount;

            event::emit(EscrowUpdated {
                escrow_id: object::id(escrow),
                action: string::utf8(b"released"),
                actor: sender,
                timestamp: clock.timestamp_ms(),
            });
        };
    }

    /// Vote to refund funds to buyer. Requires 2 of 3 parties.
    /// When resolved: buyer gets (amount - fee), fee goes to forum treasury.
    public entry fun vote_refund(
        escrow: &mut Escrow,
        forum: &mut Forum,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let sender = ctx.sender();
        assert_escrow_party(escrow, sender);
        assert!(escrow.status != ESCROW_RESOLVED, E_ESCROW_WRONG_STATUS);
        assert!(!has_voted(&escrow.refund_votes, sender), E_ALREADY_VOTED);
        // Prevent double-voting: cannot vote refund if already voted release
        assert!(!has_voted(&escrow.release_votes, sender), E_ALREADY_VOTED);

        escrow.refund_votes.push_back(sender);

        event::emit(EscrowUpdated {
            escrow_id: object::id(escrow),
            action: string::utf8(b"vote_refund"),
            actor: sender,
            timestamp: clock.timestamp_ms(),
        });

        // Check if we have enough votes
        if (escrow.refund_votes.length() >= VOTES_REQUIRED) {
            escrow.status = ESCROW_RESOLVED;

            // Calculate fee and transfer
            let total = balance::value(&escrow.balance);
            let fee_amount = total / ESCROW_FEE_DIVISOR;
            let fee_balance = balance::split(&mut escrow.balance, fee_amount);
            balance::join(&mut forum.treasury, fee_balance);

            // Remaining to buyer
            let buyer_balance = balance::withdraw_all(&mut escrow.balance);
            let buyer_coin = coin::from_balance(buyer_balance, ctx);
            transfer::public_transfer(buyer_coin, escrow.buyer);

            // Update reputations — this was a dispute
            ensure_reputation(forum, escrow.buyer);
            ensure_reputation(forum, escrow.seller);
            let buyer_rep = table::borrow_mut(&mut forum.reputations, escrow.buyer);
            buyer_rep.total_trades = buyer_rep.total_trades + 1;
            buyer_rep.disputes_won = buyer_rep.disputes_won + 1;
            buyer_rep.total_volume = buyer_rep.total_volume + escrow.amount;

            let seller_rep = table::borrow_mut(&mut forum.reputations, escrow.seller);
            seller_rep.total_trades = seller_rep.total_trades + 1;
            seller_rep.disputes_lost = seller_rep.disputes_lost + 1;
            seller_rep.total_volume = seller_rep.total_volume + escrow.amount;

            event::emit(EscrowUpdated {
                escrow_id: object::id(escrow),
                action: string::utf8(b"refunded"),
                actor: sender,
                timestamp: clock.timestamp_ms(),
            });
        };
    }

    /// Rate a trade after escrow is resolved. Only buyer or seller can rate.
    /// Score must be 1-5.
    public entry fun rate_trade(
        forum: &mut Forum,
        escrow: &Escrow,
        rated: address,
        score: u8,
        comment: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let sender = ctx.sender();
        assert!(escrow.status == ESCROW_RESOLVED, E_ESCROW_NOT_RESOLVED);
        assert!(
            sender == escrow.buyer || sender == escrow.seller,
            E_NOT_ESCROW_PARTY,
        );
        assert!(sender != rated, E_CANNOT_RATE_SELF);
        assert!(
            rated == escrow.buyer || rated == escrow.seller,
            E_NOT_ESCROW_PARTY,
        );
        assert!(score >= 1 && score <= 5, E_INVALID_RATING);

        // Update rated user's reputation
        ensure_reputation(forum, rated);
        let rep = table::borrow_mut(&mut forum.reputations, rated);
        rep.rating_sum = rep.rating_sum + (score as u64);
        rep.rating_count = rep.rating_count + 1;

        event::emit(RatingEvent {
            escrow_id: object::id(escrow),
            rater: sender,
            rated,
            score,
            comment: string::utf8(comment),
            timestamp: clock.timestamp_ms(),
        });
    }

    // ══════════════════════════════════════════════════════════════════
    // ── ADMIN: TREASURY ──────────────────────────────────────────────
    // ══════════════════════════════════════════════════════════════════

    /// Admin: withdraw funds from the forum treasury.
    public entry fun withdraw_funds(
        forum: &mut Forum,
        _cap: &AdminCap,
        amount: u64,
        ctx: &mut TxContext,
    ) {
        assert!(amount > 0, E_ZERO_AMOUNT);
        assert!(balance::value(&forum.treasury) >= amount, E_INSUFFICIENT_TREASURY);

        let withdrawn = balance::split(&mut forum.treasury, amount);
        let coin = coin::from_balance(withdrawn, ctx);
        transfer::public_transfer(coin, ctx.sender());
    }

    // ── View functions ──────────────────────────────────────────────

    public fun event_count(forum: &Forum): u64 { forum.event_count }
    public fun user_count(forum: &Forum): u64 { forum.user_count }
    public fun admin(forum: &Forum): address { forum.admin }

    public fun is_registered(forum: &Forum, user: address): bool {
        table::contains(&forum.users, user)
    }

    public fun user_role(forum: &Forum, user: address): u8 {
        get_role(forum, user)
    }

    public fun treasury_balance(forum: &Forum): u64 {
        balance::value(&forum.treasury)
    }

    public fun has_subscription(forum: &Forum, user: address): bool {
        table::contains(&forum.subscriptions, user)
    }

    public fun escrow_status(escrow: &Escrow): u8 {
        escrow.status
    }

    public fun escrow_amount(escrow: &Escrow): u64 {
        escrow.amount
    }
}
