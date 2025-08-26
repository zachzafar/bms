"use client"

import { SelectTenant, SelectUser } from "@repo/api-contract";
import { getSession } from "./session";

export class StorageService {
    private static readonly TOKEN_KEY = 'auth_token';
    private static readonly USER_KEY = 'user';
    private static readonly TENANT_KEY = 'tenant';
    private static readonly TENANT_LIST_KEY ="tenant_list"

    private static isClientSide() {
        return typeof window !== 'undefined';
    }

    static setToken(accessToken: string): void {
        localStorage.setItem(StorageService.TOKEN_KEY, accessToken);
    }

    static async getToken(): Promise<string | null> {
        if (!StorageService.isClientSide()) {
            return null;
        }
        let token = window.localStorage.getItem(StorageService.TOKEN_KEY);

        if(token) return token;

        const session = await getSession();

        if(session) {
            return session.accessToken;
        }

        return null;
    }

    static removeToken(): void {
        localStorage.removeItem(StorageService.TOKEN_KEY);
    }

    static setUser(user: Omit<SelectUser,"password">): void {
        localStorage.setItem(StorageService.USER_KEY, JSON.stringify(user));
    }

    static getUser(): Omit<SelectUser,"password"> | null {
        if (!StorageService.isClientSide()) {
            return null;
        }

        const user = localStorage.getItem(StorageService.USER_KEY);
        if (user) {
            return JSON.parse(user);
        }
        return null;
    }

    static setTenant(tenant: SelectTenant): void {
        localStorage.setItem(StorageService.TENANT_KEY, JSON.stringify(tenant));
    }

    static getTenant(): SelectTenant | null {
        if (!StorageService.isClientSide()) {
            return null;
        }

        const tenant = localStorage.getItem(StorageService.TENANT_KEY);
        
        if (tenant) {
            return JSON.parse(tenant) as SelectTenant;
        }
        return null;
    }

    static removeTenant(): void {
        localStorage.removeItem(StorageService.TENANT_KEY);
    }

    static setTenantList(tenantList: SelectTenant[]): void {
        localStorage.setItem(StorageService.TENANT_LIST_KEY, JSON.stringify(tenantList));
    }

    static getTenantList(): SelectTenant[] | null {
        if (!StorageService.isClientSide()) {
            return null;
        }

        const tenantList = localStorage.getItem(StorageService.TENANT_LIST_KEY);
        if (tenantList) {
            return JSON.parse(tenantList) as SelectTenant[];
        }
        return null;
    }

    static removeTenantList(): void {
        localStorage.removeItem(StorageService.TENANT_LIST_KEY);
    }



    static removeUser(): void {
        localStorage.removeItem(StorageService.USER_KEY);
    }

    

    static isAuthenticated(): boolean {
        return !!this.getToken();
    }
}

