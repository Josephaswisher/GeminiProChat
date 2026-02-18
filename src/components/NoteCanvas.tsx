import { For, Show, createSignal, onCleanup, onMount } from 'solid-js'
import { templates, parseAIResponseToSections } from '@/utils/templates'
import type { NoteTemplate } from '@/utils/templates'

export default function NoteCanvas() {
  const [selectedTemplate, setSelectedTemplate] = createSignal<NoteTemplate>(templates[0])
  const [sections, setSections] = createSignal<Record<string, string>>({})
  const [hasContent, setHasContent] = createSignal(false)
  const [saveStatus, setSaveStatus] = createSignal('')

  const initSections = (template: NoteTemplate) => {
    const saved = localStorage.getItem(`canvas-${template.id}`)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setSections(parsed)
        setHasContent(Object.values(parsed).some((v: string) => v.length > 0))
        return
      } catch { /* ignore */ }
    }
    const empty: Record<string, string> = {}
    for (const s of template.sections) empty[s.id] = ''
    setSections(empty)
    setHasContent(false)
  }

  onMount(() => {
    const savedTemplateId = localStorage.getItem('canvas-template') || 'soap'
    const found = templates.find(t => t.id === savedTemplateId) || templates[0]
    setSelectedTemplate(found)
    initSections(found)

    // Set system prompt for the selected template
    localStorage.setItem('systemRole', found.systemPrompt)
    window.dispatchEvent(new CustomEvent('template-changed', { detail: { template: found } }))

    // Listen for AI content sent to canvas
    const handleSendToCanvas = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail?.content) {
        const parsed = parseAIResponseToSections(detail.content, selectedTemplate())
        setSections(parsed)
        setHasContent(true)
        saveToStorage(parsed)
      }
    }
    window.addEventListener('send-to-canvas', handleSendToCanvas)
    onCleanup(() => window.removeEventListener('send-to-canvas', handleSendToCanvas))
  })

  const saveToStorage = (data: Record<string, string>) => {
    localStorage.setItem(`canvas-${selectedTemplate().id}`, JSON.stringify(data))
    setSaveStatus('Saved')
    setTimeout(() => setSaveStatus(''), 2000)
  }

  let saveTimer: ReturnType<typeof setTimeout>

  const handleSectionEdit = (sectionId: string, value: string) => {
    const updated = { ...sections(), [sectionId]: value }
    setSections(updated)
    setHasContent(Object.values(updated).some(v => v.length > 0))
    clearTimeout(saveTimer)
    saveTimer = setTimeout(() => saveToStorage(updated), 1000)
  }

  const handleTemplateChange = (e: Event) => {
    const id = (e.target as HTMLSelectElement).value
    const template = templates.find(t => t.id === id)!
    setSelectedTemplate(template)
    localStorage.setItem('canvas-template', id)
    initSections(template)

    // Update system prompt
    localStorage.setItem('systemRole', template.systemPrompt)
    window.dispatchEvent(new CustomEvent('template-changed', { detail: { template } }))
  }

  const handleCopyAll = () => {
    const template = selectedTemplate()
    const text = template.sections
      .map(s => `## ${s.label}\n${sections()[s.id] || ''}`)
      .join('\n\n')
    navigator.clipboard.writeText(text)
    setSaveStatus('Copied!')
    setTimeout(() => setSaveStatus(''), 2000)
  }

  const handleClear = () => {
    const empty: Record<string, string> = {}
    for (const s of selectedTemplate().sections) empty[s.id] = ''
    setSections(empty)
    setHasContent(false)
    localStorage.removeItem(`canvas-${selectedTemplate().id}`)
  }

  return (
    <>
      {/* Header with template selector */}
      <div class="canvas-header">
        <div class="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-40">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <select
            value={selectedTemplate().id}
            onChange={handleTemplateChange}
            class="canvas-template-select"
          >
            <For each={templates}>
              {t => <option value={t.id}>{t.name}</option>}
            </For>
          </select>
        </div>
        <div class="canvas-actions">
          <Show when={saveStatus()}>
            <span class="canvas-save-status">{saveStatus()}</span>
          </Show>
          <Show when={hasContent()}>
            <button onClick={handleCopyAll} class="canvas-action-btn" title="Copy as text">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              Copy
            </button>
            <button onClick={handleClear} class="canvas-action-btn" title="Clear all">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              Clear
            </button>
          </Show>
        </div>
      </div>

      {/* Sections */}
      <div class="canvas-body">
        <Show
          when={hasContent() || true}
          fallback={
            <div class="canvas-empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              <p>Paste clinical information in the chat and the AI will organize it into your selected template</p>
            </div>
          }
        >
          <For each={selectedTemplate().sections}>
            {(section) => (
              <div class="canvas-section">
                <div class="canvas-section-label">
                  <span>{section.label}</span>
                </div>
                <div
                  class="canvas-section-content"
                  contentEditable={true}
                  data-placeholder={section.placeholder}
                  innerHTML={sections()[section.id] || ''}
                  onBlur={(e) => handleSectionEdit(section.id, (e.target as HTMLDivElement).innerText)}
                />
              </div>
            )}
          </For>
        </Show>
      </div>
    </>
  )
}
