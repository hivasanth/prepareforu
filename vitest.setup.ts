import '@testing-library/jest-dom/vitest'

// jsdom 24.1.3 on Node 26 does not initialize window.localStorage (the
// Storage getter returns undefined), which breaks any module touching
// localStorage (queryCache, exam session store, persistence layer). These are
// environment-only polyfills — jsdom normally provides them; they force a
// spec-shaped in-memory Storage when the environment failed to.
function createStorage(): Storage {
  const store = new Map<string, string>()
  return {
    get length() { return store.size },
    clear() { store.clear() },
    getItem(key: string) { return store.has(key) ? store.get(key)! : null },
    key(index: number) { return Array.from(store.keys())[index] ?? null },
    removeItem(key: string) { store.delete(key) },
    setItem(key: string, value: string) { store.set(key, String(value)) },
  } as Storage
}

if (typeof window !== 'undefined') {
  if (!window.localStorage) {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      enumerable: true,
      writable: true,
      value: createStorage(),
    })
  }
}

if (typeof globalThis !== 'undefined' && globalThis.localStorage === undefined && typeof window !== 'undefined') {
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    enumerable: true,
    writable: true,
    value: window.localStorage,
  })
}

if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  })
}

if (typeof globalThis !== 'undefined' && !globalThis.ResizeObserver) {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver
}

if (typeof window !== 'undefined' && !window.scrollTo) {
  window.scrollTo = () => {}
}

if (typeof window !== 'undefined' && !window.Element.prototype.scrollIntoView) {
  window.Element.prototype.scrollIntoView = () => {}
}

// JSDOM Blob does not implement the `.text()` Promise API (a browser-only
// method the real download path uses). Production `downloadCSV` never calls
// `blob.text()` — it serializes CSV at the boundary and hands the bytes to the
// browser download manager. This polyfill only lets the unit test read back
// the serialized bytes the same way a browser Blob would. Real download
// contents are verified authoritatively by the browser E2E suite.
if (
  typeof Blob !== 'undefined' &&
  Blob.prototype &&
  typeof (Blob.prototype as unknown as { text?: () => Promise<string> }).text !== 'function'
) {
  Object.defineProperty(Blob.prototype, 'text', {
    configurable: true,
    enumerable: false,
    writable: true,
    value: function (this: Blob): Promise<string> {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result ?? ''))
        reader.onerror = () => reject(reader.error ?? new Error('Blob.text failed'))
        reader.readAsText(this)
      })
    },
  })
}
