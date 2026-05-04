import { createContext, useContext, useState, type ReactNode } from 'react';

interface DisplayPrefs {
  showShortNames: boolean;
  setShowShortNames: (v: boolean) => void;
}

const DisplayPrefsContext = createContext<DisplayPrefs>({
  showShortNames: false,
  setShowShortNames: () => {},
});

export function DisplayPrefsProvider({ children }: { children: ReactNode }) {
  const [showShortNames, setShowShortNamesState] = useState(() => {
    return localStorage.getItem('cumulus-show-short-names') === 'true';
  });

  function setShowShortNames(v: boolean) {
    setShowShortNamesState(v);
    localStorage.setItem('cumulus-show-short-names', String(v));
  }

  return (
    <DisplayPrefsContext.Provider value={{ showShortNames, setShowShortNames }}>
      {children}
    </DisplayPrefsContext.Provider>
  );
}

export function useDisplayPrefs() {
  return useContext(DisplayPrefsContext);
}
