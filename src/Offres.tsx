// Catalogue des prestations de l'agence : liste lisible et configuration des offres.
// Ajout pur : nouvelle table, nouvel écran, aucun écran existant n'est modifié.

import React, { useEffect, useState } from 'react';
import { Tag } from 'lucide-react';
import {
  creerOffre, definirOffreActive, listerOffres, modifierOffre,
  type DonneesOffre, type Offre,
} from './db';
import { EtatVide, StatutDonnees, Toast } from './EtatDonnees';
import { Erreur } from './Etats';
import { useToast } from './useToast';
import FormulaireCadre, { type SectionFormulaire } from './formulaires/FormulaireCadre';

const CATEGORIES = [
  'Accompagnement', 'Formation', 'Animation', 'Appui matériel', 'Autre',
].map((libelle) => ({ valeur: libelle, libelle }));

const STATUTS = [
  { valeur: 'actif', libelle: 'Active' },
  { valeur: 'inactif', libelle: 'Inactive' },
];

const OFFRES_PAR_PAS = 20;

const OFFRE_VIDE = {
  libelle: '', description: '', categorie: 'Accompagnement', tarif: '',
  duree: '', statut: 'actif',
};

const formaterTarif = (montant: number): string =>
  `${new Intl.NumberFormat('fr-FR').format(montant)} FCFA`;

