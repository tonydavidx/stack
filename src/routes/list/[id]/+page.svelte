<script lang="ts">
    import { page } from '$app/state';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import { getDb } from '$lib/db.svelte.js';
    import ListDialog from '$lib/components/ListDialog.svelte';
    import type { ItemDoc } from '$lib/types.js';

    const db = getDb();

    let listId = $derived('list:' + page.params.id);
    let list = $derived(db.lists.find(l => l._id === listId));
    let items = $derived<ItemDoc[]>(db.itemsByList[listId] || []);
    let activeItems = $derived(items.filter(i => !i.completed));
    let completedItems = $derived(items.filter(i => i.completed));

    let newItemText = $state('');
    let showEditDialog = $state(false);
    let showDeleteConfirm = $state(false);

    onMount(async () => {
        await db.loadItems(listId);
    });

    // Reload items when listId changes
    $effect(() => {
        db.loadItems(listId);
    });

    async function handleAddItem(e: Event) {
        e.preventDefault();
        if (!newItemText.trim()) return;
        await db.addItem(listId, newItemText.trim());
        newItemText = '';
    }

    async function handleToggle(item: ItemDoc) {
        await db.toggleItem(item);
    }

    async function handleDeleteItem(item: ItemDoc) {
        await db.deleteItem(item);
    }

    async function handleEditList(title: string, icon: string, color: string) {
        if (!list) return;
        await db.updateList({ ...list, title, icon, color });
        showEditDialog = false;
    }

    async function handleDeleteList() {
        await db.deleteList(listId);
        goto('/');
    }
</script>

