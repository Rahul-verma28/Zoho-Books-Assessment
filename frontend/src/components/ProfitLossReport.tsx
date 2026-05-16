import { useState, useEffect, useCallback } from "react";
import {
  fetchProfitLoss,
  fetchInvoices,
  fetchBills,
  type Invoice,
  type Bill,
} from "@/lib/zoho-api";
import { TransactionDrilldown } from "./TransactionDrilldown";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";


interface MonthData {
  label: string;
  fromDate: string;
  toDate: string;
  income: number;
  cogs: number;
  netProfit: number;
  invoices: Invoice[];
  bills: Bill[];
}

interface BudgetData {
  [key: string]: {
    incomeBudget: number;
    cogsBudget: number;
  };
}

type DrilldownType = "income" | "cogs";

interface DrilldownState {
  isOpen: boolean;
  type: DrilldownType;
  monthLabel: string;
  invoices: Invoice[];
  bills: Bill[];
}

const BUDGET_STORAGE_KEY = "zoho-pl-budgets";

function loadBudgets(): BudgetData {
  try {
    const stored = localStorage.getItem(BUDGET_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { }
  // Default budgets from the assessment
  return {
    "April 2026": { incomeBudget: 115000, cogsBudget: 80000 },
    "May 2026": { incomeBudget: 225000, cogsBudget: 50000 },
  };
}

function saveBudgets(budgets: BudgetData) {
  localStorage.setItem(BUDGET_STORAGE_KEY, JSON.stringify(budgets));
}


function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "decimal",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatCurrencySign(amount: number): string {
  const prefix = amount < 0 ? "-" : "";
  return `${prefix}${formatCurrency(Math.abs(amount))}`;
}


const MONTH_CONFIGS = [
  { label: "May 2026", fromDate: "2026-05-01", toDate: "2026-05-31" },
  { label: "April 2026", fromDate: "2026-04-01", toDate: "2026-04-30" },
];


export function ProfitLossReport() {
  const [months, setMonths] = useState<MonthData[]>([]);
  const [budgets, setBudgets] = useState<BudgetData>(loadBudgets);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drilldown, setDrilldown] = useState<DrilldownState>({
    isOpen: false,
    type: "income",
    monthLabel: "",
    invoices: [],
    bills: [],
  });
  const [expandedSections, setExpandedSections] = useState({
    income: true,
    cogs: true,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const monthDataPromises = MONTH_CONFIGS.map(async (config) => {
        const [plReport, invoicesData, billsData] = await Promise.all([
          fetchProfitLoss(config.fromDate, config.toDate),
          fetchInvoices(),
          fetchBills(),
        ]);

        // Filter invoices and bills by date range
        const monthInvoices = (invoicesData.invoices || []).filter((inv: Invoice) => {
          return inv.date >= config.fromDate && inv.date <= config.toDate;
        });
        const monthBills = (billsData.bills || []).filter((bill: Bill) => {
          return bill.date >= config.fromDate && bill.date <= config.toDate;
        });

        let income = 0;

        const plSections = plReport?.profit_and_loss;
        if (Array.isArray(plSections) && plSections.length > 0) {
          const grossProfit = plSections[0];
          const accountTxns = grossProfit?.account_transactions;
          if (Array.isArray(accountTxns)) {
            for (const section of accountTxns) {
              if (section.name === "Operating Income") {
                income = section.total || 0;
              }
            }
          }
        }

        if (income === 0 && monthInvoices.length > 0) {
          income = monthInvoices.reduce(
            (sum: number, inv: Invoice) => sum + (inv.total || 0),
            0
          );
        }


        const cogs = monthBills.reduce(
          (sum: number, bill: Bill) => sum + (bill.total || 0),
          0
        );

        return {
          ...config,
          income,
          cogs,
          netProfit: income - cogs,
          invoices: monthInvoices,
          bills: monthBills,
        };
      });

      const results = await Promise.all(monthDataPromises);
      setMonths(results);
    } catch (err: any) {
      setError(err.message || "Failed to fetch data from Zoho Books");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    saveBudgets(budgets);
  }, [budgets]);

  const handleBudgetChange = (
    monthLabel: string,
    field: "incomeBudget" | "cogsBudget",
    value: string
  ) => {
    const numVal = parseInt(value.replace(/[^0-9-]/g, ""), 10) || 0;
    setBudgets((prev) => ({
      ...prev,
      [monthLabel]: {
        ...prev[monthLabel],
        [field]: numVal,
      },
    }));
  };

  const openDrilldown = (type: DrilldownType, month: MonthData) => {
    setDrilldown({
      isOpen: true,
      type,
      monthLabel: month.label,
      invoices: type === "income" ? month.invoices : [],
      bills: type === "cogs" ? month.bills : [],
    });
  };

  const closeDrilldown = () => {
    setDrilldown((prev) => ({ ...prev, isOpen: false }));
  };

  const toggleSection = (section: "income" | "cogs") => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const may = months[0];
  const apr = months[1];

  if (error) {
    return (
      <div className="mx-auto w-full max-w-[1400px]">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="flex max-w-md flex-col items-center gap-4 rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-7 w-7 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-900">Connection Error</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
            <button
              onClick={fetchData}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6">

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Profit &amp; Loss Statement
            </h1>
            <p className="text-sm text-gray-500">Zoho Books • Live Data</p>
          </div>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh Data
        </button>
      </div>

      <div className="overflow-hidden rounded border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" id="pl-report-table">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-5 py-3.5 text-right font-semibold text-gray-900 min-w-[110px]">
                  {MONTH_CONFIGS[0].label}
                  <div className="text-[10px] font-normal text-gray-400 uppercase tracking-wider mt-0.5">Column A</div>
                </th>
                <th className="px-5 py-3.5 text-right font-semibold text-amber-700 min-w-[110px]">
                  Budget
                  <div className="text-[10px] font-normal text-amber-500 uppercase tracking-wider mt-0.5">Column B</div>
                </th>
                <th className="px-5 py-3.5 text-right font-semibold text-gray-900 min-w-[110px]">
                  Variance
                  <div className="text-[10px] font-normal text-gray-400 uppercase tracking-wider mt-0.5">C = A - B</div>
                </th>
                <th className="px-6 py-3.5 text-center font-bold text-gray-900 min-w-[200px] border-x border-gray-100">
                  Profit &amp; Loss
                </th>
                <th className="px-5 py-3.5 text-right font-semibold text-gray-900 min-w-[110px]">
                  {MONTH_CONFIGS[1].label}
                  <div className="text-[10px] font-normal text-gray-400 uppercase tracking-wider mt-0.5">Column D</div>
                </th>
                <th className="px-5 py-3.5 text-right font-semibold text-amber-700 min-w-[110px]">
                  Budget
                  <div className="text-[10px] font-normal text-amber-500 uppercase tracking-wider mt-0.5">Column E</div>
                </th>
                <th className="px-5 py-3.5 text-right font-semibold text-gray-900 min-w-[110px]">
                  Variance
                  <div className="text-[10px] font-normal text-gray-400 uppercase tracking-wider mt-0.5">F = D - E</div>
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <LoadingSkeleton />
              ) : (
                <>
                  <SectionHeaderRow
                    title="Operating Income"
                    icon={<TrendingUp className="h-4 w-4 text-gray-600" />}
                    expanded={expandedSections.income}
                    onToggle={() => toggleSection("income")}
                  />

                  {expandedSections.income && may && apr && (
                    <tr className="border-t border-gray-200 bg-white">

                      <AmountCell
                        value={may.income}
                        clickable
                        onClick={() => openDrilldown("income", may)}
                      />
                      <BudgetCell
                        value={budgets[may.label]?.incomeBudget || 0}
                        onChange={(v) => handleBudgetChange(may.label, "incomeBudget", v)}
                      />
                      <VarianceCell
                        actual={may.income}
                        budget={budgets[may.label]?.incomeBudget || 0}
                      />

                      <td className="px-6 py-3 border-x border-gray-100 font-medium text-gray-700">
                        <span className="pl-8">Sales</span>
                      </td>

                      <AmountCell
                        value={apr.income}
                        clickable
                        onClick={() => openDrilldown("income", apr)}
                      />
                      <BudgetCell
                        value={budgets[apr.label]?.incomeBudget || 0}
                        onChange={(v) => handleBudgetChange(apr.label, "incomeBudget", v)}
                      />
                      <VarianceCell
                        actual={apr.income}
                        budget={budgets[apr.label]?.incomeBudget || 0}
                      />
                    </tr>
                  )}


                  {may && apr && (
                    <tr className="border-t-2 border-gray-200 bg-gray-50">
                      <TotalCell value={may.income} />
                      <TotalCell value={budgets[may.label]?.incomeBudget || 0} amber />
                      <VarianceCell actual={may.income} budget={budgets[may.label]?.incomeBudget || 0} bold />
                      <td className="px-6 py-3 border-x border-gray-100 font-bold text-gray-900">
                        Total for Operating Income
                      </td>
                      <TotalCell value={apr.income} />
                      <TotalCell value={budgets[apr.label]?.incomeBudget || 0} amber />
                      <VarianceCell actual={apr.income} budget={budgets[apr.label]?.incomeBudget || 0} bold />
                    </tr>
                  )}


                  <tr className="h-3"><td colSpan={7}></td></tr>


                  <SectionHeaderRow
                    title="Cost of Goods Sold"
                    icon={<TrendingDown className="h-4 w-4 text-gray-600" />}
                    expanded={expandedSections.cogs}
                    onToggle={() => toggleSection("cogs")}
                  />

                  {expandedSections.cogs && may && apr && (
                    <tr className="border-t border-gray-200 bg-white">

                      <AmountCell
                        value={may.cogs}
                        clickable
                        onClick={() => openDrilldown("cogs", may)}
                      />
                      <BudgetCell
                        value={budgets[may.label]?.cogsBudget || 0}
                        onChange={(v) => handleBudgetChange(may.label, "cogsBudget", v)}
                      />
                      <VarianceCell
                        actual={may.cogs}
                        budget={budgets[may.label]?.cogsBudget || 0}
                      />

                      <td className="px-6 py-3 border-x border-gray-100 font-medium text-gray-700">
                        <span className="pl-8">Cost of Goods Sold</span>
                      </td>


                      <AmountCell
                        value={apr.cogs}
                        clickable
                        onClick={() => openDrilldown("cogs", apr)}
                      />
                      <BudgetCell
                        value={budgets[apr.label]?.cogsBudget || 0}
                        onChange={(v) => handleBudgetChange(apr.label, "cogsBudget", v)}
                      />
                      <VarianceCell
                        actual={apr.cogs}
                        budget={budgets[apr.label]?.cogsBudget || 0}
                      />
                    </tr>
                  )}


                  {may && apr && (
                    <tr className="border-t-2 border-gray-200 bg-gray-50">
                      <TotalCell value={may.cogs} />
                      <TotalCell value={budgets[may.label]?.cogsBudget || 0} amber />
                      <VarianceCell actual={may.cogs} budget={budgets[may.label]?.cogsBudget || 0} bold />
                      <td className="px-6 py-3 border-x border-gray-100 font-bold text-gray-900">
                        Total for Cost of Goods Sold
                      </td>
                      <TotalCell value={apr.cogs} />
                      <TotalCell value={budgets[apr.label]?.cogsBudget || 0} amber />
                      <VarianceCell actual={apr.cogs} budget={budgets[apr.label]?.cogsBudget || 0} bold />
                    </tr>
                  )}


                  <tr className="h-3"><td colSpan={7}></td></tr>


                  {may && apr && (() => {
                    const mayIncomeBudget = budgets[may.label]?.incomeBudget || 0;
                    const mayCogsBudget = budgets[may.label]?.cogsBudget || 0;
                    const mayBudgetNet = mayIncomeBudget - mayCogsBudget;
                    const mayVariance = may.netProfit - mayBudgetNet;

                    const aprIncomeBudget = budgets[apr.label]?.incomeBudget || 0;
                    const aprCogsBudget = budgets[apr.label]?.cogsBudget || 0;
                    const aprBudgetNet = aprIncomeBudget - aprCogsBudget;
                    const aprVariance = apr.netProfit - aprBudgetNet;

                    return (
                      <tr className="border-t border-gray-300 bg-gray-100">
                        <TotalCell value={may.netProfit} />
                        <TotalCell value={mayBudgetNet} amber />
                        <td className={`px-5 py-4 text-right font-bold ${mayVariance >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                          {formatCurrencySign(mayVariance)}
                        </td>
                        <td className="px-6 py-4 border-x border-gray-100">
                          <span className="text-base font-bold text-gray-900">Net Profit / Loss</span>
                        </td>
                        <TotalCell value={apr.netProfit} />
                        <TotalCell value={aprBudgetNet} amber />
                        <td className={`px-5 py-4 text-right font-bold ${aprVariance >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                          {formatCurrencySign(aprVariance)}
                        </td>
                      </tr>
                    );
                  })()}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TransactionDrilldown
        isOpen={drilldown.isOpen}
        onClose={closeDrilldown}
        type={drilldown.type}
        monthLabel={drilldown.monthLabel}
        invoices={drilldown.invoices}
        bills={drilldown.bills}
      />
    </div>
  );
}


function AmountCell({
  value,
  clickable,
  onClick,
}: {
  value: number;
  clickable?: boolean;
  onClick?: () => void;
}) {
  return (
    <td className="px-5 py-3 text-right">
      {clickable ? (
        <button
          onClick={onClick}
          className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
        >
          {formatCurrency(value)}
        </button>
      ) : (
        <span className="font-medium text-gray-900">{formatCurrency(value)}</span>
      )}
    </td>
  );
}

function BudgetCell({
  value,
  onChange,
}: {
  value: number;
  onChange: (val: string) => void;
}) {
  return (
    <td className="px-5 py-3 text-right">
      <input
        type="text"
        value={formatCurrency(value)}
        onChange={(e) => onChange(e.target.value)}
        className="w-24 rounded border border-gray-300 bg-white px-2 py-1 text-right text-sm font-medium text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    </td>
  );
}

function VarianceCell({
  actual,
  budget,
  bold,
}: {
  actual: number;
  budget: number;
  bold?: boolean;
}) {
  const variance = actual - budget;
  return (
    <td
      className={`px-5 py-3 text-right ${bold ? "font-bold" : "font-semibold"} ${variance >= 0 ? "text-emerald-600" : "text-red-600"
        }`}
    >
      {formatCurrencySign(variance)}
    </td>
  );
}

function TotalCell({ value, amber }: { value: number; amber?: boolean }) {
  return (
    <td
      className={`px-5 py-3 text-right font-bold ${amber ? "text-amber-800" : "text-gray-900"}`}
    >
      {formatCurrency(value)}
    </td>
  );
}

function SectionHeaderRow({
  title,
  icon,
  expanded,
  onToggle,
}: {
  title: string;
  icon: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <tr
      className="cursor-pointer border-t border-gray-200 bg-gray-50 hover:bg-gray-100"
      onClick={onToggle}
    >
      <td colSpan={3}></td>
      <td className="px-6 py-3 border-x border-gray-100">
        <div className="flex items-center gap-2 font-semibold text-gray-800">
          {icon}
          {title}
          {expanded ? (
            <ChevronUp className="h-3.5 w-3.5 text-gray-400 ml-auto" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-gray-400 ml-auto" />
          )}
        </div>
      </td>
      <td colSpan={3}></td>
    </tr>
  );
}

function LoadingSkeleton() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <tr key={i} className="border-t border-gray-50">
          <td className="px-5 py-3"><Skeleton className="ml-auto h-5 w-20" /></td>
          <td className="px-5 py-3"><Skeleton className="ml-auto h-5 w-20" /></td>
          <td className="px-5 py-3"><Skeleton className="ml-auto h-5 w-20" /></td>
          <td className="px-6 py-3 border-x border-gray-100"><Skeleton className="h-5 w-36" /></td>
          <td className="px-5 py-3"><Skeleton className="ml-auto h-5 w-20" /></td>
          <td className="px-5 py-3"><Skeleton className="ml-auto h-5 w-20" /></td>
          <td className="px-5 py-3"><Skeleton className="ml-auto h-5 w-20" /></td>
        </tr>
      ))}
    </>
  );
}
