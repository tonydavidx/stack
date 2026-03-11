<script lang="ts">
    import { page } from '$app/state';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import { getDb } from '$lib/db.svelte.js';
    import type { ItemDoc } from '$lib/types.js';

    const db = getDb();
    let listId = $derived('list:' + page.params.id);
    let list = $derived(db.lists.find(l => l._id === listId));
    let items: ItemDoc[] = $derived(db.itemsByList[listId] || []);
    
    // Category management
    let categories = $derived([...new Set(items.map(i => i.category).filter(Boolean) as string[])]);

    onMount(async () => {
        await db.loadItems(listId);
    });

    // State for showing new category input per item
    let showNewCatItems = $state<Record<string, boolean>>({});

    function toggleNewCat(itemId: string, show: boolean) {
        showNewCatItems[itemId] = show;
    }

    let manageableItems = $derived(() => {
        const allItems = db.itemsByList[listId] || [];
        return [...allItems].sort((a, b) => a.text.localeCompare(b.text));
    });

    async function handleUpdate<K extends keyof ItemDoc>(item: ItemDoc, field: K, value: ItemDoc[K]) {
        await db.updateItem(item, { [field]: value });
    }

    async function handleDelete(item: ItemDoc) {
        if (confirm(`Delete "${item.text}" permanently?`)) {
            await db.permanentlyDeleteItem(item);
        }
    }
</script>

