import PouchDB from 'pouchdb-browser';
import PouchDBFind from 'pouchdb-find';
import type { ListDoc, ItemDoc, StackDoc } from './types.js';

PouchDB.plugin(PouchDBFind);

const db = new PouchDB<StackDoc>('stackdb');

// ---------------------
// Reactive State (Runes)
// ---------------------
let lists = $state<ListDoc[]>([]);
let itemsByList = $state<Record<string, ItemDoc[]>>({});
let initialized = $state(false);

// ---------------------
// Initialization
// ---------------------
async function init() {
    if (initialized) return;

    // Create index for item lookups by listId
    await db.createIndex({
        index: { fields: ['type', 'listId', 'text'] }
    });

    await loadLists();

    // Live changes feed — pushes updates into runes
    db.changes({
        live: true,
        since: 'now',
        include_docs: true
    }).on('change', (change) => {
        if (change.deleted) {
            handleDelete(change.id);
        } else if (change.doc) {
            handleUpsert(change.doc as StackDoc);
        }
    });

    initialized = true;
}

// ---------------------
// Change Handlers
// ---------------------
function handleDelete(id: string) {
    if (id.startsWith('list:')) {
        lists = lists.filter((l) => l._id !== id);
        const copy = { ...itemsByList };
        delete copy[id];
        itemsByList = copy;
    } else if (id.startsWith('item:')) {
        for (const listId of Object.keys(itemsByList)) {
            const filtered = itemsByList[listId].filter((i) => i._id !== id);
            if (filtered.length !== itemsByList[listId].length) {
                itemsByList = { ...itemsByList, [listId]: filtered };
                break;
            }
        }
    }
}

function handleUpsert(doc: StackDoc) {
    if (doc.type === 'list') {
        const idx = lists.findIndex((l) => l._id === doc._id);
        if (idx >= 0) {
            lists = lists.map((l) => (l._id === doc._id ? (doc as ListDoc) : l));
        } else {
            lists = [...lists, doc as ListDoc].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        }
    } else if (doc.type === 'item') {
        const item = doc as ItemDoc;
        const current = itemsByList[item.listId] || [];
        const idx = current.findIndex((i) => i._id === item._id);
        if (idx >= 0) {
            itemsByList = {
                ...itemsByList,
                [item.listId]: current.map((i) => (i._id === item._id ? item : i))
            };
        } else {
            itemsByList = {
                ...itemsByList,
                [item.listId]: [...current, item].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
            };
        }
    }
}

// ---------------------
// Efficient Fetching
// ---------------------
async function loadLists() {
    const result = await db.allDocs({
        startkey: 'list:',
        endkey: 'list:\ufff0',
        include_docs: true
    });
    lists = result.rows
        .map((r) => r.doc as ListDoc)
        .filter(Boolean)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

async function loadItems(listId: string): Promise<ItemDoc[]> {
    if (itemsByList[listId]) return itemsByList[listId];

    const result = await db.find({
        selector: { type: 'item', listId }
    });
    const items = (result.docs as ItemDoc[]).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    itemsByList = { ...itemsByList, [listId]: items };
    return items;
}

// ---------------------
// List CRUD
// ---------------------
function generateId(prefix: string): string {
    return `${prefix}:${crypto.randomUUID()}`;
}

async function createList(title: string, icon: string, color: string, enableQuantity: boolean = false): Promise<ListDoc> {
    const doc: ListDoc = {
        _id: generateId('list'),
        type: 'list',
        title,
        icon,
        color,
        enableQuantity,
        createdAt: new Date().toISOString()
    };
    await db.put(doc);
    return doc;
}

async function updateList(list: ListDoc): Promise<void> {
    await db.put(list);
}

async function deleteList(listId: string): Promise<void> {
    const items = await loadItems(listId);
    for (const item of items) {
        if (item._rev) {
            await db.remove(item._id, item._rev);
        }
    }
    const list = await db.get(listId);
    await db.remove(list._id, list._rev!);
}

// ---------------------
// Item CRUD
// ---------------------
async function addItem(listId: string, text: string, quantity?: number): Promise<ItemDoc> {
    // Check if item already exists (in history or list)
    const existingItems = itemsByList[listId] || await loadItems(listId);
    const existing = existingItems.find(i => i.text.toLowerCase() === text.toLowerCase());

    if (existing) {
        const updated = {
            ...existing,
            inList: true,
            completed: false,
            usageCount: (existing.usageCount || 0) + 1,
            // Only update quantity if provided
            ...(quantity !== undefined ? { quantity } : {})
        };
        await db.put(updated);
        return updated;
    }

    const doc: ItemDoc = {
        _id: generateId('item'),
        type: 'item',
        listId,
        text,
        completed: false,
        inList: true,
        usageCount: 1,
        quantity,
        createdAt: new Date().toISOString()
    };
    await db.put(doc);
    return doc;
}

async function toggleItem(item: ItemDoc): Promise<void> {
    await db.put({ ...item, completed: !item.completed });
}

async function deleteItem(item: ItemDoc): Promise<void> {
    // Soft delete: move to history
    await db.put({ ...item, inList: false, completed: false });
}

async function permanentlyDeleteItem(item: ItemDoc): Promise<void> {
    if (item._rev) {
        await db.remove(item._id, item._rev);
    }
}

async function updateItem(item: ItemDoc, updates: Partial<ItemDoc>): Promise<void> {
    await db.put({ ...item, ...updates });
}

async function updateItemQuantity(item: ItemDoc, quantity?: number): Promise<void> {
    await db.put({ ...item, quantity });
}

// ---------------------
// Item Count Helper
// ---------------------
async function getItemCount(listId: string): Promise<number> {
    const items = await loadItems(listId);
    return items.filter(i => i.inList).length;
}

async function getActiveItemCount(listId: string): Promise<number> {
    const items = await loadItems(listId);
    return items.filter((i) => i.inList && !i.completed).length;
}

// ---------------------
// Reset List Helper
// ---------------------
async function resetListItems(listId: string): Promise<void> {
    const items = itemsByList[listId] || [];
    const activeItems = items.filter(i => i.inList);
    
    if (activeItems.length === 0) return;

    try {
        const updates = activeItems.map(item => ({
            ...item,
            inList: false,
            completed: false
        }));

        const responses = await db.bulkDocs(updates);
        
        // Update local state for all successful updates
        responses.forEach((response, index) => {
            if ('ok' in response && response.ok) {
                const item = activeItems[index];
                const localItem = items.find(i => i._id === item._id);
                if (localItem) {
                    localItem.inList = false;
                    localItem.completed = false;
                    localItem._rev = response.rev;
                }
            }
        });
    } catch (error) {
        console.error('Error resetting list:', error);
        throw error;
    }
}

// ---------------------
// Exports
// ---------------------
export function getDb() {
    return {
        get lists() { return lists; },
        get itemsByList() { return itemsByList; },
        get initialized() { return initialized; },
        init,
        loadItems,
        createList,
        updateList,
        deleteList,
        addItem,
        toggleItem,
        deleteItem,
        permanentlyDeleteItem,
        updateItem,
        updateItemQuantity,
        getItemCount,
        getActiveItemCount,
        resetListItems
    };
}
