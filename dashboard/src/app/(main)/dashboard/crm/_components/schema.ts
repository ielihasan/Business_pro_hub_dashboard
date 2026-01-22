/*import z from "zod";

export const recentLeadSchema = z.object({
  id: z.string(),
  name: z.string(),
  company: z.string(),
  status: z.string(),
  source: z.string(),
  lastActivity: z.string(),
});*/
import { z } from "zod";

export const recentLeadSchema = z.object({
  id: z.string(),
  studentName: z.string(),
  topicFile: z.string(),
  status: z.string(),
  token: z.string(),
  source: z.string(),
  lastActivity: z.string(),
});



