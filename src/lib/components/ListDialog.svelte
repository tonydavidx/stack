<script lang="ts">
    import type { ListDoc } from '$lib/types.js';

    interface Props {
        mode: 'create' | 'edit';
        list?: ListDoc;
        open: boolean;
        onclose: () => void;
        onsave: (title: string, icon: string, color: string, enableQuantity: boolean) => void;
    }

    let { mode, list, open, onclose, onsave }: Props = $props();

    let title = $state('');
    let selectedIcon = $state('📋');
    let selectedColor = $state('#6366f1');
    let enableQuantity = $state(false);

    const ICONS = ['📋', '🛒', '✅', '📝', '🎯', '💡', '🏠', '💼', '🎨', '📚', '🍽️', '🏋️', '🎵', '✈️', '🎁', '❤️', '⭐', '🔧', '📦', '🌱'];
    const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#a855f7', '#64748b'];

    $effect(() => {
        if (open && mode === 'edit' && list) {
            title = list.title;
            selectedIcon = list.icon;
            selectedColor = list.color;
            enableQuantity = list.enableQuantity ?? false;
        } else if (open && mode === 'create') {
            title = '';
            selectedIcon = '📋';
            selectedColor = '#6366f1';
            enableQuantity = false;
        }
    });

    function handleSubmit(e: Event) {
        e.preventDefault();
        if (!title.trim()) return;
        onsave(title.trim(), selectedIcon, selectedColor, enableQuantity);
        onclose();
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === 'Escape') onclose();
    }
</script>

