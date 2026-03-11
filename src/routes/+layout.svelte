<script lang="ts">
    import './layout.css';
    import { onMount } from 'svelte';
    import { getDb } from '$lib/db.svelte.js';
    import Sidebar from '$lib/components/Sidebar.svelte';
    import ListDialog from '$lib/components/ListDialog.svelte';

    let { children } = $props();

    const db = getDb();

    let sidebarOpen = $state(false);
    let showCreateDialog = $state(false);

    onMount(() => {
        db.init();
    });

    async function handleCreateList(title: string, icon: string, color: string, enableQuantity: boolean) {
        await db.createList(title, icon, color, enableQuantity);
        showCreateDialog = false;
    }
</script>

<svelte:head>
    <title>Stack – List Manager</title>
    <meta name="description" content="A multi-purpose list manager PWA" />
</svelte:head>

<div class="app-layout">
    <Sidebar
        lists={db.lists}
        isOpen={sidebarOpen}
        onclose={() => sidebarOpen = false}
        oncreate={() => { sidebarOpen = false; showCreateDialog = true; }}
    />

    <main class="main-content">
        <header class="topbar">
            <button class="menu-btn" onclick={() => sidebarOpen = !sidebarOpen} aria-label="Toggle menu">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
            </button>
        </header>

        <div class="page-content">
            {@render children()}
        </div>
    </main>
</div>

<ListDialog
    mode="create"
    open={showCreateDialog}
    onclose={() => showCreateDialog = false}
    onsave={handleCreateList}
/>

<style>
    .app-layout {
        display: flex;
        min-height: 100dvh;
    }

    .main-content {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
    }

    @media (min-width: 1024px) {
        .main-content {
            margin-left: 0;
        }
    }

    .topbar {
        display: flex;
        align-items: center;
        padding: 12px 16px;
        border-bottom: 1px solid rgba(148, 163, 184, 0.06);
        backdrop-filter: blur(12px);
        position: sticky;
        top: 0;
        z-index: 30;
        background: rgba(10, 14, 26, 0.8);
    }

    @media (min-width: 1024px) {
        .topbar {
            display: none;
        }
    }

    .menu-btn {
        width: 40px;
        height: 40px;
        border: none;
        background: rgba(148, 163, 184, 0.06);
        border-radius: 10px;
        color: #94a3b8;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
    }

    .menu-btn:hover {
        background: rgba(148, 163, 184, 0.12);
        color: #e2e8f0;
    }

    .page-content {
        flex: 1;
        padding: 24px 20px 40px;
        max-width: 900px;
        width: 100%;
        margin: 0 auto;
    }

    @media (min-width: 768px) {
        .page-content {
            padding: 32px 40px 60px;
        }
    }
</style>
