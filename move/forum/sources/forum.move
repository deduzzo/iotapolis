#[allow(duplicate_alias, unused_const, lint(custom_state_change))]
module forum::forum {
    use iota::event;
    use iota::clock::Clock;
    use iota::table::{Self, Table};
    use std::string;

    // ── Role levels (higher = more permissions) ─────────────────────
    const ROLE_BANNED: u8 = 0;
    const ROLE_USER: u8 = 1;
    const ROLE_MODERATOR: u8 = 2;
    const ROLE_ADMIN: u8 = 3;

    // ── Errors ──────────────────────────────────────────────────────
    const E_FORUM_MISMATCH: u64 = 0;
    const E_NOT_REGISTERED: u64 = 1;
    const E_ALREADY_REGISTERED: u64 = 2;
    const E_INSUFFICIENT_ROLE: u64 = 3;
    const E_BANNED: u64 = 4;
    const E_CANNOT_CHANGE_OWN_ROLE: u64 = 5;
    const E_CANNOT_PROMOTE_ABOVE_SELF: u64 = 6;
    const E_TARGET_NOT_REGISTERED: u64 = 7;

    // ── Structs ─────────────────────────────────────────────────────

    /// Shared object — the forum itself.
    /// Tracks all users and their roles on-chain.
    public struct Forum has key, store {
        id: UID,
        admin: address,
        event_count: u64,
        user_count: u64,
        version: u64,
        /// User registry: address -> role level (0=banned, 1=user, 2=mod, 3=admin)
        users: Table<address, u8>,
    }

    /// Capability object — only the forum creator holds this.
    /// Required as ultimate authority (owner of the contract).
    public struct AdminCap has key, store {
        id: UID,
        forum_id: ID,
    }

    // ── Events ──────────────────────────────────────────────────────

    /// Single event struct for all forum data.
    public struct ForumEvent has copy, drop {
        tag: string::String,
        entity_id: string::String,
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

    // ── Init (runs once on deploy) ──────────────────────────────────

    fun init(ctx: &mut TxContext) {
        let sender = ctx.sender();

        let mut forum = Forum {
            id: object::new(ctx),
            admin: sender,
            event_count: 0,
            user_count: 1,
            version: 1,
            users: table::new(ctx),
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

    // ── Public entry functions ──────────────────────────────────────

    /// Register a new user — open to anyone, one-time per address.
    /// New users get ROLE_USER (1).
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
    /// Used for: FORUM_THREAD, FORUM_POST, FORUM_VOTE
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
    /// Used for: FORUM_MODERATION, FORUM_CATEGORY
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
    /// Used for: FORUM_CONFIG, FORUM_ROLE
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
    /// Rules:
    ///   - Cannot change own role (use transfer_admin for that)
    ///   - Cannot promote someone to a role equal or higher than your own
    ///   - Moderators can ban/unban users (set 0 or 1), but cannot promote to mod/admin
    ///   - Admins can promote to any level up to their own
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
        // Cannot promote above own level
        assert!(new_role <= sender_role, E_CANNOT_PROMOTE_ABOVE_SELF);
        // Cannot change role of someone with equal or higher role
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
    /// The new holder becomes the contract owner.
    public entry fun transfer_admin(cap: AdminCap, new_admin: address) {
        transfer::transfer(cap, new_admin);
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
}
