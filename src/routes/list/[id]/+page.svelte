<script lang="ts">
    import { page } from '$app/state';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import { getDb } from '$lib/db.svelte.js';
    import ListDialog from '$lib/components/ListDialog.svelte';
    import HistoryModal from '$lib/components/HistoryModal.svelte';
    import type { ItemDoc } from '$lib/types.js';

    const db = getDb();

    let listId = $derived('list:' + page.params.id);
    let list = $derived(db.lists.find(l => l._id === listId));
    let items = $derived((db.itemsByList[listId] || []).filter(i => i.inList));
    let activeItems = $derived(items.filter(i => !i.completed));
    let completedItems = $derived(items.filter(i => i.completed));
    
    // Grouping
    let groupedItems = $derived(() => {
        const groups: Record<string, ItemDoc[]> = {};
        const sortedItems = [...items].sort((a, b) => {
            if (a.completed === b.completed) return 0;
            return a.completed ? 1 : -1;
        });
        
        for (const item of sortedItems) {
            const cat = item.category || 'No Category';
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(item);
        }
        
        // Return entries sorted by number of items (descending)
        return Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
    });

    let newItemText = $state('');
    let newItemQty = $state<number | undefined>(undefined);
    let showEditDialog = $state(false);
    let showDeleteConfirm = $state(false);
    let showHistoryModal = $state(false);
    let showMenu = $state(false);
    let hasQuantity = $derived(list?.enableQuantity ?? false);

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
        await db.addItem(listId, newItemText.trim(), hasQuantity && newItemQty ? newItemQty : undefined);
        newItemText = '';
        newItemQty = undefined;
    }

    async function handleToggle(item: ItemDoc) {
        await db.toggleItem(item);
    }

    async function handleDeleteItem(item: ItemDoc) {
        await db.deleteItem(item);
    }

    async function handleEditList(title: string, icon: string, color: string, enableQuantity: boolean) {
        if (!list) return;
        await db.updateList({ ...list, title, icon, color, enableQuantity });
        showEditDialog = false;
    }

    async function handleDeleteList() {
        await db.deleteList(listId);
        void goto('/');
    }
</script>