{#if list}
    <div class="list-detail fade-in">
        <!-- Header -->
        <div class="detail-header">
            <button class="back-btn" onclick={() => goto('/')} aria-label="Back to home">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M13 4l-6 6 6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </button>

            <div class="header-info">
                <span class="header-icon">{list.icon}</span>
                <h1 style:color={list.color}>{list.title}</h1>
            </div>

            <div class="header-actions">
                <button class="action-btn" onclick={() => showEditDialog = true} aria-label="Edit list" title="Edit list">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <path d="M13.5 2.5l2 2L5 15H3v-2L13.5 2.5z" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
                <button class="action-btn danger" onclick={() => showDeleteConfirm = true} aria-label="Delete list" title="Delete list">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <path d="M3 5h12M7 5V3h4v2M5 5v10h8V5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
            </div>
        </div>

        <!-- Stats -->
        <div class="stats-bar">
            <span class="stat">{activeItems.length} remaining</span>
            {#if completedItems.length > 0}
                <span class="stat-divider">·</span>
                <span class="stat completed-stat">{completedItems.length} completed</span>
            {/if}
        </div>

        <!-- Add Item -->
        <form class="add-item-bar" onsubmit={handleAddItem}>
            <input
                type="text"
                bind:value={newItemText}
                placeholder="Add a new item..."
                autocomplete="off"
                id="new-item-input"
            />
            <button type="submit" disabled={!newItemText.trim()} aria-label="Add item">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
            </button>
        </form>

        <!-- Active Items -->
        {#if activeItems.length > 0}
            <div class="items-section">
                {#each activeItems as item (item._id)}
                    <div class="item-row slide-in">
                        <input
                            type="checkbox"
                            checked={item.completed}
                            onchange={() => handleToggle(item)}
                            style:border-color={list.color}
                            aria-label="Toggle {item.text}"
                        />
                        <span class="item-text">{item.text}</span>
                        <button class="delete-item-btn" onclick={() => handleDeleteItem(item)} aria-label="Delete item">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                            </svg>
                        </button>
                    </div>
                {/each}
            </div>
        {/if}

        <!-- Completed Items -->
        {#if completedItems.length > 0}
            <div class="completed-section">
                <div class="completed-header">
                    <span class="completed-label">Completed</span>
                </div>
                {#each completedItems as item (item._id)}
                    <div class="item-row completed-row">
                        <input
                            type="checkbox"
                            checked={item.completed}
                            onchange={() => handleToggle(item)}
                            aria-label="Toggle {item.text}"
                        />
                        <span class="item-text completed-text">{item.text}</span>
                        <button class="delete-item-btn" onclick={() => handleDeleteItem(item)} aria-label="Delete item">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                            </svg>
                        </button>
                    </div>
                {/each}
            </div>
        {/if}

        <!-- Empty state -->
        {#if items.length === 0}
            <div class="empty-items">
                <p>No items yet. Add your first one above!</p>
            </div>
        {/if}
    </div>

    <!-- Edit Dialog -->
    <ListDialog
        mode="edit"
        {list}
        open={showEditDialog}
        onclose={() => showEditDialog = false}
        onsave={handleEditList}
    />

    <!-- Delete Confirmation -->
    {#if showDeleteConfirm}
        <div class="dialog-overlay" onclick={() => showDeleteConfirm = false} role="button" tabindex="-1" aria-label="Close">
            <div class="confirm-dialog" onclick={(e) => e.stopPropagation()} role="alertdialog" aria-modal="true">
                <h3>Delete "{list.title}"?</h3>
                <p>This will permanently delete the list and all its items.</p>
                <div class="confirm-actions">
                    <button class="cancel-btn" onclick={() => showDeleteConfirm = false}>Cancel</button>
                    <button class="delete-btn" onclick={handleDeleteList}>Delete</button>
                </div>
            </div>
        </div>
    {/if}
{:else}
    <div class="not-found fade-in">
        <h2>List not found</h2>
        <p>This list may have been deleted.</p>
        <button onclick={() => goto('/')}>Go Home</button>
    </div>
{/if}

<style>
    .detail-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
    }

    .back-btn {
        width: 36px;
        height: 36px;
        border: none;
        background: rgba(148, 163, 184, 0.06);
        border-radius: 10px;
        color: #94a3b8;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        flex-shrink: 0;
    }

    .back-btn:hover {
        background: rgba(148, 163, 184, 0.12);
        color: #e2e8f0;
    }

    .header-info {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .header-icon {
        font-size: 28px;
    }

    .header-info h1 {
        font-size: 24px;
        font-weight: 700;
        letter-spacing: -0.02em;
    }

    .header-actions {
        display: flex;
        gap: 6px;
    }

    .action-btn {
        width: 36px;
        height: 36px;
        border: none;
        background: rgba(148, 163, 184, 0.06);
        border-radius: 10px;
        color: #64748b;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
    }

    .action-btn:hover {
        background: rgba(148, 163, 184, 0.12);
        color: #e2e8f0;
    }

    .action-btn.danger:hover {
        background: rgba(244, 63, 94, 0.1);
        color: #f43f5e;
    }

    .stats-bar {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 20px;
        font-size: 13px;
        color: #64748b;
    }

    .stat-divider {
        color: #334155;
    }

    .completed-stat {
        color: #4ade80;
    }

    /* Add Item Bar */
    .add-item-bar {
        display: flex;
        gap: 8px;
        margin-bottom: 24px;
    }

    .add-item-bar input {
        flex: 1;
        padding: 14px 18px;
        background: rgba(148, 163, 184, 0.06);
        border: 1px solid rgba(148, 163, 184, 0.1);
        border-radius: 14px;
        color: #f1f5f9;
        font-size: 15px;
        font-family: inherit;
        transition: all 0.2s;
    }

    .add-item-bar input:focus {
        outline: none;
        border-color: rgba(99, 102, 241, 0.4);
        background: rgba(99, 102, 241, 0.06);
    }

    .add-item-bar input::placeholder {
        color: #475569;
    }

    .add-item-bar button {
        width: 48px;
        height: 48px;
        border: none;
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        border-radius: 14px;
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        flex-shrink: 0;
    }

    .add-item-bar button:hover:not(:disabled) {
        filter: brightness(1.1);
        transform: translateY(-1px);
    }

    .add-item-bar button:disabled {
        opacity: 0.3;
        cursor: not-allowed;
    }

    /* Items */
    .items-section {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .item-row {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 12px 14px;
        border-radius: 12px;
        transition: background 0.15s;
    }

    .item-row:hover {
        background: rgba(148, 163, 184, 0.04);
    }

    .item-text {
        flex: 1;
        font-size: 15px;
        color: #e2e8f0;
        line-height: 1.4;
    }

    .completed-text {
        text-decoration: line-through;
        color: #475569;
    }

    .delete-item-btn {
        width: 28px;
        height: 28px;
        border: none;
        background: transparent;
        border-radius: 6px;
        color: #475569;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        opacity: 0;
        flex-shrink: 0;
    }

    .item-row:hover .delete-item-btn {
        opacity: 1;
    }

    .delete-item-btn:hover {
        background: rgba(244, 63, 94, 0.1);
        color: #f43f5e;
    }

    /* Completed Section */
    .completed-section {
        margin-top: 24px;
        border-top: 1px solid rgba(148, 163, 184, 0.06);
        padding-top: 16px;
    }

    .completed-header {
        padding: 0 14px 8px;
    }

    .completed-label {
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: #475569;
    }

    .completed-row {
        opacity: 0.6;
    }

    /* Empty */
    .empty-items {
        text-align: center;
        padding: 60px 20px;
        color: #475569;
        font-size: 14px;
    }

    /* Not Found */
    .not-found {
        text-align: center;
        padding: 80px 20px;
    }

    .not-found h2 {
        font-size: 20px;
        color: #e2e8f0;
        margin-bottom: 8px;
    }

    .not-found p {
        color: #64748b;
        margin-bottom: 24px;
    }

    .not-found button {
        padding: 10px 24px;
        background: rgba(99, 102, 241, 0.1);
        border: 1px solid rgba(99, 102, 241, 0.2);
        border-radius: 10px;
        color: #818cf8;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.2s;
        font-family: inherit;
    }

    .not-found button:hover {
        background: rgba(99, 102, 241, 0.15);
    }

    /* Delete Confirmation */
    .dialog-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(8px);
        z-index: 100;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
    }

    .confirm-dialog {
        background: linear-gradient(145deg, #1e293b, #0f172a);
        border: 1px solid rgba(148, 163, 184, 0.1);
        border-radius: 20px;
        padding: 28px;
        max-width: 380px;
        width: 100%;
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
        animation: scaleIn 0.2s ease;
    }

    @keyframes scaleIn {
        from { opacity: 0; transform: scale(0.95); }
        to { opacity: 1; transform: scale(1); }
    }

    .confirm-dialog h3 {
        font-size: 18px;
        font-weight: 600;
        color: #f1f5f9;
        margin-bottom: 8px;
    }

    .confirm-dialog p {
        font-size: 14px;
        color: #94a3b8;
        margin-bottom: 24px;
        line-height: 1.5;
    }

    .confirm-actions {
        display: flex;
        gap: 10px;
        justify-content: flex-end;
    }

    .cancel-btn {
        padding: 10px 20px;
        border: 1px solid rgba(148, 163, 184, 0.1);
        background: transparent;
        border-radius: 10px;
        color: #94a3b8;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        font-family: inherit;
        transition: all 0.2s;
    }

    .cancel-btn:hover {
        background: rgba(148, 163, 184, 0.06);
    }

    .delete-btn {
        padding: 10px 20px;
        border: none;
        background: linear-gradient(135deg, #f43f5e, #e11d48);
        border-radius: 10px;
        color: white;
        cursor: pointer;
        font-size: 14px;
        font-weight: 600;
        font-family: inherit;
        transition: all 0.2s;
    }

    .delete-btn:hover {
        filter: brightness(1.1);
    }
</style>
