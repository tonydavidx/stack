export interface ListDoc {
    _id: string;
    _rev?: string;
    type: 'list';
    title: string;
    icon: string;
    color: string;
    createdAt: string;
}

export interface ItemDoc {
    _id: string;
    _rev?: string;
    type: 'item';
    listId: string;
    text: string;
    completed: boolean;
    createdAt: string;
}

export type StackDoc = ListDoc | ItemDoc;
