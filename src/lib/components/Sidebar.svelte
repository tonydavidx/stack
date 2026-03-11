<script lang="ts">
    import { page } from '$app/state';
    import { goto } from '$app/navigation';
    import type { ListDoc } from '$lib/types.js';

    interface Props {
        lists: ListDoc[];
        isOpen: boolean;
        onclose: () => void;
        oncreate: () => void;
    }

    let { lists, isOpen, onclose, oncreate }: Props = $props();

    function isActive(listId: string): boolean {
        return page.url.pathname === `/list/${listId.replace('list:', '')}`;
    }

    function navigateToList(listId: string) {
        goto(`/list/${listId.replace('list:', '')}`);
        onclose();
    }

    function navigateHome() {
        goto('/');
        onclose();
    }
</script>

<!-- Backdrop -->
{#if isOpen}
    <div
        class="sidebar-backdrop"
        onclick={onclose}
        onkeydown={(e) => e.key === 'Escape' && onclose()}
        role="button"
        tabindex="-1"
        aria-label="Close sidebar"
    ></div>
{/if}

<aside class="sidebar" class:open={isOpen}>
    <div class="sidebar-header">
        <button class="logo-btn" onclick={navigateHome}>
            <span class="logo-icon">📚</span>
            <span class="logo-text">Stack</span>
        </button>
    </div>

    <nav class="sidebar-nav">
        <button
            class="nav-item home-item"
            class:active={page.url.pathname === '/'}
            onclick={navigateHome}
        >
            <span class="nav-icon">🏠</span>
            <span class="nav-label">Home</span>
        </button>

        <div class="nav-divider"></div>

        <span class="nav-section-title">Your Lists</span>

        <div class="lists-container">
            {#each lists as list (list._id)}
                <button
                    class="nav-item list-item slide-in"
                    class:active={isActive(list._id)}
                    onclick={() => navigateToList(list._id)}
                >
                    <span class="nav-icon">{list.icon}</span>
                    <span class="nav-label">{list.title}</span>
                    <span class="color-dot" style:background={list.color}></span>
                </button>
            {/each}

            {#if lists.length === 0}
                <p class="empty-hint">No lists yet</p>
            {/if}
        </div>
    </nav>

    <div class="sidebar-footer">
        <button class="create-btn" onclick={oncreate}>
            <span class="plus-icon">+</span>
            <span>New List</span>
        </button>
    </div>
</aside>

<style>
    .sidebar-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
        z-index: 40;
        animation: fadeInBackdrop 0.2s ease;
    }

    @keyframes fadeInBackdrop {
        from { opacity: 0; }
        to { opacity: 1; }
    }

    .sidebar {
        position: fixed;
        left: 0;
        top: 0;
        bottom: 0;
        width: 280px;
        background: linear-gradient(180deg, #0f172a 0%, #0a0e1a 100%);
        border-right: 1px solid rgba(148, 163, 184, 0.08);
        z-index: 50;
        display: flex;
        flex-direction: column;
        transform: translateX(-100%);
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .sidebar.open {
        transform: translateX(0);
    }

    @media (min-width: 1024px) {
        .sidebar-backdrop {
            display: none;
        }
        .sidebar {
            transform: translateX(0);
            position: sticky;
            top: 0;
            height: 100dvh;
        }
    }

    .sidebar-header {
        padding: 20px 16px;
        border-bottom: 1px solid rgba(148, 163, 184, 0.06);
    }

    .logo-btn {
        display: flex;
        align-items: center;
        gap: 10px;
        background: none;
        border: none;
        cursor: pointer;
        padding: 8px 12px;
        border-radius: 12px;
        width: 100%;
        transition: background 0.2s;
    }

    .logo-btn:hover {
        background: rgba(148, 163, 184, 0.06);
    }

    .logo-icon {
        font-size: 24px;
    }

    .logo-text {
        font-size: 20px;
        font-weight: 700;
        background: linear-gradient(135deg, #c7d2fe, #818cf8);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        letter-spacing: -0.02em;
    }

    .sidebar-nav {
        flex: 1;
        overflow-y: auto;
        padding: 12px 12px 0;
    }

    .nav-item {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
        padding: 10px 14px;
        border: none;
        background: none;
        border-radius: 10px;
        color: #94a3b8;
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 14px;
        text-align: left;
    }

    .nav-item:hover {
        background: rgba(148, 163, 184, 0.08);
        color: #e2e8f0;
    }

    .nav-item.active {
        background: rgba(99, 102, 241, 0.12);
        color: #c7d2fe;
    }

    .nav-icon {
        font-size: 18px;
        width: 24px;
        text-align: center;
        flex-shrink: 0;
    }

    .nav-label {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-weight: 500;
    }

    .color-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex-shrink: 0;
    }

    .nav-divider {
        height: 1px;
        background: rgba(148, 163, 184, 0.06);
        margin: 8px 0;
    }

    .nav-section-title {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #475569;
        padding: 8px 14px 4px;
        display: block;
    }

    .lists-container {
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding: 4px 0;
    }

    .empty-hint {
        font-size: 13px;
        color: #475569;
        padding: 8px 14px;
        font-style: italic;
    }

    .sidebar-footer {
        padding: 12px;
        border-top: 1px solid rgba(148, 163, 184, 0.06);
    }

    .create-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        padding: 10px 14px;
        border: 1px dashed rgba(148, 163, 184, 0.15);
        background: rgba(148, 163, 184, 0.03);
        border-radius: 10px;
        color: #94a3b8;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.2s ease;
    }

    .create-btn:hover {
        border-color: rgba(99, 102, 241, 0.3);
        background: rgba(99, 102, 241, 0.06);
        color: #c7d2fe;
    }

    .plus-icon {
        font-size: 18px;
        font-weight: 300;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
        background: rgba(99, 102, 241, 0.1);
        color: #818cf8;
    }
</style>
