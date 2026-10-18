import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, numeric, boolean } from 'drizzle-orm/pg-core';

// Users table (maps Firebase Auth UID)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  fullName: text('full_name'),
  companyName: text('company_name'),
  role: text('role').default('Admin'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Accounting Parties (Customers & Vendors)
export const parties = pgTable('parties', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  name: text('name').notNull(),
  type: text('type').notNull(), // 'Customer' | 'Vendor'
  gstin: text('gstin'),
  pan: text('pan'),
  phone: text('phone'),
  email: text('email'),
  state: text('state'),
  stateCode: text('state_code'),
  address: text('address'),
  balance: numeric('balance', { precision: 14, scale: 2 }).default('0'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Invoices (Sales & Purchases)
export const invoices = pgTable('invoices', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  invoiceNumber: text('invoice_number').notNull(),
  partyName: text('party_name').notNull(),
  partyGstin: text('party_gstin'),
  invoiceDate: text('invoice_date').notNull(),
  totalAmount: numeric('total_amount', { precision: 14, scale: 2 }).notNull(),
  taxAmount: numeric('tax_amount', { precision: 14, scale: 2 }).default('0'),
  status: text('status').default('Paid'),
  invoiceType: text('invoice_type').notNull(), // 'sales' | 'purchase'
  createdAt: timestamp('created_at').defaultNow(),
});

// Expenses
export const expenses = pgTable('expenses', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  title: text('title').notNull(),
  category: text('category').notNull(),
  amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
  date: text('date').notNull(),
  gstRate: numeric('gst_rate', { precision: 5, scale: 2 }).default('0'),
  itcEligible: boolean('itc_eligible').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// Google Tasks sync cache / notes
export const workspaceTasks = pgTable('workspace_tasks', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  taskId: text('task_id').notNull(),
  title: text('title').notNull(),
  status: text('status').default('needsAction'),
  dueDate: text('due_date'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Google Meet records / links created for vendor/client meetings
export const meetingRecords = pgTable('meeting_records', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  meetingUri: text('meeting_uri').notNull(),
  meetingCode: text('meeting_code'),
  spaceName: text('space_name'),
  topic: text('topic').notNull(),
  partyName: text('party_name'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  parties: many(parties),
  invoices: many(invoices),
  expenses: many(expenses),
  tasks: many(workspaceTasks),
  meetings: many(meetingRecords),
}));
