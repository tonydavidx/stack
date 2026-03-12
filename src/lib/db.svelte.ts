import PouchDB from 'pouchdb-browser';
import PouchDBFind from 'pouchdb-find';
import type { ListDoc, ItemDoc, StackDoc } from './types.js';

import { browser } from '$app/environment';

PouchDB.plugin(PouchDBFind);

let db: PouchDB.Database<StackDoc> | null = null;

function getDbInstance() {
    if (!db && browser) {
        db = new PouchDB<StackDoc>('stackdb');
    }
    return db;
}

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
    const database = getDbInstance();
    if (initialized || !database) return;

    // Create index for item lookups by listId
    await database.createIndex({
        index: { fields: ['type', 'listId', 'text'] }
    });

    await loadLists();

    // Live changes feed — pushes updates into runes
    database.changes({
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
    const database = getDbInstance();
    if (!database) return;
    const result = await database.allDocs({
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
    const database = getDbInstance();
    if (!database) return [];
    const result = await database.find({
        selector: {
            type: 'item',
            listId
        }
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
    const database = getDbInstance();
    if (database) await database.put(doc);
    return doc;
}

async function updateList(list: ListDoc): Promise<void> {
    const database = getDbInstance();
    if (database) await database.put(list);
}

async function deleteList(listId: string): Promise<void> {
    const items = await loadItems(listId);
    const database = getDbInstance();
    if (!database) return;

    for (const item of items) {
        if (item._rev) {
            await database.remove(item._id, item._rev);
        }
    }
    const list = await database.get(listId) as ListDoc;
    await database.remove(list._id, list._rev!);
}

// ---------------------
// Item CRUD
// ---------------------
async function addItem(listId: string, text: string, quantity?: number): Promise<ItemDoc> {
    // Check if item already exists (in history or list)
    const existingItems = itemsByList[listId] || await loadItems(listId);
    const existing = existingItems.find(i => i.text.toLowerCase() === text.toLowerCase());

    const database = getDbInstance();
    if (!database) throw new Error('Database not initialized');

    if (existing) {
        const updated = {
            ...existing,
            inList: true,
            completed: false,
            usageCount: (existing.usageCount || 0) + 1,
            // Only update quantity if provided
            ...(quantity !== undefined ? { quantity } : {})
        };
        await database.put(updated);
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
    await database.put(doc);
    return doc;
}

async function toggleItem(item: ItemDoc): Promise<void> {
    const updated = { ...item, completed: !item.completed };
    const database = getDbInstance();
    if (database) await database.put(updated);
}

async function deleteItem(item: ItemDoc): Promise<void> {
    const updated = { ...item, inList: false };
    const database = getDbInstance();
    if (database) await database.put(updated);
}

async function permanentlyDeleteItem(item: ItemDoc): Promise<void> {
    const database = getDbInstance();
    if (database && item._rev) {
        await database.remove(item._id, item._rev);
    }
}

async function updateItem(item: ItemDoc, changes: Partial<ItemDoc>): Promise<void> {
    const updated = { ...item, ...changes };
    const database = getDbInstance();
    if (database) await database.put(updated);
}

async function updateItemQuantity(item: ItemDoc, quantity?: number): Promise<void> {
    const database = getDbInstance();
    if (database) await database.put({ ...item, quantity });
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
        const database = getDbInstance();
        if (!database) return;
        
        for (const item of activeItems) {
            const localItem = itemsByList[listId].find((i) => i._id === item._id);
            if (localItem && localItem._rev) {
                const response = await database.put({
                    ...item,
                    inList: false,
                    completed: false
                });
                localItem.inList = false;
                localItem.completed = false;
                localItem._rev = response.rev;
            }
        }
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