{#if open}
    <div class="dialog-overlay" onclick={onclose} onkeydown={handleKeydown} role="button" tabindex="-1" aria-label="Close dialog">
        <div class="dialog" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="{mode === 'create' ? 'Create' : 'Edit'} List">
            <div class="dialog-header">
                <h2>{mode === 'create' ? 'Create New List' : 'Edit List'}</h2>
                <button class="close-btn" onclick={onclose} aria-label="Close">✕</button>
            </div>

            <form onsubmit={handleSubmit}>
                <div class="field">
                    <label for="list-title">Title</label>
                    <input
                        id="list-title"
                        type="text"
                        bind:value={title}
                        placeholder="e.g. Groceries"
                        autocomplete="off"
                        autofocus
                    />
                </div>

                <div class="field">
                    <label>Icon</label>
                    <div class="icon-grid">
                        {#each ICONS as icon}
                            <button
                                type="button"
                                class="icon-btn"
                                class:selected={selectedIcon === icon}
                                onclick={() => selectedIcon = icon}
                            >
                                {icon}
                            </button>
                        {/each}
                    </div>
                </div>

                <div class="field">
                    <label>Color</label>
                    <div class="color-grid">
                        {#each COLORS as color}
                            <button
                                type="button"
                                class="color-btn"
                                class:selected={selectedColor === color}
                                style:background={color}
                                onclick={() => selectedColor = color}
                                aria-label="Select color {color}"
                            ></button>
                        {/each}
                    </div>
                </div>

                <div class="field">
                    <label for="enable-quantity">Options</label>
                    <label class="toggle-row">
                        <input
                            id="enable-quantity"
                            type="checkbox"
                            class="toggle-input"
                            bind:checked={enableQuantity}
                        />
                        <span class="toggle-track">
                            <span class="toggle-thumb"></span>
                        </span>
                        <span class="toggle-label">Enable item quantities</span>
                    </label>
                </div>

                <div class="dialog-actions">
                    <button type="button" class="cancel-btn" onclick={onclose}>Cancel</button>
                    <button type="submit" class="submit-btn" disabled={!title.trim()}>
                        {mode === 'create' ? 'Create' : 'Save'}
                    </button>
                </div>
            </form>
        </div>
    </div>
{/if}

<style>
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
        animation: fadeOverlay 0.2s ease;
    }

    @keyframes fadeOverlay {
        from { opacity: 0; }
        to { opacity: 1; }
    }

    .dialog {
        background: linear-gradient(145deg, #1e293b, #0f172a);
        border: 1px solid rgba(148, 163, 184, 0.1);
        border-radius: 20px;
        width: 100%;
        max-width: 440px;
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
        animation: scaleIn 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }

    @keyframes scaleIn {
        from { opacity: 0; transform: scale(0.95); }
        to { opacity: 1; transform: scale(1); }
    }

    .dialog-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20px 24px 0;
    }

    .dialog-header h2 {
        font-size: 18px;
        font-weight: 600;
        color: #f1f5f9;
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

    form {
        padding: 20px 24px 24px;
        display: flex;
        flex-direction: column;
        gap: 20px;
    }

    .field {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .field label {
        font-size: 13px;
        font-weight: 500;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 0.04em;
    }

    .field input[type="text"] {
        width: 100%;
        padding: 12px 16px;
        background: rgba(148, 163, 184, 0.06);
        border: 1px solid rgba(148, 163, 184, 0.1);
        border-radius: 12px;
        color: #f1f5f9;
        font-size: 15px;
        font-family: inherit;
        transition: all 0.2s;
    }

    .field input[type="text"]:focus {
        outline: none;
        border-color: rgba(99, 102, 241, 0.4);
        background: rgba(99, 102, 241, 0.06);
    }

    .field input[type="text"]::placeholder {
        color: #475569;
    }

    .icon-grid {
        display: grid;
        grid-template-columns: repeat(10, 1fr);
        gap: 4px;
    }

    .icon-btn {
        width: 36px;
        height: 36px;
        border: 2px solid transparent;
        background: rgba(148, 163, 184, 0.04);
        border-radius: 8px;
        font-size: 18px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.15s;
    }

    .icon-btn:hover {
        background: rgba(148, 163, 184, 0.1);
    }

    .icon-btn.selected {
        border-color: #6366f1;
        background: rgba(99, 102, 241, 0.12);
    }

    .color-grid {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
    }

    .color-btn {
        width: 32px;
        height: 32px;
        border: 3px solid transparent;
        border-radius: 50%;
        cursor: pointer;
        transition: all 0.15s;
    }

    .color-btn:hover {
        transform: scale(1.15);
    }

    .color-btn.selected {
        border-color: white;
        box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.5);
        transform: scale(1.1);
    }

    .dialog-actions {
        display: flex;
        gap: 10px;
        justify-content: flex-end;
        padding-top: 4px;
    }

    .cancel-btn {
        padding: 10px 20px;
        border: 1px solid rgba(148, 163, 184, 0.1);
        background: transparent;
        border-radius: 10px;
        color: #94a3b8;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        font-family: inherit;
    }

    .cancel-btn:hover {
        background: rgba(148, 163, 184, 0.06);
        color: #e2e8f0;
    }

    .submit-btn {
        padding: 10px 24px;
        border: none;
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        border-radius: 10px;
        color: white;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        font-family: inherit;
    }

    .submit-btn:hover:not(:disabled) {
        filter: brightness(1.1);
        transform: translateY(-1px);
    }

    .submit-btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
    }

    /* Toggle */
    .toggle-row {
        display: flex;
        align-items: center;
        gap: 12px;
        cursor: pointer;
        padding: 8px 0;
    }

    .toggle-input {
        display: none !important;
    }

    .toggle-track {
        width: 40px;
        height: 22px;
        background: rgba(148, 163, 184, 0.15);
        border-radius: 11px;
        position: relative;
        transition: background 0.2s;
        flex-shrink: 0;
    }

    .toggle-input:checked + .toggle-track {
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
    }

    .toggle-thumb {
        width: 16px;
        height: 16px;
        background: #94a3b8;
        border-radius: 50%;
        position: absolute;
        top: 3px;
        left: 3px;
        transition: all 0.2s;
    }

    .toggle-input:checked + .toggle-track .toggle-thumb {
        transform: translateX(18px);
        background: white;
    }

    .toggle-label {
        font-size: 14px;
        color: #cbd5e1;
        font-weight: 400;
    }
</style>
