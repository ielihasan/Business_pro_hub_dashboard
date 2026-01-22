import packageJson from "../../package.json";

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "BusinessHub Pro",
  version: packageJson.version,
  copyright: `© ${currentYear}, BusinessHub Solutions. All rights reserved.`,
  meta: {
    title: "BusinessHub Pro – Smart Management & Operations Dashboard",
    description: `
      BusinessHub Pro is a modern, AI-powered platform designed to help businesses of all sizes manage their daily
      operations with ease. The system centralizes business activities by tracking customers, orders, staff operations,
      performance metrics, and real-time insights — enabling owners to run their business smarter and more efficiently.

      With intelligent automation, activity monitoring, and a clean dashboard interface, BusinessHub Pro streamlines
      workflow management and provides data-driven decision support for retail shops, cafés, service providers, and
      general businesses.

      Developed by the BusinessHub Engineering Team.
    `,
  },
  organization: {
    department: "Business Operations & Intelligence",
    faculty: "Management & Technology Division",
    university: "BusinessHub Solutions",
    supervisor: "Management Team",
    contactEmail: "support@businesshub.com",
  },
};
