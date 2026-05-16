import { ProfitLossReport } from "@/components/ProfitLossReport"

export function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-16 w-20 items-center justify-center">
              <img src="https://static.zohocdn.com/devconsole/images/Zoho.6a322ea5abc600a709e2014b607b631c.svg" alt="Zoho Books" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 leading-tight">
                Zoho Books Assessment
              </h1>
              <p className="text-xs text-gray-500">
                Financial Dashboard
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
            <span className="inline-block h-2 w-2 rounded-full bg-green-500"></span>
            Connected
          </div>
        </div>
      </header>

      <main className="px-6 py-8">
        <ProfitLossReport />
      </main>

    </div>
  )
}

export default App