{#if !db.initialized}
    <div class="loading-state fade-in">
        <div class="loader"></div>
        <p>Initializing database...</p>
    </div>
{:else if list}
    <div class="list-detail fade-in">
        <!-- Header -->
        <div class="detail-header">
            <button class="back-btn" onclick={() => void goto('/')} aria-label="Back to home" type="button">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M13 4l-6 6 6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </button>

            <div class="header-info">
                <span class="header-icon">{list.icon}</span>
                <h1 style:color={list.color}>{list.title}</h1>
            </div>

            <div class="header-actions">
                <div class="menu-container">
                    <button class="action-btn" onclick={() => showMenu = !showMenu} aria-label="More actions" title="More actions">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M10 6a1.5 1.5 0 110-3 1.5 1.5 0 010 3zM10 11.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3zM10 17a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" fill="currentColor"/>
                        </svg>
                    </button>
                    
                    {#if showMenu}
                        <div class="dropdown-menu fade-in" onclick={() => showMenu = false}>
                            <div class="menu-item" onclick={() => showEditDialog = true} role="button" tabindex="0" onkeydown={(e) => e.key === 'Enter' && (showEditDialog = true)}>
                                <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                                    <path d="M13.5 2.5l2 2L5 15H3v-2L13.5 2.5z" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                                List Settings
                            </div>
                            <div class="menu-item" onclick={() => void goto(`/list/${page.params.id}/edit-items`)} role="button" tabindex="0" onkeydown={(e) => e.key === 'Enter' && void goto(`/list/${page.params.id}/edit-items`)}>
                                <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                                    <path d="M3 3h12v12H3V3zm3 4h6m-6 4h6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                                Edit Items
                            </div>
                            <div class="menu-item" onclick={() => {
                                if (confirm('Move all items to history and start fresh?')) {
                                    db.resetListItems(listId);
                                }
                            }} role="button" tabindex="0" onkeydown={(e) => e.key === 'Enter' && confirm('Move all items to history and start fresh?') && db.resetListItems(listId)}>
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path d="M2 8a6 6 0 1 1 6 6 6.002 6.002 0 0 1-6-6zm6-3v3l2 1" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                                Reset List
                            </div>
                            <div class="menu-item danger" onclick={() => showDeleteConfirm = true} role="button" tabindex="0" onkeydown={(e) => e.key === 'Enter' && (showDeleteConfirm = true)}>
                                <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                                    <path d="M3 5h12M7 5V3h4v2M5 5v10h8V5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                                Delete List
                            </div>
                        </div>
                        <div class="menu-overlay" onclick={() => showMenu = false}></div>
                    {/if}
                </div>
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
            {#if hasQuantity}
                <input
                    type="number"
                    class="qty-input"
                    bind:value={newItemQty}
                    min="1"
                    id="new-item-qty"
                    aria-label="Quantity"
                    placeholder="Qty"
                />
            {/if}
            <button type="submit" disabled={!newItemText.trim()} aria-label="Add item">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
            </button>
        </form>

        <!-- Consolidated Items List grouped by Category -->
        {#if items.length > 0}
            <div class="items-container">
                {#each groupedItems() as [category, groupItems] (category)}
                    <div class="category-block">
                        {#if category !== 'No Category' || groupedItems().length > 1}
                            <div class="category-header">
                                <span>{category}</span>
                                <span class="category-count">{groupItems.length}</span>
                            </div>
                        {/if}
                        
                        <div class="items-section">
                            {#each groupItems as item (item._id)}
                                <div class="item-row slide-in" class:completed-row={item.completed}>
                                    <input
                                        type="checkbox"
                                        checked={item.completed}
                                        onchange={() => handleToggle(item)}
                                        style:border-color={item.completed ? 'var(--color-slate-700)' : list.color}
                                        aria-label="Toggle {item.text}"
                                    />
                                    <span class="item-text" class:completed-text={item.completed}>{item.text}</span>
                                    {#if hasQuantity}
                                        {#if item.completed}
                                            {#if item.quantity != null}
                                                <span class="qty-value completed-text">×{item.quantity}</span>
                                            {/if}
                                        {:else}
                                            <input
                                                type="number"
                                                class="qty-inline"
                                                value={item.quantity || ''}
                                                min="1"
                                                placeholder="-"
                                                onchange={(e) => {
                                                    const val = parseInt((e.target as HTMLInputElement).value);
                                                    db.updateItemQuantity(item, isNaN(val) ? undefined : val);
                                                }}
                                                aria-label="Quantity for {item.text}"
                                            />
                                        {/if}
                                    {/if}
                                    <button class="delete-item-btn" onclick={() => handleDeleteItem(item)} aria-label="Delete item" type="button">
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                                        </svg>
                                    </button>
                                </div>
                            {/each}
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
        {#if items.length > 0 && items.filter(i => !i.completed).length === 0}
            <div class="all-completed">
                <div class="check-icon-large">✓</div>
                <p>All items completed!</p>
            </div>
        {/if}

        <!-- Empty state -->
        {#if items.length === 0}
            <div class="empty-items">
                <p>No items yet. Add your first one above!</p>
            </div>
        {/if}

        <!-- FAB -->
        <button class="fab" onclick={() => showHistoryModal = true} aria-label="Show past items" style:background={list.color}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 8v8M8 12h8" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" stroke="white" stroke-width="2" opacity="0.4"/>
            </svg>
        </button>
    </div>

    <!-- Edit Dialog -->
    <ListDialog
        mode="edit"
        {list}
        open={showEditDialog}
        onclose={() => showEditDialog = false}
        onsave={handleEditList}
    />

    <!-- History Modal -->
    <HistoryModal
        {listId}
        open={showHistoryModal}
        existingItems={items.map(i => i.text)}
        onclose={() => showHistoryModal = false}
        onselect={(item) => db.addItem(listId, item.text, undefined)}
    />

    <!-- Delete Confirmation -->
    {#if showDeleteConfirm}
        <div class="dialog-overlay" onclick={() => showDeleteConfirm = false} role="button" tabindex="-1" aria-label="Close" onkeydown={(e) => e.key === 'Escape' && (showDeleteConfirm = false)}>
            <div class="confirm-dialog" onclick={(e) => e.stopPropagation()} role="alertdialog" aria-modal="true" tabindex="-1">
                <h3>Delete "{list.title}"?</h3>
                <p>This will permanently delete the list and all its items.</p>
                <div class="confirm-actions">
                    <button class="cancel-btn" onclick={() => showDeleteConfirm = false} type="button">Cancel</button>
                    <button class="delete-btn" onclick={handleDeleteList} type="button">Delete</button>
                </div>
            </div>
        </div>
    {/if}
    {:else}
        <div class="not-found fade-in">
            <h2>List not found</h2>
            <p>This list may have been deleted.</p>
            <button onclick={() => void goto('/')} type="button">Go Home</button>
        </div>
    {/if}

<style>
    .detail-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
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

    .stats-bar {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
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
        margin-bottom: 16px;
    }

    .add-item-bar input {
        flex: 1;
        padding: 10px 16px;
        background: rgba(148, 163, 184, 0.06);
        border: 1px solid rgba(148, 163, 184, 0.1);
        border-radius: 12px;
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
        width: 42px;
        height: 42px;
        border: none;
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        border-radius: 12px;
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

    /* Categories */
    .items-container {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .category-block {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .category-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 0 14px;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: #475569;
    }

    .category-count {
        background: rgba(148, 163, 184, 0.1);
        padding: 1px 6px;
        border-radius: 4px;
        font-size: 10px;
    }

    /* Items */
    .items-section {
        display: flex;
        flex-direction: column;
        gap: 0px;
    }

    .item-row {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 12px;
        border-radius: 10px;
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

    /* Quantity Controls */
    .qty-input {
        width: 40px;
        text-align: center;
        border: none;
        background: transparent;
        color: #f1f5f9;
        font-size: 14px;
        font-weight: 600;
        font-family: inherit;
        -moz-appearance: textfield;
    }

    .qty-input::-webkit-outer-spin-button,
    .qty-input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }

    .qty-input:focus {
        outline: none;
    }

    .qty-value {
        font-size: 13px;
        font-weight: 600;
        color: #94a3b8;
        min-width: 24px;
        text-align: center;
    }

    /* 3-Dot Menu */
    .menu-container {
        position: relative;
    }

    .dropdown-menu {
        position: absolute;
        top: 100%;
        right: 0;
        margin-top: 8px;
        background: #1e293b;
        border: 1px solid rgba(148, 163, 184, 0.1);
        border-radius: 12px;
        padding: 6px;
        min-width: 160px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
        z-index: 1001;
    }

    .menu-item {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        background: transparent;
        border: none;
        border-radius: 8px;
        color: #cbd5e1;
        font-family: inherit;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s;
        text-align: left;
    }

    .menu-item:hover {
        background: rgba(148, 163, 184, 0.08);
        color: #f1f5f9;
    }

    .menu-item.danger:hover {
        background: rgba(244, 63, 94, 0.1);
        color: #f43f5e;
    }

    .menu-overlay {
        position: fixed;
        inset: 0;
        z-index: 1000;
    }

    /* FAB */
    .fab {
        position: fixed;
        bottom: 24px;
        right: 24px;
        width: 56px;
        height: 56px;
        border-radius: 28px;
        border: none;
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        z-index: 90;
    }

    .fab:hover {
        transform: scale(1.1) rotate(90deg);
        filter: brightness(1.1);
        box-shadow: 0 12px 24px rgba(0, 0, 0, 0.4);
    }

    .fab:active {
        transform: scale(0.95);
    }

    /* Inline Qty Input */
    .qty-inline {
        width: 32px;
        padding: 2px 4px;
        background: rgba(148, 163, 184, 0.08);
        border: 1px solid rgba(148, 163, 184, 0.1);
        border-radius: 6px;
        color: #94a3b8;
        font-family: inherit;
        font-size: 13px;
        font-weight: 600;
        text-align: center;
        -moz-appearance: textfield;
    }

    .qty-inline::-webkit-outer-spin-button,
    .qty-inline::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }

    .qty-inline:focus {
        outline: none;
        border-color: rgba(99, 102, 241, 0.4);
        background: rgba(99, 102, 241, 0.05);
        color: #e2e8f0;
    }

    /* Loading state */
    .loading-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 100px 20px;
        gap: 16px;
        color: #64748b;
    }

    .loader {
        width: 32px;
        height: 32px;
        border: 3px solid rgba(99, 102, 241, 0.1);
        border-top-color: #6366f1;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }
</style>
