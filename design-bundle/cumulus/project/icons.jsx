// Cumulus — icons (small, 1.5px stroke, line-based)
const Icon = ({ d, size = 16, fill = false, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill ? "currentColor" : "none"}
       stroke={fill ? "none" : "currentColor"} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...rest}>
    {d}
  </svg>
);

const I = {
  Home: (p) => <Icon {...p} d={<><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/></>}/>,
  Layers: (p) => <Icon {...p} d={<><path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/><path d="M3 17l9 5 9-5"/></>}/>,
  Book: (p) => <Icon {...p} d={<><path d="M4 4h12a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4z"/><path d="M4 16a4 4 0 0 1 4-4h12"/></>}/>,
  Target: (p) => <Icon {...p} d={<><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/></>}/>,
  Cog: (p) => <Icon {...p} d={<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></>}/>,
  Plus: (p) => <Icon {...p} d={<><path d="M12 5v14M5 12h14"/></>}/>,
  Minus: (p) => <Icon {...p} d={<><path d="M5 12h14"/></>}/>,
  Right: (p) => <Icon {...p} d={<><path d="M9 6l6 6-6 6"/></>}/>,
  Left: (p) => <Icon {...p} d={<><path d="M15 6l-6 6 6 6"/></>}/>,
  Up: (p) => <Icon {...p} d={<><path d="M6 15l6-6 6 6"/></>}/>,
  Down: (p) => <Icon {...p} d={<><path d="M6 9l6 6 6-6"/></>}/>,
  Search: (p) => <Icon {...p} d={<><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></>}/>,
  More: (p) => <Icon {...p} d={<><circle cx="5" cy="12" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="19" cy="12" r="1.3" fill="currentColor"/></>}/>,
  Trash: (p) => <Icon {...p} d={<><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></>}/>,
  Edit: (p) => <Icon {...p} d={<><path d="M14 4l6 6L9 21H3v-6z"/></>}/>,
  Share: (p) => <Icon {...p} d={<><circle cx="6" cy="12" r="2.4"/><circle cx="18" cy="6" r="2.4"/><circle cx="18" cy="18" r="2.4"/><path d="M8.1 11l7.8-3.8M8.1 13l7.8 3.8"/></>}/>,
  Download: (p) => <Icon {...p} d={<><path d="M12 4v12M7 11l5 5 5-5M5 20h14"/></>}/>,
  Upload: (p) => <Icon {...p} d={<><path d="M12 20V8M7 13l5-5 5 5M5 4h14"/></>}/>,
  Check: (p) => <Icon {...p} d={<><path d="M5 12l4.5 4.5L19 7"/></>}/>,
  X: (p) => <Icon {...p} d={<><path d="M6 6l12 12M18 6L6 18"/></>}/>,
  Calc: (p) => <Icon {...p} d={<><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 11h2M12 11h2M16 11h0M8 15h2M12 15h2M16 15h0M8 19h2M12 19h2M16 19h0"/></>}/>,
  Spark: (p) => <Icon {...p} d={<><path d="M5 17l4-7 4 4 6-9"/></>}/>,
  Cloud: (p) => <Icon {...p} d={<><path d="M7 17a4 4 0 1 1 1-7.9 5 5 0 0 1 9.9 1A4 4 0 0 1 17 17z"/></>}/>,
  QR: (p) => <Icon {...p} d={<><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3zM20 14v3M14 20h3v0M20 20v0"/></>}/>,
  Info: (p) => <Icon {...p} d={<><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v0"/></>}/>,
  Bell: (p) => <Icon {...p} d={<><path d="M6 9a6 6 0 0 1 12 0v4l1.5 3h-15L6 13z"/><path d="M10 19a2 2 0 0 0 4 0"/></>}/>,
  Sun: (p) => <Icon {...p} d={<><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.4 1.4M17.6 17.6L19 19M5 19l1.4-1.4M17.6 6.4L19 5"/></>}/>,
  Moon: (p) => <Icon {...p} d={<><path d="M21 13.5A9 9 0 1 1 10.5 3a7 7 0 0 0 10.5 10.5z"/></>}/>,
  ArrowUp: (p) => <Icon {...p} d={<><path d="M12 19V5M5 12l7-7 7 7"/></>}/>,
  ArrowRight: (p) => <Icon {...p} d={<><path d="M5 12h14M12 5l7 7-7 7"/></>}/>,
};

window.I = I;
