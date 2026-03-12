<script lang="ts">
    import { getDb } from '$lib/db.svelte.js';
    import type { ItemDoc } from '$lib/types.js';

    interface Props {
        listId: string;
        open: boolean;
        existingItems: string[];
        onclose: () => void;
        onselect: (item: ItemDoc) => void;
    }

    let { listId, open, existingItems, onclose, onselect }: Props = $props();
    const db = getDb();

    // History items are those not in list
    let history = $derived((db.itemsByList[listId] || []).filter(i => !i.inList));
    let searchQuery = $state('');
    
    let filteredHistory = $derived(() => {
        let base = searchQuery 
            ? history.filter(item => item.text.toLowerCase().includes(searchQuery.toLowerCase()))
            : [...history];
            
        // Sort by usageCount (descending) then alphabetically
        return base.sort((a, b) => {
            const countA = a.usageCount || 0;
            const countB = b.usageCount || 0;
            if (countB !== countA) return countB - countA;
            return a.text.localeCompare(b.text);
        });
    });

    const displayHistory = $derived(filteredHistory());

    function handleSelect(item: ItemDoc) {
        onselect(item);
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === 'Escape') onclose();
    }
</script>

{#if open}
    <div class="modal-overlay" onclick={onclose} onkeydown={handleKeydown} role="button" tabindex="-1" aria-label="Close history">
        <div class="modal" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" tabindex="-1">
            <div class="modal-header">
                <h2>Past Items</h2>
                <button class="close-btn" onclick={onclose} aria-label="Close" type="button">✕</button>
            </div>

            <div class="search-box">
                <input 
                    type="text" 
                    bind:value={searchQuery} 
                    placeholder="Search history..." 
                />
            </div>

            <div class="history-list">
                {#each displayHistory as template (template.text)}
                    {@const exists = existingItems.includes(template.text)}
                    <button 
                        class="history-item" 
                        class:exists
                        onclick={() => !exists && handleSelect(template)}
                        disabled={exists}
                    >
                        <div class="history-item-content">
                            <span class="history-text">{template.text}</span>
                            {#if template.category}
                                <span class="history-category">{template.category}</span>
                            {/if}
                        </div>
                        {#if exists}
                            <span class="exists-label">In list</span>
                        {:else}
                            <span class="plus-icon">+</span>
                        {/if}
                    </button>
                {:else}
                    <div class="empty-history">
                        <p>{searchQuery ? 'No matches found.' : 'No items in history yet.'}</p>
                    </div>
                {/each}
            </div>
        </div>
    </div>
{/if}

<style>
    .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(4px);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }

    .modal {
        background: #1e293b;
        border: 1px solid rgba(148, 163, 184, 0.1);
        border-radius: 20px;
        width: 100%;
        max-width: 400px;
        max-height: 80vh;
        display: flex;
        flex-direction: column;
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
        animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    @keyframes slideUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }

    .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20px 24px;
        border-bottom: 1px solid rgba(148, 163, 184, 0.1);
    }

    .modal-header h2 {
        font-size: 18px;
        font-weight: 600;
        color: #f1f5f9;
        margin: 0;
    }

    .close-btn {
        width: 32px;
        height: 32px;
        border: none;
        background: rgba(148, 163, 184, 0.06);
        border-radius: 8px;
        color: #94a3b8;
        cursor: pointer;
        font-size: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
    }

    .close-btn:hover {
        background: rgba(148, 163, 184, 0.12);
        color: #e2e8f0;
    }

    .search-box {
        padding: 16px 24px;
    }

    .search-box input {
        width: 100%;
        padding: 10px 16px;
        background: rgba(148, 163, 184, 0.05);
        border: 1px solid rgba(148, 163, 184, 0.1);
        border-radius: 10px;
        color: #f1f5f9;
        font-family: inherit;
        font-size: 14px;
    }

    .search-box input:focus {
        outline: none;
        border-color: #6366f1;
    }

    .history-list {
        flex: 1;
        overflow-y: auto;
        padding: 0 12px 200px; /* Extra padding for bottom visibility */
    }

    .history-item {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        background: transparent;
        border: none;
        border-radius: 12px;
        color: #cbd5e1;
        cursor: pointer;
        text-align: left;
        transition: all 0.15s;
    }

    .history-item:hover:not(:disabled) {
        background: rgba(99, 102, 241, 0.1);
        color: #818cf8;
    }

    .history-item:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        filter: grayscale(1);
    }

    .exists-label {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        color: #475569;
        background: rgba(148, 163, 184, 0.1);
        padding: 2px 6px;
        border-radius: 4px;
        letter-spacing: 0.05em;
    }

    .history-text {
        font-size: 15px;
        font-weight: 500;
        display: block;
    }

    .history-item-content {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .history-category {
        font-size: 11px;
        color: #64748b;
        font-weight: 500;
    }

    .plus-icon {
        font-size: 18px;
        color: #64748b;
        opacity: 0.5;
    }

    .history-item:hover .plus-icon {
        color: #818cf8;
        opacity: 1;
    }

    .empty-history {
        padding: 40px 24px;
        text-align: center;
        color: #64748b;
        font-size: 14px;
    }
</style>
