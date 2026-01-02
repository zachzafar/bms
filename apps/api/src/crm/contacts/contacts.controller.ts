import { Controller, Headers, Logger } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { crmContract } from '@repo/api-contract'; // { contacts: ..., profiles: ... }
import { ContactsService } from './contacts.service';
import * as schema from '@repo/api-contract';
import { TenantService } from 'src/tenant/tenant.service';
// import { RequireRead, RequireWrite, RequireDelete } from 'src/auth/decorators/permissions.decorator';
import { Roles } from 'src/auth/decorators/permissions.decorator';
import { PermissionScope } from 'src/auth/permissions';

@Controller()
export class ContactsController {
  private readonly logger = new Logger(ContactsController.name);
  constructor(
    private readonly contacts: ContactsService,
    private readonly tenantService: TenantService
  ) {}

  @TsRestHandler(crmContract.contacts.createContact)
  @Roles(PermissionScope.CONTACTS_WRITE)
  async createContact(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(crmContract.contacts.createContact, async ({ body }) => {
      const tenantId = headers['x-tenant-id'];
      const id = await this.contacts.createContact({ ...body, tenantId });
      return { status: 201, body: { message: 'contact created', contactId: id } };
    });
  }

  @TsRestHandler(crmContract.contacts.listContacts)
  @Roles(PermissionScope.CONTACTS_READ)
  async listContacts(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(crmContract.contacts.listContacts, async ({ query }) => {
      const tenantId = headers['x-tenant-id'];
      const rows = await this.contacts.listContacts(tenantId, query);
      return { status: 200, body: rows };
    });
  }

  @TsRestHandler(crmContract.contacts.getContact)
  @Roles(PermissionScope.CONTACTS_READ)
  async getContact(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(crmContract.contacts.getContact, async ({ params }) => {
      const tenantId = headers['x-tenant-id'];
      await this.tenantService.validateTenantAccess(tenantId, schema.Contact, (params.id));
      const row = await this.contacts.getContact(params.id);
      if (!row) return { status: 404, body: undefined };
      return { status: 200, body: row };
    });
  }

  @TsRestHandler(crmContract.contacts.updateContact)
  @Roles(PermissionScope.CONTACTS_WRITE)
  async updateContact(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(crmContract.contacts.updateContact, async ({ params, body }) => {
      const tenantId = headers['x-tenant-id'];
      await this.tenantService.validateTenantAccess(tenantId, schema.Contact, (params.id));
      await this.contacts.updateContact(params.id, body);
      return { status: 200, body: { message: 'contact updated' } };
    });
  }

  @TsRestHandler(crmContract.contacts.deleteContact)
  @Roles(PermissionScope.CONTACTS_DELETE)
  async deleteContact(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
    return tsRestHandler(crmContract.contacts.deleteContact, async ({ params }) => {
      const tenantId = headers['x-tenant-id'];
      await this.tenantService.validateTenantAccess(tenantId, schema.Contact, (params.id));
      await this.contacts.deleteContact(params.id);
      return { status: 204, body: undefined };
    });
  }

  // @TsRestHandler(crmContract.contacts.mergeContacts)
  // @Roles(PermissionScope.CONTACTS_WRITE)
  // async mergeContacts(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
  //   return tsRestHandler(crmContract.contacts.mergeContacts, async ({ params, body }) => {
  //     const tenantId = headers['x-tenant-id'];
  //     const targetId = (params.id);
  //     const sourceId = body.sourceContactId;
  //     await this.tenantService.validateTenantAccess(tenantId, schema.Contact, targetId);
  //     await this.tenantService.validateTenantAccess(tenantId, schema.Contact, sourceId);
  //     await this.contacts.mergeContacts(tenantId, { targetId, sourceId });
  //     return { status: 200, body: { message: 'contacts merged', mergedFrom: sourceId, mergedInto: targetId } };
  //   });
  // }

  // @TsRestHandler(crmContract.contacts.attachUser)
  // @Roles(PermissionScope.CONTACTS_WRITE)
  // async attachUser(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
  //   return tsRestHandler(crmContract.contacts.attachUser, async ({ params, body }) => {
  //     const tenantId = headers['x-tenant-id'];
  //     const contactId = (params.id);
  //     await this.tenantService.validateTenantAccess(tenantId, schema.Contact, contactId);
  //     await this.contacts.attachUser(contactId, body.userId);
  //     return { status: 200, body: { message: 'user attached' } };
  //   });
  // }

  // @TsRestHandler(crmContract.contacts.detachUser)
  // @Roles(PermissionScope.CONTACTS_WRITE)
  // async detachUser(@Headers() headers: any): Promise<ReturnType<typeof tsRestHandler>> {
  //   return tsRestHandler(crmContract.contacts.detachUser, async ({ params }) => {
  //     const tenantId = headers['x-tenant-id'];
  //     const contactId = (params.id);
  //     await this.tenantService.validateTenantAccess(tenantId, schema.Contact, contactId);
  //     await this.contacts.detachUser(contactId);
  //     return { status: 200, body: { message: 'user detached' } };
  //   });
  // }
}
