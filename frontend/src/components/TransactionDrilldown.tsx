import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getInvoiceAttachmentUrl,
  getBillAttachmentUrl,
  type Invoice,
  type Bill,
} from "@/lib/zoho-api";
import { FileText, ExternalLink, Paperclip, Calendar, Hash, User } from "lucide-react";

interface TransactionDrilldownProps {
  isOpen: boolean;
  onClose: () => void;
  type: "income" | "cogs";
  monthLabel: string;
  invoices: Invoice[];
  bills: Bill[];
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "decimal",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function TransactionDrilldown({
  isOpen,
  onClose,
  type,
  monthLabel,
  invoices,
  bills,
}: TransactionDrilldownProps) {
  const isIncome = type === "income";
  const transactions = isIncome ? invoices : bills;
  const total = transactions.reduce(
    (sum, t) => sum + (t.total || 0),
    0
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${isIncome
                ? "bg-gradient-to-br from-emerald-500 to-teal-600"
                : "bg-gradient-to-br from-red-500 to-rose-600"
                } shadow-lg`}
            >
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl">
                {isIncome ? "Sales / Operating Income" : "Cost of Goods Sold"}
              </DialogTitle>
              <DialogDescription className="text-sm">
                Transactions for {monthLabel}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto mt-4">
          {transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <FileText className="h-12 w-12 mb-3 opacity-40" />
              <p className="text-lg font-medium">No transactions found</p>
              <p className="text-sm">No {isIncome ? "invoices" : "bills"} for this period</p>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-b-2 border-indigo-100/50 bg-[#F9F9FB] uppercase text-[10px] tracking-wider text-gray-500 font-semibold hover:bg-[#F9F9FB]">
                    <TableHead className="whitespace-nowrap font-semibold">Date</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold">Account</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold">Transaction Details</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold">Transaction Type</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold">Transaction#</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold">Reference#</TableHead>
                    <TableHead className="whitespace-nowrap text-right font-semibold">Debit</TableHead>
                    <TableHead className="whitespace-nowrap text-right font-semibold">Credit</TableHead>
                    <TableHead className="whitespace-nowrap text-right font-semibold">Amount</TableHead>
                    <TableHead className="whitespace-nowrap text-center font-semibold">File</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isIncome
                    ? invoices.map((inv) => (
                      <TableRow
                        key={inv.invoice_id}
                        className="transition-colors hover:bg-gray-50/50 border-b border-gray-100 text-xs"
                      >
                        <TableCell className="font-medium text-gray-900 whitespace-nowrap">
                          {formatDate(inv.date)}
                        </TableCell>
                        <TableCell className="text-gray-700">Sales</TableCell>
                        <TableCell className="text-gray-700 whitespace-nowrap">{inv.customer_name}</TableCell>
                        <TableCell className="text-gray-600">Invoice</TableCell>
                        <TableCell className="font-medium text-blue-600 cursor-pointer hover:underline">
                          {inv.invoice_number}
                        </TableCell>
                        <TableCell className="text-gray-400">—</TableCell>
                        <TableCell className="text-right text-gray-400">—</TableCell>
                        <TableCell className="text-right text-blue-600 font-medium">
                          {formatCurrency(inv.total)}
                        </TableCell>
                        <TableCell className="text-right text-blue-600 font-medium">
                          {formatCurrency(inv.total)} Cr
                        </TableCell>
                        <TableCell className="text-center">
                          {inv.has_attachment ? (
                            <a
                              href={getInvoiceAttachmentUrl(inv.invoice_id)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-1 text-[10px] font-medium text-blue-700 transition-colors hover:bg-blue-100 whitespace-nowrap"
                            >
                              <FileText className="h-3 w-3" />
                              PDF
                            </a>
                          ) : (
                            <span className="text-[10px] text-gray-400">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                    : bills.map((bill) => (
                      <TableRow
                        key={bill.bill_id}
                        className="transition-colors hover:bg-gray-50/50 border-b border-gray-100 text-xs"
                      >
                        <TableCell className="font-medium text-gray-900 whitespace-nowrap">
                          {formatDate(bill.date)}
                        </TableCell>
                        <TableCell className="text-gray-700">Cost of Goods Sold</TableCell>
                        <TableCell className="text-gray-700 whitespace-nowrap">{bill.vendor_name}</TableCell>
                        <TableCell className="text-gray-600">Bill</TableCell>
                        <TableCell className="font-medium text-blue-600 cursor-pointer hover:underline">
                          {bill.bill_number}
                        </TableCell>
                        <TableCell className="text-gray-400">—</TableCell>
                        <TableCell className="text-right text-blue-600 font-medium">
                          {formatCurrency(bill.total)}
                        </TableCell>
                        <TableCell className="text-right text-gray-400">—</TableCell>
                        <TableCell className="text-right text-blue-600 font-medium">
                          {formatCurrency(bill.total)} Dr
                        </TableCell>
                        <TableCell className="text-center">
                          {bill.has_attachment ? (
                            <a
                              href={getBillAttachmentUrl(bill.bill_id)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-1 text-[10px] font-medium text-blue-700 transition-colors hover:bg-blue-100 whitespace-nowrap"
                            >
                              <FileText className="h-3 w-3" />
                              PDF
                            </a>
                          ) : (
                            <span className="text-[10px] text-gray-400">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}

                  <TableRow className="bg-[#F9F9FB] hover:bg-[#F9F9FB] text-xs font-semibold">
                    <TableCell colSpan={6} className="text-gray-700 pl-4 py-4">
                      Total Debits and Credits
                    </TableCell>
                    <TableCell className="text-right text-gray-900">
                      {isIncome ? "₹0.00" : `₹${formatCurrency(total)}`}
                    </TableCell>
                    <TableCell className="text-right text-gray-900">
                      {isIncome ? `₹${formatCurrency(total)}` : "₹0.00"}
                    </TableCell>
                    <TableCell className="text-right text-gray-900">
                      {isIncome ? "" : ""}
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </div>


      </DialogContent>
    </Dialog>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status?.toLowerCase() || "";

  let variant: "default" | "secondary" | "outline" | "destructive" = "secondary";
  let label = status;

  if (normalized === "sent" || normalized === "open") {
    variant = "default";
    label = "Sent";
  } else if (normalized === "paid" || normalized === "closed") {
    variant = "outline";
    label = "Paid";
  } else if (normalized === "overdue") {
    variant = "destructive";
    label = "Overdue";
  } else if (normalized === "draft") {
    variant = "secondary";
    label = "Draft";
  }

  return (
    <Badge variant={variant} className="text-xs capitalize">
      {label}
    </Badge>
  );
}
