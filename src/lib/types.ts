export interface ListDoc {
    _id: string;
    _rev?: string;
    type: 'list';
    title: string;
    icon: string;
    color: string;
    enableQuantity?: boolean;
    createdAt: string;
}

export interface ItemDoc {
    _id: string;
    _rev?: string;
    type: 'item';
    listId: string;
    text: string;
    completed: boolean;
    inList: boolean; // True if active in the list, false if moved to history
    quantity?: number;
    category?: string;
    createdAt: string;
}

export type StackDoc = ListDoc | ItemDoc;