{#if list}
    <div class="edit-items-page fade-in">
        <header class="page-header">
            <button class="back-btn" onclick={() => void goto(`/list/${page.params.id}`)} aria-label="Back" type="button">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M13 4l-6 6 6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </button>
            <div class="header-text">
                <h1>Edit Items</h1>
                <p>{list.title}</p>
            </div>
        </header>

        <div class="items-list">
            {#if manageableItems().length === 0}
                <div class="empty-state">
                    <p>No items in this list yet.</p>
                </div>
            {:else}
                {#each manageableItems() as item (item._id)}
                    <div class="item-edit-card shadow-sm" class:inactive-card={!item.inList}>
                        <div class="card-row">
                            <div class="name-container">
                                <input 
                                    type="text" 
                                    class="item-name-input"
                                    value={item.text}
                                    onchange={(e) => handleUpdate(item, 'text', (e.target as HTMLInputElement).value)}
                                    placeholder="Item name"
                                />
                                {#if !item.inList}
                                    <span class="history-badge">History only</span>
                                {/if}
                            </div>
                            <button class="delete-btn" onclick={() => handleDelete(item)} aria-label="Delete" type="button">
                                <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                                    <path d="M3 4h10M5 4V3h6v1M4 4v10h8V4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                                </svg>
                            </button>
                        </div>

                        <div class="card-controls">
                            <div class="control-group">
                                <label for="qty-{item._id}">Default Qty</label>
                                <input 
                                    id="qty-{item._id}"
                                    type="number" 
                                    class="qty-input"
                                    value={item.quantity || ''}
                                    placeholder="-"
                                    onchange={(e) => handleUpdate(item, 'quantity', parseInt((e.target as HTMLInputElement).value) || undefined)}
                                />
                            </div>

                            <div class="control-group">
                                <label for="cat-{item._id}">Category</label>
                                <select 
                                    id="cat-{item._id}"
                                    class="category-select"
                                    value={item.category || ''}
                                    onchange={(e) => {
                                        const val = (e.target as HTMLSelectElement).value;
                                        if (val === '__new__') {
                                            toggleNewCat(item._id, true);
                                        } else {
                                            toggleNewCat(item._id, false);
                                            handleUpdate(item, 'category', val || undefined);
                                        }
                                    }}
                                >
                                    <option value="">No category</option>
                                    {#each categories as cat (cat)}
                                        <option value={cat}>{cat}</option>
                                    {/each}
                                    <option value="__new__">+ New Category...</option>
                                </select>
                            </div>
                        </div>

                        {#if showNewCatItems[item._id]}
                            <div class="new-cat-row slide-in">
                                <input 
                                    type="text" 
                                    placeholder="Category name"
                                    onkeydown={(e) => {
                                        if (e.key === 'Enter') {
                                            const val = (e.target as HTMLInputElement).value.trim();
                                            if (val) {
                                                handleUpdate(item, 'category', val);
                                                toggleNewCat(item._id, false);
                                            }
                                        }
                                    }}
                                />
                            </div>
                        {/if}
                    </div>
                {/each}
            {/if}
        </div>
    </div>
{/if}

<style>
    .edit-items-page {
        max-width: 600px;
        margin: 0 auto;
        padding-bottom: 80px;
    }

    .page-header {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 24px;
        position: sticky;
        top: 0;
        background: var(--color-slate-950);
        padding: 16px 0;
        z-index: 10;
    }

    .back-btn {
        width: 40px;
        height: 40px;
        border: none;
        background: rgba(148, 163, 184, 0.06);
        border-radius: 12px;
        color: #94a3b8;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
    }

    .back-btn:hover {
        background: rgba(148, 163, 184, 0.12);
        color: #e2e8f0;
    }

    .header-text h1 {
        font-size: 20px;
        font-weight: 700;
        color: #f1f5f9;
        line-height: 1.2;
    }

    .header-text p {
        font-size: 14px;
        color: #64748b;
    }

    .items-list {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .item-edit-card {
        background: #1e293b;
        border: 1px solid rgba(148, 163, 184, 0.1);
        border-radius: 16px;
        padding: 16px;
    }

    .card-row {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
    }

    .name-container {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .history-badge {
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        background: rgba(148, 163, 184, 0.1);
        color: #94a3b8;
        padding: 2px 6px;
        border-radius: 4px;
        white-space: nowrap;
    }

    .inactive-card {
        opacity: 0.7;
        border-style: dashed;
    }

    .item-name-input {
        flex: 1;
        background: transparent;
        border: none;
        border-bottom: 1px solid transparent;
        color: #f1f5f9;
        font-size: 16px;
        font-weight: 600;
        padding: 4px 0;
        transition: all 0.2s;
    }

    .item-name-input:focus {
        outline: none;
        border-color: #6366f1;
    }

    .delete-btn {
        width: 32px;
        height: 32px;
        border: none;
        background: transparent;
        color: #475569;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
        transition: all 0.2s;
    }

    .delete-btn:hover {
        background: rgba(244, 63, 94, 0.1);
        color: #f43f5e;
    }

    .card-controls {
        display: grid;
        grid-template-columns: 1fr 2fr;
        gap: 16px;
    }

    @media (max-width: 480px) {
        .card-controls {
            grid-template-columns: 1fr;
            gap: 12px;
        }
    }

    .control-group {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .control-group label {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        color: #64748b;
        letter-spacing: 0.05em;
    }

    .qty-input, .category-select {
        background: rgba(15, 23, 42, 0.6);
        border: 1px solid rgba(148, 163, 184, 0.1);
        border-radius: 12px;
        color: #f1f5f9;
        padding: 10px 14px;
        font-size: 14px;
        font-family: inherit;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        backdrop-filter: blur(4px);
    }

    .category-select {
        appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 12px center;
        background-size: 16px;
        padding-right: 40px;
        cursor: pointer;
    }

    .qty-input:hover, .category-select:hover {
        background-color: rgba(30, 41, 59, 0.8);
        border-color: rgba(148, 163, 184, 0.2);
    }

    .qty-input:focus, .category-select:focus {
        outline: none;
        border-color: #6366f1;
        box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
        background-color: #1e293b;
    }

    .new-cat-row {
        margin-top: 12px;
    }

    .new-cat-row input {
        width: 100%;
        background: rgba(99, 102, 241, 0.05);
        border: 1px solid rgba(99, 102, 241, 0.2);
        border-radius: 8px;
        color: #f1f5f9;
        padding: 8px 12px;
        font-size: 14px;
    }

    .empty-state {
        padding: 80px 20px;
        text-align: center;
        color: #64748b;
    }
</style>
