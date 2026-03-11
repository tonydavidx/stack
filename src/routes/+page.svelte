<script lang="ts">
    import { goto } from '$app/navigation';
    import { getDb } from '$lib/db.svelte.js';
    import ListDialog from '$lib/components/ListDialog.svelte';

    const db = getDb();

    let itemCounts = $state<Record<string, { total: number; active: number }>>({});
    let showCreateDialog = $state(false);

    $effect(() => {
        // Recalculate counts when lists or items change
        if (db.lists.length > 0) {
            updateCounts();
        }
    });

    async function updateCounts() {
        const counts: Record<string, { total: number; active: number }> = {};
        for (const list of db.lists) {
            await db.loadItems(list._id);
            const items = db.itemsByList[list._id] || [];
            counts[list._id] = {
                total: items.length,
                active: items.filter(i => !i.completed).length
            };
        }
        itemCounts = counts;
    }

    async function handleCreateList(title: string, icon: string, color: string) {
        const newList = await db.createList(title, icon, color);
        showCreateDialog = false;
        goto(`/list/${newList._id.replace('list:', '')}`);
    }
</script>

<div class="home fade-in">
    <div class="home-header">
        <h1>Your Lists</h1>
        <p class="subtitle">
            {#if db.lists.length > 0}
                {db.lists.length} list{db.lists.length !== 1 ? 's' : ''}
            {:else}
                Get started by creating your first list
            {/if}
        </p>
    </div>

    {#if db.lists.length === 0}
        <div class="empty-state">
            <div class="empty-icon">📝</div>
            <h2>No lists yet</h2>
            <p>Create your first list to start organizing</p>
            <button class="create-first-btn" onclick={() => showCreateDialog = true}>
                <span>+</span> Create Your First List
            </button>
        </div>
    {:else}
        <div class="lists-grid stagger">
            {#each db.lists as list (list._id)}
                {@const count = itemCounts[list._id]}
                <button
                    class="list-card"
                    onclick={() => goto(`/list/${list._id.replace('list:', '')}`)}
                >
                    <div class="card-accent" style:background={list.color}></div>
                    <div class="card-body">
                        <div class="card-header">
                            <span class="card-icon">{list.icon}</span>
                            {#if count}
                                <span class="card-badge" style:background="{list.color}20" style:color={list.color}>
                                    {count.active} / {count.total}
                                </span>
                            {/if}
                        </div>
                        <h3 class="card-title">{list.title}</h3>
                        {#if count}
                            <div class="card-progress">
                                <div class="progress-bar">
                                    <div
                                        class="progress-fill"
                                        style:background={list.color}
                                        style:width="{count.total > 0 ? ((count.total - count.active) / count.total * 100) : 0}%"
                                    ></div>
                                </div>
                            </div>
                        {/if}
                    </div>
                </button>
            {/each}

            <button class="list-card add-card" onclick={() => showCreateDialog = true}>
                <div class="card-body add-body">
                    <span class="add-icon">+</span>
                    <span class="add-text">New List</span>
                </div>
            </button>
        </div>
    {/if}
</div>

<ListDialog
    mode="create"
    open={showCreateDialog}
    onclose={() => showCreateDialog = false}
    onsave={handleCreateList}
/>

<style>
    .home-header {
        margin-bottom: 32px;
    }

    .home-header h1 {
        font-size: 28px;
        font-weight: 700;
        color: #f1f5f9;
        letter-spacing: -0.02em;
    }

    .subtitle {
        font-size: 14px;
        color: #64748b;
        margin-top: 4px;
    }

    /* Empty State */
    .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 80px 20px;
        text-align: center;
    }

    .empty-icon {
        font-size: 64px;
        margin-bottom: 16px;
        animation: float 3s ease-in-out infinite;
    }

    @keyframes float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-8px); }
    }

    .empty-state h2 {
        font-size: 20px;
        font-weight: 600;
        color: #e2e8f0;
        margin-bottom: 8px;
    }

    .empty-state p {
        font-size: 14px;
        color: #64748b;
        margin-bottom: 28px;
    }

    .create-first-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 14px 28px;
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        border: none;
        border-radius: 14px;
        color: white;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        font-family: inherit;
        box-shadow: 0 4px 20px rgba(99, 102, 241, 0.3);
    }

    .create-first-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 30px rgba(99, 102, 241, 0.4);
    }

    /* Lists Grid */
    .lists-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 16px;
    }

    .list-card {
        position: relative;
        background: linear-gradient(145deg, rgba(30, 41, 59, 0.6), rgba(15, 23, 42, 0.8));
        border: 1px solid rgba(148, 163, 184, 0.08);
        border-radius: 16px;
        overflow: hidden;
        cursor: pointer;
        transition: all 0.25s ease;
        text-align: left;
        font-family: inherit;
        color: inherit;
    }

    .list-card:hover {
        transform: translateY(-4px);
        border-color: rgba(148, 163, 184, 0.15);
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
    }

    .card-accent {
        height: 3px;
        width: 100%;
    }

    .card-body {
        padding: 20px;
    }

    .card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
    }

    .card-icon {
        font-size: 28px;
    }

    .card-badge {
        font-size: 12px;
        font-weight: 600;
        padding: 4px 10px;
        border-radius: 20px;
    }

    .card-title {
        font-size: 16px;
        font-weight: 600;
        color: #e2e8f0;
        margin-bottom: 12px;
    }

    .card-progress {
        margin-top: 4px;
    }

    .progress-bar {
        height: 4px;
        background: rgba(148, 163, 184, 0.1);
        border-radius: 2px;
        overflow: hidden;
    }

    .progress-fill {
        height: 100%;
        border-radius: 2px;
        transition: width 0.4s ease;
    }

    /* Add card */
    .add-card {
        border-style: dashed;
        border-color: rgba(148, 163, 184, 0.12);
        background: rgba(148, 163, 184, 0.02);
    }

    .add-card:hover {
        border-color: rgba(99, 102, 241, 0.3);
        background: rgba(99, 102, 241, 0.04);
    }

    .add-body {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8px;
        min-height: 100px;
    }

    .add-icon {
        font-size: 28px;
        color: #64748b;
        font-weight: 300;
        width: 44px;
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 12px;
        background: rgba(99, 102, 241, 0.08);
        color: #818cf8;
    }

    .add-text {
        font-size: 14px;
        color: #64748b;
        font-weight: 500;
    }
</style>
