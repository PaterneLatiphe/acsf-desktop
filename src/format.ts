// Formatage d'affichage uniquement : la base garde les dates au format ISO.

export function formaterDateFr(valeur: string | null | undefined): string {
  if (!valeur) return '—';
  const iso = String(valeur).slice(0, 10);
  const correspondance = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!correspondance) return '—';
  const [, annee, mois, jour] = correspondance;
  return `${jour}/${mois}/${annee}`;
}

export function formaterDateHeureFr(valeur: string | null | undefined): string {
  if (!valeur) return '—';
  const chaine = String(valeur);
  const date = formaterDateFr(chaine);
  const heure = /T(\d{2}):(\d{2})/.exec(chaine);
  return heure ? `${date} à ${heure[1]}:${heure[2]}` : date;
}
