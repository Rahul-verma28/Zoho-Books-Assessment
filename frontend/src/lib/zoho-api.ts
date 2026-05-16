

export interface Invoice {
  invoice_id: string;
  invoice_number: string;
  customer_name: string;
  date: string;
  due_date: string;
  total: number;
  status: string;
  has_attachment: boolean;
  line_items?: LineItem[];
}

export interface Bill {
  bill_id: string;
  bill_number: string;
  vendor_name: string;
  date: string;
  due_date: string;
  total: number;
  status: string;
  has_attachment: boolean;
  line_items?: LineItem[];
}

export interface LineItem {
  item_id: string;
  name: string;
  description: string;
  quantity: number;
  rate: number;
  item_total: number;
}

export interface ProfitLossReport {
  profitandloss: {
    income: ReportSection;
    cost_of_goods_sold: ReportSection;
    net_profit: number;
  };
}

export interface ReportSection {
  transactions: ReportTransaction[];
  total: number;
}

export interface ReportTransaction {
  account_name: string;
  total: number;
}


async function apiFetch<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `API Error: ${response.status}`);
  }
  return response.json();
}

export async function fetchProfitLoss(fromDate: string, toDate: string) {
  return apiFetch<any>(
    `/api/zoho/reports/profit-loss?from_date=${fromDate}&to_date=${toDate}`
  );
}

export async function fetchInvoices(dateStart?: string, dateEnd?: string) {
  const params = new URLSearchParams();
  if (dateStart) params.set("date_start", dateStart);
  if (dateEnd) params.set("date_end", dateEnd);
  return apiFetch<{ invoices: Invoice[] }>(`/api/zoho/invoices?${params.toString()}`);
}

export async function fetchInvoiceDetail(invoiceId: string) {
  return apiFetch<{ invoice: Invoice }>(`/api/zoho/invoices/${invoiceId}`);
}


export async function fetchBills(dateStart?: string, dateEnd?: string) {
  const params = new URLSearchParams();
  if (dateStart) params.set("date_start", dateStart);
  if (dateEnd) params.set("date_end", dateEnd);
  return apiFetch<{ bills: Bill[] }>(`/api/zoho/bills?${params.toString()}`);
}


export async function fetchBillDetail(billId: string) {
  return apiFetch<{ bill: Bill }>(`/api/zoho/bills/${billId}`);
}


export function getInvoiceAttachmentUrl(invoiceId: string) {
  return `/api/zoho/invoices/${invoiceId}/attachment`;
}

export function getBillAttachmentUrl(billId: string) {
  return `/api/zoho/bills/${billId}/attachment`;
}
