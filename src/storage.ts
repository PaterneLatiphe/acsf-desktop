// Pont de stockage : fichier réel sous Electron, repli localStorage en navigateur (dev/aperçu).
export async function lireBase(): Promise<Uint8Array | null> {
  const pont = (window as unknown as { acsfDisque?: { lire?: () => Promise<Uint8Array> } }).acsfDisque;
  if (pont?.lire) {
    try {
      return await pont.lire();
    } catch {
      return null;
    }
  }
  try {
    const brut = localStorage.getItem('acsf:db');
    if (!brut) return null;
    const binaire = atob(brut);
    const octets = new Uint8Array(binaire.length);
    for (let i = 0; i < binaire.length; i++) octets[i] = binaire.charCodeAt(i);
    return octets;
  } catch {
    return null;
  }
}

export async function lireWasm(): Promise<Uint8Array | null> {
  const pont = (window as unknown as { acsfDisque?: { lireWasm?: () => Promise<string | null> } }).acsfDisque;
  if (!pont?.lireWasm) return null;
  try {
    const b64 = await pont.lireWasm();
    if (!b64) return null;
    const binaire = atob(b64);
    const octets = new Uint8Array(binaire.length);
    for (let i = 0; i < binaire.length; i++) octets[i] = binaire.charCodeAt(i);
    return octets;
  } catch {
    return null;
  }
}

export async function sauvegarderBase(): Promise<void> {
  const pont = (window as unknown as { acsfDisque?: { sauvegarder?: () => Promise<boolean> } }).acsfDisque;
  if (pont?.sauvegarder) {
    try { await pont.sauvegarder(); } catch { /* ignore */ }
  }
}
export async function ecrireBase(donnees: Uint8Array): Promise<void> {
  const pont = (window as unknown as { acsfDisque?: { ecrire?: (d: Uint8Array) => Promise<void> } }).acsfDisque;
  if (pont?.ecrire) {
    await pont.ecrire(donnees);
    return;
  }
  try {
    let s = '';
    const taille = 8192;
    for (let i = 0; i < donnees.length; i += taille) {
      s += String.fromCharCode(...donnees.subarray(i, i + taille));
    }
    localStorage.setItem('acsf:db', btoa(s));
  } catch {
    /* stockage indisponible : la donnée reste en mémoire pour la session */
  }
}