const Offres: React.FC = () => {
  const [offres, setOffres] = useState<Offre[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreurChargement, setErreurChargement] = useState<string | null>(null);
  const [recherche, setRecherche] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('tous');
  const [limite, setLimite] = useState(OFFRES_PAR_PAS);
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [offreEnCours, setOffreEnCours] = useState<Offre | null>(null);
  const [libelle, setLibelle] = useState('');
  const [description, setDescription] = useState('');
  const [categorie, setCategorie] = useState('Accompagnement');
  const [tarif, setTarif] = useState('');
  const [duree, setDuree] = useState('');
  const [statut, setStatut] = useState('actif');
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const { toast, afficherToast, mettreEnPause, reprendre } = useToast();

  const recharger = async () => {
    setChargement(true);
    try {
      setOffres(await listerOffres());
      setErreurChargement(null);
    } catch {
      setErreurChargement('Le catalogue d’offres n’a pas pu être chargé.');
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    recharger();
  }, []);

  useEffect(() => {
    setLimite(OFFRES_PAR_PAS);
  }, [recherche, filtreStatut]);

  const terme = recherche.trim().toLocaleLowerCase('fr');
  const offresFiltrees = offres.filter((offre) => {
    const statutOk = filtreStatut === 'tous'
      || (filtreStatut === 'actifs' ? offre.active : !offre.active);
    const texteOk = !terme || [offre.libelle, offre.description, offre.categorie, offre.duree]
      .some((valeur) => valeur.toLocaleLowerCase('fr').includes(terme));
    return statutOk && texteOk;
  });
  const offresVisibles = offresFiltrees.slice(0, limite);
  const restants = offresFiltrees.length - limite;

  const ouvrirFormulaire = (offre: Offre | null = null) => {
    setOffreEnCours(offre);
    setLibelle(offre?.libelle ?? '');
    setDescription(offre?.description ?? '');
    setCategorie(offre?.categorie ?? 'Accompagnement');
    setTarif(offre ? String(offre.tarif) : '');
    setDuree(offre?.duree ?? '');
    setStatut(offre ? (offre.active ? 'actif' : 'inactif') : 'actif');
    setErreurs({});
    setFormulaireOuvert(true);
  };

  const enregistrer = async (e: React.FormEvent) => {
    e.preventDefault();
    const invalides: Record<string, string> = {};
    if (!libelle.trim()) invalides.libelle = 'Choisissez un libellé.';
    if (!categorie) invalides.categorie = 'Choisissez une catégorie.';
    const montant = Number(tarif);
    if (!tarif.trim() || !Number.isFinite(montant) || !Number.isInteger(montant) || montant < 0) {
      invalides.tarif = 'Saisissez un montant entier positif.';
    }
    setErreurs(invalides);
    if (Object.keys(invalides).length > 0) return;

    const donnees: DonneesOffre = {
      libelle: libelle.trim(),
      description: description.trim(),
      categorie,
      tarif: montant,
      duree: duree.trim(),
      active: statut === 'actif',
    };
    try {
      if (offreEnCours) await modifierOffre(offreEnCours.id, donnees);
      else await creerOffre(donnees);
    } catch (e) {
      afficherToast(e instanceof Error ? e.message : 'L’offre n’a pas pu être enregistrée.');
      return;
    }
    const etaitModification = Boolean(offreEnCours);
    setFormulaireOuvert(false);
    setOffreEnCours(null);
    await recharger();
    afficherToast(etaitModification ? 'Offre mise à jour.' : 'Offre enregistrée.');
  };

  const basculer = async (offre: Offre) => {
    try {
      await definirOffreActive(offre.id, !offre.active);
      await recharger();
      afficherToast(offre.active ? 'Offre désactivée.' : 'Offre activée.');
    } catch {
      afficherToast('La mise à jour de l’offre a échoué. Réessayez.');
    }
  };

  const sections: SectionFormulaire[] = [
    {
      titre: 'OFFRE',
      champs: [
        {
          cle: 'libelle', libelle: 'Libellé', type: 'texte', obligatoire: true,
          placeholder: 'ex. Accompagnement scolaire',
        },
        {
          cle: 'categorie', libelle: 'Catégorie', type: 'select', obligatoire: true,
          options: [{ valeur: '', libelle: '— Choisir une catégorie —' }, ...CATEGORIES],
        },
        { cle: 'tarif', libelle: 'Tarif', type: 'nombre', obligatoire: true, indications: 'FCFA' },
        { cle: 'duree', libelle: 'Durée', placeholder: 'ex. 3 mois' },
        {
          cle: 'statut', libelle: 'Statut', type: 'select', obligatoire: true,
          options: STATUTS,
        },
        {
          cle: 'description', libelle: 'Description', type: 'texte', largeur: 2,
          placeholder: 'Ce que comprend la prestation…',
        },
      ],
    },
  ];

  const valeurs = { libelle, description, categorie, tarif, duree, statut };
  const valeursInitiales = offreEnCours
    ? {
      libelle: offreEnCours.libelle,
      description: offreEnCours.description,
      categorie: offreEnCours.categorie,
      tarif: String(offreEnCours.tarif),
      duree: offreEnCours.duree,
      statut: offreEnCours.active ? 'actif' : 'inactif',
    }
    : OFFRE_VIDE;

  return (
    <div className="page-enter">
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
        <div>
          <h1 className="page">Offres</h1>
          <p className="sous-titre">Catalogue des prestations proposées par l’agence</p>
        </div>
        <button
          type="button"
          className="btn btn-principal"
          style={{ marginLeft: 'auto' }}
          onClick={() => ouvrirFormulaire()}
        >
          <Tag size={18} /> Nouvelle offre
        </button>
      </div>

      {erreurChargement && <Erreur message={erreurChargement} onRetry={recharger} />}

      {!chargement && !erreurChargement && (
        <StatutDonnees affiches={offresVisibles.length} total={offres.length} />
      )}

      <div className="bloc">
        <div className="bloc-titre">
          Catalogue
          <div className="offres-outils">
            <input
              type="search"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              aria-label="Rechercher une offre"
              placeholder="Rechercher une offre…"
            />
            <select
              value={filtreStatut}
              onChange={(e) => setFiltreStatut(e.target.value)}
              aria-label="Filtrer les offres par statut"
            >
              <option value="tous">Tous statuts</option>
              <option value="actifs">Actives</option>
              <option value="inactifs">Inactives</option>
            </select>
          </div>
        </div>
        {chargement ? (
          <div className="vide">
            <div className="skel skel-ligne" />
          </div>
        ) : offresFiltrees.length === 0 ? (
          <EtatVide
            titre={offres.length === 0 ? 'Aucune offre.' : 'Aucune offre pour ces critères.'}
            message={offres.length === 0
              ? 'Créez la première prestation du catalogue.'
              : 'Modifiez la recherche ou le filtre de statut.'}
            action={offres.length === 0
              ? { libelle: 'Nouvelle offre', onClick: () => ouvrirFormulaire() }
              : {
                libelle: 'Effacer les filtres',
                onClick: () => { setRecherche(''); setFiltreStatut('tous'); },
              }}
          />
        ) : (
          <>
            {offresVisibles.map((offre) => (
              <div className="ligne" key={offre.id}>
                <div className="info" style={{ flex: 1, minWidth: 0 }}>
                  <b>{offre.libelle}</b>
                  <small>
                    {offre.description || 'Aucune description.'}
                    {offre.duree ? ` · ${offre.duree}` : ''}
                  </small>
                </div>
                <span className="pill rdv">{offre.categorie}</span>
                <span className="offre-tarif">{formaterTarif(offre.tarif)}</span>
                <span className={`pill ${offre.active ? 'ok' : 'ret'}`}>
                  {offre.active ? 'ACTIVE' : 'INACTIVE'}
                </span>
                <span style={{ display: 'flex', gap: 'var(--sp-2)' }}>
                  <button
                    type="button"
                    className="btn btn-secondaire"
                    onClick={() => ouvrirFormulaire(offre)}
                  >
                    Modifier
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondaire"
                    onClick={() => basculer(offre)}
                  >
                    {offre.active ? 'Désactiver' : 'Activer'}
                  </button>
                </span>
              </div>
            ))}
            {restants > 0 && (
              <button
                type="button"
                className="btn btn-secondaire rdv-plus"
                onClick={() => setLimite(limite + OFFRES_PAR_PAS)}
              >
                Afficher plus ({restants} restant{restants === 1 ? '' : 's'})
              </button>
            )}
          </>
        )}
      </div>

      {formulaireOuvert && (
        <FormulaireCadre
          titre={offreEnCours ? 'Modifier l’offre' : 'Nouvelle offre'}
          sections={sections}
          valeurs={valeurs}
          valeursInitiales={valeursInitiales}
          erreurs={erreurs}
          onChange={(nouvellesValeurs) => {
            setLibelle(nouvellesValeurs.libelle);
            setDescription(nouvellesValeurs.description);
            setCategorie(nouvellesValeurs.categorie);
            setTarif(nouvellesValeurs.tarif);
            setDuree(nouvellesValeurs.duree);
            setStatut(nouvellesValeurs.statut);
            if (Object.keys(erreurs).length) setErreurs({});
          }}
          onFermer={() => setFormulaireOuvert(false)}
          onEnregistrer={enregistrer}
          libelleEnregistrer={offreEnCours ? 'Enregistrer' : 'Ajouter'}
          avecResumeErreurs
        />
      )}

      {toast && <Toast message={toast} onPause={mettreEnPause} onReprendre={reprendre} />}
    </div>
  );
};

export default Offres;
