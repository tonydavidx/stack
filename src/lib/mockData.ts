import { getDb } from './db.svelte.js';
import type { ItemDoc } from './types.js';

interface MockItem {
    text: string;
    category?: string;
    quantity?: number;
}

interface MockList {
    title: string;
    icon: string;
    color: string;
    enableQuantity: boolean;
    items: MockItem[];
}

const mockLists: MockList[] = [
    {
        title: 'Weekly Groceries',
        icon: '🛒',
        color: '#10b981',
        enableQuantity: true,
        items: [
            { text: 'Whole Milk', category: 'Dairy', quantity: 2 },
            { text: 'Greek Yogurt', category: 'Dairy', quantity: 4 },
            { text: 'Avocados', category: 'Produce', quantity: 3 },
            { text: 'Sourdough Bread', category: 'Bakery', quantity: 1 },
            { text: 'Chicken Breast', category: 'Meat', quantity: 2 },
            { text: 'Spinach', category: 'Produce', quantity: 1 },
            { text: 'Coffee Beans', category: 'Pantry', quantity: 1 }
        ]
    },
    {
        title: 'Gym Routine',
        icon: '💪',
        color: '#3b82f6',
        enableQuantity: false,
        items: [
            { text: 'Warm up stretch', category: 'Mobility' },
            { text: 'Squats 3x10', category: 'Legs' },
            { text: 'Deadlifts 3x5', category: 'Back' },
            { text: 'Bench Press 3x10', category: 'Chest' },
            { text: 'Pull ups 3xMax', category: 'Back' },
            { text: 'Plank 3x1min', category: 'Core' }
        ]
    },
    {
        title: 'Weekend Chores',
        icon: '🏠',
        color: '#f59e0b',
        enableQuantity: false,
        items: [
            { text: 'Vacuum living room', category: 'Cleaning' },
            { text: 'Mop kitchen floor', category: 'Cleaning' },
            { text: 'Wash car', category: 'Maintenance' },
            { text: 'Mow lawn', category: 'Outdoor' },
            { text: 'Clean windows', category: 'Cleaning' },
            { text: 'Laundry - Whites', category: 'Laundry' }
        ]
    },
    {
        title: 'Beach Trip',
        icon: '🏖️',
        color: '#06b6d4',
        enableQuantity: true,
        items: [
            { text: 'Sunscreen SPF 50', category: 'Essentials', quantity: 1 },
            { text: 'Beach towels', category: 'Gear', quantity: 2 },
            { text: 'Flip flops', category: 'Apparel', quantity: 1 },
            { text: 'Cooler box', category: 'Gear', quantity: 1 },
            { text: 'Snacks/Chips', category: 'Food', quantity: 3 },
            { text: 'Water bottles', category: 'Drinks', quantity: 4 },
            { text: 'Books/Kindle', category: 'Entertainment', quantity: 1 }
        ]
    },
    {
        title: 'Painting Project',
        icon: '🎨',
        color: '#ec4899',
        enableQuantity: true,
        items: [
            { text: 'Blue wall paint', category: 'Supplies', quantity: 2 },
            { text: 'Paint brushes', category: 'Tools', quantity: 3 },
            { text: 'Painter tape', category: 'Supplies', quantity: 1 },
            { text: 'Drop cloth', category: 'Supplies', quantity: 2 },
            { text: 'Sandpaper', category: 'Prep', quantity: 5 },
            { text: 'Primer', category: 'Supplies', quantity: 1 }
        ]
    },
    {
        title: 'Tech Backlog',
        icon: '💻',
        color: '#8b5cf6',
        enableQuantity: false,
        items: [
            { text: 'Update portfolio site', category: 'Development' },
            { text: 'Clean up GitHub issues', category: 'Maintenance' },
            { text: 'Refactor Auth logic', category: 'Coding' },
            { text: 'Backup SSD', category: 'Admin' },
            { text: 'Write blog post', category: 'Content' }
        ]
    },
    {
        title: 'Gift Ideas',
        icon: '🎁',
        color: '#ef4444',
        enableQuantity: false,
        items: [
            { text: 'Watch for Dad', category: 'Family' },
            { text: 'Pottery class for Mom', category: 'Family' },
            { text: 'Board game for Sam', category: 'Friends' },
            { text: 'Wine for the party', category: 'Party' },
            { text: 'Lego for nephew', category: 'Family' }
        ]
    },
    {
        title: 'Camping Gear',
        icon: '🏕️',
        color: '#15803d',
        enableQuantity: true,
        items: [
            { text: 'Tent (4-person)', category: 'Shelter', quantity: 1 },
            { text: 'Sleeping bag', category: 'Sleep', quantity: 2 },
            { text: 'Cooking stove', category: 'Kitchen', quantity: 1 },
            { text: 'First aid kit', category: 'Safety', quantity: 1 },
            { text: 'Flashlight', category: 'Lighting', quantity: 2 },
            { text: 'Hiking boots', category: 'Apparel', quantity: 1 }
        ]
    },
    {
        title: 'Pancakes Recipe',
        icon: '🥞',
        color: '#f97316',
        enableQuantity: true,
        items: [
            { text: 'All-purpose flour', category: 'Dry', quantity: 2 },
            { text: 'Eggs', category: 'Wet', quantity: 2 },
            { text: 'Milk', category: 'Wet', quantity: 1 },
            { text: 'Baking powder', category: 'Dry', quantity: 1 },
            { text: 'Butter', category: 'Wet', quantity: 1 },
            { text: 'Maple syrup', category: 'Toppings', quantity: 1 }
        ]
    },
    {
        title: 'Office Supplies',
        icon: '📎',
        color: '#64748b',
        enableQuantity: true,
        items: [
            { text: 'A4 Paper ream', category: 'Stationery', quantity: 2 },
            { text: 'Black pens', category: 'Writing', quantity: 12 },
            { text: 'Post-it notes', category: 'Stationery', quantity: 5 },
            { text: 'Printer ink', category: 'Tech', quantity: 1 },
            { text: 'Stapler', category: 'Hardware', quantity: 1 }
        ]
    }
];

export async function seedMockData() {
    const db = getDb();
    
    // Process lists one by one for safety
    for (const listData of mockLists) {
        // Create the list
        const list = await db.createList(
            listData.title, 
            listData.icon, 
            listData.color, 
            listData.enableQuantity
        );

        const listId = list._id;

        // Add items to that list
        for (const item of listData.items) {
            // Note: addItem internally handles inList: true
            await db.addItem(listId, item.text, item.quantity);
            
            // To set the category, we need to find the doc we just created
            const listItems = db.itemsByList[listId] || [];
            const doc = (listItems as ItemDoc[]).find(i => i.text === item.text && i.inList);
            if (doc && item.category) {
                await db.updateItem(doc, { category: item.category });
            }
        }
    }
}

export async function clearAllData() {
    const db = getDb();
    
    // Delete all items first
    const listIds = Object.keys(db.itemsByList);
    for (const listId of listIds) {
        const items = db.itemsByList[listId];
        for (const item of items) {
            await db.permanentlyDeleteItem(item);
        }
    }

    // Delete all lists
    const lists = [...db.lists];
    for (const list of lists) {
        await db.deleteList(list._id);
    }
}
