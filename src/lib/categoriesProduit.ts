// =====================================================================
//  Categories de produits pour le module Sourcing
//  Liste figee + possibilite d'ajouter "a la volee" via le champ libre
//  du formulaire (le groupe ne sert qu'a organiser le menu deroulant ;
//  seul le libelle fin est stocke dans trouvailles.categorie).
// =====================================================================

export interface CategorieGroupe {
  groupe: string;
  items: string[];
}

export const CATEGORIES_PRODUIT: CategorieGroupe[] = [
  {
    groupe: 'Mobilier',
    items: ['Table', 'Chaise', 'Fauteuil', 'Canapé / banquette', 'Lit', 'Commode / console / étagère', 'Tabouret / pouf'],
  },
  {
    groupe: 'Sol & murs',
    items: ['Carrelage / zellige', 'Bejmat', 'Tadelakt', 'Marbre / pierre', 'Béton ciré', 'Peinture / enduit'],
  },
  {
    groupe: 'Luminaire',
    items: ['Lampe / lampadaire', 'Lustre / suspension', 'Applique', 'Photophore / lanterne'],
  },
  {
    groupe: 'Textile',
    items: ['Draps / linge de lit', 'Rideaux', 'Tapis', 'Coussins', "Tissu d'ameublement", 'Serviettes / linge de bain'],
  },
  {
    groupe: 'Salle de bain & eau',
    items: ['Vasque / lavabo', 'Robinetterie', 'Baignoire / douche', 'Accessoires SDB'],
  },
  {
    groupe: 'Déco & finitions',
    items: ['Tableaux / art mural', 'Miroir', 'Poterie / céramique', 'Objet déco', 'Plante / pot', 'Vaisselle'],
  },
  {
    groupe: 'Menuiserie & métal',
    items: ['Porte', 'Fenêtre / moucharabieh', 'Ferronnerie', 'Plâtre / gebs sculpté'],
  },
  {
    groupe: 'Extérieur',
    items: ['Mobilier de jardin', "Parasol / voile d'ombrage", 'Dallage extérieur'],
  },
];

// Liste a plat (pour validation / recherche rapide)
export const CATEGORIES_FLAT: string[] = CATEGORIES_PRODUIT.flatMap((g) => g.items);

// Unites de prix proposees dans le formulaire de trouvaille
export const UNITES_PRIX: string[] = ['', '/m²', '/ml', '/pièce', '/lot', 'forfait'];
