/** Convert displayed Thai digits without changing stored content, IDs or voice keys. */
export function toArabicDigits(value) {
  return String(value ?? '').replace(/[๐-๙]/g, digit => String(digit.charCodeAt(0) - 0x0e50));
}

const displayAttributes = ['title', 'aria-label', 'aria-valuetext', 'placeholder', 'alt', 'label'];
const excludedTags = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA']);

export function formatDisplayedNumbers(node) {
  if (node.nodeType === 3) {
    if (node.parentElement?.closest('script, style, textarea, [contenteditable="true"]')) return;
    const formatted = toArabicDigits(node.nodeValue);
    if (formatted !== node.nodeValue) node.nodeValue = formatted;
    return;
  }
  if (node.nodeType !== 1 || excludedTags.has(node.tagName) || node.isContentEditable) return;
  for (const name of displayAttributes) {
    const original = node.getAttribute(name);
    if (original === null) continue;
    const formatted = toArabicDigits(original);
    if (formatted !== original) node.setAttribute(name, formatted);
  }
  for (const child of node.childNodes) formatDisplayedNumbers(child);
}

export function installNumericDisplay(root = document.body) {
  formatDisplayedNumbers(root);
  document.title = toArabicDigits(document.title);
  const observer = new MutationObserver(records => {
    for (const record of records) {
      if (record.type === 'childList') {
        for (const node of record.addedNodes) formatDisplayedNumbers(node);
      } else if (!record.target.parentElement?.closest('script, style, textarea, [contenteditable="true"]')) {
        formatDisplayedNumbers(record.target);
      }
    }
  });
  observer.observe(root, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: displayAttributes });
  return observer;
}
