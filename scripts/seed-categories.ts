import { createClient } from '@supabase/supabase-js';
import { categoryTaxonomy } from '../src/data/categories';
import { config } from 'dotenv';

// Charger les variables d'environnement
config({ path: '.env' });

// Configuration Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('⚠️  Variables d\'environnement Supabase manquantes');
  console.error('   Créez un fichier .env à la racine du projet avec:');
  console.error('   VITE_SUPABASE_URL=votre_url_supabase');
  console.error('   VITE_SUPABASE_ANON_KEY=votre_cle_anon_supabase');
  console.error('\n   Exemple:');
  console.error('   VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co');
  console.error('   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
  process.exit(1);
}

console.log('✓ Connexion Supabase configurée');
console.log(`  URL: ${supabaseUrl.substring(0, 30)}...`);

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedCategories() {
  console.log('Début du seeding des catégories...');
  
  let sectorCount = 0;
  let subcategoryCount = 0;
  let totalCategories = 0;

  for (const sector of categoryTaxonomy) {
    // Insérer le secteur principal
    const { data: sectorData, error: sectorError } = await supabase
      .from('categories')
      .insert({
        name: sector.name,
        slug: sector.slug,
        icon: sector.icon,
        parent_id: null,
        sort_order: sectorCount,
        level: 0
      })
      .select()
      .single();

    if (sectorError) {
      console.error(`Erreur lors de l'insertion du secteur ${sector.name}:`, sectorError);
      continue;
    }

    sectorCount++;
    totalCategories++;
    console.log(`✓ Secteur créé: ${sector.name}`);

    // Insérer les sous-catégories
    for (const subcategory of sector.subcategories) {
      const { error: subError } = await supabase
        .from('categories')
        .insert({
          name: subcategory.name,
          slug: subcategory.slug,
          icon: null,
          parent_id: sectorData.id,
          sort_order: subcategoryCount,
          level: 1
        });

      if (subError) {
        console.error(`Erreur lors de l'insertion de la sous-catégorie ${subcategory.name}:`, subError);
        continue;
      }

      subcategoryCount++;
      totalCategories++;
      console.log(`  ✓ Sous-catégorie créée: ${subcategory.name}`);
    }
  }

  console.log('\n=== Résumé ===');
  console.log(`Secteurs créés: ${sectorCount}`);
  console.log(`Sous-catégories créées: ${subcategoryCount}`);
  console.log(`Total catégories: ${totalCategories}`);
  console.log('\nSeeding terminé avec succès!');
}

// Exécuter le seeding
seedCategories().catch(console.error);
