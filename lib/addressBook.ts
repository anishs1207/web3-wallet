export interface Contact {
    id: string;
    alias: string;
    address: string;
    chain: "solana" | "ethereum";
}

const STORAGE_KEY = "vaulta_address_book";

export function getContacts(): Contact[] {
    if (typeof window === "undefined") return [];
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
}

export function saveContact(contact: Omit<Contact, "id">): Contact {
    const contacts = getContacts();
    const newContact = { ...contact, id: Date.now().toString() };
    contacts.push(newContact);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
    return newContact;
}

export function deleteContact(id: string) {
    const contacts = getContacts();
    const filtered = contacts.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export function updateContact(id: string, updates: Partial<Contact>) {
    const contacts = getContacts();
    const index = contacts.findIndex(c => c.id === id);
    if (index !== -1) {
        contacts[index] = { ...contacts[index], ...updates };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
    }
}
