import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─── AUTH HELPERS ────────────────────────────────────────────────────────────

export async function signUp({ email, password, firstName, weddingDate, planningStyle, budgetTotal }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        wedding_date: weddingDate,
        planning_style: planningStyle,
        budget_total: budgetTotal || 20000,
        is_premium: false,
      }
    }
  });
  if (error) throw error;
  return data;
}

export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function resetPassword(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.REACT_APP_URL}/reset-password`,
  });
  if (error) throw error;
}

export async function updatePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

// ─── PROFILE HELPERS ─────────────────────────────────────────────────────────

export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

// ─── TASK HELPERS ────────────────────────────────────────────────────────────

export async function getTasks(userId) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .order('phase_number', { ascending: true })
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data;
}

export async function toggleTask(taskId, isCompleted) {
  const { data, error } = await supabase
    .from('tasks')
    .update({ is_completed: isCompleted, completed_at: isCompleted ? new Date().toISOString() : null })
    .eq('id', taskId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createDefaultTasks(userId) {
  const tasks = [
    // Phase 1 — The Big Decisions
    { user_id: userId, phase_number: 1, phase_title: 'The Big Decisions', title: 'Set your total wedding budget', sort_order: 1 },
    { user_id: userId, phase_number: 1, phase_title: 'The Big Decisions', title: 'Build your guest list', sort_order: 2 },
    { user_id: userId, phase_number: 1, phase_title: 'The Big Decisions', title: 'Research and shortlist venues — visit at least 3', sort_order: 3 },
    { user_id: userId, phase_number: 1, phase_title: 'The Big Decisions', title: 'Book your venue and secure your date', sort_order: 4 },
    { user_id: userId, phase_number: 1, phase_title: 'The Big Decisions', title: 'Begin research on photographers', sort_order: 5 },
    { user_id: userId, phase_number: 1, phase_title: 'The Big Decisions', title: 'Start wedding dress shopping', sort_order: 6 },
    { user_id: userId, phase_number: 1, phase_title: 'The Big Decisions', title: 'Purchase wedding insurance', sort_order: 7 },
    // Phase 2 — Key Supplier Bookings
    { user_id: userId, phase_number: 2, phase_title: 'Key Supplier Bookings', title: 'Book your photographer', sort_order: 1 },
    { user_id: userId, phase_number: 2, phase_title: 'Key Supplier Bookings', title: 'Book your videographer (if having one)', sort_order: 2 },
    { user_id: userId, phase_number: 2, phase_title: 'Key Supplier Bookings', title: 'Book your caterer (if not venue-supplied)', sort_order: 3 },
    { user_id: userId, phase_number: 2, phase_title: 'Key Supplier Bookings', title: 'Book your entertainment — band or DJ', sort_order: 4 },
    { user_id: userId, phase_number: 2, phase_title: 'Key Supplier Bookings', title: 'Confirm your wedding dress order', sort_order: 5 },
    { user_id: userId, phase_number: 2, phase_title: 'Key Supplier Bookings', title: 'Book hair and makeup artist', sort_order: 6 },
    { user_id: userId, phase_number: 2, phase_title: 'Key Supplier Bookings', title: 'Book your registrar or celebrant', sort_order: 7 },
    { user_id: userId, phase_number: 2, phase_title: 'Key Supplier Bookings', title: 'Begin honeymoon research and book flights', sort_order: 8 },
    // Phase 3 — The Details
    { user_id: userId, phase_number: 3, phase_title: 'The Details', title: 'Book your florist and confirm floral scheme', sort_order: 1 },
    { user_id: userId, phase_number: 3, phase_title: 'The Details', title: 'Design and order your invitations', sort_order: 2 },
    { user_id: userId, phase_number: 3, phase_title: 'The Details', title: 'Send save the dates', sort_order: 3 },
    { user_id: userId, phase_number: 3, phase_title: 'The Details', title: 'Book transport for the wedding day', sort_order: 4 },
    { user_id: userId, phase_number: 3, phase_title: 'The Details', title: 'Schedule your first dress fitting', sort_order: 5 },
    { user_id: userId, phase_number: 3, phase_title: 'The Details', title: 'Choose and order your wedding rings', sort_order: 6 },
    { user_id: userId, phase_number: 3, phase_title: 'The Details', title: 'Plan your ceremony — readings, vows, order of service', sort_order: 7 },
    { user_id: userId, phase_number: 3, phase_title: 'The Details', title: 'Order your wedding cake', sort_order: 8 },
    // Phase 4 — Logistics & Admin
    { user_id: userId, phase_number: 4, phase_title: 'Logistics & Admin', title: 'Chase RSVPs and finalise your guest list', sort_order: 1 },
    { user_id: userId, phase_number: 4, phase_title: 'Logistics & Admin', title: 'Begin your seating plan', sort_order: 2 },
    { user_id: userId, phase_number: 4, phase_title: 'Logistics & Admin', title: 'Collect all dietary requirements from guests', sort_order: 3 },
    { user_id: userId, phase_number: 4, phase_title: 'Logistics & Admin', title: 'Plan your full wedding day timeline', sort_order: 4 },
    { user_id: userId, phase_number: 4, phase_title: 'Logistics & Admin', title: 'Confirm all supplier bookings in writing', sort_order: 5 },
    { user_id: userId, phase_number: 4, phase_title: 'Logistics & Admin', title: 'Schedule your second dress fitting', sort_order: 6 },
    { user_id: userId, phase_number: 4, phase_title: 'Logistics & Admin', title: 'Plan speeches — confirm speakers and running order', sort_order: 7 },
    // Phase 5 — Final Confirmations
    { user_id: userId, phase_number: 5, phase_title: 'Final Confirmations', title: 'Send finalised guest numbers to caterer', sort_order: 1 },
    { user_id: userId, phase_number: 5, phase_title: 'Final Confirmations', title: 'Confirm all supplier arrival times and access details', sort_order: 2 },
    { user_id: userId, phase_number: 5, phase_title: 'Final Confirmations', title: 'Create supplier call sheets', sort_order: 3 },
    { user_id: userId, phase_number: 5, phase_title: 'Final Confirmations', title: 'Finalise and print your seating plan', sort_order: 4 },
    { user_id: userId, phase_number: 5, phase_title: 'Final Confirmations', title: 'Chase all outstanding supplier payments', sort_order: 5 },
    { user_id: userId, phase_number: 5, phase_title: 'Final Confirmations', title: 'Final dress fitting', sort_order: 6 },
    { user_id: userId, phase_number: 5, phase_title: 'Final Confirmations', title: 'Prepare your wedding day emergency kit', sort_order: 7 },
  ];

  const { error } = await supabase.from('tasks').insert(tasks);
  if (error) throw error;
}

export async function createDefaultBudgetCategories(userId, budgetTotal) {
  const total = budgetTotal || 20000;
  const categories = [
    { user_id: userId, name: 'Venue & Catering',    icon: '🏛️', percentage: 40,   sort_order: 1 },
    { user_id: userId, name: 'Photography',          icon: '📸', percentage: 12.5, sort_order: 2 },
    { user_id: userId, name: 'Flowers & Styling',    icon: '💐', percentage: 9,    sort_order: 3 },
    { user_id: userId, name: 'Entertainment',        icon: '🎵', percentage: 7,    sort_order: 4 },
    { user_id: userId, name: 'Attire & Beauty',      icon: '👗', percentage: 10,   sort_order: 5 },
    { user_id: userId, name: 'Stationery',           icon: '✉️', percentage: 3,    sort_order: 6 },
    { user_id: userId, name: 'Transport',            icon: '🚗', percentage: 2.5,  sort_order: 7 },
    { user_id: userId, name: 'Honeymoon Fund',       icon: '✈️', percentage: 7,    sort_order: 8 },
    { user_id: userId, name: 'Contingency',          icon: '🔒', percentage: 10,   sort_order: 9 },
  ].map(c => ({ ...c, budget_amount: Math.round(total * c.percentage / 100), spent_amount: 0 }));

  const { error } = await supabase.from('budget_categories').insert(categories);
  if (error) throw error;
}

// ─── BUDGET HELPERS ──────────────────────────────────────────────────────────

export async function getBudgetCategories(userId) {
  const { data, error } = await supabase
    .from('budget_categories')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data;
}

export async function updateBudgetCategory(categoryId, updates) {
  const { data, error } = await supabase
    .from('budget_categories')
    .update(updates)
    .eq('id', categoryId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function addBudgetCategory(userId, category) {
  const { data, error } = await supabase
    .from('budget_categories')
    .insert({ ...category, user_id: userId, spent_amount: 0 })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteBudgetCategory(categoryId) {
  const { error } = await supabase
    .from('budget_categories')
    .delete()
    .eq('id', categoryId);
  if (error) throw error;
}

// ─── SUPPLIER HELPERS ────────────────────────────────────────────────────────

export async function getSuppliers(userId) {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function addSupplier(userId, supplier) {
  const { data, error } = await supabase
    .from('suppliers')
    .insert({ ...supplier, user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateSupplier(supplierId, updates) {
  const { data, error } = await supabase
    .from('suppliers')
    .update(updates)
    .eq('id', supplierId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSupplier(supplierId) {
  const { error } = await supabase
    .from('suppliers')
    .delete()
    .eq('id', supplierId);
  if (error) throw error;
}
