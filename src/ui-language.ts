const replacements: Array<[string, string]> = [
  ['Menus intelligents', 'Planification des repas'],
  ['✨ Générer une semaine', 'Proposer un menu'],
  ['Générer une semaine', 'Proposer un menu'],
  ['DÉCISION DU JOUR', 'SITUATION DU JOUR'],
  ['🔒 Données locales uniquement', 'Données enregistrées sur cet ordinateur'],
  ['💾 Sauvegarder maintenant', 'Sauvegarder maintenant'],
  ['Moteur intelligent', 'Aide à la planification'],
  ['moteur intelligent', 'outil de planification'],
  ['Suggestions intelligentes', 'Propositions de repas'],
  ['suggestions intelligentes', 'propositions de repas']
]

function replaceTextNode(node: Text) {
  const original = node.nodeValue
  if (!original) return

  let next = original
  for (const [from, to] of replacements) {
    next = next.replaceAll(from, to)
  }

  if (next !== original) node.nodeValue = next
}

function rewrite(root: Node) {
  if (root.nodeType === Node.TEXT_NODE) {
    replaceTextNode(root as Text)
    return
  }

  for (const child of Array.from(root.childNodes)) rewrite(child)
}

const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of Array.from(mutation.addedNodes)) rewrite(node)
    if (mutation.type === 'characterData') rewrite(mutation.target)
  }
})

function start() {
  rewrite(document.body)
  observer.observe(document.body, { childList: true, subtree: true, characterData: true })
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start, { once: true })
} else {
  start()
}
