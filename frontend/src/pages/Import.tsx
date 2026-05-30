import { useCallback, useRef, useState } from 'react'
import { Navbar } from '../components/Navbar'
import { previewStatement, importStatement } from '../lib/api'
import type { ImportPreview, ImportSummary } from '../types'

type Stage =
  | { type: 'idle' }
  | { type: 'loading'; label: string }
  | { type: 'preview'; file: File; data: ImportPreview }
  | { type: 'success'; data: ImportSummary }
  | { type: 'error'; message: string }

export function Import() {
  const [stage, setStage] = useState<Stage>({ type: 'idle' })
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setStage({ type: 'error', message: 'Only PDF files are supported.' })
      return
    }
    setStage({ type: 'loading', label: 'Reading statement…' })
    try {
      const preview = await previewStatement(file)
      setStage({ type: 'preview', file, data: preview })
    } catch (e) {
      setStage({ type: 'error', message: (e as Error).message })
    }
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  async function confirmImport(file: File) {
    setStage({ type: 'loading', label: 'Importing transactions…' })
    try {
      const summary = await importStatement(file)
      setStage({ type: 'success', data: summary })
    } catch (e) {
      setStage({ type: 'error', message: (e as Error).message })
    }
  }

  function reset() { setStage({ type: 'idle' }) }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-2xl mx-auto px-6 py-10 space-y-6">
        <div>
          <h2 className="text-2xl font-semibold">Import Statement</h2>
          <p className="text-sm text-gray-400 mt-1">Upload a bank statement PDF — we'll parse it and show you a preview before saving anything.</p>
        </div>

        {(stage.type === 'idle' || stage.type === 'error') && (
          <>
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-16 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors select-none ${
                dragging ? 'border-blue-500 bg-blue-950/20' : 'border-gray-700 hover:border-gray-500'
              }`}
            >
              <UploadIcon />
              <p className="text-gray-300 font-medium">Drop your PDF here</p>
              <p className="text-sm text-gray-500">or click to browse</p>
              <p className="text-xs text-gray-600 mt-2">BAC statements supported · max 10 MB</p>
            </div>
            <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
            {stage.type === 'error' && (
              <div className="bg-red-900/20 border border-red-800 rounded-xl p-4 text-red-400 text-sm">{stage.message}</div>
            )}
          </>
        )}

        {stage.type === 'loading' && (
          <div className="flex flex-col items-center gap-4 py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-500" />
            <p className="text-gray-400 text-sm">{stage.label}</p>
          </div>
        )}

        {stage.type === 'preview' && (
          <PreviewCard
            preview={stage.data}
            onConfirm={() => confirmImport(stage.file)}
            onCancel={reset}
          />
        )}

        {stage.type === 'success' && (
          <SuccessCard summary={stage.data} onImportAnother={reset} />
        )}
      </main>
    </div>
  )
}

function PreviewCard({ preview, onConfirm, onCancel }: {
  preview: ImportPreview
  onConfirm: () => void
  onCancel: () => void
}) {
  const acctSuffix = preview.account_number.length >= 4
    ? '****' + preview.account_number.slice(-4)
    : preview.account_number

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 space-y-5">
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Statement preview</p>
        <h3 className="text-lg font-semibold">{preview.bank} · {acctSuffix}</h3>
        <p className="text-sm text-gray-400 mt-0.5">{preview.currency} account</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Transactions" value={String(preview.transaction_count)} />
        <Stat label="From" value={fmtDate(preview.period_start)} />
        <Stat label="To" value={fmtDate(preview.period_end)} />
      </div>

      {preview.existing_count > 0 && (
        <div className="bg-amber-900/20 border border-amber-700 rounded-xl p-4 flex gap-3">
          <span className="text-amber-400 text-base flex-shrink-0 mt-0.5">⚠</span>
          <p className="text-sm text-amber-300">
            This account already has <strong>{preview.existing_count} transaction{preview.existing_count !== 1 ? 's' : ''}</strong> recorded
            between {fmtDate(preview.period_start)} and {fmtDate(preview.period_end)}.
            Confirm only if this is a continuation or correction of a previous import.
          </p>
        </div>
      )}

      {preview.sample.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Sample ({preview.sample.length} of {preview.transaction_count})</p>
          <div className="bg-gray-800 rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <tbody>
                {preview.sample.map((tx, i) => (
                  <tr key={i} className="border-b border-gray-700/50 last:border-0">
                    <td className="px-3 py-2 text-gray-400 whitespace-nowrap">{fmtDate(tx.date)}</td>
                    <td className="px-3 py-2 text-gray-200 truncate max-w-[160px]">{tx.description}</td>
                    <td className={`px-3 py-2 text-right font-mono whitespace-nowrap ${Number(tx.amount) < 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {Number(tx.amount).toLocaleString('es-CR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-1">
        <button onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
        <button onClick={onConfirm} className="btn-primary flex-1">
          Confirm Import · {preview.transaction_count} transactions
        </button>
      </div>
    </div>
  )
}

function SuccessCard({ summary, onImportAnother }: { summary: ImportSummary; onImportAnother: () => void }) {
  const acctSuffix = summary.account_number.length >= 4
    ? '****' + summary.account_number.slice(-4)
    : summary.account_number

  return (
    <div className="bg-green-900/20 border border-green-800 rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-2xl">✓</span>
        <div>
          <p className="font-semibold text-green-300">Import complete</p>
          <p className="text-sm text-green-400/80 mt-0.5">
            {summary.imported_count} transactions imported into{' '}
            <span className="font-medium">{summary.account_name || `${summary.bank} ${acctSuffix}`}</span>
            {' '}· {summary.currency}
          </p>
        </div>
      </div>
      <button onClick={onImportAnother} className="btn-secondary text-sm">Import another statement</button>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-800 rounded-lg px-4 py-3">
      <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  )
}

function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('es-CR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function UploadIcon() {
  return (
    <svg className="w-10 h-10 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
  )
}
