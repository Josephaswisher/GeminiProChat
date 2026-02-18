import { Show, createSignal, onMount } from 'solid-js'

let roleInputRef: HTMLTextAreaElement

export default function Sidebar() {
  const [isOpen, setIsOpen] = createSignal(false)
  const [systemRole, setSystemRole] = createSignal('')
  const [temperature, setTemperature] = createSignal(0.6)
  const [editingRole, setEditingRole] = createSignal(false)
  const [isDark, setIsDark] = createSignal(false)

  const updateSliderFill = (el: HTMLInputElement, val: number) => {
    const pct = (val / 2) * 100
    el.style.setProperty('--pct', `${pct}%`)
  }

  onMount(() => {
    setSystemRole(localStorage.getItem('systemRole') || '')
    const savedTemp = parseFloat(localStorage.getItem('temperature') || '0.6')
    setTemperature(savedTemp)
    setIsDark(document.documentElement.classList.contains('dark'))

    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'))
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

    // Init slider fill on mount
    const slider = document.querySelector('.sidebar-range') as HTMLInputElement
    if (slider)
      updateSliderFill(slider, savedTemp)
  })

  const handleNewChat = () => {
    window.dispatchEvent(new CustomEvent('new-chat'))
    if (window.innerWidth < 1024)
      setIsOpen(false)
  }

  const handleSaveRole = () => {
    const value = roleInputRef?.value ?? ''
    setSystemRole(value)
    localStorage.setItem('systemRole', value)
    setEditingRole(false)
  }

  const handleClearRole = () => {
    setSystemRole('')
    localStorage.removeItem('systemRole')
  }

  const handleTempChange = (e: Event) => {
    const val = parseFloat((e.target as HTMLInputElement).value)
    setTemperature(val)
    localStorage.setItem('temperature', String(val))
    updateSliderFill(e.target as HTMLInputElement, val)
  }

  const handleThemeToggle = (e: MouseEvent) => {
    const root = document.documentElement
    const dark = root.classList.contains('dark')
    localStorage.setItem('theme', dark ? 'light' : 'dark')

    const doc = document as any
    const isTransitionSupported =
      doc.startViewTransition &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (!isTransitionSupported) {
      root.classList.toggle('dark')
      setIsDark(!dark)
      return
    }

    const { clientX: x, clientY: y } = e
    const dx = Math.max(x, innerWidth - x)
    const dy = Math.max(y, innerHeight - y)
    const endRadius = Math.sqrt(dx * dx + dy * dy)
    const transition = doc.startViewTransition(() => {
      root.classList.toggle('dark')
      setIsDark(!dark)
    })
    transition.ready.then(() => {
      const clipPath = [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`]
      const _c = !dark ? clipPath : [...clipPath].reverse()
      const pseudo = !dark ? '::view-transition-new(root)' : '::view-transition-old(root)'
      document.documentElement.animate({ clipPath: _c }, { duration: 500, easing: 'ease-in', pseudoElement: pseudo })
    })
  }

  return (
    <>
      {/* Mobile backdrop */}
      <Show when={isOpen()}>
        <div
          class="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      </Show>

      {/* Mobile hamburger */}
      <button
        class="sidebar-hamburger fixed top-3 left-3 z-40 flex items-center justify-center w-9 h-9 rounded-lg cursor-pointer transition-all lg:hidden"
        onClick={() => setIsOpen(!isOpen())}
        aria-label="Toggle sidebar"
      >
        <Show when={isOpen()} fallback={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        }>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </Show>
      </button>

      {/* Sidebar panel */}
      <aside
        class={`sidebar-panel fixed top-0 left-0 h-full z-30 flex flex-col overflow-hidden transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen() ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Branding */}
        <div class="sidebar-brand flex items-center gap-3 px-4 py-4 border-b border-[var(--c-sidebar-border)]">
          <div class="flex-shrink-0">
            <svg viewBox="0 0 48 48" width="34" height="34" xmlns="http://www.w3.org/2000/svg">
              <path d="M43,4H5A4,4,0,0,0,1,8V33a4,4,0,0,0,4,4H16l6.38,8.78a2,2,0,0,0,3.23,0L32,37H43a4,4,0,0,0,4-4V8A4,4,0,0,0,43,4Z" fill="#f9da97" />
              <path d="M24,18H10a2,2,0,0,1,0-4H24A2,2,0,0,1,24,18Z" fill="#f6c253" />
              <path d="M39,27H10a2,2,0,0,1,0-4H39A2,2,0,0,1,39,27Z" fill="#f6c253" />
            </svg>
          </div>
          <div class="min-w-0">
            <div class="flex items-baseline gap-1 leading-none">
              <span class="text-base font-extrabold">Gemini Pro</span>
              <span class="text-base font-extrabold sidebar-gradient-text">Chat</span>
            </div>
            <p class="text-xs mt-0.5 opacity-40 truncate">Gemini Pro API</p>
          </div>
        </div>

        {/* New Chat */}
        <div class="px-3 py-3">
          <button
            onClick={handleNewChat}
            class="sidebar-new-chat w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-all"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Chat
          </button>
        </div>

        {/* Scrollable settings area */}
        <div class="flex-1 overflow-y-auto px-3 space-y-4 pb-4">

          {/* System Role */}
          <div>
            <div class="sidebar-label text-xs font-semibold uppercase tracking-widest opacity-40 mb-2 px-1">
              System Prompt
            </div>
            <Show when={!editingRole()}>
              <Show
                when={systemRole()}
                fallback={
                  <button
                    onClick={() => setEditingRole(true)}
                    class="sidebar-item-empty w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm cursor-pointer transition-all text-left"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="flex-shrink-0 opacity-50">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    <span class="opacity-50">Set system prompt...</span>
                  </button>
                }
              >
                <div class="sidebar-item-active rounded-xl p-3">
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-xs font-semibold opacity-40 uppercase tracking-wide">Active</span>
                    <div class="flex items-center gap-1">
                      <button
                        onClick={() => setEditingRole(true)}
                        title="Edit"
                        class="sidebar-icon-btn p-1 rounded cursor-pointer transition-all"
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        onClick={handleClearRole}
                        title="Remove"
                        class="sidebar-icon-btn p-1 rounded cursor-pointer transition-all"
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <p class="text-sm opacity-70 leading-relaxed line-clamp-3 break-words">{systemRole()}</p>
                </div>
              </Show>
            </Show>

            <Show when={editingRole()}>
              <div class="sidebar-edit-box rounded-xl p-3 border border-[var(--c-sidebar-border)]">
                <textarea
                  ref={roleInputRef!}
                  value={systemRole()}
                  placeholder="You are a helpful assistant..."
                  rows={4}
                  class="sidebar-textarea w-full text-sm resize-none bg-transparent outline-none placeholder:opacity-30 leading-relaxed"
                />
                <div class="flex gap-2 mt-2.5">
                  <button
                    onClick={handleSaveRole}
                    class="sidebar-save-btn flex-1 py-1.5 text-xs font-semibold rounded-lg cursor-pointer transition-all"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingRole(false)}
                    class="sidebar-cancel-btn flex-1 py-1.5 text-xs rounded-lg cursor-pointer transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </Show>
          </div>

          {/* Temperature */}
          <div>
            <div class="flex items-center justify-between mb-2 px-1">
              <div class="sidebar-label text-xs font-semibold uppercase tracking-widest opacity-40">
                Temperature
              </div>
              <span class="text-xs font-mono opacity-60 tabular-nums sidebar-temp-badge px-2 py-0.5 rounded-full">
                {temperature().toFixed(2)}
              </span>
            </div>
            <div class="px-1">
              <input
                type="range"
                min="0"
                max="2"
                step="0.01"
                value={temperature()}
                onInput={handleTempChange}
                class="sidebar-range w-full cursor-pointer"
              />
              <div class="flex justify-between text-xs opacity-25 mt-1.5">
                <span>Precise</span>
                <span>Creative</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div class="sidebar-footer border-t border-[var(--c-sidebar-border)] px-3 py-3">
          <div class="flex items-center justify-between">
            <a
              href="https://github.com/babaohuang/GeminiProChat"
              target="_blank"
              rel="noopener noreferrer"
              class="sidebar-footer-link flex items-center gap-2 text-xs opacity-50 hover:opacity-90 cursor-pointer transition-opacity"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              Source code
            </a>
            <button
              onClick={handleThemeToggle}
              class="sidebar-theme-btn flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer transition-all"
              aria-label={isDark() ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDark() ? 'Light mode' : 'Dark mode'}
            >
              <Show when={isDark()} fallback={
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              }>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              </Show>
            </button>
          </div>
          <p class="text-xs opacity-20 mt-2 text-center">© 2024 Orz, LLC</p>
        </div>
      </aside>
    </>
  )
}
