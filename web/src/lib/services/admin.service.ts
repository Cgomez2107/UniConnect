/**
 * @deprecated Use deps.apiClients.admin directly or import from @uniconnect/shared-api.
 * This file is kept as a thin adapter for backward compatibility.
 */
import { deps } from "@/store/deps";

const adminService = {
  async getUsers() {
    return deps.apiClients.admin.getUsers();
  },

  async getRequests() {
    return deps.apiClients.admin.getRequests();
  },

  async getResources() {
    return deps.apiClients.admin.getResources();
  },

  async getEvents() {
    return deps.apiClients.admin.getEvents();
  },

  async getMetrics() {
    return deps.apiClients.admin.getMetrics();
  },
};

export default adminService;
