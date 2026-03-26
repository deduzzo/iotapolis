module forum::forum {
    use iota::object::{Self, UID, ID};
    use iota::transfer;
    use iota::tx_context::{Self, TxContext};
    use iota::event;
    use iota::clock::{Self, Clock};
    use iota::table::{Self, Table};
    use std::string::{Self, String};

    // ── Errors ──────────────────────────────────────────────────────────
    const E_FORUM_MISMATCH: u64 = 0;
    const E_NOT_REGISTERED: u64 = 1;
    const E_ALREADY_REGISTERED: u64 = 2;

    // ── Structs ─────────────────────────────────────────────────────────

    /// Shared object — the forum itself. Anyone can reference it.
    /// Contains a registry of registered user addresses.
    public struct Forum has key, store {
        id: UID,
        admin: address,
        event_count: u64,
        user_count: u64,
        version: u64,
        /// Registered users: address -> true
        users: Table<address, bool>,
    }

    /// Capability object — only the forum creator holds this.
    /// Required for admin operations (roles, moderation, config).
    public struct AdminCap has key, store {
        id: UID,
        forum_id: ID,
    }

    // ── Events ──────────────────────────────────────────────────────────

    /// Single event struct for all forum data.
    /// The `data` field carries gzipped JSON bytes.
    public struct ForumEvent has copy, drop {
        tag: String,
        entity_id: String,
        data: vector<u8>,
        version: u64,
        author: address,
        timestamp: u64,
    }

    // ── Init (runs once on deploy) ──────────────────────────────────────

    fun init(ctx: &mut TxContext) {
        let sender = tx_context::sender(ctx);

        let mut forum = Forum {
            id: object::new(ctx),
            admin: sender,
            event_count: 0,
            user_count: 1,
            version: 1,
            users: table::new(ctx),
        };

        // Admin is auto-registered
        table::add(&mut forum.users, sender, true);

        let admin_cap = AdminCap {
            id: object::new(ctx),
            forum_id: object::id(&forum),
        };

        transfer::share_object(forum);
        transfer::transfer(admin_cap, sender);
    }

    // ── Public entry functions ──────────────────────────────────────────

    /// Register a new user — open to anyone, one-time per address.
    /// Emits a FORUM_USER event with the user data.
    public entry fun register(
        forum: &mut Forum,
        entity_id: vector<u8>,
        data: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let sender = tx_context::sender(ctx);
        assert!(!table::contains(&forum.users, sender), E_ALREADY_REGISTERED);

        // Add to registry
        table::add(&mut forum.users, sender, true);
        forum.user_count = forum.user_count + 1;
        forum.event_count = forum.event_count + 1;

        event::emit(ForumEvent {
            tag: string::utf8(b"FORUM_USER"),
            entity_id: string::utf8(entity_id),
            data,
            version: 1,
            author: sender,
            timestamp: clock::timestamp_ms(clock),
        });
    }

    /// Post a forum event — only registered users.
    /// Used for: FORUM_CATEGORY, FORUM_THREAD, FORUM_POST, FORUM_VOTE
    public entry fun post_event(
        forum: &mut Forum,
        tag: vector<u8>,
        entity_id: vector<u8>,
        data: vector<u8>,
        version: u64,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let sender = tx_context::sender(ctx);
        assert!(table::contains(&forum.users, sender), E_NOT_REGISTERED);

        forum.event_count = forum.event_count + 1;

        event::emit(ForumEvent {
            tag: string::utf8(tag),
            entity_id: string::utf8(entity_id),
            data,
            version,
            author: sender,
            timestamp: clock::timestamp_ms(clock),
        });
    }

    /// Post an admin-only event — requires AdminCap + registered.
    /// Used for: FORUM_ROLE, FORUM_MODERATION, FORUM_CONFIG
    public entry fun admin_post_event(
        forum: &mut Forum,
        cap: &AdminCap,
        tag: vector<u8>,
        entity_id: vector<u8>,
        data: vector<u8>,
        version: u64,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        assert!(cap.forum_id == object::id(forum), E_FORUM_MISMATCH);

        forum.event_count = forum.event_count + 1;

        event::emit(ForumEvent {
            tag: string::utf8(tag),
            entity_id: string::utf8(entity_id),
            data,
            version,
            author: tx_context::sender(ctx),
            timestamp: clock::timestamp_ms(clock),
        });
    }

    /// Transfer AdminCap to a new admin.
    public entry fun transfer_admin(cap: AdminCap, new_admin: address) {
        transfer::transfer(cap, new_admin);
    }

    // ── View functions ──────────────────────────────────────────────────

    public fun event_count(forum: &Forum): u64 { forum.event_count }
    public fun user_count(forum: &Forum): u64 { forum.user_count }
    public fun admin(forum: &Forum): address { forum.admin }

    public fun is_registered(forum: &Forum, user: address): bool {
        table::contains(&forum.users, user)
    }
}
