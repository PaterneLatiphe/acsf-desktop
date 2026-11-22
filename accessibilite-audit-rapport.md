# Rapport d'audit accessibility — ACSF Desktop

## 1. Contraste des couleurs (tokens CSS)

Ratios calculés selon la formule WCAG (luminosité relative) :

- **--nuit:#150A54 sur --blanc:#FFFFFF** : **17.45:1** → **AAA** pour texte normal et texte grossier (seuil 7:1 et 4.5:1)
- **--jaune:#FFF268 sur --nuit:#150A54** : **15.10:1** → **AAA** pour texte normal et texte grossier
- **--gris:#55536A sur --blanc:#FFFFFF** : **7.42:1** → **AAA** pour texte normal, **AA** pour texte grossier (seuil 3:1)
- **--succes-fond:#E7F1DF sur --succes-texte:#245B20** : **6.96:1** → **AA** pour texte normal (seuil 4.5:1), **AA** pour texte grossier (seuil 3:1)
- **--alerte-fond:#FFF3CC sur --alerte-texte:#695100** : **6.82:1** → **AA** pour texte normal, **AA** pour texte grossier
- **--erreur-fond:#FBE6DF sur --erreur-texte:#8A2F15** : **7.00:1** → **AA** pour texte normal (seuil pile à 7:1), **AA** pour texte grossier

**Conclusion** : Tous les contrastes satisfont au minimum le WCAG AA pour texte normal. Le bleu nuit sur blanc et le jaune sur bleu atteignent le AAA. Le gris sur blanc est juste au-dessus du seuil AAA pour texte normal.

## 2. Focus clavier & visibilité

- **base.css ligne 11** : `:focus-visible{outline:2px solid var(--nuit);outline-offset:2px}` — outline nocturne 2px avec offset
- **base.css ligne 12** : `.side :focus-visible{outline-color:var(--jaune)}` — Sidebar focus en jaune sur le bleu nuit
- Tous les inputs/select/buttons reçoivent outline lors du focus : `.recherche:focus-within`, `.champ-controle:focus-within`, `.btn:focus-visible`
- ** tabindex management** : buttons navbtn ont `role="button"` + `aria-label` (App.tsx)
- **Menus contextuels** : menu rôle `menu` avec retour focus vers élément précédent (Volets.tsx, `role="menu"` + `role="menuitem"`)
- **Dialogues** : `DialogueConfirmation` : `role="dialog"`, `aria-modal`, `aria-labelledby/describedby`, focus retour Échap, traversées clavier Tab/shiftTab
- **Roving tabindex sur OngletsVolets** : `role="tablist"`, `aria-selected`, `aria-controls`, `tabIndex=0/-1`, navigation flèches/Home/End (OngletsVolets.tsx lignes 81-102)

## 3. ARIA & rôles sémantiques

- **role="search"** sur div recherche (App.tsx ligne 139)
- **aria-label**, **aria-current='page'** sur boutons navigation (App.tsx: aria-current, aria-label)
- **aria-live="polite"** sur `.statut-donnees`, `.toast` (EtatDonnees, useToast)
- **aria-busy="true"** sur Squelettes (Etats.tsx)
- **role="alert"** sur Erreur, Erreur component, ResumeErreurs
- **role="dialog"**, `aria-modal`, `aria-labelledby/describedby` sur DialogueConfirmation
- **role="tablist"**, `aria-selected`, `aria-controls`, `tabindex` sur OngletsVolets
- **role="menu"**, focus retour sur menu contextuel suppression (Volets.tsx)
- **role="status"** sur `.etat-sauvegarde` (App.tsx)
- **aria-invalid + aria-describedby** sur champs formulaire (ChampFormulaire: `aria-invalid`, `aria-describedby` `erreur-${champ.cle}`; ResumeErreurs liens `#champ-${cle}`)
- **data-champ attributs** pour liaison label/contrôle (ChampFormulaire: `data-champ`, `id="champ-${cle}";`; ResumeErreurs `href` vers `#champ-${cle}`)
- **Balises de titre appropriées** : `h1.page`, `h2.section-titre`, etc.

## 4. Reduced motion & animations

- **@media (prefers-reduced-motion:reduce)** dans base.css (ligne 108-109) et accessibilite.css (ligne 142-144) :
  - Désactive animations: respiration, spin, transitions box-shadow/borderColor/backgroundColor sur `.bloc/.kpi/.dialog-modal/.fiche-page`
  - `*{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}`
- **Infos critiques non dépendantes de l'animation** :
  - Skeletons texte lisibles hors animation
  - Toast masqué mais info textuelle conservée
- **Aucun motion sensor / animation auto-play** contraire à reduced motion

## 5. Résumé des points de vigilance ACSF / invariants

- **Contraste identité** : bleu nuit #150A54 sur blanc autorisé par guidelines ACSF (17.45:1, bien au-dessus de 7:1)
- **Pas de couleur seule pour transmettre un sens** : toujours texte + couleur (les états succès/alerte/erreur ont tous du texte explicite)
- **Langue par défaut=fr** sur inputs date : `lang={type === 'date' ? 'fr' : undefined}` (ChampFormulaire.tsx)
- **Téléphone burkinabé format +226 XX XX XX XX préservé** : `normaliserTelephone` dans exportTableur.ts (lignes 151-162) formate correctement avec indicatif +226 et espaces

## Points à surveiller

- Le ratio `succes-fond/#E7F1DF` sur `succes-texte/#245B20` est de 6.96:1, juste en dessous du seuil AAA 7:1 pour texte normal — satisfait AA mais pas AAA.
- Le ratio `alerte-fond/#FFF3CC` sur `alerte-texte/#695100` est de 6.82:1, également AA seulement.
- Le ratio `erreur-fond/#FBE6DF` sur `erreur-texte/#8A2F15` est exactement de 7.00:1 — se situe à la frontière AA/AAA pour texte normal.