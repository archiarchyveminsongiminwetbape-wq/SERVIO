import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { categoryTaxonomy } from '@/data/categories';
import { Loader2, Database, CheckCircle, AlertCircle } from 'lucide-react';

export default function CategorySeeder() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [results, setResults] = useState({ sectors: 0, subcategories: 0, total: 0 });

  // Configuration Supabase directe pour le seeding
  const supabaseUrl = 'https://kmfiynflaxmegurkvyca.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZml5bmZsYXhtZWd1cmt2eWNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5ODM2MDIsImV4cCI6MjEwMDU1OTYwMn0.pOIG1ykCICGGehPG-AIcu7ddtLCD6v8BphMU8puyyBA';

  const supabase = createClient(supabaseUrl, supabaseKey);

  const seedCategories = async () => {
    setLoading(true);
    setStatus('idle');
    setMessage('Initialisation du seeding...');
    setProgress({ current: 0, total: categoryTaxonomy.length });

    let sectorCount = 0;
    let subcategoryCount = 0;
    let totalCategories = 0;

    try {
      // Nettoyer les catégories existantes (optionnel)
      // await supabase.from('categories').delete().neq('id', '00000000-0000-0000-0000-000000000000');

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
          console.error(`Erreur secteur ${sector.name}:`, sectorError);
          setMessage(`Erreur: ${sectorError.message}`);
          setStatus('error');
          setLoading(false);
          return;
        }

        sectorCount++;
        totalCategories++;
        setProgress({ current: sectorCount, total: categoryTaxonomy.length });
        setMessage(`Secteur ${sectorCount}/${categoryTaxonomy.length}: ${sector.name}`);

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
            console.error(`Erreur sous-catégorie ${subcategory.name}:`, subError);
          } else {
            subcategoryCount++;
            totalCategories++;
          }
        }

        // Petit délai pour éviter de surcharger la base de données
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      setResults({ sectors: sectorCount, subcategories: subcategoryCount, total: totalCategories });
      setMessage(`Seeding terminé avec succès!`);
      setStatus('success');
    } catch (error) {
      console.error('Erreur lors du seeding:', error);
      setMessage(`Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <Database className="text-primary-600" size={32} />
          <div>
            <h2 className="text-2xl font-bold text-neutral-900">Seeding des catégories</h2>
            <p className="text-sm text-neutral-600">Import de la taxonomie complète (33 secteurs, 186 sous-catégories)</p>
          </div>
        </div>

        {status === 'idle' && (
          <div className="space-y-4">
            <div className="bg-neutral-50 rounded-lg p-4">
              <h3 className="font-semibold text-neutral-900 mb-2">Informations</h3>
              <ul className="text-sm text-neutral-600 space-y-1">
                <li>• 33 secteurs principaux</li>
                <li>• 186 sous-catégories</li>
                <li>• 219 catégories au total</li>
              </ul>
            </div>

            <button
              onClick={seedCategories}
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Import en cours...
                </>
              ) : (
                <>
                  <Database size={20} />
                  Démarrer l'import
                </>
              )}
            </button>
          </div>
        )}

        {loading && (
          <div className="space-y-4">
            <div className="bg-neutral-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-neutral-900">Progression</span>
                <span className="text-sm text-neutral-600">{progress.current} / {progress.total}</span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
              <p className="text-sm text-neutral-600 mt-2">{message}</p>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
              <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <h3 className="font-semibold text-green-900">Import réussi</h3>
                <p className="text-sm text-green-700 mt-1">{message}</p>
              </div>
            </div>

            <div className="bg-neutral-50 rounded-lg p-4">
              <h3 className="font-semibold text-neutral-900 mb-3">Résultats</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-primary-600">{results.sectors}</p>
                  <p className="text-xs text-neutral-600">Secteurs</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary-600">{results.subcategories}</p>
                  <p className="text-xs text-neutral-600">Sous-catégories</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary-600">{results.total}</p>
                  <p className="text-xs text-neutral-600">Total</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setStatus('idle');
                setMessage('');
                setResults({ sectors: 0, subcategories: 0, total: 0 });
              }}
              className="btn-secondary w-full"
            >
              Réinitialiser
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <h3 className="font-semibold text-red-900">Erreur</h3>
                <p className="text-sm text-red-700 mt-1">{message}</p>
              </div>
            </div>

            <button
              onClick={() => {
                setStatus('idle');
                setMessage('');
              }}
              className="btn-secondary w-full"
            >
              Réessayer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
