// CRM Query Keys following the web folder pattern
export const CONTACTS_QUERY_KEY = ['contacts'];
export const INQUIRIES_QUERY_KEY = ['inquiries'];
export const COMMUNICATION_LOGS_QUERY_KEY = ['communicationLogs'];
export const FEEDBACK_QUERY_KEY = ['feedback'];
export const BROCHURES_QUERY_KEY = ['brochures'];
export const TASKS_QUERY_KEY = ['tasks'];
export const DOCUMENTS_QUERY_KEY = ['documents'];
export const USERS_QUERY_KEY = ['users'];
export const ASSETS_QUERY_KEY = ['assets'];

// Extended query keys for specific contexts
export const CONTACT_INQUIRIES_QUERY_KEY = (contactId: number) => [...CONTACTS_QUERY_KEY, contactId, 'inquiries'];
export const CONTACT_COMMUNICATIONS_QUERY_KEY = (contactId: number) => [...CONTACTS_QUERY_KEY, contactId, 'communications'];
export const CONTACT_FEEDBACK_QUERY_KEY = (contactId: number) => [...CONTACTS_QUERY_KEY, contactId, 'feedback'];
export const CONTACT_BROCHURES_QUERY_KEY = (contactId: number) => [...CONTACTS_QUERY_KEY, contactId, 'brochures'];
export const CONTACT_DOCUMENTS_QUERY_KEY = (contactId: number) => [...CONTACTS_QUERY_KEY, contactId, 'documents'];
export const USER_TASKS_QUERY_KEY = (userId: string) => [...USERS_QUERY_KEY, userId, 'tasks'];
export const ASSET_INQUIRIES_QUERY_KEY = (assetId: string) => [...ASSETS_QUERY_KEY, assetId, 'inquiries'];
export const ASSET_FEEDBACK_QUERY_KEY = (assetId: string) => [...ASSETS_QUERY_KEY, assetId, 'feedback'];
